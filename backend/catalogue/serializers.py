from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    in_stock = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'category_name', 'description',
                  'intended_use', 'pack_size', 'price', 'stock_quantity',
                  'in_stock', 'stock_status', 'image']

    def get_in_stock(self, obj):
        return obj.stock_quantity > 0

    def get_stock_status(self, obj):
        return 'In stock' if obj.stock_quantity > 0 else 'Out of stock'