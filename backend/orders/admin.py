from django.contrib import admin

from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = ('product', 'product_name', 'quantity', 'unit_price', 'line_total')


class StatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    can_delete = False
    readonly_fields = ('status', 'changed_by', 'changed_at')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('reference', 'user', 'status', 'total_amount', 'created_at')
    list_filter = ('status',)
    search_fields = ('reference', 'user__email')
    readonly_fields = ('reference', 'status', 'total_amount', 'created_at')
    inlines = [OrderItemInline, StatusHistoryInline]