# Gin API 开发模板

## 技术栈

- **Gin**: Go 高性能 Web 框架
- **GORM**: Go ORM 库
- **PostgreSQL/MySQL**: 关系型数据库
- **JWT-Go**: 身份认证
- **Validator**: 请求验证
- **Viper**: 配置管理
- **Zap**: 结构化日志
- **Air**: 热重载开发工具

## 项目结构

```
gin-api/
├── cmd/
│   └── server/
│       └── main.go           # 应用入口
├── internal/
│   ├── config/
│   │   └── config.go         # 配置加载
│   ├── handlers/
│   │   ├── auth.handler.go
│   │   ├── user.handler.go
│   │   └── post.handler.go
│   ├── middleware/
│   │   ├── auth.go           # JWT 验证
│   │   ├── cors.go           # CORS 配置
│   │   ├── logger.go         # 日志中间件
│   │   ├── ratelimit.go      # 限流
│   │   └── recovery.go       # 崩溃恢复
│   ├── models/
│   │   ├── user.go
│   │   ├── post.go
│   │   └── base.go
│   ├── repositories/
│   │   ├── user.repository.go
│   │   └── post.repository.go
│   ├── services/
│   │   ├── auth.service.go
│   │   └── user.service.go
│   ├── dto/
│   │   ├── auth.dto.go
│   │   └── user.dto.go
│   ├── routes/
│   │   └── routes.go
│   └── utils/
│       ├── response.go
│       ├── hash.go
│       └── jwt.go
├── pkg/
│   ├── database/
│   │   └── postgres.go
│   ├── logger/
│   │   └── zap.go
│   └── validator/
│       └── validator.go
├── migrations/
│   ├── 001_init.up.sql
│   └── 001_init.down.sql
├── tests/
│   ├── auth_test.go
│   └── setup_test.go
├── .air.toml                 # Air 配置
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── go.mod
└── go.sum
```

## 代码模式

### 应用入口

```go
// cmd/server/main.go
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"myapp/internal/config"
	"myapp/internal/routes"
	"myapp/pkg/database"
	"myapp/pkg/logger"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化日志
	log := logger.New(cfg.LogLevel)

	// 连接数据库
	db, err := database.NewPostgres(cfg.Database)
	if err != nil {
		log.Fatal("数据库连接失败", "error", err)
	}
	defer db.Close()

	// 自动迁移
	if err := db.AutoMigrate(); err != nil {
		log.Fatal("数据库迁移失败", "error", err)
	}

	// 创建 Gin 引擎
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())

	// 设置路由
	routes.Setup(router, db, log, cfg)

	// 启动服务器
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// 优雅关闭
	go func() {
		log.Info("服务器启动", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("服务器启动失败", "error", err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("正在关闭服务器...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("服务器强制关闭", "error", err)
	}

	log.Info("服务器已关闭")
}
```

### 配置管理

```go
// internal/config/config.go
package config

import (
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Env        string
	Port       int
	LogLevel   string
	Database   DatabaseConfig
	JWT        JWTConfig
	CORS       CORSConfig
	RateLimit  RateLimitConfig
}

type DatabaseConfig struct {
	Host            string
	Port            int
	User            string
	Password        string
	DBName          string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

type JWTConfig struct {
	Secret     string
	ExpireTime time.Duration
}

type CORSConfig struct {
	AllowOrigins []string
	AllowMethods []string
	AllowHeaders []string
}

type RateLimitConfig struct {
	Enabled bool
	Request int
	Window  time.Duration
}

func Load() *Config {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		panic("配置文件读取失败: " + err.Error())
	}

	return &Config{
		Env:      viper.GetString("ENV"),
		Port:     viper.GetInt("PORT"),
		LogLevel: viper.GetString("LOG_LEVEL"),
		Database: DatabaseConfig{
			Host:            viper.GetString("DB_HOST"),
			Port:            viper.GetInt("DB_PORT"),
			User:            viper.GetString("DB_USER"),
			Password:        viper.GetString("DB_PASSWORD"),
			DBName:          viper.GetString("DB_NAME"),
			SSLMode:         viper.GetString("DB_SSL_MODE"),
			MaxOpenConns:    viper.GetInt("DB_MAX_OPEN_CONNS"),
			MaxIdleConns:    viper.GetInt("DB_MAX_IDLE_CONNS"),
			ConnMaxLifetime: viper.GetDuration("DB_CONN_MAX_LIFETIME"),
		},
		JWT: JWTConfig{
			Secret:     viper.GetString("JWT_SECRET"),
			ExpireTime: viper.GetDuration("JWT_EXPIRE_TIME"),
		},
		CORS: CORSConfig{
			AllowOrigins: viper.GetStringSlice("CORS_ALLOW_ORIGINS"),
			AllowMethods: viper.GetStringSlice("CORS_ALLOW_METHODS"),
			AllowHeaders: viper.GetStringSlice("CORS_ALLOW_HEADERS"),
		},
		RateLimit: RateLimitConfig{
			Enabled: viper.GetBool("RATE_LIMIT_ENABLED"),
			Request: viper.GetInt("RATE_LIMIT_REQUEST"),
			Window:  viper.GetDuration("RATE_LIMIT_WINDOW"),
		},
	}
}
```

### 数据库连接

```go
// pkg/database/postgres.go
package database

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"myapp/internal/config"
	"myapp/internal/models"
)

type PostgresDB struct {
	*gorm.DB
}

func NewPostgres(cfg config.DatabaseConfig) (*PostgresDB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("数据库连接失败: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("获取数据库连接池失败: %w", err)
	}

	// 连接池配置
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	return &PostgresDB{db}, nil
}

func (db *PostgresDB) AutoMigrate() error {
	return db.DB.AutoMigrate(
		&models.User{},
		&models.Post{},
	)
}

func (db *PostgresDB) Close() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
```

### 模型定义

```go
// internal/models/base.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type Base struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
```

```go
// internal/models/user.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	Base
	Email         string    `gorm:"uniqueIndex;not null;size:255" json:"email"`
	Password      string    `gorm:"not null;size:255" json:"-"`
	Name          string    `gorm:"not null;size:100" json:"name"`
	Role          string    `gorm:"default:user;size:20" json:"role"`
	Avatar        string    `gorm:"size:500" json:"avatar,omitempty"`
	IsEmailVerified bool   `gorm:"default:false" json:"isEmailVerified"`
	Posts         []Post   `gorm:"foreignKey:AuthorID" json:"posts,omitempty"`
}

func (User) TableName() string {
	return "users"
}

// BeforeCreate 钩子
func (u *User) BeforeCreate(tx *gorm.DB) error {
	// 可以在这里进行密码加密等操作
	return nil
}
```

```go
// internal/models/post.go
package models

type Post struct {
	Base
	Title       string `gorm:"not null;size:200" json:"title"`
	Content     string `gorm:"not null;type:text" json:"content"`
	AuthorID    uint   `gorm:"not null;index" json:"authorId"`
	Author      User   `gorm:"foreignKey:AuthorID" json:"author"`
	Tags        string `gorm:"size:500" json:"tags,omitempty"`
	Likes       int    `gorm:"default:0" json:"likes"`
	IsPublished bool   `gorm:"default:false" json:"isPublished"`
}

func (Post) TableName() string {
	return "posts"
}
```

### 处理器 (Handler)

```go
// internal/handlers/auth.handler.go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"myapp/internal/dto"
	"myapp/internal/services"
	"myapp/internal/utils"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Register 用户注册
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	user, token, err := h.authService.Register(&req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "注册成功", gin.H{
		"user":  user,
		"token": token,
	})
}

// Login 用户登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "请求参数错误", err)
		return
	}

	user, token, err := h.authService.Login(&req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error(), nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "登录成功", gin.H{
		"user":  user,
		"token": token,
	})
}

// GetMe 获取当前用户
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID := c.GetString("userID")
	user, err := h.authService.GetMe(userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "用户不存在", nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "获取成功", user)
}
```

### 服务层

```go
// internal/services/auth.service.go
package services

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
	"myapp/internal/config"
	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/repositories"
	"myapp/internal/utils"
)

type AuthService struct {
	userRepo *repositories.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo *repositories.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (s *AuthService) Register(req *dto.RegisterRequest) (*models.User, string, error) {
	// 检查邮箱是否已存在
	exists, err := s.userRepo.ExistsByEmail(req.Email)
	if err != nil {
		return nil, "", err
	}
	if exists {
		return nil, "", errors.New("邮箱已被注册")
	}

	// 加密密码
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, "", err
	}

	// 创建用户
	user := &models.User{
		Email:    req.Email,
		Password: hashedPassword,
		Name:     req.Name,
		Role:     "user",
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, "", err
	}

	// 生成 token
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) Login(req *dto.LoginRequest) (*models.User, string, error) {
	// 查找用户
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("邮箱或密码错误")
		}
		return nil, "", err
	}

	// 验证密码
	if !utils.CheckPassword(req.Password, user.Password) {
		return nil, "", errors.New("邮箱或密码错误")
	}

	// 生成 token
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) GetMe(userID string) (*models.User, error) {
	return s.userRepo.FindByID(userID)
}

func (s *AuthService) generateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(s.cfg.JWT.ExpireTime).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWT.Secret))
}
```

### 仓储层

```go
// internal/repositories/user.repository.go
package repositories

import (
	"gorm.io/gorm"
	"myapp/internal/models"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id string) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, "id = ?", id).Error
	return &user, err
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) ExistsByEmail(email string) (bool, error) {
	var count int64
	err := r.db.Model(&models.User{}).Where("email = ?", email).Count(&count).Error
	return count > 0, err
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Delete(id string) error {
	return r.db.Delete(&models.User{}, "id = ?", id).Error
}
```

### 路由设置

```go
// internal/routes/routes.go
package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"myapp/internal/config"
	"myapp/internal/handlers"
	"myapp/internal/middleware"
	"myapp/internal/repositories"
	"myapp/internal/services"
	"myapp/pkg/logger"
)

func Setup(router *gin.Engine, db *gorm.DB, log *logger.Logger, cfg *config.Config) {
	// 依赖注入
	userRepo := repositories.NewUserRepository(db)
	authService := services.NewAuthService(userRepo, cfg)
	authHandler := handlers.NewAuthHandler(authService)

	// 中间件
	router.Use(middleware.CORS(cfg))
	router.Use(middleware.Logger(log))
	router.Use(middleware.Recovery(log))

	if cfg.RateLimit.Enabled {
		router.Use(middleware.RateLimit(cfg))
	}

	// API 路由组
	v1 := router.Group("/api/v1")
	{
		// 健康检查
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		// 认证路由
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.Auth(cfg), authHandler.GetMe)
		}

		// 用户路由（需要认证）
		users := v1.Group("/users")
		users.Use(middleware.Auth(cfg))
		{
			users.GET("/:id", authHandler.GetMe)
			users.PUT("/:id", authHandler.GetMe)
		}
	}
}
```

### 中间件

```go
// internal/middleware/auth.go
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"myapp/internal/config"
	"myapp/internal/utils"
)

func Auth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取 token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "请先登录", nil)
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

		// 验证 token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWT.Secret), nil
		})

		if err != nil || !token.Valid {
			utils.ErrorResponse(c, http.StatusUnauthorized, "认证失败", nil)
			c.Abort()
			return
		}

		// 获取用户 ID
		claims := token.Claims.(jwt.MapClaims)
		userID := claims["user_id"]

		c.Set("userID", userID)
		c.Next()
	}
}
```

```go
// internal/middleware/cors.go
package middleware

import (
	"github.com/gin-gonic/gin"
	"myapp/internal/config"
)

func CORS(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// 检查是否在允许列表中
		allowed := false
		for _, o := range cfg.CORS.AllowOrigins {
			if o == origin || o == "*" {
				allowed = true
				break
			}
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Methods", strings.Join(cfg.CORS.AllowMethods, ", "))
		c.Header("Access-Control-Allow-Headers", strings.Join(cfg.CORS.AllowHeaders, ", "))
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
```

```go
// internal/middleware/ratelimit.go
package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"myapp/internal/config"
	"myapp/internal/utils"
)

type RateLimiter struct {
	requests map[string]*ClientInfo
	mu       sync.RWMutex
}

type ClientInfo struct {
	count     int
	resetTime time.Time
}

func RateLimit(cfg *config.Config) gin.HandlerFunc {
	limiter := &RateLimiter{
		requests: make(map[string]*ClientInfo),
	}

	// 清理过期记录
	go func() {
		ticker := time.NewTicker(time.Minute)
		for range ticker.C {
			limiter.mu.Lock()
			for ip, info := range limiter.requests {
				if time.Now().After(info.resetTime) {
					delete(limiter.requests, ip)
				}
			}
			limiter.mu.Unlock()
		}
	}()

	return func(c *gin.Context) {
		ip := c.ClientIP()

		limiter.mu.Lock()
		defer limiter.mu.Unlock()

		info, exists := limiter.requests[ip]
		if !exists || time.Now().After(info.resetTime) {
			limiter.requests[ip] = &ClientInfo{
				count:     1,
				resetTime: time.Now().Add(cfg.RateLimit.Window),
			}
			c.Next()
			return
		}

		if info.count >= cfg.RateLimit.Request {
			utils.ErrorResponse(c, http.StatusTooManyRequests, "请求过于频繁", nil)
			c.Abort()
			return
		}

		info.count++
		c.Next()
	}
}
```

### DTO (数据传输对象)

```go
// internal/dto/auth.dto.go
package dto

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
```

### 工具函数

```go
// internal/utils/response.go
package utils

import (
	"github.com/gin-gonic/gin"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   interface{} `json:"error,omitempty"`
}

func SuccessResponse(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func ErrorResponse(c *gin.Context, statusCode int, message string, err interface{}) {
	c.JSON(statusCode, Response{
		Success: false,
		Message: message,
		Error:   err,
	})
}
```

```go
// internal/utils/hash.go
package utils

import (
	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
```

## 最佳实践

### 1. 分页查询

```go
// internal/utils/pagination.go
package utils

import (
	"gorm.io/gorm"
)

type Pagination struct {
	Page  int `form:"page" binding:"min=1"`
	Limit int `form:"limit" binding:"min=1,max=100"`
}

type PaginatedResult struct {
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	Total      int64       `json:"total"`
	TotalPages int         `json:"totalPages"`
}

func Paginate(db *gorm.DB, model interface{}, pagination *Pagination) (*PaginatedResult, error) {
	if pagination.Page == 0 {
		pagination.Page = 1
	}
	if pagination.Limit == 0 {
		pagination.Limit = 10
	}

	offset := (pagination.Page - 1) * pagination.Limit

	var total int64
	if err := db.Model(model).Count(&total).Error; err != nil {
		return nil, err
	}

	if err := db.Offset(offset).Limit(pagination.Limit).Find(model).Error; err != nil {
		return nil, err
	}

	return &PaginatedResult{
		Data:       model,
		Page:       pagination.Page,
		Limit:      pagination.Limit,
		Total:      total,
		TotalPages: int((total + int64(pagination.Limit) - 1) / int64(pagination.Limit)),
	}, nil
}
```

### 2. 事务处理

```go
// 使用事务
err := db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&user).Error; err != nil {
        return err
    }
    
    if err := tx.Create(&post).Error; err != nil {
        return err
    }
    
    return nil
})
```

### 3. 自定义验证

```go
// pkg/validator/validator.go
package validator

import (
	"regexp"

	"github.com/go-playground/validator/v10"
)

func SetupCustomValidators(v *validator.Validate) {
	v.RegisterValidation("phone", func(fl validator.FieldLevel) bool {
		phone := fl.Field().String()
		matched, _ := regexp.MatchString(`^1[3-9]\d{9}$`, phone)
		return matched
	})
}
```

## 常用命令

### 开发

```bash
# 初始化项目
go mod init myapp

# 安装依赖
go get -u github.com/gin-gonic/gin
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres
go get -u github.com/golang-jwt/jwt/v5
go get -u github.com/spf13/viper
go get -u go.uber.org/zap

# 开发模式（热重载）
air

# 运行
go run cmd/server/main.go

# 构建
go build -o bin/server cmd/server/main.go

# 测试
go test ./... -v

# 测试覆盖率
go test ./... -cover
```

### 数据库迁移

```bash
# 安装迁移工具
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# 创建迁移
migrate create -ext sql -dir migrations -seq init

# 运行迁移
migrate -database "postgres://user:pass@localhost:5432/dbname?sslmode=disable" -path migrations up

# 回滚
migrate -database "postgres://user:pass@localhost:5432/dbname?sslmode=disable" -path migrations down
```

## 部署配置

### Dockerfile

```dockerfile
# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装依赖
RUN apk add --no-cache git

# 复制 go.mod 和 go.sum
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/server/main.go

# 运行阶段
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# 从构建阶段复制二进制文件
COPY --from=builder /app/main .

# 暴露端口
EXPOSE 8080

# 运行
CMD ["./main"]
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
      - ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=password
      - DB_NAME=mydb
      - JWT_SECRET=your-secret-key
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### .air.toml (热重载配置)

```toml
root = "."
tmp_dir = "tmp"

[build]
cmd = "go build -o ./tmp/main cmd/server/main.go"
bin = "./tmp/main"
full_bin = "./tmp/main"
include_ext = ["go", "tpl", "tmpl", "html"]
exclude_dir = ["assets", "tmp", "vendor"]
delay = 1000

[log]
time = false

[color]
main = "magenta"
watcher = "cyan"
build = "yellow"
runner = "green"
```

### 环境变量

```env
# .env.example
ENV=development
PORT=8080
LOG_LEVEL=debug

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=mydb
DB_SSL_MODE=disable
DB_MAX_OPEN_CONNS=100
DB_MAX_IDLE_CONNS=10
DB_CONN_MAX_LIFETIME=1h

JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE_TIME=24h

CORS_ALLOW_ORIGINS=["http://localhost:3000"]
CORS_ALLOW_METHODS=["GET","POST","PUT","DELETE","OPTIONS"]
CORS_ALLOW_HEADERS=["Origin","Content-Type","Authorization"]

RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUEST=100
RATE_LIMIT_WINDOW=15m
```
