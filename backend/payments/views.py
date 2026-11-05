import stripe
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


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

from accounts.permissions import IsAdminRole, IsCustomer
from orders.models import Order

from .daraja import DarajaError, stk_push, stk_query
from .models import Payment
from .serializers import (PaymentSerializer, SimulatePaymentSerializer,
                          StartPaymentSerializer)
from .services import apply_result


class StartPaymentView(APIView):
    """Starts a payment for one of the customer's own orders."""
    permission_classes = [IsCustomer]

    def post(self, request):
        mode = settings.PAYMENT_MODE
        if mode not in ('simulated', 'daraja'):
            return Response({'detail': 'Payments are not switched on.'},
                            status=status.HTTP_501_NOT_IMPLEMENTED)

        serializer = StartPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            # Lock the order so two requests cannot start two payments at once.
            order = get_object_or_404(
                Order.objects.select_for_update(),
                pk=data['order'], user=request.user)

            if order.status == 'cancelled':
                return Response({'detail': 'This order was cancelled.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if order.payments.filter(status='success').exists():
                return Response({'detail': 'This order is already paid.'},
                                status=status.HTTP_400_BAD_REQUEST)

            # A payment that has waited too long is closed.
            cutoff = timezone.now() - timedelta(minutes=settings.PAYMENT_PENDING_MINUTES)
            order.payments.filter(status='pending', created_at__lt=cutoff).update(
                status='cancelled', result_description='Timed out',
                completed_at=timezone.now())

            if order.payments.filter(status='pending').exists():
                return Response(
                    {'detail': 'A payment is already waiting for this order.'},
                    status=status.HTTP_400_BAD_REQUEST)

            payment = Payment.objects.create(
                order=order,
                phone=data['mpesa_phone'],
                amount=order.total_amount,          # always taken from the order
                checkout_request_id=(f'SIM-{uuid.uuid4().hex[:12].upper()}'
                                     if mode == 'simulated' else ''),
            )

        if mode == 'daraja':
            # The call to Safaricom happens outside the lock.
            try:
                result = stk_push(
                    phone=payment.phone, amount=payment.amount,
                    reference=order.reference, description='Order payment')
                checkout_id = result.get('CheckoutRequestID')
                if not checkout_id:
                    raise DarajaError('M-Pesa did not return a payment reference.')
            except DarajaError as error:
                payment.status = 'failed'
                payment.result_description = str(error)[:200]
                payment.completed_at = timezone.now()
                payment.save()
                return Response({'detail': str(error)}, status=status.HTTP_502_BAD_GATEWAY)

            payment.checkout_request_id = checkout_id
            payment.result_description = str(result.get('CustomerMessage', ''))[:200]
            payment.save(update_fields=['checkout_request_id', 'result_description'])

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class MpesaCallbackView(APIView):
    """Safaricom calls this with the result of a payment.

    The secret in the address proves the call is meant for us. The body is still
    checked: the payment must exist, be pending, and the amount must match.
    """
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
        except (KeyError, TypeError, ValueError):
            return ack
        if not checkout_id:
            return ack

        receipt = ''
        paid_amount = None
        metadata = body.get('CallbackMetadata') or {}
        for item in metadata.get('Item', []):
            if item.get('Name') == 'MpesaReceiptNumber':
                receipt = str(item.get('Value', ''))
            elif item.get('Name') == 'Amount':
                paid_amount = item.get('Value')

        with transaction.atomic():
            payment = (Payment.objects.select_for_update()
                       .filter(checkout_request_id=checkout_id).first())
            if payment:
                apply_result(payment, code, body.get('ResultDesc', ''),
                             receipt=receipt, paid_amount=paid_amount)
        return ack


class CheckPaymentView(APIView):
    """Lets the customer ask Daraja what happened, if the callback never arrived."""
    permission_classes = [IsCustomer]

    def post(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk, order__user=request.user)

        if (payment.status == 'pending' and settings.PAYMENT_MODE == 'daraja'
                and payment.checkout_request_id):
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
    """Development only: pretends to be the M-Pesa result."""
    permission_classes = [IsCustomer]

    def post(self, request, pk):
        if settings.PAYMENT_MODE != 'simulated':
            raise Http404

        serializer = SimulatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.validated_data['result']

        with transaction.atomic():
            payment = get_object_or_404(
                Payment.objects.select_for_update(),
                pk=pk, order__user=request.user)

            if payment.status != 'pending':
                return Response({'detail': 'This payment is already completed.'},
                                status=status.HTTP_400_BAD_REQUEST)

            payment.status = result
            payment.completed_at = timezone.now()
            if result == 'success':
                payment.mpesa_receipt = f'SIM{payment.pk:07d}'
                payment.result_description = 'Simulated payment received'
            elif result == 'failed':
                payment.result_description = 'Simulated failure'
            else:
                payment.result_description = 'Cancelled by the customer'
            payment.save()

        return Response(PaymentSerializer(payment).data)


class PaymentDetailView(APIView):
    """Lets the screen check the result of a payment."""
    permission_classes = [IsCustomer]

    def get(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk, order__user=request.user)
        return Response(PaymentSerializer(payment).data)


class AdminPaymentListView(generics.ListAPIView):
    """All payments for staff, with an optional ?status= filter."""
    permission_classes = [IsAdminRole]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        queryset = Payment.objects.select_related('order')
        status_value = self.request.query_params.get('status')
        if status_value in dict(Payment.STATUS_CHOICES):
            queryset = queryset.filter(status=status_value)
        return queryset

    # --- STRIPE INTEGRATION ---

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateStripeSessionView(APIView):
    """Creates a Stripe checkout session and returns the URL."""
    permission_classes = [IsCustomer]

    def post(self, request):
        order_id = request.data.get('order')
        
        # 1. Find the order and lock it (prevent double payment)
        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update(), 
                pk=order_id, user=request.user
            )
            
            if order.payments.filter(status='success').exists():
                return Response({'detail': 'This order is already paid.'}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Create a pending payment record in your database
            payment = Payment.objects.create(
                order=order,
                phone='CARD', # Since it's a card, we don't have an M-PESA phone number
                amount=order.total_amount,
                status='pending'
            )

        # 3. Create the Stripe Session
        try:
            session = stripe.checkout.Session.create(
                line_items=[{
                    'price_data': {
                        'currency': 'kes', # Or 'usd' depending on your account
                        'product_data': {'name': f'Order {order.reference}'},
                        'unit_amount': int(order.total_amount * 100), # Stripe uses cents
                    },
                    'quantity': 1,
                }],
                mode='payment',
                # When Stripe finishes, redirect back to React
                success_url=f'http://localhost:5173/checkout?success=true&order_id={order.id}',
                cancel_url='http://localhost:5173/checkout?cancelled=true',
                # This metadata is crucial for the webhook to find the payment
                metadata={'payment_id': payment.id} 
            )
            return Response({'url': session.url})
        except Exception as e:
            payment.status = 'failed'
            payment.result_description = str(e)[:200]
            payment.save()
            return Response({'detail': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """Listens for Stripe's secure webhook to confirm the payment."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = 'whsec_your_webhook_secret' # Get this from Stripe CLI or Dashboard

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            return Response(status=400)
        except stripe.error.SignatureVerificationError:
            return Response(status=400)

        # Handle the successful checkout
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            payment_id = session['metadata']['payment_id']
            
            with transaction.atomic():
                payment = Payment.objects.select_for_update().get(pk=payment_id)
                if payment.status == 'pending':
                    payment.status = 'success'
                    payment.mpesa_receipt = session['payment_intent'] # Use the Stripe intent as receipt
                    payment.result_description = 'Stripe Card Payment'
                    payment.completed_at = timezone.now()
                    payment.save()

        return Response({'status': 'success'})