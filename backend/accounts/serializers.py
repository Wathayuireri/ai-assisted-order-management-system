from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomerProfile, User


class UserSerializer(serializers.ModelSerializer):
    customer_type = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone',
                  'role', 'customer_type', 'company_name']

    def get_customer_type(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.customer_type if profile else None

    def get_company_name(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.company_name if profile else ''


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    customer_type = serializers.ChoiceField(
        choices=CustomerProfile.TYPE_CHOICES, default='individual')
    company_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone',
                  'password', 'customer_type', 'company_name']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'An account with this email already exists.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs.get('customer_type') == 'business' and not attrs.get('company_name'):
            raise serializers.ValidationError(
                {'company_name': 'Enter the business or organisation name.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        customer_type = validated_data.pop('customer_type')
        company_name = validated_data.pop('company_name', '')
        password = validated_data.pop('password')
        user = User.objects.create_user(
            username=validated_data['email'], password=password, **validated_data)
        CustomerProfile.objects.create(
            user=user, customer_type=customer_type, company_name=company_name)
        return user


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Sign in with email and password; the token also carries the role."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data