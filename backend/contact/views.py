from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole

from .models import ContactMessage
from .serializers import (ContactCreateSerializer, ContactMessageSerializer,
                          MarkReadSerializer)


class ContactCreateView(generics.CreateAPIView):
    """Anyone can send a message. Limited per address to stop spam."""
    serializer_class = ContactCreateSerializer
    permission_classes = [AllowAny]
    authentication_classes = []        # an expired token must not block a visitor
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'contact'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Your message has been sent.'},
                        status=status.HTTP_201_CREATED)


class AdminMessageListView(generics.ListAPIView):
    """All messages for staff. Optional filter: ?is_read=true or ?is_read=false"""
    permission_classes = [IsAdminRole]
    serializer_class = ContactMessageSerializer

    def get_queryset(self):
        queryset = ContactMessage.objects.all()
        is_read = self.request.query_params.get('is_read')
        if is_read in ('true', 'false'):
            queryset = queryset.filter(is_read=(is_read == 'true'))
        return queryset


class UnreadCountView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response({'unread': ContactMessage.objects.filter(is_read=False).count()})


class AdminMessageDetailView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        message = get_object_or_404(ContactMessage, pk=pk)
        if not message.is_read:                      # opening a message marks it read
            message.is_read = True
            message.save(update_fields=['is_read'])
        return Response(ContactMessageSerializer(message).data)

    def patch(self, request, pk):
        message = get_object_or_404(ContactMessage, pk=pk)
        serializer = MarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message.is_read = serializer.validated_data['is_read']
        message.save(update_fields=['is_read'])
        return Response(ContactMessageSerializer(message).data)