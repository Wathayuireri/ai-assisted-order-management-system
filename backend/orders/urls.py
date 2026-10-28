from django.urls import path

from .views import (AdminOrderDetailView, AdminOrderListView,
                    AdminOrderStatusView, CheckoutView, MyOrderListView,
                    OrderDetailView)

urlpatterns = [
    path('', MyOrderListView.as_view()),
    path('checkout/', CheckoutView.as_view()),
    path('admin/', AdminOrderListView.as_view()),
    path('admin/<int:pk>/', AdminOrderDetailView.as_view()),
    path('admin/<int:pk>/status/', AdminOrderStatusView.as_view()),
    path('<int:pk>/', OrderDetailView.as_view()),
]