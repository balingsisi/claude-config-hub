# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Go Microservice
**Type**: High-Performance Backend Service
**Tech Stack**: Go 1.22 + Gin + GORM + Redis
**Goal**: Production-ready, scalable microservice with clean architecture

---

## Tech Stack

### Core
- **Language**: Go 1.22+
- **HTTP Framework**: Gin 1.9+
- **ORM**: GORM 1.25+
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+

### Development
- **Build**: Make + Go build
- **Linting**: golangci-lint
- **Testing**: Go testing + testify
- **Docs**: Swagger/OpenAPI

---

## Project Structure

```
cmd/
├── api/
│   └── main.go           # Application entry point
├── migrate/
│   └── main.go           # Migration tool
internal/
├── config/
│   └── config.go         # Configuration management
├── domain/
│   ├── user.go           # Domain entities
│   └── order.go
├── repository/
│   ├── user_repo.go      # Data access layer
│   └── order_repo.go
├── service/
│   ├── user_service.go   # Business logic
│   └── order_service.go
├── handler/
│   ├── user_handler.go   # HTTP handlers
│   └── order_handler.go
├── middleware/
│   ├── auth.go
│   ├── logging.go
│   └── ratelimit.go
└── pkg/
    ├── response/
    │   └── response.go   # Standard response format
    ├── validator/
    │   └── validator.go
    └── logger/
        └── logger.go
pkg/
├── database/
│   └── postgres.go
└── cache/
    └── redis.go
api/
├── openapi.yaml          # API specification
└── docs/                 # Generated docs
configs/
├── config.yaml
└── config.example.yaml
scripts/
├── migrate.sh
└── seed.sh
Makefile
docker-compose.yml
Dockerfile
```

---

## Coding Rules

### 1. Clean Architecture Layers

**Domain Layer (Entities):**

```go
// internal/domain/user.go
package domain

import "time"

type User struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    Email     string    `json:"email" gorm:"uniqueIndex;not null"`
    Name      string    `json:"name"`
    Password  string    `json:"-" gorm:"not null"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

func (User) TableName() string {
    return "users"
}
```

**Repository Layer (Data Access):**

```go
// internal/repository/user_repo.go
package repository

import (
    "context"
    "errors"
    
    "your-app/internal/domain"
    "gorm.io/gorm"
)

type UserRepository interface {
    Create(ctx context.Context, user *domain.User) error
    FindByID(ctx context.Context, id uint) (*domain.User, error)
    FindByEmail(ctx context.Context, email string) (*domain.User, error)
    Update(ctx context.Context, user *domain.User) error
    Delete(ctx context.Context, id uint) error
}

type userRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) FindByID(ctx context.Context, id uint) (*domain.User, error) {
    var user domain.User
    err := r.db.WithContext(ctx).First(&user, id).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    return &user, err
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
    var user domain.User
    err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    return &user, err
}
```

**Service Layer (Business Logic):**

```go
// internal/service/user_service.go
package service

import (
    "context"
    "errors"
    
    "your-app/internal/domain"
    "your-app/internal/repository"
    "golang.org/x/crypto/bcrypt"
)

var (
    ErrUserNotFound      = errors.New("user not found")
    ErrEmailAlreadyExist = errors.New("email already exists")
    ErrInvalidPassword   = errors.New("invalid password")
)

type UserService interface {
    Register(ctx context.Context, email, password, name string) (*domain.User, error)
    Login(ctx context.Context, email, password string) (*domain.User, error)
    GetByID(ctx context.Context, id uint) (*domain.User, error)
}

type userService struct {
    repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
    return &userService{repo: repo}
}

func (s *userService) Register(ctx context.Context, email, password, name string) (*domain.User, error) {
    // Check if email exists
    existing, err := s.repo.FindByEmail(ctx, email)
    if err != nil {
        return nil, err
    }
    if existing != nil {
        return nil, ErrEmailAlreadyExist
    }

    // Hash password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }

    user := &domain.User{
        Email:    email,
        Password: string(hashedPassword),
        Name:     name,
    }

    if err := s.repo.Create(ctx, user); err != nil {
        return nil, err
    }

    return user, nil
}

func (s *userService) Login(ctx context.Context, email, password string) (*domain.User, error) {
    user, err := s.repo.FindByEmail(ctx, email)
    if err != nil {
        return nil, err
    }
    if user == nil {
        return nil, ErrUserNotFound
    }

    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
        return nil, ErrInvalidPassword
    }

    return user, nil
}
```

**Handler Layer (HTTP):**

```go
// internal/handler/user_handler.go
package handler

import (
    "net/http"
    
    "your-app/internal/service"
    "your-app/internal/pkg/response"
    "github.com/gin-gonic/gin"
)

type UserHandler struct {
    userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
    return &UserHandler{userService: userService}
}

type RegisterRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
    Name     string `json:"name" binding:"required,min=2"`
}

type LoginRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

func (h *UserHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    user, err := h.userService.Register(c.Request.Context(), req.Email, req.Password, req.Name)
    if err != nil {
        if errors.Is(err, service.ErrEmailAlreadyExist) {
            response.Conflict(c, err.Error())
            return
        }
        response.InternalError(c, "Failed to register user")
        return
    }

    response.Created(c, user)
}

func (h *UserHandler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    user, err := h.userService.Login(c.Request.Context(), req.Email, req.Password)
    if err != nil {
        if errors.Is(err, service.ErrInvalidPassword) || errors.Is(err, service.ErrUserNotFound) {
            response.Unauthorized(c, "Invalid credentials")
            return
        }
        response.InternalError(c, "Failed to login")
        return
    }

    // Generate JWT token
    token, err := generateToken(user)
    if err != nil {
        response.InternalError(c, "Failed to generate token")
        return
    }

    response.OK(c, gin.H{
        "user":  user,
        "token": token,
    })
}
```

### 2. Standard Response Format

```go
// internal/pkg/response/response.go
package response

import (
    "github.com/gin-gonic/gin"
)

type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

func OK(c *gin.Context, data interface{}) {
    c.JSON(http.StatusOK, Response{
        Success: true,
        Data:    data,
    })
}

func Created(c *gin.Context, data interface{}) {
    c.JSON(http.StatusCreated, Response{
        Success: true,
        Data:    data,
    })
}

func BadRequest(c *gin.Context, message string) {
    c.JSON(http.StatusBadRequest, Response{
        Success: false,
        Error:   message,
    })
}

func Unauthorized(c *gin.Context, message string) {
    c.JSON(http.StatusUnauthorized, Response{
        Success: false,
        Error:   message,
    })
}

func NotFound(c *gin.Context, message string) {
    c.JSON(http.StatusNotFound, Response{
        Success: false,
        Error:   message,
    })
}

func InternalError(c *gin.Context, message string) {
    c.JSON(http.StatusInternalServerError, Response{
        Success: false,
        Error:   message,
    })
}
```

### 3. Middleware

```go
// internal/middleware/auth.go
package middleware

import (
    "strings"
    
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func Auth(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "Authorization header required"})
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.AbortWithStatusJSON(401, gin.H{"error": "Invalid authorization header"})
            return
        }

        tokenString := parts[1]
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            return []byte(jwtSecret), nil
        })

        if err != nil || !token.Valid {
            c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token"})
            return
        }

        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token claims"})
            return
        }

        c.Set("userID", claims["sub"])
        c.Next()
    }
}

// internal/middleware/logging.go
package middleware

import (
    "time"
    
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

func Logger(logger *zap.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        query := c.Request.URL.RawQuery

        c.Next()

        latency := time.Since(start)
        status := c.Writer.Status()

        logger.Info("HTTP Request",
            zap.Int("status", status),
            zap.String("method", c.Request.Method),
            zap.String("path", path),
            zap.String("query", query),
            zap.Duration("latency", latency),
            zap.String("ip", c.ClientIP()),
        )
    }
}
```

### 4. Configuration

```go
// internal/config/config.go
package config

import (
    "os"
    
    "github.com/spf13/viper"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    JWT      JWTConfig
}

type ServerConfig struct {
    Port int
    Mode string
}

type DatabaseConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    DBName   string
    SSLMode  string
}

type RedisConfig struct {
    Host     string
    Port     int
    Password string
    DB       int
}

type JWTConfig struct {
    Secret     string
    Expiration int // hours
}

func Load() (*Config, error) {
    viper.SetConfigName("config")
    viper.SetConfigType("yaml")
    viper.AddConfigPath("./configs")
    viper.AutomaticEnv()

    if err := viper.ReadInConfig(); err != nil {
        return nil, err
    }

    var cfg Config
    if err := viper.Unmarshal(&cfg); err != nil {
        return nil, err
    }

    return &cfg, nil
}
```

---

## Testing

### Unit Tests

```go
// internal/service/user_service_test.go
package service

import (
    "context"
    "testing"
    
    "your-app/internal/domain"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) Create(ctx context.Context, user *domain.User) error {
    args := m.Called(ctx, user)
    return args.Error(0)
}

func (m *MockUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
    args := m.Called(ctx, email)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*domain.User), args.Error(1)
}

func TestUserService_Register_Success(t *testing.T) {
    mockRepo := new(MockUserRepository)
    service := NewUserService(mockRepo)

    ctx := context.Background()
    email := "test@example.com"
    
    // Email doesn't exist
    mockRepo.On("FindByEmail", ctx, email).Return(nil, nil)
    mockRepo.On("Create", ctx, mock.AnythingOfType("*domain.User")).Return(nil)

    user, err := service.Register(ctx, email, "password123", "Test User")

    assert.NoError(t, err)
    assert.NotNil(t, user)
    assert.Equal(t, email, user.Email)
    mockRepo.AssertExpectations(t)
}
```

---

## Common Commands

```bash
# Run development server
make dev

# Build binary
make build

# Run tests
make test

# Run tests with coverage
make test-coverage

# Run linter
make lint

# Generate Swagger docs
make docs

# Run migrations
make migrate-up

# Docker compose up
docker-compose up -d
```

---

## Makefile

```makefile
.PHONY: dev build test lint docs migrate-up migrate-down

dev:
	go run cmd/api/main.go

build:
	go build -o bin/api cmd/api/main.go

test:
	go test ./... -v

test-coverage:
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out

lint:
	golangci-lint run

docs:
	swag init -g cmd/api/main.go -o api/docs

migrate-up:
	go run cmd/migrate/main.go up

migrate-down:
	go run cmd/migrate/main.go down

docker:
	docker-compose up -d

docker-down:
	docker-compose down
```

---

## Deployment

### Dockerfile

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/api .
EXPOSE 8080
CMD ["./api"]
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
      - DATABASE_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```
