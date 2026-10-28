from rest_framework import serializers

from catalogue.models import Product

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    pack_size = serializers.CharField(source='product.pack_size', read_only=True)
    unit_price = serializers.DecimalField(
        source='product.price', max_digits=10, decimal_places=2, read_only=True)
    stock_quantity = serializers.IntegerField(source='product.stock_quantity', read_only=True)
    line_total = serializers.SerializerMethodField()
    problem = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_name', 'pack_size', 'unit_price',
                  'quantity', 'line_total', 'stock_quantity', 'problem']

    def get_line_total(self, obj):
        return str(obj.line_total)

    def get_problem(self, obj):
        return obj.problem()


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    can_checkout = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'item_count', 'total', 'can_checkout']

    def get_total(self, obj):
        total = sum(item.line_total for item in obj.items.select_related('product'))
        return str(total) if total else '0.00'

    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_can_checkout(self, obj):
        items = list(obj.items.select_related('product'))
        return bool(items) and all(item.problem() == '' for item in items)


class AddItemSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1, max_value=1000, default=1)


class QuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=1000)