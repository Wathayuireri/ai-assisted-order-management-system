from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'phone', 'amount', 'status', 'mpesa_receipt', 'created_at')
    list_filter = ('status',)
    search_fields = ('order__reference', 'phone', 'mpesa_receipt')
    readonly_fields = [field.name for field in Payment._meta.fields]

    def has_add_permission(self, request):
        return False