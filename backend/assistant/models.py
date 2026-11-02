from django.conf import settings
from django.db import models


class AIConversationLog(models.Model):
    ASSISTANT_CHOICES = [('customer', 'Customer'), ('admin', 'Admin')]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='ai_logs')
    assistant = models.CharField(max_length=10, choices=ASSISTANT_CHOICES)
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f'{self.assistant}: {self.question[:40]}'