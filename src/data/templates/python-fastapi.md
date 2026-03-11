# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Python FastAPI Application
**Type**: Modern REST API Backend
**Tech Stack**: FastAPI + SQLAlchemy + Pydantic + Python 3.11+
**Goal**: Production-ready API with async support, validation, and best practices

---

## Tech Stack

### Core
- **Framework**: FastAPI 0.109+
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0+ (async)
- **Validation**: Pydantic v2
- **Database**: PostgreSQL / SQLite
- **Migrations**: Alembic

### Development
- **Package Manager**: uv / poetry / pip
- **Testing**: pytest + pytest-asyncio
- **Linting**: ruff
- **Formatting**: black
- **Type Checking**: mypy

---

## Code Standards

### Python Rules
- Use Python 3.11+ features (type hints, match statements)
- Enable strict mypy checking
- Use f-strings for formatting
- Prefer pathlib over os.path
- Use dataclasses or Pydantic for data structures

```python
# ✅ Good
from typing import Annotated
from pydantic import BaseModel, Field

class User(BaseModel):
    id: Annotated[int, Field(gt=0)]
    name: Annotated[str, Field(min_length=1, max_length=100)]
    email: Annotated[str, Field(pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')]

# ❌ Bad
class User:
    def __init__(self, id, name, email):
        self.id = id
        self.name = name
        self.email = email
```

### Naming Conventions
- **Variables/Functions**: snake_case (`get_user_by_id`)
- **Classes**: PascalCase (`UserController`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Private**: _leading_underscore (`_internal_cache`)
- **Modules**: snake_case (`user_service.py`)

---

## Directory Structure

```
project/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── users.py
│   │   │   │   ├── auth.py
│   │   │   │   └── items.py
│   │   │   └── __init__.py
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── exceptions.py
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── init_db.py
│   ├── models/
│   │   ├── user.py
│   │   ├── item.py
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── item.py
│   │   └── __init__.py
│   ├── services/
│   │   ├── user_service.py
│   │   ├── auth_service.py
│   │   └── email_service.py
│   ├── utils/
│   │   ├── validators.py
│   │   └── helpers.py
│   └── main.py
├── tests/
│   ├── api/
│   ├── services/
│   └── conftest.py
├── alembic/
│   └── versions/
├── alembic.ini
├── pyproject.toml
├── requirements.txt
└── .env
```

---

## FastAPI Application Structure

### Main Application
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Router Configuration
```python
# app/api/v1/__init__.py
from fastapi import APIRouter
from app.api.v1.endpoints import users, auth, items

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
```

---

## Pydantic Schemas

### Request/Response Schemas
```python
# app/schemas/user.py
from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    full_name: Annotated[str, Field(min_length=1, max_length=100)]

class UserCreate(UserBase):
    password: Annotated[str, Field(min_length=8, max_length=100)]

class UserUpdate(BaseModel):
    full_name: Optional[Annotated[str, Field(min_length=1, max_length=100)]] = None
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    page_size: int
```

### Validation Rules
- Use Pydantic v2 with `Annotated` + `Field`
- Separate schemas for create/update/response
- Use `model_config = ConfigDict(from_attributes=True)` for ORM mode
- Validate at schema level, not in endpoints

```python
# ✅ Good - schema validation
class ItemCreate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=200)]
    price: Annotated[float, Field(gt=0)]
    quantity: Annotated[int, Field(ge=0)]

# ❌ Bad - manual validation in endpoint
@router.post("/items/")
async def create_item(name: str, price: float):
    if len(name) == 0:
        raise HTTPException(400, "Name required")
    if price <= 0:
        raise HTTPException(400, "Price must be positive")
```

---

## Database Models (SQLAlchemy)

### Model Definition
```python
# app/models/user.py
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    # Relationships
    items: Mapped[list["Item"]] = relationship(back_populates="owner")
```

### Database Session
```python
# app/db/session.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

---

## Dependency Injection

### Common Dependencies
```python
# app/api/deps.py
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.core.security import decode_token

security = HTTPBearer()

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_current_superuser(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
```

---

## API Endpoints

### CRUD Endpoint Pattern
```python
# app/api/v1/endpoints/users.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.api.deps import get_current_user, get_current_superuser, get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse
)
from app.services.user_service import UserService

router = APIRouter()

@router.get("/", response_model=UserListResponse)
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> UserListResponse:
    """List all users (superuser only)."""
    offset = (page - 1) * page_size
    
    # Count query
    count_query = select(func.count()).select_from(User)
    total = await db.scalar(count_query)
    
    # Select query
    query = select(User).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return UserListResponse(
        users=users,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> UserResponse:
    """Get current user information."""
    return current_user

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserResponse:
    """Create new user."""
    service = UserService(db)
    user = await service.create_user(user_in)
    return user

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> UserResponse:
    """Update user information."""
    service = UserService(db)
    user = await service.update_user(user_id, user_in, current_user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)]
) -> None:
    """Delete user (superuser only)."""
    service = UserService(db)
    await service.delete_user(user_id)
```

---

## Service Layer

### Business Logic Separation
```python
# app/services/user_service.py
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def create_user(self, user_in: UserCreate) -> User:
        # Check if user exists
        existing_user = await self.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def update_user(
        self,
        user_id: int,
        user_in: UserUpdate,
        current_user: User
    ) -> User:
        # Only allow users to update their own profile (or superuser)
        if user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        user = await self.db.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        update_data = user_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def authenticate(self, email: str, password: str) -> Optional[User]:
        user = await self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
```

---

## Authentication & Security

### JWT Token Generation
```python
# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
```

### Authentication Endpoint
```python
# app/api/v1/endpoints/auth.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.core.security import create_access_token
from app.core.config import settings
from app.schemas.token import Token
from app.services.user_service import UserService

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Token:
    """OAuth2 compatible token login."""
    service = UserService(db)
    user = await service.authenticate(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")
```

---

## Configuration Management

### Settings with Pydantic
```python
# app/core/config.py
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "FastAPI Application"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Email (optional)
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )

settings = Settings()
```

---

## Database Migrations (Alembic)

### Migration Commands
```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Add user table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Migration Example
```python
# alembic/versions/001_add_user_table.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'])

def downgrade():
    op.drop_index('ix_users_email', 'users')
    op.drop_table('users')
```

---

## Error Handling

### Custom Exceptions
```python
# app/core/exceptions.py
from fastapi import HTTPException, status

class AppException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

class NotFoundError(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status.HTTP_404_NOT_FOUND, detail)

class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail)

class ForbiddenError(AppException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail)
```

### Exception Handlers
```python
# app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import AppException

app = FastAPI()

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

---

## Testing

### Pytest Configuration
```python
# tests/conftest.py
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

### Test Examples
```python
# tests/api/test_users.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/users/",
        json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"

@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient):
    # First create user and get token
    # Then test endpoint
    pass
```

---

## Background Tasks

### Async Background Tasks
```python
from fastapi import BackgroundTasks

async def send_email_notification(email: str, message: str):
    # Email sending logic
    pass

@router.post("/users/")
async def create_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    user = await create_user_in_db(db, user_in)
    
    # Add background task
    background_tasks.add_task(
        send_email_notification,
        email=user_in.email,
        message="Welcome to our platform!"
    )
    
    return user
```

---

## Rate Limiting

### Using slowapi
```python
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/limited")
@limiter.limit("5/minute")
async def limited_endpoint(request: Request):
    return {"message": "This endpoint is rate limited"}
```

---

## API Documentation

### Automatic Documentation
- FastAPI auto-generates OpenAPI docs at `/docs` (Swagger UI)
- Alternative docs at `/redoc` (ReDoc)
- OpenAPI schema at `/openapi.json`

### Custom Documentation
```python
@router.post(
    "/users/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new user",
    description="Create a new user with the provided information",
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "Email already registered"},
        422: {"description": "Validation error"}
    }
)
async def create_user(user_in: UserCreate):
    pass
```

---

## Performance Optimization

### Database Optimization
- Use `selectinload` for eager loading
- Add proper indexes
- Use pagination for list endpoints
- Cache frequently accessed data

```python
from sqlalchemy.orm import selectinload

# Eager loading relationships
query = select(User).options(selectinload(User.items))
```

### Async Best Practices
- Use async database drivers
- Avoid blocking operations
- Use connection pooling
- Set appropriate timeouts

---

## Logging

### Structured Logging
```python
import logging
from fastapi import FastAPI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response
```

---

## Docker Deployment

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/app
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Best Practices Summary

1. **Use async everywhere** - async/await for database, external APIs
2. **Validate with Pydantic** - schemas for all inputs/outputs
3. **Separate concerns** - models, schemas, services, endpoints
4. **Handle errors gracefully** - custom exceptions, proper status codes
5. **Use dependency injection** - FastAPI's Depends system
6. **Write tests** - aim for 80%+ coverage
7. **Document your API** - use FastAPI's built-in docs
8. **Use migrations** - Alembic for schema changes
9. **Log everything** - structured logging for debugging
10. **Secure your API** - JWT, CORS, rate limiting

---

## Quick Reference

### Common Commands
```bash
uvicorn app.main:app --reload    # Development server
pytest tests/                     # Run tests
alembic upgrade head             # Run migrations
ruff check app/                  # Lint code
black app/                       # Format code
mypy app/                        # Type check
```

### Useful Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Docs](https://docs.sqlalchemy.org/en/20/)
- [Pydantic V2 Docs](https://docs.pydantic.dev/)
- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
