import stripe
import hmac
import uuid
from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from accounts.permissions import IsAdminRole, IsCustomer
from orders.models import Order, OrderItem
from cart.models import Cart
from .daraja import DarajaError, stk_push, stk_query
from .models import Payment
from .serializers import (
    PaymentSerializer, SimulatePaymentSerializer, StartPaymentSerializer
)
from .services import apply_result

stripe.api_key = settings.STRIPE_SECRET_KEY

# --- 1. START M-PESA PAYMENT (Creates Temporary Order) ---
class StartPaymentView(APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        phone = request.data.get('mpesa_phone')
        notes = request.data.get('notes', '')
        
        try:
            cart = Cart.objects.get(user=request.user)
            cart_items = cart.items.all()
            if not cart_items:
                return Response({'detail': 'Cart is empty'}, status=400)
                
            total_amount = sum(item.product.price * item.quantity for item in cart_items)

            with transaction.atomic():
                # Create a TEMPORARY order (will be deleted if payment fails)
                order = Order.objects.create(
                    user=request.user,
                    reference=f"TEMP-{uuid.uuid4().hex[:6].upper()}",
                    status='pending',
                    contact_phone=phone,
                    notes=notes,
                    total_amount=total_amount
                )
                for item in cart_items:
                    OrderItem.objects.create(
                        order=order, product=item.product, product_name=item.product.name,
                        quantity=item.quantity, unit_price=item.product.price,
                        line_total=item.product.price * item.quantity
                    )
                payment = Payment.objects.create(
                    order=order, phone=phone, amount=total_amount, status='pending'
                )

            try:
                result = stk_push(
                    phone=phone, amount=total_amount, 
                    reference=order.reference, description='Order Payment'
                )
                payment.checkout_request_id = result.get('CheckoutRequestID', '')
                payment.save()
            except DarajaError as e:
                order.delete() # Delete the temporary order if M-PESA fails
                return Response({'detail': str(e)}, status=502)

            return Response({'payment_id': payment.id, 'order_id': order.id}, status=201)
        except Exception as e:
            return Response({'detail': str(e)}, status=500)

# --- 2. M-PESA CALLBACK (Finalizes or Deletes Order) ---
class MpesaCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, secret):
        expected = settings.DARAJA_CALLBACK_SECRET
        if not expected or not hmac.compare_digest(secret.encode(), expected.encode()):
            raise Http404

        ack = Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})
        try:
            body = request.data['Body']['stkCallback']
            checkout_id = body['CheckoutRequestID']
            code = int(body['ResultCode'])
            receipt = ''
            for item in body.get('CallbackMetadata', {}).get('Item', []):
                if item.get('Name') == 'MpesaReceiptNumber':
                    receipt = str(item.get('Value', ''))
        except (KeyError, TypeError, ValueError):
            return ack

        with transaction.atomic():
            payment = Payment.objects.select_for_update().filter(checkout_request_id=checkout_id).first()
            if payment and payment.status == 'pending':
                if code == 0:
                    # SUCCESS: Finalize the order
                    payment.status = 'success'
                    payment.mpesa_receipt = receipt
                    payment.result_description = 'Payment received'
                    payment.completed_at = timezone.now()
                    payment.save()

                    payment.order.status = 'placed'
                    payment.order.reference = f"CC-{uuid.uuid4().hex[:4].upper()}" # Real reference
                    payment.order.save()

                    # Clear the cart
                    Cart.objects.filter(user=payment.order.user).delete()
                else:
                    # FAILED: Delete the temporary order
                    payment.status = 'failed'
                    payment.save()
                    payment.order.delete()

        return ack

# --- 3. START STRIPE PAYMENT (Creates Temporary Order) ---
class CreateStripeSessionView(APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        notes = request.data.get('notes', '')
        try:
            cart = Cart.objects.get(user=request.user)
            cart_items = cart.items.all()
            if not cart_items:
                return Response({'detail': 'Cart is empty'}, status=400)
                
            total_amount = sum(item.product.price * item.quantity for item in cart_items)

            with transaction.atomic():
                order = Order.objects.create(
                    user=request.user, reference=f"TEMP-{uuid.uuid4().hex[:6].upper()}",
                    status='pending', contact_phone='CARD', notes=notes, total_amount=total_amount
                )
                for item in cart_items:
                    OrderItem.objects.create(
                        order=order, product=item.product, product_name=item.product.name,
                        quantity=item.quantity, unit_price=item.product.price,
                        line_total=item.product.price * item.quantity
                    )
                payment = Payment.objects.create(
                    order=order, phone='CARD', amount=total_amount, status='pending'
                )

            session = stripe.checkout.Session.create(
                line_items=[{
                    'price_data': {
                        'currency': 'kes',
                        'product_data': {'name': f'Order {order.reference}'},
                        'unit_amount': int(total_amount * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'http://localhost:5173/checkout?success=true&payment_id={payment.id}',
                cancel_url='http://localhost:5173/checkout?cancelled=true',
                metadata={'payment_id': payment.id}
            )
            return Response({'url': session.url})
        except Exception as e:
            return Response({'detail': str(e)}, status=500)

# --- 4. STRIPE WEBHOOK (Finalizes Order) ---
@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = 'whsec_your_webhook_secret'

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            payment_id = session['metadata']['payment_id']
            with transaction.atomic():
                payment = Payment.objects.select_for_update().get(pk=payment_id)
                if payment.status == 'pending':
                    payment.status = 'success'
                    payment.mpesa_receipt = session['payment_intent']
                    payment.result_description = 'Stripe Card Payment'
                    payment.completed_at = timezone.now()
                    payment.save()

                    payment.order.status = 'placed'
                    payment.order.reference = f"CC-{uuid.uuid4().hex[:4].upper()}"
                    payment.order.save()

                    Cart.objects.filter(user=payment.order.user).delete()

        return Response({'status': 'success'})

# --- 5. KEEPING YOUR EXISTING VIEWS ---
class CheckPaymentView(APIView):
    permission_classes = [IsCustomer]
    def post(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk, order__user=request.user)
        if (payment.status == 'pending' and settings.PAYMENT_MODE == 'daraja' and payment.checkout_request_id):
            try:
                result = stk_query(payment.checkout_request_id)
            except DarajaError as error:
                return Response({'detail': str(error)}, status=status.HTTP_502_BAD_GATEWAY)
            try:
                code = None if result.get('ResultCode') is None else int(result['ResultCode'])
            except (TypeError, ValueError):
                code = None
            if code is not None:
                with transaction.atomic():
                    locked = Payment.objects.select_for_update().get(pk=payment.pk)
                    apply_result(locked, code, result.get('ResultDesc', ''))
        payment.refresh_from_db()
        return Response(PaymentSerializer(payment).data)

class SimulatePaymentView(APIView):
    permission_classes = [IsCustomer]
    def post(self, request, pk):
        if settings.PAYMENT_MODE != 'simulated':
            raise Http404
        serializer = SimulatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.validated_data['result']
        with transaction.atomic():
            payment = get_object_or_404(Payment.objects.select_for_update(), pk=pk, order__user=request.user)
            if payment.status != 'pending':
                return Response({'detail': 'This payment is already completed.'}, status=400)
            payment.status = result
            payment.completed_at = timezone.now()
            payment.save()
        return Response(PaymentSerializer(payment).data)

class PaymentDetailView(APIView):
    permission_classes = [IsCustomer]
    def get(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk, order__user=request.user)
        return Response(PaymentSerializer(payment).data)

class AdminPaymentListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = PaymentSerializer
    def get_queryset(self):
        queryset = Payment.objects.select_related('order')
        status_value = self.request.query_params.get('status')
        if status_value in dict(Payment.STATUS_CHOICES):
            queryset = queryset.filter(status=status_value)
        return queryset