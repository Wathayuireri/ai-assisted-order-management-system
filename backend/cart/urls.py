from django.urls import path

from .views import CartItemAddView, CartItemDetailView, CartView

urlpatterns = [
    path('', CartView.as_view()),
    path('items/', CartItemAddView.as_view()),
    path('items/<int:pk>/', CartItemDetailView.as_view()),
]