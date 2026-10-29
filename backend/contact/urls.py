from django.urls import path

from .views import (AdminMessageDetailView, AdminMessageListView,
                    ContactCreateView, UnreadCountView)

urlpatterns = [
    path('', ContactCreateView.as_view()),
    path('admin/', AdminMessageListView.as_view()),
    path('admin/unread-count/', UnreadCountView.as_view()),
    path('admin/<int:pk>/', AdminMessageDetailView.as_view()),
]