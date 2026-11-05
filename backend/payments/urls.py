from django.urls import path

from .views import (AdminPaymentListView, CheckPaymentView, MpesaCallbackView,
                    PaymentDetailView, SimulatePaymentView, CreateStripeSessionView,StripeWebhookView,StartPaymentView)

urlpatterns = [
    path('start/', StartPaymentView.as_view()),
    path('admin/', AdminPaymentListView.as_view()),
    path('mpesa/callback/<str:secret>/', MpesaCallbackView.as_view()),
    path('<int:pk>/check/', CheckPaymentView.as_view()),
    path('<int:pk>/simulate/', SimulatePaymentView.as_view()),
    path('<int:pk>/', PaymentDetailView.as_view()),
    path('stripe/create-session/', CreateStripeSessionView.as_view()),
    path('stripe/webhook/', StripeWebhookView.as_view()),
]