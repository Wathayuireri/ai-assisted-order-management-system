import re

from rest_framework import serializers

from .models import Payment

PHONE_PATTERN = re.compile(r'^(?:\+?254|0)([71]\d{8})$')


class StartPaymentSerializer(serializers.Serializer):
    order = serializers.IntegerField()
    mpesa_phone = serializers.CharField(max_length=15)

    def validate_mpesa_phone(self, value):
        phone = value.replace(' ', '')
        match = PHONE_PATTERN.match(phone)
        if not match:
            raise serializers.ValidationError(
                'Enter a valid M-Pesa number, for example 0712345678.')
        return '254' + match.group(1)


class SimulatePaymentSerializer(serializers.Serializer):
    result = serializers.ChoiceField(choices=['success', 'failed', 'cancelled'])


class PaymentSerializer(serializers.ModelSerializer):
    order_reference = serializers.CharField(source='order.reference', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'order', 'order_reference', 'method', 'phone', 'amount',
                  'checkout_request_id', 'mpesa_receipt', 'status', 'status_label',
                  'result_description', 'created_at', 'completed_at']