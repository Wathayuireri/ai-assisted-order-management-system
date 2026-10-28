import re

from rest_framework import serializers

from .models import Order, OrderItem, OrderStatusHistory

PHONE_PATTERN = re.compile(r'^(?:\+?254|0)\d{9}$')


class CheckoutSerializer(serializers.Serializer):
    contact_phone = serializers.CharField(max_length=15)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_contact_phone(self, value):
        phone = value.replace(' ', '')
        if not PHONE_PATTERN.match(phone):
            raise serializers.ValidationError(
                'Enter a valid Kenyan phone number, for example 0712345678.')
        return phone


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'line_total']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ['status', 'status_label', 'changed_at']


class OrderSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'reference', 'status', 'status_label', 'contact_phone',
                  'notes', 'total_amount', 'created_at', 'items', 'history']


class AdminOrderSerializer(OrderSerializer):
    customer = serializers.SerializerMethodField()

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ['customer']

    def get_customer(self, obj):
        user = obj.user
        profile = getattr(user, 'profile', None)
        return {
            'id': user.id,
            'name': f'{user.first_name} {user.last_name}'.strip(),
            'email': user.email,
            'phone': user.phone,
            'customer_type': profile.customer_type if profile else None,
            'company_name': profile.company_name if profile else '',
        }


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)