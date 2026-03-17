# Actix Web 模板

Rust 高性能、异步 Web 框架，适用于构建快速、可靠的 Web 应用和 API。

## 技术栈

- **框架**: Actix Web 4.x
- **语言**: Rust 1.75+
- **异步运行时**: Tokio
- **序列化**: Serde
- **数据库**: SQLx / Diesel
- **日志**: Tracing
- **配置**: Config-rs
- **测试**: Actix-rt

## 项目结构

```
actix-web-api/
├── Cargo.toml
├── .env
├── .env.example
├── src/
│   ├── main.rs              # 应用入口
│   ├── app.rs               # 应用配置
│   ├── config.rs            # 配置管理
│   ├── error.rs             # 错误处理
│   ├── lib.rs               # 库入口
│   ├── handlers/            # 请求处理器
│   │   ├── mod.rs
│   │   ├── health.rs
│   │   ├── user.rs
│   │   └── auth.rs
│   ├── models/              # 数据模型
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   └── dto.rs
│   ├── middleware/          # 中间件
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── logging.rs
│   ├── repository/          # 数据访问层
│   │   ├── mod.rs
│   │   └── user_repo.rs
│   ├── services/            # 业务逻辑层
│   │   ├── mod.rs
│   │   └── user_service.rs
│   ├── utils/               # 工具函数
│   │   ├── mod.rs
│   │   └── jwt.rs
│   └── db/                  # 数据库连接
│       ├── mod.rs
│       └── pool.rs
├── migrations/              # 数据库迁移
├── tests/                   # 集成测试
│   └── integration_test.rs
└── docs/                    # API 文档
    └── openapi.yaml
```

## 核心代码模式

### 1. 应用入口 (main.rs)

```rust
use actix_web::{web, App, HttpServer};
use actix_web::middleware::Logger;
use std::env;
use sqlx::postgres::PgPoolOptions;

mod handlers;
mod models;
mod middleware;
mod repository;
mod services;
mod config;
mod error;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 初始化日志
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // 加载配置
    let config = config::Config::from_env().expect("Failed to load config");
    
    // 创建数据库连接池
    let db_pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await
        .expect("Failed to create pool");
    
    // 运行数据库迁移
    sqlx::migrate!("./migrations")
        .run(&db_pool)
        .await
        .expect("Failed to run migrations");
    
    let bind_address = format!("{}:{}", config.server.host, config.server.port);
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db_pool.clone()))
            .wrap(Logger::default())
            .wrap(middleware::auth::AuthMiddleware::new())
            .configure(handlers::configure_routes)
    })
    .bind(&bind_address)?
    .run()
    .await
}
```

### 2. 请求处理器 (handlers/user.rs)

```rust
use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use crate::models::user::{CreateUser, User};
use crate::services::user_service::UserService;
use crate::error::ApiError;

#[derive(Serialize)]
pub struct UserResponse {
    id: i32,
    username: String,
    email: String,
}

#[derive(Deserialize)]
pub struct CreateUserRequest {
    username: String,
    email: String,
    password: String,
}

pub async fn get_users(
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, ApiError> {
    let users = UserService::new(pool.get_ref())
        .get_all_users()
        .await?;
    
    Ok(HttpResponse::Ok().json(users))
}

pub async fn get_user(
    pool: web::Data<PgPool>,
    path: web::Path<i32>,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();
    let user = UserService::new(pool.get_ref())
        .get_user_by_id(user_id)
        .await?;
    
    Ok(HttpResponse::Ok().json(user))
}

pub async fn create_user(
    pool: web::Data<PgPool>,
    user_data: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, ApiError> {
    let user = UserService::new(pool.get_ref())
        .create_user(user_data.into_inner())
        .await?;
    
    Ok(HttpResponse::Created().json(user))
}

pub async fn update_user(
    pool: web::Data<PgPool>,
    path: web::Path<i32>,
    user_data: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();
    let user = UserService::new(pool.get_ref())
        .update_user(user_id, user_data.into_inner())
        .await?;
    
    Ok(HttpResponse::Ok().json(user))
}

pub async fn delete_user(
    pool: web::Data<PgPool>,
    path: web::Path<i32>,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();
    UserService::new(pool.get_ref())
        .delete_user(user_id)
        .await?;
    
    Ok(HttpResponse::NoContent().finish())
}

// 路由配置
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1/users")
            .route("", web::get().to(get_users))
            .route("", web::post().to(create_user))
            .route("/{id}", web::get().to(get_user))
            .route("/{id}", web::put().to(update_user))
            .route("/{id}", web::delete().to(delete_user))
    );
}
```

### 3. 数据模型 (models/user.rs)

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateUser {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUser {
    pub username: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UserDTO {
    pub id: i32,
    pub username: String,
    pub email: String,
}

impl From<User> for UserDTO {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            email: user.email,
        }
    }
}
```

### 4. 中间件 (middleware/auth.rs)

```rust
use actix_web::{dev::Payload, Error, FromRequest, HttpRequest};
use futures::future::{ready, Ready};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use chrono::{Duration, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32,
    pub username: String,
    pub exp: usize,
    pub iat: usize,
}

pub struct AuthMiddleware;

impl FromRequest for AuthMiddleware {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let auth_header = req.headers().get("Authorization");
        
        if let Some(auth_header) = auth_header {
            if let Ok(auth_str) = auth_header.to_str() {
                if auth_str.starts_with("Bearer ") {
                    let token = auth_str[7..].to_string();
                    // 验证 token
                    return ready(Ok(AuthMiddleware));
                }
            }
        }
        
        ready(Err(actix_web::error::ErrorUnauthorized("Invalid token")))
    }
}

pub fn create_jwt(user_id: i32, username: String, secret: &str) -> Result<String, Error> {
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;
    
    let claims = Claims {
        sub: user_id,
        username,
        iat: Utc::now().timestamp() as usize,
        exp: expiration,
    };
    
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .map_err(|e| actix_web::error::ErrorBadRequest(e))
}

pub fn validate_jwt(token: &str, secret: &str) -> Result<Claims, Error> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::new(Algorithm::HS256),
    )
    .map(|data| data.claims)
    .map_err(|e| actix_web::error::ErrorUnauthorized(e))
}
```

### 5. 数据库仓库层 (repository/user_repo.rs)

```rust
use sqlx::PgPool;
use crate::models::user::{CreateUser, User};
use crate::error::ApiError;

pub struct UserRepository<'a> {
    pool: &'a PgPool,
}

impl<'a> UserRepository<'a> {
    pub fn new(pool: &'a PgPool) -> Self {
        Self { pool }
    }
    
    pub async fn find_all(&self) -> Result<Vec<User>, ApiError> {
        let users = sqlx::query_as::<_, User>(
            "SELECT id, username, email, created_at, updated_at FROM users ORDER BY created_at DESC"
        )
        .fetch_all(self.pool)
        .await
        .map_err(ApiError::from)?;
        
        Ok(users)
    }
    
    pub async fn find_by_id(&self, id: i32) -> Result<Option<User>, ApiError> {
        let user = sqlx::query_as::<_, User>(
            "SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(self.pool)
        .await
        .map_err(ApiError::from)?;
        
        Ok(user)
    }
    
    pub async fn create(&self, user: CreateUser) -> Result<User, ApiError> {
        let created_user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (username, email, password_hash, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id, username, email, created_at, updated_at
            "#
        )
        .bind(&user.username)
        .bind(&user.email)
        .bind(&user.password)
        .fetch_one(self.pool)
        .await
        .map_err(ApiError::from)?;
        
        Ok(created_user)
    }
    
    pub async fn update(&self, id: i32, username: String, email: String) -> Result<User, ApiError> {
        let user = sqlx::query_as::<_, User>(
            r#"
            UPDATE users
            SET username = $1, email = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING id, username, email, created_at, updated_at
            "#
        )
        .bind(username)
        .bind(email)
        .bind(id)
        .fetch_one(self.pool)
        .await
        .map_err(ApiError::from)?;
        
        Ok(user)
    }
    
    pub async fn delete(&self, id: i32) -> Result<(), ApiError> {
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(self.pool)
            .await
            .map_err(ApiError::from)?;
        
        Ok(())
    }
}
```

### 6. 错误处理 (error.rs)

```rust
use actix_web::{HttpResponse, ResponseError};
use std::fmt;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    
    #[error("Not found: {0}")]
    NotFoundError(String),
    
    #[error("Bad request: {0}")]
    BadRequestError(String),
    
    #[error("Internal server error: {0}")]
    InternalError(String),
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::DatabaseError(_) => {
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": "Internal server error"
                }))
            }
            ApiError::NotFoundError(msg) => {
                HttpResponse::NotFound().json(serde_json::json!({
                    "error": msg
                }))
            }
            ApiError::BadRequestError(msg) => {
                HttpResponse::BadRequest().json(serde_json::json!({
                    "error": msg
                }))
            }
            ApiError::InternalError(msg) => {
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": msg
                }))
            }
        }
    }
}
```

### 7. 配置管理 (config.rs)

```rust
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
}

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub expiration: u64,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        Ok(Self {
            server: ServerConfig {
                host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
                port: env::var("PORT")
                    .unwrap_or_else(|_| "8080".to_string())
                    .parse()
                    .expect("PORT must be a number"),
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")?,
                max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .expect("DATABASE_MAX_CONNECTIONS must be a number"),
            },
            jwt: JwtConfig {
                secret: env::var("JWT_SECRET")?,
                expiration: env::var("JWT_EXPIRATION")
                    .unwrap_or_else(|_| "86400".to_string())
                    .parse()
                    .expect("JWT_EXPIRATION must be a number"),
            },
        })
    }
}
```

## 最佳实践

### 1. 性能优化

```rust
// 使用连接池
let pool = PgPoolOptions::new()
    .max_connections(20)
    .min_connections(5)
    .connect(&database_url)
    .await?;

// 启用压缩中间件
use actix_web::middleware::Compress;
App::new().wrap(Compress::default())

// 优化 JSON 解析
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Request {
    field: String,
}
```

### 2. 安全措施

```rust
// CORS 配置
use actix_cors::Cors;

let cors = Cors::permissive(); // 或自定义
App::new().wrap(cors);

// 速率限制
use actix_governor::{Governor, GovernorConfigBuilder};
let governor_conf = GovernorConfigBuilder::default()
    .seconds_per_request(1)
    .burst_size(10)
    .finish()
    .unwrap();
App::new().wrap(Governor::new(&governor_conf));

// 密码哈希
use argon2::{self, Config, ThreadMode, Variant, Version};
let config = Config {
    variant: Variant::Argon2id,
    version: Version::Version13,
    mem_cost: 65536,
    time_cost: 3,
    lanes: 4,
    thread_mode: ThreadMode::Parallel,
    secret: &secret_key,
    ad: &[],
    hash_length: 32,
};
```

### 3. 测试

```rust
#[cfg(test)]
mod tests {
    use actix_web::{test, web, App};
    use super::*;
    
    #[actix_web::test]
    async fn test_get_users() {
        let pool = setup_test_db().await;
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(pool))
                .configure(handlers::configure_routes)
        ).await;
        
        let req = test::TestRequest::get()
            .uri("/api/v1/users")
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }
    
    #[actix_web::test]
    async fn test_create_user() {
        let pool = setup_test_db().await;
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(pool))
                .configure(handlers::configure_routes)
        ).await;
        
        let user_data = CreateUserRequest {
            username: "test".to_string(),
            email: "test@example.com".to_string(),
            password: "password123".to_string(),
        };
        
        let req = test::TestRequest::post()
            .uri("/api/v1/users")
            .set_json(&user_data)
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }
}
```

### 4. 日志和追踪

```rust
use tracing::{info, warn, error, instrument};
use tracing_subscriber;

#[instrument(skip(pool))]
pub async fn get_user_by_id(pool: &PgPool, id: i32) -> Result<User, ApiError> {
    info!("Fetching user with id: {}", id);
    
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            error!("Database error: {}", e);
            ApiError::from(e)
        })?
        .ok_or_else(|| {
            warn!("User not found: {}", id);
            ApiError::NotFoundError(format!("User {} not found", id))
        })?;
    
    info!("Successfully fetched user: {}", user.id);
    Ok(user)
}

// 初始化追踪
tracing_subscriber::fmt()
    .with_max_level(tracing::Level::INFO)
    .init();
```

## 常用命令

### 开发

```bash
# 运行开发服务器
cargo run

# 运行并监听文件变化 (需要 cargo-watch)
cargo watch -x run

# 运行测试
cargo test

# 运行特定测试
cargo test test_get_users

# 运行测试并显示输出
cargo test -- --nocapture

# 代码格式化
cargo fmt

# 代码检查
cargo clippy
cargo clippy -- -D warnings

# 构建发布版本
cargo build --release

# 生成文档
cargo doc --open

# 添加依赖
cargo add serde --features derive
cargo add sqlx --features runtime-tokio,postgres

# 数据库迁移
sqlx migrate add create_users_table
sqlx migrate run
sqlx migrate revert
```

### 生产部署

```bash
# 构建优化版本
cargo build --release

# 运行
./target/release/actix-web-api

# 使用环境变量
ROCKET_ADDRESS=0.0.0.0 ROCKET_PORT=8080 ./target/release/actix-web-api

# 使用 systemd 服务
sudo systemctl start actix-api
sudo systemctl enable actix-api

# 查看日志
journalctl -u actix-api -f
```

## 部署配置

### Docker

```dockerfile
# 多阶段构建
FROM rust:1.75 as builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/actix-web-api /usr/local/bin/
COPY .env.example .env
EXPOSE 8080
CMD ["actix-web-api"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:password@db:5432/mydb
      - JWT_SECRET=your-secret-key
      - RUST_LOG=info
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: actix-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: actix-api
  template:
    metadata:
      labels:
        app: actix-api
    spec:
      containers:
      - name: actix-api
        image: actix-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: actix-api-service
spec:
  type: LoadBalancer
  selector:
    app: actix-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

### Nginx 反向代理

```nginx
upstream actix_backend {
    server 127.0.0.1:8080;
    keepalive 64;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://actix_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Systemd 服务

```ini
[Unit]
Description=Actix Web API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/actix-api
Environment="DATABASE_URL=postgres://user:pass@localhost/mydb"
Environment="JWT_SECRET=your-secret-key"
Environment="RUST_LOG=info"
ExecStart=/opt/actix-api/target/release/actix-web-api
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

## 性能调优

### 1. Tokio 运行时配置

```rust
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 自定义 Tokio 运行时
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(4)
        .enable_all()
        .build()
        .unwrap();
    
    runtime.block_on(async {
        // 启动服务器
        HttpServer::new(|| {
            App::new()
        })
        .workers(4)
        .bind("0.0.0.0:8080")?
        .run()
        .await
    })
}
```

### 2. 数据库优化

```rust
// 批量插入
pub async fn batch_insert(&self, users: Vec<CreateUser>) -> Result<Vec<User>, ApiError> {
    let mut query_builder = sqlx::QueryBuilder::new(
        "INSERT INTO users (username, email, password_hash, created_at, updated_at)"
    );
    
    query_builder.push_values(users, |mut b, user| {
        b.push_bind(user.username)
         .push_bind(user.email)
         .push_bind(user.password)
         .push_bind(chrono::Utc::now().naive_utc())
         .push_bind(chrono::Utc::now().naive_utc());
    });
    
    query_builder.push(" RETURNING id, username, email, created_at, updated_at");
    
    let users = query_builder
        .build_query_as::<User>()
        .fetch_all(self.pool)
        .await?;
    
    Ok(users)
}
```

### 3. 缓存策略

```rust
use moka::future::Cache;

lazy_static! {
    static ref USER_CACHE: Cache<i32, User> = Cache::builder()
        .max_capacity(1000)
        .time_to_live(Duration::from_secs(300))
        .build();
}

pub async fn get_user_cached(pool: &PgPool, id: i32) -> Result<User, ApiError> {
    if let Some(user) = USER_CACHE.get(&id).await {
        return Ok(user);
    }
    
    let user = UserRepository::new(pool)
        .find_by_id(id)
        .await?
        .ok_or_else(|| ApiError::NotFoundError(format!("User {} not found", id)))?;
    
    USER_CACHE.insert(id, user.clone()).await;
    Ok(user)
}
```

## 监控和可观测性

### Prometheus 指标

```rust
use actix_web_prom::PrometheusMetricsBuilder;

let prometheus = PrometheusMetricsBuilder::new("api")
    .endpoint("/metrics")
    .build()
    .unwrap();

App::new()
    .wrap(prometheus)
    // ... 其他配置
```

### 健康检查端点

```rust
pub async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339(),
    }))
}
```

## 参考资料

- [Actix Web 官方文档](https://actix.rs/)
- [SQLx 文档](https://docs.rs/sqlx/)
- [Tokio 文档](https://tokio.rs/)
- [Rust 异步编程](https://rust-lang.github.io/async-book/)
- [Actix 示例](https://github.com/actix/examples)
