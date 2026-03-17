# FastAPI SQLModel 现代 API 开发模板

## 技术栈

- **FastAPI**: 现代 Python Web 框架
- **SQLModel**: SQL 数据库 ORM（Pydantic + SQLAlchemy）
- **PostgreSQL**: 关系型数据库
- **Alembic**: 数据库迁移工具
- **Pydantic**: 数据验证
- **Uvicorn**: ASGI 服务器
- **Python 3.11+**: 编程语言

## 项目结构

```
fastapi-sqlmodel/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── posts.py
│   │   │   │   └── health.py
│   │   │   └── api.py
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── database.py
│   │   └── exceptions.py
│   ├── models/
│   │   ├── user.py
│   │   ├── post.py
│   │   └── base.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── token.py
│   │   └── common.py
│   ├── services/
│   │   ├── user_service.py
│   │   ├── post_service.py
│   │   └── auth_service.py
│   ├── middleware/
│   │   ├── logging.py
│   │   └── error_handler.py
│   ├── utils/
│   │   ├── pagination.py
│   │   └── dependencies.py
│   └── main.py
├── alembic/
│   ├── versions/
│   └── env.py
├── tests/
│   ├── conftest.py
│   ├── test_users.py
│   └── test_posts.py
├── .env
├── alembic.ini
├── pyproject.toml
└── Dockerfile
```

## 代码模式

### 主应用

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.api.v1.api import api_router
from app.middleware.logging import log_requests
from app.middleware.error_handler import add_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时
    await create_db_and_tables()
    yield
    # 关闭时


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FastAPI SQLModel API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.middleware("http")(log_requests)

# 异常处理
add_exception_handlers(app)

# 路由
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": "Welcome to FastAPI SQLModel API",
        "docs": f"{settings.API_V1_STR}/docs",
    }
```

### 配置

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # 应用配置
    PROJECT_NAME: str = "FastAPI SQLModel API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://user:pass@localhost/dbname"
    
    # 安全配置
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # 邮件配置
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # 环境
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
```

### 数据库

```python
# app/core/database.py
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator

from app.core.config import settings

# 同步引擎
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# 异步引擎
async_engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
)

# 异步会话
async_session_maker = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)


async def create_db_and_tables():
    """创建数据库表"""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """获取异步数据库会话"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


def get_session():
    """获取同步数据库会话"""
    with Session(engine) as session:
        yield session
```

### 安全

```python
# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.database import get_async_session
from app.models.user import User
from app.services.user_service import UserService

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    return pwd_context.hash(password)


def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    """创建访问令牌"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: str | Any) -> str:
    """创建刷新令牌"""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """解码令牌"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_async_session),
) -> User:
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user_service = UserService(session)
    user = await user_service.get_by_id(int(user_id))
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前激活用户"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    return current_user
```

### 模型

```python
# app/models/base.py
from datetime import datetime
from sqlmodel import SQLModel, Field
from typing import Optional


class BaseModel(SQLModel):
    """基础模型"""
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# app/models/user.py
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

from app.models.base import BaseModel


class User(BaseModel, table=True):
    """用户模型"""
    __tablename__ = "users"
    
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    
    # 关系
    posts: List["Post"] = Relationship(back_populates="author")


# app/models/post.py
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

from app.models.base import BaseModel


class Post(BaseModel, table=True):
    """文章模型"""
    __tablename__ = "posts"
    
    title: str = Field(index=True)
    content: str
    is_published: bool = Field(default=False)
    author_id: int = Field(foreign_key="users.id")
    
    # 关系
    author: Optional["User"] = Relationship(back_populates="posts")
```

### 模式

```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    """用户基础模式"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """用户创建模式"""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """用户更新模式"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(UserBase):
    """用户响应模式"""
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """用户列表响应"""
    items: List[UserResponse]
    total: int
    page: int
    page_size: int


# app/schemas/post.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PostBase(BaseModel):
    """文章基础模式"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    is_published: bool = False


class PostCreate(PostBase):
    """文章创建模式"""
    pass


class PostUpdate(BaseModel):
    """文章更新模式"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    is_published: Optional[bool] = None


class PostResponse(PostBase):
    """文章响应模式"""
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# app/schemas/token.py
from pydantic import BaseModel


class Token(BaseModel):
    """令牌模式"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """令牌负载"""
    sub: str
    exp: int
```

### 服务层

```python
# app/services/user_service.py
from typing import Optional, List
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, user_create: UserCreate) -> User:
        """创建用户"""
        user = User(
            email=user_create.email,
            username=user_create.username,
            full_name=user_create.full_name,
            hashed_password=get_password_hash(user_create.password),
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """通过 ID 获取用户"""
        statement = select(User).where(User.id == user_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """通过邮箱获取用户"""
        statement = select(User).where(User.email == email)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """通过用户名获取用户"""
        statement = select(User).where(User.username == username)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_list(self, skip: int = 0, limit: int = 100) -> List[User]:
        """获取用户列表"""
        statement = select(User).offset(skip).limit(limit)
        result = await self.session.execute(statement)
        return result.scalars().all()
    
    async def update(self, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """更新用户"""
        user = await self.get_by_id(user_id)
        if not user:
            return None
        
        update_data = user_update.dict(exclude_unset=True)
        
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        for key, value in update_data.items():
            setattr(user, key, value)
        
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def delete(self, user_id: int) -> bool:
        """删除用户"""
        user = await self.get_by_id(user_id)
        if not user:
            return False
        
        await self.session.delete(user)
        await self.session.commit()
        return True
    
    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """验证用户"""
        user = await self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user


# app/services/post_service.py
from typing import Optional, List
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate


class PostService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, post_create: PostCreate, author_id: int) -> Post:
        """创建文章"""
        post = Post(**post_create.dict(), author_id=author_id)
        self.session.add(post)
        await self.session.commit()
        await self.session.refresh(post)
        return post
    
    async def get_by_id(self, post_id: int) -> Optional[Post]:
        """通过 ID 获取文章"""
        statement = select(Post).where(Post.id == post_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_list(
        self, skip: int = 0, limit: int = 10, published_only: bool = False
    ) -> tuple[List[Post], int]:
        """获取文章列表"""
        # 查询条件
        statement = select(Post)
        count_statement = select(func.count(Post.id))
        
        if published_only:
            statement = statement.where(Post.is_published == True)
            count_statement = count_statement.where(Post.is_published == True)
        
        # 获取总数
        total_result = await self.session.execute(count_statement)
        total = total_result.scalar()
        
        # 获取列表
        statement = statement.offset(skip).limit(limit).order_by(Post.created_at.desc())
        result = await self.session.execute(statement)
        posts = result.scalars().all()
        
        return posts, total
    
    async def update(self, post_id: int, post_update: PostUpdate) -> Optional[Post]:
        """更新文章"""
        post = await self.get_by_id(post_id)
        if not post:
            return None
        
        update_data = post_update.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(post, key, value)
        
        self.session.add(post)
        await self.session.commit()
        await self.session.refresh(post)
        return post
    
    async def delete(self, post_id: int) -> bool:
        """删除文章"""
        post = await self.get_by_id(post_id)
        if not post:
            return False
        
        await self.session.delete(post)
        await self.session.commit()
        return True
```

### API 端点

```python
# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_async_session
from app.core.security import create_access_token, create_refresh_token
from app.schemas.token import Token
from app.schemas.user import UserResponse
from app.services.user_service import UserService

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_async_session),
):
    """用户登录"""
    user_service = UserService(session)
    user = await user_service.authenticate(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户未激活",
        )
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_create: UserCreate,
    session: AsyncSession = Depends(get_async_session),
):
    """用户注册"""
    user_service = UserService(session)
    
    # 检查邮箱是否存在
    if await user_service.get_by_email(user_create.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册",
        )
    
    # 检查用户名是否存在
    if await user_service.get_by_username(user_create.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被使用",
        )
    
    user = await user_service.create(user_create)
    return user
```

```python
# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List

from app.core.database import get_async_session
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserListResponse
from app.services.user_service import UserService
from app.utils.pagination import PaginationParams

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    """更新当前用户信息"""
    user_service = UserService(session)
    
    # 检查邮箱
    if user_update.email and user_update.email != current_user.email:
        if await user_service.get_by_email(user_update.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被使用",
            )
    
    # 检查用户名
    if user_update.username and user_update.username != current_user.username:
        if await user_service.get_by_username(user_update.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已被使用",
            )
    
    user = await user_service.update(current_user.id, user_update)
    return user


@router.get("/", response_model=UserListResponse)
async def read_users(
    pagination: PaginationParams = Depends(),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_active_user),
):
    """获取用户列表（管理员）"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足",
        )
    
    user_service = UserService(session)
    users = await user_service.get_list(skip=pagination.skip, limit=pagination.limit)
    return {
        "items": users,
        "total": len(users),
        "page": pagination.page,
        "page_size": pagination.page_size,
    }
```

```python
# app/api/v1/endpoints/posts.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_async_session
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.post import PostCreate, PostUpdate, PostResponse
from app.services.post_service import PostService

router = APIRouter()


@router.get("/", response_model=List[PostResponse])
async def read_posts(
    skip: int = 0,
    limit: int = 10,
    published_only: bool = True,
    session: AsyncSession = Depends(get_async_session),
):
    """获取文章列表"""
    post_service = PostService(session)
    posts, total = await post_service.get_list(
        skip=skip, limit=limit, published_only=published_only
    )
    return posts


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_create: PostCreate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    """创建文章"""
    post_service = PostService(session)
    post = await post_service.create(post_create, author_id=current_user.id)
    return post


@router.get("/{post_id}", response_model=PostResponse)
async def read_post(
    post_id: int,
    session: AsyncSession = Depends(get_async_session),
):
    """获取文章详情"""
    post_service = PostService(session)
    post = await post_service.get_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文章不存在",
        )
    
    return post


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_update: PostUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    """更新文章"""
    post_service = PostService(session)
    post = await post_service.get_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文章不存在",
        )
    
    if post.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有权限修改此文章",
        )
    
    updated_post = await post_service.update(post_id, post_update)
    return updated_post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    """删除文章"""
    post_service = PostService(session)
    post = await post_service.get_by_id(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文章不存在",
        )
    
    if post.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有权限删除此文章",
        )
    
    await post_service.delete(post_id)
```

## 最佳实践

### 1. 分页工具

```python
# app/utils/pagination.py
from fastapi import Query
from pydantic import BaseModel


class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="页码"),
        page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    ):
        self.page = page
        self.page_size = page_size
        self.skip = (page - 1) * page_size
        self.limit = page_size


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
```

### 2. 异常处理

```python
# app/middleware/error_handler.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError


def add_exception_handlers(app):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": exc.errors(), "body": exc.body},
        )
    
    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "数据完整性错误"},
        )
```

### 3. 日志中间件

```python
# app/middleware/logging.py
import time
import logging
from fastapi import Request, Response

logger = logging.getLogger(__name__)


async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response: Response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    formatted_time = f"{process_time:.2f}ms"
    
    logger.info(
        f"method={request.method} path={request.url.path} "
        f"status_code={response.status_code} time={formatted_time}"
    )
    
    response.headers["X-Process-Time"] = formatted_time
    
    return response
```

## 常用命令

### 开发

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 安装依赖
pip install fastapi sqlmodel uvicorn alembic psycopg2-binary asyncpg python-jose passlib python-multipart

# 运行开发服务器
uvicorn app.main:app --reload --port 8000

# 创建迁移
alembic revision --autogenerate -m "Initial migration"

# 运行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1

# 测试
pytest
```

## 部署配置

### pyproject.toml

```toml
[tool.poetry]
name = "fastapi-sqlmodel"
version = "1.0.0"
description = "FastAPI SQLModel API"
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"
sqlmodel = "^0.0.14"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
alembic = "^1.12.0"
asyncpg = "^0.29.0"
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
python-multipart = "^0.0.6"
pydantic-settings = "^2.1.0"

[tool.poetry.dev-dependencies]
pytest = "^7.4.0"
httpx = "^0.25.0"
black = "^23.11.0"
flake8 = "^6.1.0"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 8000

# 运行命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/mydb
      - SECRET_KEY=your-secret-key
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 环境变量

```env
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=["http://localhost:3000"]
ENVIRONMENT=development
```
