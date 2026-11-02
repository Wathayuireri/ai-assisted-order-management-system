from rest_framework import serializers


class AssistantRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=500)
    history = serializers.ListField(
        child=serializers.DictField(), required=False, max_length=12)