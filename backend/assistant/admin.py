from django.contrib import admin

from .models import AIConversationLog


@admin.register(AIConversationLog)
class AIConversationLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'assistant', 'user', 'short_question')
    list_filter = ('assistant',)
    search_fields = ('question', 'answer', 'user__email')
    readonly_fields = [field.name for field in AIConversationLog._meta.fields]

    def short_question(self, obj):
        return obj.question[:60]

    def has_add_permission(self, request):
        return False