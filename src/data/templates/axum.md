# Axum Web Framework

## 技术栈

### 核心框架
- **Axum** - Tokio 团队开发的 ergonomic Web 框架
- **Tokio** - Rust 异步运行时
- **Tower** - 中间件和服务抽象层
- **Hyper** - HTTP 服务器底层实现
- **Tower-http** - HTTP 中间件集合

### 数据库
- **SQLx** - 编译时检查的 SQL 客户端
- **SeaORM** - 异步 ORM 框架
- **Deadpool** - 连接池管理

### 序列化
- **Serde** - 序列化/反序列化框架
- **Serde_json** - JSON 支持

### 验证
- **Validator** - 结构体验证
- **Garde** - 现代验证库

### 认证
- **jsonwebtoken** - JWT 认证
- **argon2** - 密码哈希
- **tower-sessions** - 会话管理

## 项目结构

```
axum-project/
├── Cargo.toml
├── .env
├── .env.example
├── src/
│   ├── main.rs                 # 应用入口
│   ├── lib.rs                  # 库导出
│   │
│   ├── config/
│   │   ├── mod.rs
│   │   └── app_config.rs       # 配置管理
│   │
│   ├── routes/
│   │   ├── mod.rs
│   │   ├── health.rs           # 健康检查
│   │   ├── users.rs            # 用户路由
│   │   └── auth.rs             # 认证路由
│   │
│   ├── handlers/               # 或 controllers
│   │   ├── mod.rs
│   │   ├── user_handler.rs
│   │   └── auth_handler.rs
│   │
│   ├── models/
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   └── response.rs         # API 响应模型
│   │
│   ├── services/
│   │   ├── mod.rs
│   │   └── user_service.rs
│   │
│   ├── repositories/
│   │   ├── mod.rs
│   │   └── user_repo.rs
│   │
│   ├── db/
│   │   ├── mod.rs
│   │   └── pool.rs             # 数据库连接池
│   │
│   ├── middleware/
│   │   ├── mod.rs
│   │   ├── auth.rs             # JWT 验证中间件
│   │   └── logging.rs
│   │
│   ├── errors/
│   │   ├── mod.rs
│   │   └── app_error.rs        # 自定义错误类型
│   │
│   └── utils/
│       ├── mod.rs
│       └── password.rs
│
├── migrations/                  # SQLx 迁移文件
│   └── 20240101000000_create_users.sql
│
├── tests/                       # 集成测试
│   ├── integration_test.rs
│   └── common/
│       └── mod.rs
│
└── scripts/
    └── init_db.sh
```

## 代码模式

### 1. 基础应用设置

```rust
// src/main.rs
use axum::{
    routing::{get, post, put, delete},
    Router, Extension,
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;

mod config;
mod routes;
mod handlers;
mod models;
mod services;
mod repositories;
mod db;
mod middleware;
mod errors;

use db::pool::create_pool;
use config::app_config:: AppConfig;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化日志
    tracing_subscriber::fmt::init();
    
    // 加载配置
    let config = AppConfig::from_env()?;
    
    // 创建数据库连接池
    let pool = create_pool(&config.database_url).await?;
    
    // 运行迁移
    sqlx::migrate!("./migrations").run(&pool).await?;
    
    // 构建应用路由
    let app = Router::new()
        .route("/health", get(handlers::health::health_check))
        .nest("/api", routes::api_routes())
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .layer(Extension(pool))
        .layer(Extension(config.clone()));
    
    // 启动服务器
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
    
    Ok(())
}
```

### 2. 路由定义

```rust
// src/routes/mod.rs
use axum::{routing::{get, post, put, delete}, Router, Extension};
use crate::{handlers, middleware::auth::auth_layer};

pub fn api_routes() -> Router {
    Router::new()
        // 公开路由
        .route("/auth/register", post(handlers::auth::register))
        .route("/auth/login", post(handlers::auth::login))
        
        // 受保护路由
        .nest("/users", user_routes())
}

fn user_routes() -> Router {
    Router::new()
        .route("/", get(handlers::user::list_users))
        .route("/:id", get(handlers::user::get_user))
        .route("/:id", put(handlers::user::update_user))
        .route("/:id", delete(handlers::user::delete_user))
        .route_layer(auth_layer())
}
```

### 3. Handler 模式

```rust
// src/handlers/user_handler.rs
use axum::{
    extract::{Path, Extension, Query},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use crate::{
    models::user::{CreateUser, UpdateUser, User},
    services::user_service::UserService,
    errors::app_error::AppError,
};

#[derive(Deserialize)]
pub struct ListUsersQuery {
    page: Option<i32>,
    per_page: Option<i32>,
}

#[derive(Serialize)]
pub struct UserListResponse {
    users: Vec<User>,
    total: i64,
    page: i32,
    per_page: i32,
}

pub async fn list_users(
    Extension(pool): Extension<PgPool>,
    Query(query): Query<ListUsersQuery>,
) -> Result<Json<UserListResponse>, AppError> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20);
    
    let service = UserService::new(pool);
    let (users, total) = service.list(page, per_page).await?;
    
    Ok(Json(UserListResponse {
        users,
        total,
        page,
        per_page,
    }))
}

pub async fn get_user(
    Path(id): Path<i32>,
    Extension(pool): Extension<PgPool>,
) -> Result<Json<User>, AppError> {
    let service = UserService::new(pool);
    let user = service.get_by_id(id).await?;
    Ok(Json(user))
}

pub async fn create_user(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<CreateUser>,
) -> Result<(StatusCode, Json<User>), AppError> {
    let service = UserService::new(pool);
    let user = service.create(payload).await?;
    Ok((StatusCode::CREATED, Json(user)))
}

pub async fn update_user(
    Path(id): Path<i32>,
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<UpdateUser>,
) -> Result<Json<User>, AppError> {
    let service = UserService::new(pool);
    let user = service.update(id, payload).await?;
    Ok(Json(user))
}

pub async fn delete_user(
    Path(id): Path<i32>,
    Extension(pool): Extension<PgPool>,
) -> Result<StatusCode, AppError> {
    let service = UserService::new(pool);
    service.delete(id).await?;
    Ok(StatusCode::NO_CONTENT)
}
```

### 4. 错误处理

```rust
// src/errors/app_error.rs
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Unauthorized")]
    Unauthorized,
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Internal server error")]
    InternalServerError,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::DatabaseError(e) => {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
            }
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Unauthorized => {
                (StatusCode::UNAUTHORIZED, "Unauthorized".to_string())
            }
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::InternalServerError => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal error".to_string())
            }
        };
        
        let body = Json(ErrorResponse {
            error: status.canonical_reason().unwrap_or("Error").to_string(),
            message,
        });
        
        (status, body).into_response()
    }
}
```

### 5. 中间件

```rust
// src/middleware/auth.rs
use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, Validation, DecodingKey};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32,  // user_id
    pub exp: usize,
    pub iat: usize,
}

pub async fn auth_middleware(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;
    
    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;
    
    let claims = decode::<Claims>(
        token,
        &DecodingKey::from_secret("secret".as_ref()),
        &Validation::default(),
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?
    .claims;
    
    // 将 user_id 注入到请求扩展中
    req.extensions_mut().insert(claims.sub);
    
    Ok(next.run(req).await)
}
```

### 6. Service 层

```rust
// src/services/user_service.rs
use sqlx::PgPool;
use crate::{
    models::user::{CreateUser, UpdateUser, User},
    errors::AppError,
};

pub struct UserService {
    pool: PgPool,
}

impl UserService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
    
    pub async fn list(&self, page: i32, per_page: i32) -> Result<(Vec<User>, i64), AppError> {
        let offset = (page - 1) * per_page;
        
        let users = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, username, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            per_page,
            offset
        )
        .fetch_all(&self.pool)
        .await?;
        
        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
            .fetch_one(&self.pool)
            .await?;
        
        Ok((users, total))
    }
    
    pub async fn get_by_id(&self, id: i32) -> Result<User, AppError> {
        let user = sqlx::query_as!(
            User,
            "SELECT id, email, username, created_at, updated_at FROM users WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound(format!("User {} not found", id)))?;
        
        Ok(user)
    }
    
    pub async fn create(&self, payload: CreateUser) -> Result<User, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (email, username, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, email, username, created_at, updated_at
            "#,
            payload.email,
            payload.username,
            payload.password_hash,
        )
        .fetch_one(&self.pool)
        .await?;
        
        Ok(user)
    }
    
    pub async fn update(&self, id: i32, payload: UpdateUser) -> Result<User, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            UPDATE users
            SET username = COALESCE($1, username),
                updated_at = NOW()
            WHERE id = $2
            RETURNING id, email, username, created_at, updated_at
            "#,
            payload.username,
            id,
        )
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AppError::NotFound(format!("User {} not found", id)))?;
        
        Ok(user)
    }
    
    pub async fn delete(&self, id: i32) -> Result<(), AppError> {
        let result = sqlx::query!("DELETE FROM users WHERE id = $1", id)
            .execute(&self.pool)
            .await?;
        
        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("User {} not found", id)));
        }
        
        Ok(())
    }
}
```

## 最佳实践

### 1. 使用编译时 SQL 检查

```rust
// Cargo.toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "chrono", "uuid"] }

# 构建时检查 SQL
[build-dependencies]
sqlx = "0.7"

// 在构建前运行
// cargo sqlx prepare  # 生成 .sqlx 文件用于离线编译
```

### 2. 使用 thiserror 和 anyhow

```toml
[dependencies]
thiserror = "1.0"
anyhow = "1.0"
```

### 3. 配置管理

```rust
// src/config/app_config.rs
use config::{Config, ConfigError, File, Environment};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub port: u16,
    pub database_url: String,
    pub jwt_secret: String,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, ConfigError> {
        let config = Config::builder()
            .add_source(File::with_name("config/default"))
            .add_source(Environment::default())
            .build()?;
        
        config.try_deserialize()
    }
}
```

### 4. 使用 Tower 中间件

```rust
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
    compression::CompressionLayer,
    limit::RateLimitLayer,
};
use std::time::Duration;

let app = Router::new()
    .route("/", get(handler))
    .layer(
        ServiceBuilder::new()
            .layer(TraceLayer::new_for_http())
            .layer(CompressionLayer::new())
            .layer(RateLimitLayer::new(100, Duration::from_secs(1)))
            .layer(CorsLayer::permissive())
    );
```

### 5. 测试模式

```rust
// tests/integration_test.rs
use axum::{
    body::Body,
    http::{Request, Method, StatusCode},
};
use tower::ServiceExt;
use sqlx::PgPool;
use crate::create_app;

#[sqlx::test]
async fn test_list_users(pool: PgPool) {
    let app = create_app(pool);
    
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/users")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
}
```

### 6. 使用 Extractor 组合

```rust
use axum::extract::{FromRequestParts, FromRequest};

// 自定义 extractor
pub struct AuthUser(pub i32);

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = StatusCode;
    
    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let user_id = parts
            .extensions
            .get::<i32>()
            .copied()
            .ok_or(StatusCode::UNAUTHORIZED)?;
        
        Ok(AuthUser(user_id))
    }
}

// 使用
pub async fn get_profile(
    AuthUser(user_id): AuthUser,
    Extension(pool): Extension<PgPool>,
) -> Result<Json<User>, AppError> {
    // ...
}
```

## 常用命令

### 开发
```bash
# 运行开发服务器（热重载需要 cargo-watch）
cargo watch -x run

# 运行测试
cargo test

# 运行特定测试
cargo test test_name

# 生成 SQLx 离线检查文件
cargo sqlx prepare

# 代码格式化
cargo fmt

# 代码检查
cargo clippy -- -D warnings

# 构建发布版本
cargo build --release
```

### 数据库
```bash
# 创建迁移
cargo sqlx migrate add create_users_table

# 运行迁移
cargo sqlx migrate run

# 回滚迁移
cargo sqlx migrate revert

# 数据库设置
sqlx database create
sqlx database drop
```

### 性能分析
```bash
# 运行 benchmark
cargo bench

# 生成火焰图（需要 cargo-flamegraph）
cargo flamegraph

# 检查编译时间
cargo build --timings
```

## 部署配置

### Docker

```dockerfile
# Dockerfile
FROM rust:1.75 as builder

WORKDIR /app
COPY Cargo.* ./
COPY src ./src

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/axum-app /usr/local/bin/

EXPOSE 3000
CMD ["axum-app"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - JWT_SECRET=your-secret-key
    depends_on:
      - db
      - redis

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
  postgres_data:
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axum-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: axum-api
  template:
    metadata:
      labels:
        app: axum-api
    spec:
      containers:
      - name: axum-api
        image: axum-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: axum-api-service
spec:
  selector:
    app: axum-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Shuttle（Rust 原生云平台）

```rust
// src/main.rs
use axum::Router;
use shuttle_axum::ShuttleAxum;

#[shuttle_runtime::main]
async fn axum() -> ShuttleAxum<Router> {
    let router = Router::new()
        .route("/", axum::routing::get(|| async { "Hello, Shuttle!" }));
    
    Ok(router.into())
}
```

```toml
# Cargo.toml
[dependencies]
shuttle-axum = "0.36"
shuttle-runtime = "0.36"
```

```bash
# 部署到 Shuttle
shuttle deploy
```

### 性能优化

1. **连接池调优**
```rust
let pool = PgPoolOptions::new()
    .max_connections(20)
    .min_connections(5)
    .acquire_timeout(Duration::from_secs(3))
    .connect(&database_url)
    .await?;
```

2. **启用 HTTP/2**
```rust
axum::Server::bind(&addr)
    .http2_only(true)  // 仅 HTTP/2
    .serve(app.into_make_service())
    .await?;
```

3. **启用 keep-alive**
```rust
use tower_http::timeout::TimeoutLayer;

let app = Router::new()
    .layer(TimeoutLayer::new(Duration::from_secs(30)));
```

4. **静态文件服务**
```rust
use tower_http::services::ServeDir;

let app = Router::new()
    .nest_service("/static", ServeDir::new("static"));
```

### 监控和日志

```rust
// 结构化日志
use tracing::{info, error, instrument};

#[instrument(skip(pool))]
pub async fn get_user(
    Path(id): Path<i32>,
    Extension(pool): Extension<PgPool>,
) -> Result<Json<User>, AppError> {
    info!(user_id = id, "Fetching user");
    let user = service.get_by_id(id).await?;
    info!(user_id = id, "User fetched successfully");
    Ok(Json(user))
}
```

### 环境变量

```bash
# .env
DATABASE_URL=postgres://user:password@localhost:5432/mydb
JWT_SECRET=your-super-secret-key
PORT=3000
RUST_LOG=info,my_app=debug
```

## 性能指标

- **启动时间**: < 10ms
- **请求延迟**: < 1ms (简单路由)
- **吞吐量**: 300k+ req/s (Hello World)
- **内存占用**: < 10MB (基础应用)
- **二进制大小**: 8-15MB (release + strip)