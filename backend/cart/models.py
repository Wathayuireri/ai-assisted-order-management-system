from django.conf import settings
from django.db import models

from catalogue.models import Product


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Cart of {self.user.email}'


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['cart', 'product'], name='unique_product_per_cart'),
        ]

    def __str__(self):
        return f'{self.quantity} x {self.product.name}'

    @property
    def line_total(self):
        return self.product.price * self.quantity

    def problem(self):
        """Returns a message if this item can no longer be bought, else an empty string."""
        product = self.product
        if not product.is_active:
            return 'This product is no longer available.'
        if product.stock_quantity == 0:
            return 'This product is out of stock.'
        if self.quantity > product.stock_quantity:
            return f'Only {product.stock_quantity} available. Reduce the quantity.'
        return ''