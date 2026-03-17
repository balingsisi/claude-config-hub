# Python Flask API Development

## 技术栈

### 核心框架
- **Flask** - 轻量级 Web 框架
- **Flask-RESTful** - REST API 扩展
- **Flask-SQLAlchemy** - ORM 支持
- **Flask-Migrate** - 数据库迁移
- **Flask-CORS** - 跨域支持

### 数据库
- **PostgreSQL** - 主数据库
- **SQLite** - 开发数据库
- **Redis** - 缓存和会话
- **MongoDB** - NoSQL 数据库

### 认证
- **Flask-JWT-Extended** - JWT 认证
- **Flask-Login** - Session 认证
- **Flask-HTTPAuth** - HTTP 认证

### 验证
- **Marshmallow** - 对象序列化/验证
- **Pydantic** - 数据验证（可选）
- **WTForms** - 表单验证

### API 文档
- **Flask-RESTX** - Swagger/OpenAPI 支持
- **Flask-APISpec** - API 文档生成
- **Flasgger** - Swagger UI

### 异步任务
- **Celery** - 分布式任务队列
- **Redis** - 消息代理
- **RQ (Redis Queue)** - 简单任务队列

### 测试
- **pytest** - 测试框架
- **pytest-flask** - Flask 测试工具
- **Faker** - 测试数据生成
- **Coverage.py** - 代码覆盖率

### 部署
- **Gunicorn** - WSGI 服务器
- **uWSGI** - 应用服务器
- **Docker** - 容器化
- **Nginx** - 反向代理

## 项目结构

```
flask-api-project/
├── app/
│   ├── __init__.py                # 应用工厂
│   ├── config.py                  # 配置管理
│   ├── extensions.py              # 扩展初始化
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── post.py
│   │   └── base.py
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── posts.py
│   │   └── health.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user_schema.py
│   │   └── post_schema.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── auth_service.py
│   │   └── email_service.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── user_repository.py
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── decorators.py
│   │   ├── validators.py
│   │   ├── responses.py
│   │   └── helpers.py
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── logging.py
│   │
│   └── tasks/
│       ├── __init__.py
│       └── email_tasks.py
│
├── migrations/
│   ├── env.py
│   ├── versions/
│   └── alembic.ini
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_users.py
│   ├── test_posts.py
│   └── factories.py
│
├── scripts/
│   ├── init_db.py
│   └── seed_data.py
│
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   ├── production.txt
│   └── testing.txt
│
├── .env
├── .env.example
├── requirements.txt
├── config.py
├── wsgi.py
├── run.py
└── docker-compose.yml
```

## 代码模式

### 1. 应用工厂模式

```python
# app/__init__.py
from flask import Flask
from flask_cors import CORS
from app.config import config
from app.extensions import db, migrate, jwt, ma, celery

def create_app(config_name='default'):
    """应用工厂函数"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # 初始化扩展
    register_extensions(app)
    
    # 注册蓝图
    register_blueprints(app)
    
    # 注册错误处理
    register_error_handlers(app)
    
    # 注册中间件
    register_middleware(app)
    
    # 配置 CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    return app

def register_extensions(app):
    """初始化 Flask 扩展"""
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    celery.conf.update(app.config)

def register_blueprints(app):
    """注册蓝图"""
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.posts import posts_bp
    from app.routes.health import health_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    app.register_blueprint(health_bp, url_prefix='/api')

def register_error_handlers(app):
    """注册错误处理器"""
    from app.utils.responses import error_response
    
    @app.errorhandler(404)
    def not_found(error):
        return error_response('Resource not found', 404)
    
    @app.errorhandler(500)
    def internal_error(error):
        return error_response('Internal server error', 500)
    
    @app.errorhandler(400)
    def bad_request(error):
        return error_response('Bad request', 400)

def register_middleware(app):
    """注册中间件"""
    from app.middleware.logging import log_request
    
    @app.before_request
    def before_request():
        log_request()
```

### 2. 配置管理

```python
# app/config.py
import os
from datetime import timedelta

class Config:
    """基础配置"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    
    # 数据库
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ALGORITHM = 'HS256'
    
    # Redis
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # Celery
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    
    # 分页
    ITEMS_PER_PAGE = 20
    
    # 邮件
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')

class DevelopmentConfig(Config):
    """开发配置"""
    DEBUG = True
    SQLALCHEMY_ECHO = True

class TestingConfig(Config):
    """测试配置"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

class ProductionConfig(Config):
    """生产配置"""
    DEBUG = False
    
    # 生产环境安全配置
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    @classmethod
    def init_app(cls, app):
        # 生产日志
        import logging
        from logging.handlers import RotatingFileHandler
        
        handler = RotatingFileHandler(
            'logs/app.log',
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=10
        )
        handler.setLevel(logging.INFO)
        app.logger.addHandler(handler)

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

### 3. 数据模型

```python
# app/models/base.py
from datetime import datetime
from app.extensions import db

class BaseModel(db.Model):
    """基础模型"""
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def save(self):
        """保存到数据库"""
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        """从数据库删除"""
        db.session.delete(self)
        db.session.commit()
    
    def update(self, **kwargs):
        """更新字段"""
        for key, value in kwargs.items():
            setattr(self, key, value)
        db.session.commit()

# app/models/user.py
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from app.models.base import BaseModel

class User(BaseModel):
    """用户模型"""
    __tablename__ = 'users'
    
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    
    # 关系
    posts = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """设置密码"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """验证密码"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
    
    def __repr__(self):
        return f'<User {self.username}>'

# app/models/post.py
from app.extensions import db
from app.models.base import BaseModel

class Post(BaseModel):
    """文章模型"""
    __tablename__ = 'posts'
    
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_published = db.Column(db.Boolean, default=False)
    view_count = db.Column(db.Integer, default=0)
    
    # 标签
    tags = db.relationship('Tag', secondary='post_tags', backref='posts')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'author': self.author.to_dict(),
            'is_published': self.is_published,
            'view_count': self.view_count,
            'tags': [tag.name for tag in self.tags],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
```

### 4. Schema 验证

```python
# app/schemas/user_schema.py
from marshmallow import Schema, fields, validate, validates, ValidationError
from app.models import User

class UserSchema(Schema):
    """用户序列化 Schema"""
    id = fields.Int(dump_only=True)
    username = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=80)
    )
    email = fields.Email(required=True)
    password = fields.Str(
        load_only=True,
        required=True,
        validate=validate.Length(min=8)
    )
    is_active = fields.Bool(dump_only=True)
    is_admin = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    @validates('username')
    def validate_username(self, value):
        """验证用户名是否已存在"""
        if User.query.filter_by(username=value).first():
            raise ValidationError('Username already exists')
    
    @validates('email')
    def validate_email(self, value):
        """验证邮箱是否已存在"""
        if User.query.filter_by(email=value).first():
            raise ValidationError('Email already exists')

class UserUpdateSchema(Schema):
    """用户更新 Schema"""
    username = fields.Str(validate=validate.Length(min=3, max=80))
    email = fields.Email()
    password = fields.Str(
        load_only=True,
        validate=validate.Length(min=8)
    )

class UserLoginSchema(Schema):
    """用户登录 Schema"""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)

# app/schemas/post_schema.py
from marshmallow import Schema, fields, validate

class PostSchema(Schema):
    """文章序列化 Schema"""
    id = fields.Int(dump_only=True)
    title = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=200)
    )
    content = fields.Str(required=True)
    author_id = fields.Int(load_only=True, required=True)
    author = fields.Nested('UserSchema', dump_only=True)
    is_published = fields.Bool()
    view_count = fields.Int(dump_only=True)
    tags = fields.List(fields.Str())
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
```

### 5. 路由和视图

```python
# app/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from app.schemas.user_schema import UserSchema, UserLoginSchema
from app.services.auth_service import AuthService
from app.utils.responses import success_response, error_response

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    schema = UserSchema()
    
    try:
        data = schema.load(request.json)
    except Exception as e:
        return error_response(str(e), 400)
    
    try:
        user = auth_service.register_user(data)
        return success_response(
            UserSchema().dump(user),
            'User registered successfully',
            201
        )
    except Exception as e:
        return error_response(str(e), 400)

@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    schema = UserLoginSchema()
    
    try:
        data = schema.load(request.json)
    except Exception as e:
        return error_response(str(e), 400)
    
    try:
        user = auth_service.authenticate_user(data['email'], data['password'])
        
        # 创建 token
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return success_response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserSchema().dump(user)
        }, 'Login successful')
    except Exception as e:
        return error_response(str(e), 401)

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """刷新 access token"""
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    
    return success_response({
        'access_token': access_token
    }, 'Token refreshed')

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """获取当前用户"""
    user_id = get_jwt_identity()
    user = auth_service.get_user_by_id(user_id)
    
    if not user:
        return error_response('User not found', 404)
    
    return success_response(UserSchema().dump(user))

# app/routes/users.py
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.schemas.user_schema import UserSchema, UserUpdateSchema
from app.services.user_service import UserService
from app.utils.responses import success_response, error_response
from app.utils.decorators import admin_required

users_bp = Blueprint('users', __name__)
user_service = UserService()

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """获取用户列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    users, total = user_service.get_users(page, per_page)
    
    return success_response({
        'users': UserSchema(many=True).dump(users),
        'total': total,
        'page': page,
        'per_page': per_page
    })

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """获取单个用户"""
    user = user_service.get_user_by_id(user_id)
    
    if not user:
        return error_response('User not found', 404)
    
    return success_response(UserSchema().dump(user))

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """更新用户"""
    current_user_id = get_jwt_identity()
    
    # 只能更新自己的信息，或者是管理员
    if current_user_id != user_id:
        return error_response('Unauthorized', 403)
    
    schema = UserUpdateSchema()
    
    try:
        data = schema.load(request.json)
    except Exception as e:
        return error_response(str(e), 400)
    
    try:
        user = user_service.update_user(user_id, data)
        return success_response(UserSchema().dump(user), 'User updated')
    except Exception as e:
        return error_response(str(e), 400)

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """删除用户（管理员）"""
    try:
        user_service.delete_user(user_id)
        return success_response(None, 'User deleted', 204)
    except Exception as e:
        return error_response(str(e), 400)
```

### 6. Service 层

```python
# app/services/auth_service.py
from app.models import User
from app.extensions import db
from werkzeug.exceptions import BadRequest, Unauthorized

class AuthService:
    """认证服务"""
    
    def register_user(self, data):
        """注册用户"""
        # 检查用户是否已存在
        if User.query.filter_by(email=data['email']).first():
            raise BadRequest('Email already registered')
        
        if User.query.filter_by(username=data['username']).first():
            raise BadRequest('Username already taken')
        
        # 创建用户
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return user
    
    def authenticate_user(self, email, password):
        """验证用户"""
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            raise Unauthorized('Invalid credentials')
        
        if not user.is_active:
            raise Unauthorized('User account is deactivated')
        
        return user
    
    def get_user_by_id(self, user_id):
        """根据 ID 获取用户"""
        return User.query.get(user_id)

# app/services/user_service.py
from app.models import User
from app.extensions import db
from werkzeug.exceptions import NotFound, BadRequest

class UserService:
    """用户服务"""
    
    def get_users(self, page=1, per_page=20):
        """获取用户列表"""
        query = User.query.order_by(User.created_at.desc())
        
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return pagination.items, pagination.total
    
    def get_user_by_id(self, user_id):
        """根据 ID 获取用户"""
        user = User.query.get(user_id)
        
        if not user:
            raise NotFound('User not found')
        
        return user
    
    def update_user(self, user_id, data):
        """更新用户"""
        user = self.get_user_by_id(user_id)
        
        # 更新字段
        if 'username' in data:
            if User.query.filter(
                User.username == data['username'],
                User.id != user_id
            ).first():
                raise BadRequest('Username already taken')
            user.username = data['username']
        
        if 'email' in data:
            if User.query.filter(
                User.email == data['email'],
                User.id != user_id
            ).first():
                raise BadRequest('Email already registered')
            user.email = data['email']
        
        if 'password' in data:
            user.set_password(data['password'])
        
        db.session.commit()
        
        return user
    
    def delete_user(self, user_id):
        """删除用户"""
        user = self.get_user_by_id(user_id)
        db.session.delete(user)
        db.session.commit()
```

### 7. 工具函数

```python
# app/utils/responses.py
from flask import jsonify

def success_response(data=None, message='Success', status_code=200):
    """成功响应"""
    response = {
        'success': True,
        'message': message,
    }
    
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code

def error_response(message='Error', status_code=400, errors=None):
    """错误响应"""
    response = {
        'success': False,
        'message': message,
    }
    
    if errors:
        response['errors'] = errors
    
    return jsonify(response), status_code

# app/utils/decorators.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models import User

def admin_required():
    """管理员权限装饰器"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or not user.is_admin:
                return jsonify({
                    'success': False,
                    'message': 'Admin access required'
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# app/middleware/logging.py
import time
from flask import request, g
from app.extensions import db

def log_request():
    """记录请求日志"""
    g.start_time = time.time()

def after_request_logger(response):
    """请求后记录日志"""
    if hasattr(g, 'start_time'):
        duration = time.time() - g.start_time
        
        log_data = {
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'duration': f'{duration:.3f}s',
            'ip': request.remote_addr,
        }
        
        # 这里可以记录到日志系统
        print(f"[API] {log_data}")
    
    return response
```

### 8. Celery 异步任务

```python
# app/tasks/email_tasks.py
from app.extensions import celery
from app.services.email_service import EmailService

@celery.task
def send_email_async(to, subject, template, **kwargs):
    """异步发送邮件"""
    email_service = EmailService()
    return email_service.send_email(to, subject, template, **kwargs)

@celery.task
def send_welcome_email(user_id):
    """发送欢迎邮件"""
    from app.models import User
    
    user = User.query.get(user_id)
    if user:
        send_email_async.delay(
            to=user.email,
            subject='Welcome!',
            template='welcome',
            username=user.username
        )

# 在路由中使用
@auth_bp.route('/register', methods=['POST'])
def register():
    # ... 注册逻辑
    
    # 异步发送欢迎邮件
    send_welcome_email.delay(user.id)
    
    return success_response(...)
```

## 最佳实践

### 1. 使用蓝图组织代码

```python
# app/routes/__init__.py
from flask import Blueprint

api_v1 = Blueprint('api_v1', __name__, url_prefix='/api/v1')

# 注册子蓝图
from .auth import auth_bp
from .users import users_bp

api_v1.register_blueprint(auth_bp)
api_v1.register_blueprint(users_bp)
```

### 2. 环境变量管理

```python
# 使用 python-dotenv
from dotenv import load_dotenv

load_dotenv()  # 从 .env 文件加载环境变量

# 或在配置中使用
import os
SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret')
```

### 3. 请求钩子

```python
@app.before_request
def before_request():
    """请求前执行"""
    g.user = None
    if 'Authorization' in request.headers:
        # 验证 token
        pass

@app.after_request
def after_request(response):
    """请求后执行"""
    # 添加安全头
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'deny'
    return response

@app.teardown_appcontext
def teardown_db(exception):
    """清理数据库连接"""
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()
```

### 4. 错误处理

```python
@app.errorhandler(Exception)
def handle_exception(e):
    """全局异常处理"""
    # 记录错误日志
    app.logger.error(f'Unhandled exception: {str(e)}', exc_info=True)
    
    # 返回统一格式的错误响应
    return error_response(
        'An unexpected error occurred',
        500
    )

@app.errorhandler(404)
def handle_404(e):
    return error_response('Resource not found', 404)

@app.errorhandler(400)
def handle_400(e):
    return error_response('Bad request', 400)
```

### 5. 分页和过滤

```python
from flask import request
from app.models import Post

def get_posts():
    # 分页
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # 过滤
    search = request.args.get('search', '')
    author_id = request.args.get('author_id', type=int)
    
    query = Post.query
    
    if search:
        query = query.filter(Post.title.ilike(f'%{search}%'))
    
    if author_id:
        query = query.filter_by(author_id=author_id)
    
    pagination = query.paginate(page=page, per_page=per_page)
    
    return {
        'items': [post.to_dict() for post in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }
```

### 6. 数据库迁移

```bash
# 初始化迁移
flask db init

# 创建迁移脚本
flask db migrate -m "Add user table"

# 应用迁移
flask db upgrade

# 回滚迁移
flask db downgrade
```

## 常用命令

### 开发
```bash
# 运行开发服务器
flask run

# 指定主机和端口
flask run --host=0.0.0.0 --port=5000

# 开启调试模式
export FLASK_DEBUG=1
flask run

# 运行应用
python run.py
```

### 数据库
```bash
# 初始化数据库
flask db init

# 创建迁移
flask db migrate -m "message"

# 应用迁移
flask db upgrade

# 回滚
flask db downgrade

# 查看迁移历史
flask db history

# 重置数据库
flask db drop
flask db create
```

### 测试
```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_auth.py

# 运行特定测试
pytest tests/test_auth.py::test_login

# 显示 print 输出
pytest -s

# 详细输出
pytest -v

# 生成覆盖率报告
pytest --cov=app --cov-report=html

# 并行测试
pytest -n auto
```

### Celery
```bash
# 启动 Celery worker
celery -A app.tasks worker --loglevel=info

# 启动 Celery beat（定时任务）
celery -A app.tasks beat --loglevel=info

# 启动 Flower（监控界面）
celery -A app.tasks flower

# 查看已注册任务
celery -A app.tasks inspect registered

# 查看活跃任务
celery -A app.tasks inspect active
```

### 其他
```bash
# 安装依赖
pip install -r requirements.txt

# 冻结依赖
pip freeze > requirements.txt

# 代码格式化
black app/

# 代码检查
flake8 app/

# 类型检查
mypy app/

# 生成依赖安全报告
safety check

# 检查依赖更新
pip list --outdated
```

## 部署配置

### Gunicorn

```python
# gunicorn.conf.py
import multiprocessing

bind = "0.0.0.0:5000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
keepalive = 120
timeout = 120
```

```bash
# 运行 Gunicorn
gunicorn -c gunicorn.conf.py wsgi:app

# 或直接指定参数
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

### Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements/production.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 运行迁移
RUN flask db upgrade

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - redis
    volumes:
      - ./app:/app/app

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  celery_worker:
    build: .
    command: celery -A app.tasks worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - app
      - redis

  celery_beat:
    build: .
    command: celery -A app.tasks beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - app
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Nginx

```nginx
# /etc/nginx/sites-available/myapp
upstream flask_app {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://flask_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /path/to/app/static;
        expires 30d;
    }
}
```

### Systemd

```ini
# /etc/systemd/system/flask_app.service
[Unit]
Description=Flask Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/app
Environment="PATH=/path/to/app/venv/bin"
ExecStart=/path/to/app/venv/bin/gunicorn -c gunicorn.conf.py wsgi:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 启动服务
sudo systemctl start flask_app

# 开机自启
sudo systemctl enable flask_app

# 查看状态
sudo systemctl status flask_app
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flask-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flask-api
  template:
    metadata:
      labels:
        app: flask-api
    spec:
      containers:
      - name: flask-api
        image: flask-api:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: secret-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: flask-api-service
spec:
  selector:
    app: flask-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

### 环境变量

```bash
# .env
FLASK_APP=wsgi.py
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=jwt-secret-key-here
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-email-password
```

## 性能优化

1. **启用缓存**
```python
from flask_caching import Cache

cache = Cache(config={'CACHE_TYPE': 'RedisCache'})

@app.route('/api/posts')
@cache.cached(timeout=300)
def get_posts():
    # ...
```

2. **数据库查询优化**
```python
# 使用 joinedload 减少查询次数
from sqlalchemy.orm import joinedload

posts = Post.query.options(joinedload(Post.author)).all()

# 只查询需要的字段
posts = Post.query.with_entities(Post.title, Post.created_at).all()
```

3. **启用 Gzip 压缩**
```python
from flask_compress import Compress

Compress(app)
```

4. **连接池配置**
```python
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
}
```

## 性能指标

- **请求延迟**: < 100ms (简单 API)
- **吞吐量**: 1000+ req/s (单 worker)
- **启动时间**: < 2s
- **内存占用**: 50-150MB
- **并发连接**: 取决于 worker 数量