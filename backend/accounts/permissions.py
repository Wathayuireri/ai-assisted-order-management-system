from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Permission check to allow only users with the 'admin' role.
    """
    def has_permission(self, request, view):
        # Check if user is authenticated and their role is 'admin'
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'role', None) == 'admin'
        )