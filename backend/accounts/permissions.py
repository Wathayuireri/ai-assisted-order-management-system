from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allows only signed-in users whose role is admin."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'admin')


class IsCustomer(BasePermission):
    """Allows only signed-in users whose role is customer."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'customer')