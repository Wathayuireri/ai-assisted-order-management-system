from django.urls import path

from .views import (AdminPaymentListView, PaymentDetailView,
                    SimulatePaymentView, StartPaymentView)

urlpatterns = [
    path('start/', StartPaymentView.as_view()),
    path('admin/', AdminPaymentListView.as_view()),
    path('<int:pk>/', PaymentDetailView.as_view()),
    path('<int:pk>/simulate/', SimulatePaymentView.as_view()),
]