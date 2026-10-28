import uuid
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole, IsCustomer
from orders.models import Order

from .models import Payment
from .serializers import (PaymentSerializer, SimulatePaymentSerializer,
                          StartPaymentSerializer)


class StartPaymentView(APIView):
    """Starts a payment for one of the customer's own orders."""
    permission_classes = [IsCustomer]

    def post(self, request):
        if settings.PAYMENT_MODE != 'simulated':
            return Response(
                {'detail': 'Live M-Pesa payments are not switched on yet.'},
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
                checkout_request_id=f'SIM-{uuid.uuid4().hex[:12].upper()}',
            )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


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