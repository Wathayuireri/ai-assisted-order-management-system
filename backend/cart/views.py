from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsCustomer

from .models import Cart, CartItem
from .serializers import AddItemSerializer, CartSerializer, QuantitySerializer


def get_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        return Response(CartSerializer(get_cart(request.user)).data)

    def delete(self, request):
        cart = get_cart(request.user)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)


class CartItemAddView(APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        if not product.is_active:
            return Response({'detail': 'This product is not available.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if product.stock_quantity == 0:
            return Response({'detail': 'This product is out of stock.'},
                            status=status.HTTP_400_BAD_REQUEST)

        cart = get_cart(request.user)
        item = CartItem.objects.filter(cart=cart, product=product).first()
        current = item.quantity if item else 0
        new_quantity = current + quantity

        if new_quantity > product.stock_quantity:
            message = f'Only {product.stock_quantity} available.'
            if current:
                message += f' You already have {current} in your cart.'
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        if item:
            item.quantity = new_quantity
            item.save()
        else:
            CartItem.objects.create(cart=cart, product=product, quantity=quantity)

        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [IsCustomer]

    def patch(self, request, pk):
        cart = get_cart(request.user)
        item = get_object_or_404(CartItem, pk=pk, cart=cart)

        serializer = QuantitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data['quantity']
        product = item.product

        if not product.is_active:
            return Response({'detail': 'This product is no longer available.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if quantity > product.stock_quantity:
            return Response({'detail': f'Only {product.stock_quantity} available.'},
                            status=status.HTTP_400_BAD_REQUEST)

        item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request, pk):
        cart = get_cart(request.user)
        item = get_object_or_404(CartItem, pk=pk, cart=cart)
        item.delete()
        return Response(CartSerializer(cart).data)