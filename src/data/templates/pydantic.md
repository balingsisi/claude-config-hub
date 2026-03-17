# Pydantic 模板

## 技术栈
- **Pydantic** - Python 数据验证库，使用类型注解
- **Pydantic V2** - 基于 Rust 的性能优化版本
- **类型系统** - 运行时类型检查和验证
- **序列化** - JSON、字典等格式转换
- **FastAPI** - 与 FastAPI 完美集成
- **Settings** - 环境变量和配置管理

## 项目结构
```
pydantic-project/
├── src/
│   ├── models/            # Pydantic 模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── product.py
│   │   └── order.py
│   ├── schemas/           # API Schema
│   │   ├── __init__.py
│   │   ├── request.py
│   │   └── response.py
│   ├── services/          # 业务逻辑
│   │   ├── __init__.py
│   │   └── user_service.py
│   ├── config.py          # 配置管理
│   └── main.py
├── tests/
│   ├── test_models.py
│   └── test_schemas.py
├── pyproject.toml
└── requirements.txt
```

## 代码模式

### 基础模型
```python
# src/models/user.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, HttpUrl, field_validator, model_validator
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class UserBase(BaseModel):
    """用户基础模型"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    email: EmailStr = Field(..., description="邮箱地址")
    full_name: Optional[str] = Field(None, max_length=100)
    role: UserRole = Field(default=UserRole.USER)
    tags: List[str] = Field(default_factory=list, max_length=10)
    
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace('_', '').isalnum():
            raise ValueError('must be alphanumeric or underscore')
        return v.lower()

class UserCreate(UserBase):
    """创建用户请求"""
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str
    
    @model_validator(mode='after')
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError('passwords do not match')
        return self

class User(UserBase):
    """用户完整模型"""
    id: int = Field(..., gt=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    avatar_url: Optional[HttpUrl] = None
    settings: dict = Field(default_factory=dict)
    
    model_config = {
        "from_attributes": True,  # V2: 替代 V1 的 Config.orm_mode
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }

class UserResponse(BaseModel):
    """API 响应模型"""
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }
```

### 嵌套模型和复杂验证
```python
# src/models/product.py
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, computed_field
from datetime import datetime

class Price(BaseModel):
    """价格模型"""
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    
    @computed_field
    @property
    def formatted(self) -> str:
        return f"{self.currency} {self.amount:.2f}"

class ProductVariant(BaseModel):
    """产品变体"""
    sku: str = Field(..., pattern=r'^[A-Z]{3}-\d{4}$')
    name: str
    price: Price
    inventory: int = Field(default=0, ge=0)
    attributes: Dict[str, str] = Field(default_factory=dict)

class Product(BaseModel):
    """产品模型"""
    id: int
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    base_price: Price
    variants: List[ProductVariant] = Field(default_factory=list)
    category_ids: List[int] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True
    created_at: datetime
    
    @field_validator('variants')
    @classmethod
    def validate_variants(cls, v: List[ProductVariant]) -> List[ProductVariant]:
        if len(v) > 100:
            raise ValueError('Maximum 100 variants allowed')
        return v
    
    @computed_field
    @property
    def variant_count(self) -> int:
        return len(self.variants)
    
    @computed_field
    @property
    def total_inventory(self) -> int:
        return sum(v.inventory for v in self.variants)
    
    model_config = {
        "from_attributes": True,
        "str_strip_whitespace": True,
    }
```

### 配置管理
```python
# src/config.py
from typing import Optional, List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """应用配置"""
    # 应用基础配置
    app_name: str = Field(default="My App", alias="APP_NAME")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)
    
    # 数据库配置
    database_url: str = Field(..., alias="DATABASE_URL")
    database_pool_size: int = Field(default=10, ge=1, le=100)
    database_echo: bool = Field(default=False)
    
    # Redis 配置
    redis_url: Optional[str] = Field(None, alias="REDIS_URL")
    
    # API 配置
    api_prefix: str = Field(default="/api/v1")
    cors_origins: List[str] = Field(default=["http://localhost:3000"])
    
    # 安全配置
    secret_key: str = Field(..., alias="SECRET_KEY", min_length=32)
    access_token_expire_minutes: int = Field(default=30)
    
    # 第三方服务
    stripe_api_key: Optional[str] = Field(None, alias="STRIPE_API_KEY")
    sendgrid_api_key: Optional[str] = Field(None, alias="SENDGRID_API_KEY")
    
    # 文件上传
    max_upload_size_mb: int = Field(default=10, ge=1, le=100)
    allowed_extensions: List[str] = Field(
        default=["jpg", "jpeg", "png", "gif", "pdf"]
    )
    
    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore'
    )

# 全局配置实例
settings = Settings()

# 使用示例
print(settings.app_name)
print(settings.database_url)
```

### FastAPI 集成
```python
# src/main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime

from models.user import User, UserCreate, UserResponse
from models.product import Product
from config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url=f"{settings.api_prefix}/docs",
)

# 异常处理器
from pydantic import ValidationError

@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": exc.json()
        }
    )

# API 路由
@app.post(f"{settings.api_prefix}/users", response_model=UserResponse, status_code=201)
async def create_user(user_data: UserCreate):
    """创建用户"""
    # 自动验证 user_data
    user = User(
        id=1,
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        created_at=datetime.utcnow()
    )
    return user

@app.get(f"{settings.api_prefix}/users/{{user_id}}", response_model=UserResponse)
async def get_user(user_id: int):
    """获取用户"""
    if user_id != 1:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(
        id=user_id,
        username="john_doe",
        email="john@example.com",
        role="user",
        created_at=datetime.utcnow()
    )

# 使用 Pydantic 模型进行响应
@app.get(f"{settings.api_prefix}/products")
async def list_products() -> List[Product]:
    """获取产品列表"""
    # 模拟数据
    products = [
        Product(
            id=1,
            name="Laptop",
            base_price={"amount": 999.99, "currency": "USD"},
            variants=[
                {
                    "sku": "LAP-0001",
                    "name": "16GB RAM",
                    "price": {"amount": 999.99, "currency": "USD"},
                    "inventory": 10
                }
            ],
            created_at=datetime.utcnow()
        )
    ]
    return products
```

### 序列化和反序列化
```python
# src/serializers/user.py
from models.user import User, UserCreate
from typing import List, Dict, Any
import json

class UserSerializer:
    """用户序列化器"""
    
    @staticmethod
    def to_dict(user: User) -> Dict[str, Any]:
        """转换为字典"""
        return user.model_dump()
    
    @staticmethod
    def to_json(user: User) -> str:
        """转换为 JSON 字符串"""
        return user.model_dump_json(indent=2)
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> User:
        """从字典创建"""
        return User.model_validate(data)
    
    @staticmethod
    def from_json(json_str: str) -> User:
        """从 JSON 字符串创建"""
        return User.model_validate_json(json_str)
    
    @staticmethod
    def to_response(user: User) -> Dict[str, Any]:
        """转换为 API 响应格式"""
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "created_at": user.created_at.isoformat(),
        }

# 使用示例
user = User(
    id=1,
    username="john_doe",
    email="john@example.com",
    role="user",
    created_at=datetime.utcnow()
)

# 序列化
print(UserSerializer.to_json(user))

# 过滤字段
print(user.model_dump(exclude={'password', 'created_at'}))
print(user.model_dump(include={'id', 'username'}))

# 自定义导出模式
print(user.model_dump(mode='json'))  # JSON 兼容格式
print(user.model_dump(mode='python'))  # Python 原生类型
```

### 动态模型
```python
# src/models/dynamic.py
from typing import Any, Dict, Type
from pydantic import BaseModel, create_model

def create_dynamic_model(
    model_name: str,
    fields: Dict[str, tuple[Type, Any]]
) -> Type[BaseModel]:
    """动态创建 Pydantic 模型"""
    return create_model(model_name, **fields)

# 示例：根据配置创建模型
DynamicUser = create_dynamic_model(
    'DynamicUser',
    {
        'name': (str, ...),
        'age': (int, 18),
        'email': (str, None),
    }
)

# 使用
user = DynamicUser(name="John", age=25)
print(user.model_dump())

# 从 JSON Schema 创建模型
from pydantic import TypeAdapter

schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer", "minimum": 0}
    },
    "required": ["name"]
}

adapter = TypeAdapter(dict)
data = adapter.validate_python({"name": "John", "age": 25})
```

### 验证器模式
```python
# src/validators/common.py
from pydantic import BaseModel, field_validator, model_validator, WrapValidator
from typing import Any, List
import re
from functools import wraps

def validate_phone_number(value: str) -> str:
    """验证手机号"""
    pattern = r'^\+?1?\d{9,15}$'
    if not re.match(pattern, value):
        raise ValueError('Invalid phone number format')
    return value

def validate_password_strength(value: str) -> str:
    """验证密码强度"""
    if len(value) < 8:
        raise ValueError('Password must be at least 8 characters')
    if not re.search(r'[A-Z]', value):
        raise ValueError('Password must contain uppercase letter')
    if not re.search(r'[a-z]', value):
        raise ValueError('Password must contain lowercase letter')
    if not re.search(r'\d', value):
        raise ValueError('Password must contain digit')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
        raise ValueError('Password must contain special character')
    return value

class ContactForm(BaseModel):
    """联系表单"""
    name: str
    email: str
    phone: str
    message: str
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return validate_phone_number(v)
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        words = v.split()
        if len(words) < 10:
            raise ValueError('Message must contain at least 10 words')
        return v

class RegistrationForm(BaseModel):
    """注册表单"""
    username: str
    email: str
    password: str
    confirm_password: str
    accept_terms: bool
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        return validate_password_strength(v)
    
    @model_validator(mode='after')
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError('Passwords do not match')
        if not self.accept_terms:
            raise ValueError('Must accept terms and conditions')
        return self
```

## 最佳实践

### 1. 模型继承和复用
```python
# 基础模型
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class IDMixin(BaseModel):
    id: int = Field(..., gt=0)

# 组合模型
class BaseModel(IDMixin, TimestampMixin):
    pass

# 具体模型
class Article(BaseModel):
    title: str
    content: str
    author_id: int
```

### 2. 自定义类型
```python
from pydantic import BaseModel, GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import Annotated

class PhoneNumber(str):
    """自定义电话号码类型"""
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type, handler: GetCoreSchemaHandler
    ):
        return core_schema.with_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.plain_serializer_function_ser_schema(str)
        )
    
    @classmethod
    def validate(cls, v, _info):
        if not isinstance(v, str):
            raise TypeError('string required')
        if not re.match(r'^\+?1?\d{9,15}$', v):
            raise ValueError('invalid phone number format')
        return cls(v)

# 使用
class Contact(BaseModel):
    phone: PhoneNumber
```

### 3. 性能优化
```python
# 使用 model_config 优化
class OptimizedModel(BaseModel):
    model_config = {
        # 验证后不要重新解析
        'revalidate_instances': 'never',
        # 严格模式（性能更好）
        'strict': True,
        # 使用枚举值
        'use_enum_values': True,
        # 验证赋值
        'validate_assignment': True,
        # 性能：缓存
        'defer_build': False,
    }
```

## 常用命令

### 安装
```bash
# 安装 Pydantic
pip install pydantic

# 安装 V2（推荐）
pip install "pydantic>=2.0"

# 安装额外功能
pip install pydantic[email]  # EmailStr 支持
pip install pydantic[dotenv]  # .env 支持
pip install pydantic-settings  # 配置管理
```

### 测试
```bash
# 运行测试
pytest tests/

# 带覆盖率
pytest --cov=src tests/

# 验证模型
python -c "from models.user import User; print(User.model_json_schema())"
```

## 部署配置

### pyproject.toml
```toml
[tool.poetry]
name = "pydantic-project"
version = "1.0.0"
description = "Pydantic data validation project"

[tool.poetry.dependencies]
python = "^3.10"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
email-validator = "^2.1.0"

[tool.poetry.dev-dependencies]
pytest = "^7.4.0"
pytest-cov = "^4.1.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

### requirements.txt
```
pydantic>=2.5.0
pydantic-settings>=2.1.0
email-validator>=2.1.0
python-dotenv>=1.0.0
```

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY src/ ./src/

# 运行
CMD ["python", "src/main.py"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - ./src:/app/src
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### .env 示例
```bash
# 应用配置
APP_NAME=My App
DEBUG=false

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DATABASE_POOL_SIZE=10

# 安全
SECRET_KEY=your-secret-key-at-least-32-characters-long
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 第三方服务
STRIPE_API_KEY=sk_test_xxx
SENDGRID_API_KEY=SG.xxx
```
