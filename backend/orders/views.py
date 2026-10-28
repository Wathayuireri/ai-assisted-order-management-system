from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole, IsCustomer
from cart.views import get_cart
from catalogue.models import Product

from .models import Order, OrderItem, OrderStatusHistory
from .serializers import (AdminOrderSerializer, CheckoutSerializer,
                          OrderSerializer, StatusUpdateSerializer)

# The only status changes that are allowed.
ALLOWED_TRANSITIONS = {
    'placed': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['dispatched', 'cancelled'],
    'dispatched': ['delivered'],
    'delivered': [],
    'cancelled': [],
}


class CheckoutError(Exception):
    def __init__(self, problems):
        super().__init__('Checkout failed')
        self.problems = problems


class CheckoutView(APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        cart = get_cart(request.user)
        cart_items = list(cart.items.select_related('product'))
        if not cart_items:
            return Response({'detail': 'Your cart is empty.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                order = self.create_order(request.user, cart, cart_items, data)
        except CheckoutError as error:
            return Response(
                {'detail': 'Some items in your cart cannot be ordered.',
                 'problems': error.problems},
                status=status.HTTP_400_BAD_REQUEST)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    def create_order(self, user, cart, cart_items, data):
        product_ids = sorted(item.product_id for item in cart_items)
        products = {
            product.pk: product
            for product in Product.objects.select_for_update()
            .filter(pk__in=product_ids).order_by('pk')
        }

        problems = []
        for item in cart_items:
            product = products[item.product_id]
            if not product.is_active:
                problems.append(f'{product.name} is no longer available.')
            elif product.stock_quantity == 0:
                problems.append(f'{product.name} is out of stock.')
            elif item.quantity > product.stock_quantity:
                problems.append(
                    f'{product.name}: only {product.stock_quantity} available.')
        if problems:
            raise CheckoutError(problems)

        order = Order.objects.create(
            user=user,
            contact_phone=data['contact_phone'],
            notes=data.get('notes', ''),
            total_amount=Decimal('0.00'),
        )

        total = Decimal('0.00')
        for item in cart_items:
            product = products[item.product_id]
            line_total = product.price * item.quantity
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                quantity=item.quantity,
                unit_price=product.price,
                line_total=line_total,
            )
            product.stock_quantity -= item.quantity
            product.save(update_fields=['stock_quantity', 'updated_at'])
            total += line_total

        order.total_amount = total
        order.reference = f'CC-{1000 + order.pk}'
        order.save(update_fields=['total_amount', 'reference', 'updated_at'])

        OrderStatusHistory.objects.create(order=order, status='placed', changed_by=user)
        cart.items.all().delete()
        return order


class MyOrderListView(generics.ListAPIView):
    """A customer's own orders, newest first."""
    permission_classes = [IsCustomer]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return (Order.objects.filter(user=self.request.user)
                .prefetch_related('items', 'history'))


class OrderDetailView(APIView):
    permission_classes = [IsCustomer]

    def get(self, request, pk):
        order = get_object_or_404(
            Order.objects.prefetch_related('items', 'history'),
            pk=pk, user=request.user)
        return Response(OrderSerializer(order).data)


class AdminOrderListView(generics.ListAPIView):
    """All orders, with filters: ?status=, ?customer_type=, ?search="""
    permission_classes = [IsAdminRole]
    serializer_class = AdminOrderSerializer

    def get_queryset(self):
        queryset = (Order.objects
                    .select_related('user', 'user__profile')
                    .prefetch_related('items', 'history'))
        params = self.request.query_params

        status_value = params.get('status')
        if status_value in dict(Order.STATUS_CHOICES):
            queryset = queryset.filter(status=status_value)

        customer_type = params.get('customer_type')
        if customer_type in ('individual', 'business'):
            queryset = queryset.filter(user__profile__customer_type=customer_type)

        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(reference__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__profile__company_name__icontains=search)
            )
        return queryset


class AdminOrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = AdminOrderSerializer
    queryset = (Order.objects
                .select_related('user', 'user__profile')
                .prefetch_related('items', 'history'))


class AdminOrderStatusView(APIView):
    """Moves an order along its path, and returns stock if it is cancelled."""
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        serializer = StatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['status']

        with transaction.atomic():
            order = get_object_or_404(Order.objects.select_for_update(), pk=pk)
            allowed = ALLOWED_TRANSITIONS.get(order.status, [])

            if new_status not in allowed:
                return Response(
                    {'detail': (f'An order that is {order.get_status_display().lower()} '
                                f'cannot be changed to {new_status}.'),
                     'allowed': allowed},
                    status=status.HTTP_400_BAD_REQUEST)

            if new_status == 'cancelled':
                items = sorted(order.items.all(), key=lambda item: item.product_id)
                for item in items:
                    product = Product.objects.select_for_update().get(pk=item.product_id)
                    product.stock_quantity += item.quantity
                    product.save(update_fields=['stock_quantity', 'updated_at'])

            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])
            OrderStatusHistory.objects.create(
                order=order, status=new_status, changed_by=request.user)

        order = (Order.objects
                 .select_related('user', 'user__profile')
                 .prefetch_related('items', 'history').get(pk=pk))
        return Response(AdminOrderSerializer(order).data)