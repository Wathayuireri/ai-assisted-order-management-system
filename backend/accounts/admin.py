from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User  # If your model is named CustomUser, change 'User' to 'CustomUser'

admin.site.register(User, UserAdmin)