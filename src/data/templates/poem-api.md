# Poem API Template

## Project Overview

High-performance, ergonomic web framework for Rust with Poem, featuring async/await, middleware, WebSocket, and comprehensive ecosystem support.

## Tech Stack

- **Framework**: Poem 2.0
- **Runtime**: Tokio
- **Language**: Rust 1.75+
- **Serialization**: Serde
- **Validation**: poem-openapi
- **Database**: SQLx / SeaORM
- **Testing: Tokio Test

## Project Structure

```
api/
├── src/
│   ├── main.rs               # Entry point
│   ├── lib.rs                # Library exports
│   ├── routes/
│   │   ├── mod.rs
│   │   ├── users.rs
│   │   ├── auth.rs
│   │   └── health.rs
│   ├── handlers/
│   │   ├── mod.rs
│   │   └── user_handler.rs
│   ├── models/
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   └── auth.rs
│   ├── middleware/
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── logging.rs
│   ├── services/
│   │   ├── mod.rs
│   │   └── user_service.rs
│   ├── db/
│   │   ├── mod.rs
│   │   └── pool.rs
│   ├── config.rs             # Configuration
│   └── error.rs              # Error handling
├── Cargo.toml
└── config.toml
```

## Key Patterns

### 1. Basic Server Setup

```rust
// src/main.rs
use poem::{endpoint::make_sync, listener::TcpListener, Route, Server, web::Html};
use poem::middleware::AddData;
use std::env;

mod routes;
mod handlers;
mod models;
mod middleware;
mod services;
mod db;
mod config;
mod error;

use crate::config::Config;
use crate::db::create_pool;

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    // Load configuration
    let config = Config::from_env();
    
    // Setup database
    let db_pool = create_pool(&config.database_url).await;
    
    // Build routes
    let app = Route::new()
        .at("/", make_sync(|| Html("<h1>Welcome to Poem API</h1>")))
        .nest("/api/users", routes::users::routes())
        .nest("/api/auth", routes::auth::routes())
        .nest("/health", routes::health::routes())
        .with(AddData::new(db_pool))
        .with(middleware::logging::LogMiddleware);
    
    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    println!("Server running at http://{}", addr);
    
    Server::new(TcpListener::bind(addr))
        .run(app)
        .await
}
```

### 2. Route Definitions

```rust
// src/routes/users.rs
use poem::{
    web::{Data, Json, Path},
    Route, IntoResponse,
};
use crate::handlers::user_handler;
use crate::db::DbPool;

pub fn routes() -> Route {
    Route::new()
        .at("/", poem::get(user_handler::list_users))
        .at("/", poem::post(user_handler::create_user))
        .at("/:id", poem::get(user_handler::get_user))
        .at("/:id", poem::put(user_handler::update_user))
        .at("/:id", poem::delete(user_handler::delete_user))
}

// src/routes/auth.rs
use poem::Route;
use crate::handlers::auth_handler;

pub fn routes() -> Route {
    Route::new()
        .at("/login", poem::post(auth_handler::login))
        .at("/register", poem::post(auth_handler::register))
        .at("/logout", poem::post(auth_handler::logout))
}
```

### 3. Handlers with Models

```rust
// src/models/user.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateUser {
    pub name: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUser {
    pub name: Option<String>,
    pub email: Option<String>,
}

// src/handlers/user_handler.rs
use poem::{
    web::{Data, Json, Path},
    IntoResponse, Response,
};
use crate::models::user::{User, CreateUser, UpdateUser};
use crate::services::user_service;
use crate::db::DbPool;
use crate::error::ApiError;

pub async fn list_users(Data(pool): Data<&DbPool>) -> Result<Json<Vec<User>>, ApiError> {
    let users = user_service::get_all_users(pool).await?;
    Ok(Json(users))
}

pub async fn get_user(
    Data(pool): Data<&DbPool>,
    Path(id): Path<i32>,
) -> Result<Json<User>, ApiError> {
    let user = user_service::get_user_by_id(pool, id).await?;
    Ok(Json(user))
}

pub async fn create_user(
    Data(pool): Data<&DbPool>,
    Json(payload): Json<CreateUser>,
) -> Result<Json<User>, ApiError> {
    let user = user_service::create_user(pool, payload).await?;
    Ok(Json(user))
}

pub async fn update_user(
    Data(pool): Data<&DbPool>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateUser>,
) -> Result<Json<User>, ApiError> {
    let user = user_service::update_user(pool, id, payload).await?;
    Ok(Json(user))
}

pub async fn delete_user(
    Data(pool): Data<&DbPool>,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, ApiError> {
    user_service::delete_user(pool, id).await?;
    Ok(Json(serde_json::json!({"message": "User deleted"})))
}
```

### 4. Service Layer

```rust
// src/services/user_service.rs
use sqlx::PgPool;
use crate::models::user::{User, CreateUser, UpdateUser};
use crate::error::ApiError;

pub async fn get_all_users(pool: &PgPool) -> Result<Vec<User>, ApiError> {
    let users = sqlx::query_as::<_, User>("SELECT id, name, email, created_at FROM users")
        .fetch_all(pool)
        .await?;
    
    Ok(users)
}

pub async fn get_user_by_id(pool: &PgPool, id: i32) -> Result<User, ApiError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, name, email, created_at FROM users WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or(ApiError::NotFound)?;
    
    Ok(user)
}

pub async fn create_user(pool: &PgPool, payload: CreateUser) -> Result<User, ApiError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at
        "#
    )
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&hash_password(&payload.password)?)
    .fetch_one(pool)
    .await?;
    
    Ok(user)
}

pub async fn update_user(
    pool: &PgPool,
    id: i32,
    payload: UpdateUser,
) -> Result<User, ApiError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        UPDATE users
        SET name = COALESCE($1, name),
            email = COALESCE($2, email)
        WHERE id = $3
        RETURNING id, name, email, created_at
        "#
    )
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(id)
    .fetch_one(pool)
    .await?;
    
    Ok(user)
}

pub async fn delete_user(pool: &PgPool, id: i32) -> Result<(), ApiError> {
    let result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    
    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }
    
    Ok(())
}

fn hash_password(password: &str) -> Result<String, ApiError> {
    // Use bcrypt or argon2
    use bcrypt::{hash, DEFAULT_COST};
    hash(password, DEFAULT_COST).map_err(ApiError::HashError)
}
```

### 5. Error Handling

```rust
// src/error.rs
use poem::{http::StatusCode, IntoResponse, Response};
use serde_json::json;

#[derive(Debug)]
pub enum ApiError {
    NotFound,
    BadRequest(String),
    Unauthorized,
    InternalError(String),
    DatabaseError(sqlx::Error),
}

impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        ApiError::DatabaseError(err)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, "Resource not found"),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, &msg),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            ApiError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, &msg),
            ApiError::DatabaseError(err) => {
                (StatusCode::INTERNAL_SERVER_ERROR, &format!("Database error: {}", err))
            }
            ApiError::HashError(err) => {
                (StatusCode::INTERNAL_SERVER_ERROR, &format!("Hash error: {}", err))
            }
        };
        
        let body = json!({
            "error": message,
            "status": status.as_u16(),
        });
        
        (status, poem::web::Json(body)).into_response()
    }
}
```

### 6. Middleware

```rust
// src/middleware/auth.rs
use poem::{
    http::StatusCode,
    middleware::AddData,
    Endpoint, Middleware, Request, Result,
};
use jsonwebtoken::{decode, Validation, DecodingKey};

pub struct AuthMiddleware;

impl<E: Endpoint> Middleware<E> for AuthMiddleware {
    type Output = AuthMiddlewareImpl<E>;

    fn transform(&self, ep: E) -> Self::Output {
        AuthMiddlewareImpl(ep)
    }
}

pub struct AuthMiddlewareImpl<E>(E);

#[poem::async_trait]
impl<E: Endpoint> Endpoint for AuthMiddlewareImpl<E> {
    type Output = E::Output;

    async fn call(&self, mut req: Request) -> Result<Self::Output> {
        let auth_header = req
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or(poem::Error::from_status(StatusCode::UNAUTHORIZED))?;
        
        if !auth_header.starts_with("Bearer ") {
            return Err(poem::Error::from_status(StatusCode::UNAUTHORIZED));
        }
        
        let token = &auth_header[7..];
        
        // Validate token
        let claims = decode::<Claims>(
            token,
            &DecodingKey::from_secret("secret".as_ref()),
            &Validation::default(),
        )
        .map_err(|_| poem::Error::from_status(StatusCode::UNAUTHORIZED))?;
        
        // Add user ID to request
        req.set_data(claims.claims.user_id);
        
        self.0.call(req).await
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
struct Claims {
    user_id: i32,
    exp: usize,
}
```

### 7. OpenAPI Documentation

```rust
// src/routes/api_doc.rs
use poem_openapi::{
    payload::Json,
    OpenApi, OpenApiService,
};
use crate::models::user::{User, CreateUser};

pub struct Api;

#[OpenApi]
impl Api {
    /// List all users
    #[oai(path = "/users", method = "get")]
    async fn list_users(&self) -> Json<Vec<User>> {
        // Implementation
        Json(vec![])
    }

    /// Create a new user
    #[oai(path = "/users", method = "post")]
    async fn create_user(&self, payload: Json<CreateUser>) -> Json<User> {
        // Implementation
        Json(User {
            id: 1,
            name: payload.name.clone(),
            email: payload.email.clone(),
            created_at: chrono::Utc::now().naive_utc(),
        })
    }
}

// In main.rs
use poem_openapi::OpenApiService;

let api_service = OpenApiService::new(Api::new(), "My API", "1.0")
    .server("http://localhost:3000/api");

let app = Route::new()
    .nest("/api", api_service)
    .nest("/docs", api_service.swagger_ui());
```

### 8. WebSocket Support

```rust
// src/routes/websocket.rs
use poem::{
    web::websocket::{WebSocket, WebSocketMessage},
    EndpointExt, Route,
};

async fn ws_handler(ws: WebSocket) {
    let (mut sink, mut stream) = ws.split();
    
    // Send welcome message
    sink.send(WebSocketMessage::Text("Welcome!".to_string()))
        .await
        .ok();
    
    // Echo messages
    while let Some(msg) = stream.next().await {
        if let Ok(msg) = msg {
            sink.send(msg).await.ok();
        }
    }
}

pub fn routes() -> Route {
    Route::new().at("/ws", poem::get(|ws: WebSocket| async move {
        ws_handler(ws).await
    }))
}
```

## Best Practices

1. **Async Everywhere**: Use async/await for all I/O operations
2. **Error Handling**: Use custom error types with IntoResponse
3. **Validation**: Validate input data before processing
4. **Connection Pooling**: Use database connection pools
5. **Logging**: Implement structured logging

## Common Commands

```bash
# Run development server
cargo run

# Build for production
cargo build --release

# Run tests
cargo test

# Watch for changes
cargo watch -x run

# Generate documentation
cargo doc --open

# Check code
cargo clippy

# Format code
cargo fmt
```

## Dependencies

```toml
# Cargo.toml
[package]
name = "poem-api"
version = "0.1.0"
edition = "2021"

[dependencies]
poem = "2.0"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "postgres", "chrono"] }
chrono = { version = "0.4", features = ["serde"] }
jsonwebtoken = "9"
bcrypt = "0.15"
tracing = "0.1"
tracing-subscriber = "0.3"

[dependencies.poem-openapi]
version = "4.0"
features = ["swagger-ui"]

[dev-dependencies]
tokio-test = "0.4"
```

## Database Setup

```rust
// src/db/pool.rs
use sqlx::postgres::PgPoolOptions;

pub type DbPool = sqlx::postgres::PgPool;

pub async fn create_pool(database_url: &str) -> DbPool {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
        .expect("Failed to create pool")
}

pub async fn run_migrations(pool: &DbPool) {
    sqlx::migrate!("./migrations")
        .run(pool)
        .await
        .expect("Failed to run migrations");
}
```

## Testing

```rust
// tests/api_test.rs
use poem::test::TestClient;
use crate::main;

#[tokio::test]
async fn test_list_users() {
    let app = main::create_app().await;
    let cli = TestClient::new(app);
    
    let resp = cli.get("/api/users").send().await;
    resp.assert_status_is_ok();
}

#[tokio::test]
async fn test_create_user() {
    let app = main::create_app().await;
    let cli = TestClient::new(app);
    
    let resp = cli
        .post("/api/users")
        .body_json(&serde_json::json!({
            "name": "John Doe",
            "email": "john@example.com",
            "password": "password123"
        }))
        .send()
        .await;
    
    resp.assert_status_is_ok();
}
```

## Deployment

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

COPY --from=builder /app/target/release/poem-api /usr/local/bin/

EXPOSE 3000

CMD ["poem-api"]
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: poem-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: poem-api
  template:
    metadata:
      labels:
        app: poem-api
    spec:
      containers:
      - name: poem-api
        image: poem-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: poem-secrets
              key: database-url
```

## Performance Tips

1. **Use Connection Pooling**: Reuse database connections
2. **Async I/O**: Use async for all I/O operations
3. **Middleware Ordering**: Place frequently used middleware first
4. **Caching**: Use Redis for frequently accessed data
5. **Compression**: Enable gzip compression for responses

## Resources

- [Poem Documentation](https://docs.rs/poem/)
- [Poem GitHub](https://github.com/poem-web/poem)
- [Tokio Documentation](https://docs.rs/tokio/)
- [SQLx Documentation](https://docs.rs/sqlx/)
- [Awesome Rust](https://github.com/rust-unofficial/awesome-rust)
