# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Rust Web Application
**Type**: High-performance Backend Service
**Tech Stack**: Rust + Actix-web + Diesel + PostgreSQL
**Goal**: Production-ready, type-safe web service with exceptional performance

---

## Tech Stack

### Core
- **Language**: Rust 1.75+
- **Web Framework**: Actix-web 4.4+
- **ORM**: Diesel 2.1+
- **Database**: PostgreSQL 15+
- **Async Runtime**: Tokio 1.x

### Development
- **Build Tool**: Cargo
- **Linting**: Clippy
- **Formatting**: rustfmt
- **Testing**: Built-in test framework + cargo-nextest

---

## Project Structure

```
src/
├── main.rs              # Entry point
├── lib.rs               # Library root
├── config/              # Configuration
│   ├── mod.rs
│   └── settings.rs
├── handlers/            # HTTP handlers
│   ├── mod.rs
│   ├── health.rs
│   └── users.rs
├── models/              # Data models
│   ├── mod.rs
│   └── user.rs
├── schema/              # Database schema (Diesel)
│   └── schema.rs
├── services/            # Business logic
│   ├── mod.rs
│   └── user_service.rs
├── repositories/        # Data access
│   ├── mod.rs
│   └── user_repo.rs
├── dto/                 # Data transfer objects
│   ├── mod.rs
│   └── requests.rs
├── errors/              # Error handling
│   ├── mod.rs
│   └── api_error.rs
└── utils/               # Utilities
    ├── mod.rs
    └── jwt.rs
```

---

## Coding Rules

### 1. Error Handling

**Always use Result types with custom errors:**

```rust
// src/errors/api_error.rs
use actix_web::{HttpResponse, ResponseError};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Internal error: {0}")]
    InternalError(String),
    
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::NotFound(msg) => {
                HttpResponse::NotFound().json(serde_json::json!({
                    "error": msg
                }))
            }
            ApiError::BadRequest(msg) => {
                HttpResponse::BadRequest().json(serde_json::json!({
                    "error": msg
                }))
            }
            ApiError::InternalError(msg) => {
                HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": msg
                }))
            }
            ApiError::Unauthorized(msg) => {
                HttpResponse::Unauthorized().json(serde_json::json!({
                    "error": msg
                }))
            }
        }
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
```

### 2. Handler Pattern

**Keep handlers thin, delegate to services:**

```rust
// src/handlers/users.rs
use actix_web::{web, HttpResponse};
use crate::services::user_service::UserService;
use crate::dto::requests::CreateUserRequest;
use crate::errors::ApiResult;

pub async fn create_user(
    service: web::Data<UserService>,
    body: web::Json<CreateUserRequest>,
) -> ApiResult<HttpResponse> {
    let user = service.create(body.into_inner()).await?;
    Ok(HttpResponse::Created().json(user))
}

pub async fn get_user(
    service: web::Data<UserService>,
    path: web::Path<i32>,
) -> ApiResult<HttpResponse> {
    let user = service.find_by_id(path.into_inner()).await?;
    Ok(HttpResponse::Ok().json(user))
}
```

### 3. Service Layer

**Business logic belongs in services:**

```rust
// src/services/user_service.rs
use crate::repositories::user_repo::UserRepository;
use crate::models::user::{User, NewUser};
use crate::dto::requests::CreateUserRequest;
use crate::errors::{ApiError, ApiResult};

pub struct UserRepository {
    repo: UserRepository,
}

impl UserService {
    pub fn new(repo: UserRepository) -> Self {
        Self { repo }
    }

    pub async fn create(&self, req: CreateUserRequest) -> ApiResult<User> {
        // Validate input
        if req.email.is_empty() {
            return Err(ApiError::BadRequest("Email is required".into()));
        }

        let new_user = NewUser {
            email: req.email,
            name: req.name,
        };

        self.repo.create(new_user).await
    }

    pub async fn find_by_id(&self, id: i32) -> ApiResult<User> {
        self.repo.find_by_id(id).await
            .ok_or_else(|| ApiError::NotFound(format!("User {} not found", id)))
    }
}
```

### 4. Database Queries with Diesel

**Use type-safe queries:**

```rust
// src/repositories/user_repo.rs
use diesel::prelude::*;
use diesel::async::{AsyncPgConnection, RunQueryDsl};
use crate::models::user::{User, NewUser};
use crate::schema::users::dsl::*;

pub struct UserRepository;

impl UserRepository {
    pub async fn create(
        conn: &mut AsyncPgConnection,
        new_user: NewUser,
    ) -> Result<User, diesel::result::Error> {
        diesel::insert_into(users)
            .values(&new_user)
            .returning((id, email, name, created_at))
            .get_result(conn)
            .await
    }

    pub async fn find_by_id(
        conn: &mut AsyncPgConnection,
        user_id: i32,
    ) -> Option<User> {
        users
            .find(user_id)
            .first::<User>(conn)
            .await
            .ok()
    }

    pub async fn find_all(
        conn: &mut AsyncPgConnection,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<User>, diesel::result::Error> {
        users
            .order(created_at.desc())
            .limit(limit)
            .offset(offset)
            .load::<User>(conn)
            .await
    }
}
```

### 5. Configuration Management

**Use environment variables with defaults:**

```rust
// src/config/settings.rs
use std::env;

pub struct Settings {
    pub database_url: String,
    pub server_host: String,
    pub server_port: u16,
    pub jwt_secret: String,
}

impl Settings {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            server_host: env::var("SERVER_HOST")
                .unwrap_or_else(|_| "0.0.0.0".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .expect("Invalid port"),
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
        }
    }
}
```

### 6. Testing

**Write unit tests for services:**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_user_success() {
        // Arrange
        let mock_repo = MockUserRepository::new();
        let service = UserService::new(mock_repo);
        let request = CreateUserRequest {
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
        };

        // Act
        let result = service.create(request).await;

        // Assert
        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.email, "test@example.com");
    }
}
```

---

## Performance Rules

### 1. Use `&str` for string slices, `String` for owned strings
```rust
// Good: Function takes string slice
fn validate_email(email: &str) -> bool {
    email.contains('@')
}

// Good: When you need ownership
struct User {
    email: String,  // Owned
}
```

### 2. Avoid unnecessary clones
```rust
// Bad
let email = user.email.clone();
process(&email);

// Good
process(&user.email);
```

### 3. Use `Cow<str>` for conditional ownership
```rust
use std::borrow::Cow;

fn process_input(input: &str) -> Cow<str> {
    if input.contains("placeholder") {
        Cow::Owned(input.replace("placeholder", "value"))
    } else {
        Cow::Borrowed(input)
    }
}
```

---

## Security Rules

### 1. Never log sensitive data
```rust
// Bad
log::info!("User login: {}", password);

// Good
log::info!("User login: {}", email);
```

### 2. Validate all input
```rust
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 2, max = 100))]
    pub name: String,
}
```

### 3. Use parameterized queries (Diesel does this by default)
```rust
// Always safe with Diesel
users.filter(email.eq(user_email)).first::<User>(conn)
```

---

## Common Commands

```bash
# Run development server
cargo run

# Run with auto-reload
cargo watch -x run

# Run tests
cargo test

# Run specific test
cargo test test_create_user

# Check code without building
cargo check

# Run linter
cargo clippy -- -D warnings

# Format code
cargo fmt

# Build for production
cargo build --release

# Generate Diesel schema
diesel print-schema > src/schema/schema.rs
```

---

## Dependencies (Cargo.toml)

```toml
[dependencies]
actix-web = "4.4"
tokio = { version = "1", features = ["full"] }
diesel = { version = "2.1", features = ["postgres", "r2d2", "chrono"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
thiserror = "1.0"
validator = { version = "0.16", features = ["derive"] }
jsonwebtoken = "9"
chrono = { version = "0.4", features = ["serde"] }
dotenv = "0.15"
log = "0.4"
env_logger = "0.10"
```

---

## Deployment Checklist

- [ ] Set `RUST_LOG=info` for production logging
- [ ] Configure SSL/TLS (use reverse proxy like nginx)
- [ ] Set up connection pooling (r2d2)
- [ ] Enable request logging
- [ ] Configure rate limiting
- [ ] Set up health check endpoint
- [ ] Configure graceful shutdown
