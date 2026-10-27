from django.contrib.auth.models import AbstractUser
from django.db import models



class User(AbstractUser):
    ROLE_CHOICES = [('customer', 'Customer'), ('admin', 'Admin')]

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'admin'
        super().save(*args, **kwargs)


class CustomerProfile(models.Model):
    TYPE_CHOICES = [('individual', 'Individual'), ('business', 'Business')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    customer_type = models.CharField(max_length=12, choices=TYPE_CHOICES, default='individual')
    company_name = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return f'{self.user.email} ({self.customer_type})'