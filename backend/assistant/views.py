import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole, IsCustomer

from .llm import AIError
from .models import AIConversationLog
from .serializers import AssistantRequestSerializer
from .services import admin_reply, customer_reply

logger = logging.getLogger(__name__)

UNAVAILABLE = 'The assistant is not available right now. Please try again, or contact our staff.'


class BaseAssistantView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'assistant'
    assistant = ''
    reply_function = None

    def post(self, request):
        serializer = AssistantRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.validated_data['message']
        history = serializer.validated_data.get('history', [])

        try:
            result = type(self).reply_function(message, history)
        except AIError:
            logger.exception('AI request failed')
            return Response({'detail': UNAVAILABLE}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        #AIConversationLog.objects.create(
            #user=request.user, assistant=self.assistant,
            #question=message, answer=result['answer'])
        return Response({**result, 'ai_generated': True})


class CustomerAssistantView(BaseAssistantView):
    permission_classes = [IsCustomer]
    assistant = 'customer'
    reply_function = staticmethod(customer_reply)


class AdminAssistantView(BaseAssistantView):
    permission_classes = [IsAdminRole]
    assistant = 'admin'
    reply_function = staticmethod(admin_reply)