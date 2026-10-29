from rest_framework import serializers

from .models import ContactMessage


class ContactCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'message']

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('Enter your name.')
        return value

    def validate_email(self, value):
        return value.strip().lower()

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError('Please write at least 10 characters.')
        return value


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'name', 'email', 'message', 'created_at']


class MarkReadSerializer(serializers.Serializer):
    is_read = serializers.BooleanField()