# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Django REST API
**Type**: RESTful API Backend
**Tech Stack**: Django 5 + Django REST Framework + PostgreSQL
**Goal**: Production-ready REST API with authentication, documentation, and testing

---

## Tech Stack

### Backend
- **Framework**: Django 5.0
- **API**: Django REST Framework (DRF) 3.14+
- **Database**: PostgreSQL 15+
- **ORM**: Django ORM
- **Migration**: Django Migrations

### Authentication & Security
- **Auth**: JWT (djangorestframework-simplejwt)
- **Permissions**: Django Guardian (object-level permissions)
- **CORS**: django-cors-headers
- **Security**: django-environ, django-ratelimit

### Development
- **Python**: 3.11+
- **Package Manager**: Poetry / pip
- **Testing**: pytest + pytest-django + pytest-cov
- **Linting**: black, flake8, isort, mypy
- **Documentation**: drf-spectacular (OpenAPI 3.0)

---

## Project Structure

```
project/
├── config/                 # Project configuration
│   ├── settings/          # Settings split by environment
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── test.py
│   ├── urls.py
│   └── wsgi.py
├── apps/                   # Django applications
│   ├── core/              # Core functionality
│   ├── users/             # User management
│   └── api/               # API endpoints
├── manage.py
├── pytest.ini
├── pyproject.toml
└── .env.example
```

---

## Django Best Practices

### Settings Organization
```python
# config/settings/base.py
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = env('DJANGO_SECRET_KEY')  # Always use env vars
DEBUG = False
ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=[])

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': env('DATABASE_HOST', default='localhost'),
        'PORT': env('DATABASE_PORT', default='5432'),
        'NAME': env('DATABASE_NAME'),
        'USER': env('DATABASE_USER'),
        'PASSWORD': env('DATABASE_PASSWORD'),
    }
}

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# drf-spectacular (OpenAPI)
SPECTACULAR_SETTINGS = {
    'TITLE': 'My API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}
```

### Model Design
```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """Custom user model extending AbstractUser"""

    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    avatar = models.URLField(blank=True)
    bio = models.TextField(max_length=500, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.email

# apps/core/models.py
class TimestampedModel(models.Model):
    """Abstract base class for models with timestamps"""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

class Post(TimestampedModel):
    """Blog post model"""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=255, unique=True)
    author = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='posts'
    )
    content = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'posts'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status', '-published_at']),
        ]

    def __str__(self):
        return self.title
```

### Serializers
```python
# apps/api/serializers.py
from rest_framework import serializers
from apps.users.models import User
from apps.core.models import Post

class UserSerializer(serializers.ModelSerializer):
    """User serializer with sensitive fields excluded"""

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name',
                  'last_name', 'avatar', 'bio', 'created_at']
        read_only_fields = ['id', 'created_at']

class UserCreateSerializer(serializers.ModelSerializer):
    """User registration serializer"""

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['email', 'username', 'password',
                  'password_confirm', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Password fields did not match.'
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

class PostSerializer(serializers.ModelSerializer):
    """Post serializer with author info"""

    author = UserSerializer(read_only=True)
    author_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Post
        fields = ['id', 'title', 'slug', 'author', 'author_id',
                  'content', 'status', 'published_at',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
```

### Views & ViewSets
```python
# apps/api/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.models import Post
from .serializers import PostSerializer

class PostViewSet(viewsets.ModelViewSet):
    """ViewSet for Post model"""

    queryset = Post.objects.select_related('author').all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'author']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'published_at']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        """Set author to current user on create"""
        serializer.save(author=self.request.user)

    @action(detail=False, methods=['get'])
    def published(self, request):
        """Get all published posts"""
        published = self.queryset.filter(status='published')
        serializer = self.get_serializer(published, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a post"""
        post = self.get_object()
        post.status = 'published'
        post.published_at = timezone.now()
        post.save()
        serializer = self.get_serializer(post)
        return Response(serializer.data)
```

### URLs & Routers
```python
# config/urls.py
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/posts/', include('apps.api.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# apps/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')

urlpatterns = [
    path('', include(router.urls)),
]
```

---

## Testing Best Practices

### Pytest Configuration
```python
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --reuse-db
    --cov=.
    --cov-report=html
    --cov-report=term-missing
```

### Test Example
```python
# apps/api/tests/test_views.py
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.core.models import Post

@pytest.mark.django_db
class TestPostViewSet:
    """Test PostViewSet"""

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    @pytest.fixture
    def authenticated_client(self, api_client, user):
        """Return authenticated client"""
        response = api_client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        token = response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return api_client

    def test_list_posts(self, authenticated_client):
        """Test listing posts"""
        response = authenticated_client.get('/api/posts/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data['results'], list)

    def test_create_post(self, authenticated_client, user):
        """Test creating a post"""
        data = {
            'title': 'Test Post',
            'slug': 'test-post',
            'content': 'Test content',
            'status': 'draft',
            'author_id': user.id
        }
        response = authenticated_client.post('/api/posts/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Post.objects.count() == 1

    def test_publish_post(self, authenticated_client):
        """Test publishing a post"""
        post = Post.objects.create(
            title='Test',
            slug='test',
            content='Content',
            author=User.objects.first()
        )
        response = authenticated_client.post(f'/api/posts/{post.id}/publish/')
        assert response.status_code == status.HTTP_200_OK
        post.refresh_from_db()
        assert post.status == 'published'
```

---

## Common Commands

### Development
```bash
poetry install           # Install dependencies
poetry run python manage.py runserver  # Start dev server
poetry run python manage.py migrate     # Run migrations
poetry run python manage.py createsuperuser  # Create admin user
poetry run python manage.py shell       # Django shell
```

### Database
```bash
poetry run python manage.py makemigrations  # Create migrations
poetry run python manage.py migrate         # Apply migrations
poetry run python manage.py showmigrations  # Show migrations
poetry run python manage.py sqlmigrate app 0001  # Show SQL
```

### Testing
```bash
poetry run pytest              # Run tests
poetry run pytest -v           # Verbose output
poetry run pytest --cov        # With coverage
poetry run pytest -x           # Stop on first failure
```

### Code Quality
```bash
poetry run black .             # Format code
poetry run isort .             # Sort imports
poetry run flake8              # Lint code
poetry run mypy .              # Type checking
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use `python manage.py migrate --fake-initial` in production
- Don't commit `.env` files or sensitive data
- Don't use `Model.objects.get()` without try/catch
- Don't forget to run migrations after model changes
- Don't use raw SQL queries unless absolutely necessary
- Don't disable CSRF protection
- Don't use `@csrf_exempt` unless necessary
- Don't forget to use `select_related` and `prefetch_related` for foreign keys

### ⚠️ Use with Caution
- `Model.objects.get()` - use `get_object_or_404` in views
- Raw SQL queries - use ORM when possible
- `--fake` migrations - only in development
- Database indexes - add them based on query patterns

---

## Performance Optimization

### Query Optimization
```python
# ❌ Bad - N+1 query problem
posts = Post.objects.all()
for post in posts:
    print(post.author.email)  # N+1 queries!

# ✅ Good - Use select_related
posts = Post.objects.select_related('author').all()
for post in posts:
    print(post.author.email)  # Single query!

# ✅ Good - Use prefetch_related for many-to-many
categories = Category.objects.prefetch_related('posts').all()
for category in categories:
    for post in category.posts.all():
        print(post.title)
```

### Database Indexing
```python
class Post(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=255, unique=True)
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
```

---

## Security Best Practices

### Always
- ✅ Use environment variables for secrets
- ✅ Enable `DEBUG = False` in production
- ✅ Use `ALLOWED_HOSTS` properly
- ✅ Enable HTTPS and secure cookies
- ✅ Validate all user input
- ✅ Use Django's built-in password hashing
- ✅ Implement rate limiting
- ✅ Keep dependencies updated

### Never
- ❌ Commit `.env` files
- ❌ Use `DEBUG = True` in production
- ❌ Expose sensitive data in API responses
- ❌ Use hardcoded credentials
- ❌ Disable CSRF protection
- ❌ Forget to validate file uploads

---

## Environment Variables

```env
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,.yourdomain.com

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=your_db_name
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password

# Security
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

**Last Updated**: 2026-03-01
