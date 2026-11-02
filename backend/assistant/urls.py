from django.urls import path

from .views import AdminAssistantView, CustomerAssistantView

urlpatterns = [
    path('customer/', CustomerAssistantView.as_view()),
    path('admin/', AdminAssistantView.as_view()),
]