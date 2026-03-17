# HTMX + Gin 全栈应用模板

## 项目概述

使用 HTMX 和 Gin（Go）构建轻量级、高性能全栈应用的模板。HTMX 允许通过 HTML 属性直接实现 AJAX、CSS 过渡等现代 Web 功能，Gin 提供高性能的 Go HTTP 框架。

## 技术栈

### 前端
- **交互库**: HTMX 1.9+
- **样式**: Tailwind CSS / Alpine.js
- **模板引擎**: Go Templates / Templ
- **图标**: Heroicons / Lucide Icons

### 后端
- **语言**: Go 1.21+
- **框架**: Gin 1.9+
- **数据库**: PostgreSQL / SQLite / MySQL
- **ORM**: GORM / sqlc
- **缓存**: Redis
- **会话**: Gin Sessions
- **认证**: JWT / Session-based

### 工具
- **构建**: Make
- **热重载**: Air
- **测试**: Go Test
- **部署**: Docker / Kubernetes

## 项目结构

```
htmx-gin-app/
├── cmd/                      # 应用入口
│   └── server/
│       └── main.go          # 主程序
├── internal/                 # 内部代码
│   ├── handlers/            # HTTP 处理器
│   │   ├── home.go
│   │   ├── auth.go
│   │   ├── posts.go
│   │   └── api.go
│   ├── models/              # 数据模型
│   │   ├── user.go
│   │   ├── post.go
│   │   └── comment.go
│   ├── services/            # 业务逻辑
│   │   ├── auth.go
│   │   ├── post.go
│   │   └── email.go
│   ├── repository/          # 数据访问
│   │   ├── user.go
│   │   └── post.go
│   ├── middleware/          # 中间件
│   │   ├── auth.go
│   │   ├── csrf.go
│   │   └── logger.go
│   └── config/              # 配置
│       └── config.go
├── pkg/                      # 公共库
│   ├── validator/
│   ├── response/
│   └── utils/
├── templates/                # HTML 模板
│   ├── layouts/
│   │   └── base.html
│   ├── partials/            # 部分 HTML（HTMX 使用）
│   │   ├── navbar.html
│   │   ├── post-card.html
│   │   └── pagination.html
│   ├── pages/
│   │   ├── home.html
│   │   ├── login.html
│   │   ├── posts.html
│   │   └── post-detail.html
│   └── components/
│       ├── button.html
│       ├── form.html
│       └── alert.html
├── static/                   # 静态资源
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── htmx.min.js
│   │   ├── alpine.min.js
│   │   └── app.js
│   └── images/
├── migrations/               # 数据库迁移
│   ├── 001_init.up.sql
│   └── 001_init.down.sql
├── tests/                    # 测试
│   ├── handlers_test.go
│   └── services_test.go
├── .air.toml                 # Air 配置（热重载）
├── .env                      # 环境变量
├── Makefile                  # Make 命令
├── go.mod
├── go.sum
└── Dockerfile
```

## 代码模式

### 1. 应用入口

```go
// cmd/server/main.go
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	
	"htmx-gin-app/internal/config"
	"htmx-gin-app/internal/handlers"
	"htmx-gin-app/internal/middleware"
	"htmx-gin-app/internal/models"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	db, err := config.InitDB(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 自动迁移
	db.AutoMigrate(&models.User{}, &models.Post{}, &models.Comment{})

	// 创建 Gin 路由
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	
	r := gin.Default()

	// 加载模板
	r.LoadHTMLGlob("templates/**/*")

	// 静态文件
	r.Static("/static", "./static")

	// 中间件
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(cfg))
	r.Use(middleware.CSRF())

	// 初始化处理器
	h := handlers.New(db, cfg)

	// 路由
	setupRoutes(r, h)

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRoutes(r *gin.Engine, h *handlers.Handlers) {
	// 公开路由
	r.GET("/", h.Home)
	r.GET("/login", h.LoginPage)
	r.POST("/login", h.Login)
	r.GET("/register", h.RegisterPage)
	r.POST("/register", h.Register)
	
	// 博客路由
	r.GET("/posts", h.ListPosts)
	r.GET("/posts/:id", h.GetPost)
	
	// API 路由（HTMX）
	api := r.Group("/api")
	{
		api.GET("/posts", h.APIListPosts)
		api.GET("/posts/:id", h.APIGetPost)
		api.POST("/posts", h.APICreatePost)
		api.PUT("/posts/:id", h.APIUpdatePost)
		api.DELETE("/posts/:id", h.APIDeletePost)
		
		api.POST("/posts/:id/comments", h.APIAddComment)
		api.DELETE("/comments/:id", h.APIDeleteComment)
	}

	// 需要认证的路由
	auth := r.Group("/")
	auth.Use(middleware.AuthRequired())
	{
		auth.GET("/dashboard", h.Dashboard)
		auth.GET("/posts/new", h.NewPostPage)
		auth.POST("/posts", h.CreatePost)
		auth.GET("/posts/:id/edit", h.EditPostPage)
		auth.PUT("/posts/:id", h.UpdatePost)
		auth.DELETE("/posts/:id", h.DeletePost)
		auth.POST("/logout", h.Logout)
	}
}
```

### 2. 配置管理

```go
// internal/config/config.go
package config

import (
	"os"
	"strconv"
)

type Config struct {
	Environment string
	Port        string
	
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	App      AppConfig
}

type DatabaseConfig struct {
	Driver   string
	Host     string
	Port     int
	User     string
	Password string
	Name     string
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

type AppConfig struct {
	Name string
	URL  string
}

func Load() *Config {
	return &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("PORT", "8080"),
		
		Database: DatabaseConfig{
			Driver:   getEnv("DB_DRIVER", "postgres"),
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			Name:     getEnv("DB_NAME", "htmx_gin"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvAsInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "change-this-secret"),
			Expiration: getEnvAsInt("JWT_EXPIRATION", 168), // 7 days
		},
		
		App: AppConfig{
			Name: getEnv("APP_NAME", "HTMX + Gin App"),
			URL:  getEnv("APP_URL", "http://localhost:8080"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if int, err := strconv.Atoi(value); err == nil {
			return int
		}
	}
	return defaultValue
}

// InitDB 初始化数据库连接
func InitDB(cfg *Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%d sslmode=%s",
		cfg.Database.Host,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
		cfg.Database.Port,
		cfg.Database.SSLMode,
	)

	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}
```

### 3. 数据模型

```go
// internal/models/user.go
package models

import (
	"time"
	
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"`
	Name      string    `json:"name"`
	Avatar    string    `json:"avatar"`
	Bio       string    `json:"bio"`
	Role      string    `gorm:"default:user" json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Posts     []Post    `gorm:"foreignKey:AuthorID" json:"posts,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// internal/models/post.go
package models

import (
	"time"
	
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Post struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Slug        string    `gorm:"uniqueIndex;not null" json:"slug"`
	Content     string    `gorm:"type:text;not null" json:"content"`
	Excerpt     string    `json:"excerpt"`
	FeaturedImg string    `json:"featured_image"`
	Status      string    `gorm:"default:draft" json:"status"` // draft, published
	ViewCount   int       `gorm:"default:0" json:"view_count"`
	
	AuthorID    uuid.UUID `gorm:"type:uuid" json:"author_id"`
	Author      User      `gorm:"foreignKey:AuthorID" json:"author"`
	
	CategoryID  uuid.UUID `gorm:"type:uuid" json:"category_id"`
	Category    Category  `gorm:"foreignKey:CategoryID" json:"category"`
	
	Tags        []Tag     `gorm:"many2many:post_tags;" json:"tags"`
	Comments    []Comment `gorm:"foreignKey:PostID" json:"comments"`
	
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (p *Post) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// internal/models/comment.go
package models

import (
	"time"
	
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Comment struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	PostID    uuid.UUID `gorm:"type:uuid;not null" json:"post_id"`
	Post      Post      `gorm:"foreignKey:PostID" json:"-"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	CreatedAt time.Time `json:"created_at"`
}

func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
```

### 4. 处理器

```go
// internal/handlers/home.go
package handlers

import (
	"net/http"
	
	"github.com/gin-gonic/gin"
)

func (h *Handlers) Home(c *gin.Context) {
	// 获取最新的已发布文章
	posts, err := h.postService.GetPublishedPosts(1, 6)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"error": "Failed to load posts",
		})
		return
	}

	c.HTML(http.StatusOK, "home.html", gin.H{
		"title": "Home",
		"posts": posts,
		"user":  h.getCurrentUser(c),
	})
}

// internal/handlers/posts.go
package handlers

import (
	"net/http"
	"strconv"
	
	"github.com/gin-gonic/gin"
)

// ListPosts 显示文章列表
func (h *Handlers) ListPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	posts, err := h.postService.GetPublishedPosts(page, 10)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"error": "Failed to load posts",
		})
		return
	}

	// 检查是否是 HTMX 请求
	if c.GetHeader("HX-Request") == "true" {
		// 返回部分 HTML
		c.HTML(http.StatusOK, "partials/post-list.html", gin.H{
			"posts": posts,
			"page":  page,
		})
	} else {
		// 返回完整页面
		c.HTML(http.StatusOK, "posts.html", gin.H{
			"title": "Posts",
			"posts": posts,
			"page":  page,
			"user":  h.getCurrentUser(c),
		})
	}
}

// GetPost 显示文章详情
func (h *Handlers) GetPost(c *gin.Context) {
	postID := c.Param("id")
	
	post, err := h.postService.GetPostByID(postID)
	if err != nil {
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"error": "Post not found",
		})
		return
	}

	// 增加浏览次数
	go h.postService.IncrementViewCount(postID)

	c.HTML(http.StatusOK, "post-detail.html", gin.H{
		"title": post.Title,
		"post":  post,
		"user":  h.getCurrentUser(c),
	})
}

// APIListPosts API 获取文章列表
func (h *Handlers) APIListPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	
	posts, err := h.postService.GetPublishedPosts(page, 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 返回 HTML 片段
	c.HTML(http.StatusOK, "partials/post-cards.html", gin.H{
		"posts": posts,
	})
}

// APICreatePost API 创建文章
func (h *Handlers) APICreatePost(c *gin.Context) {
	var input struct {
		Title       string `json:"title" binding:"required"`
		Content     string `json:"content" binding:"required"`
		Excerpt     string `json:"excerpt"`
		CategoryID  string `json:"category_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := h.getCurrentUser(c)
	
	post, err := h.postService.CreatePost(input.Title, input.Content, input.Excerpt, input.CategoryID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 返回新创建的文章卡片
	c.HTML(http.StatusCreated, "partials/post-card.html", gin.H{
		"post": post,
	})
}

// APIAddComment API 添加评论
func (h *Handlers) APIAddComment(c *gin.Context) {
	postID := c.Param("id")
	
	var input struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := h.getCurrentUser(c)
	
	comment, err := h.postService.AddComment(postID, user.ID, input.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 返回新评论的 HTML
	c.HTML(http.StatusCreated, "partials/comment.html", gin.H{
		"comment": comment,
	})
}

// APIDeleteComment API 删除评论
func (h *Handlers) APIDeleteComment(c *gin.Context) {
	commentID := c.Param("id")
	
	user := h.getCurrentUser(c)
	
	if err := h.postService.DeleteComment(commentID, user.ID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	// 返回空响应，HTMX 会自动移除元素
	c.Status(http.StatusOK)
}

// internal/handlers/auth.go
package handlers

import (
	"net/http"
	
	"github.com/gin-gonic/gin"
)

func (h *Handlers) LoginPage(c *gin.Context) {
	c.HTML(http.StatusOK, "login.html", gin.H{
		"title": "Login",
	})
}

func (h *Handlers) Login(c *gin.Context) {
	var input struct {
		Email    string `form:"email" binding:"required,email"`
		Password string `form:"password" binding:"required"`
	}

	if err := c.ShouldBind(&input); err != nil {
		c.HTML(http.StatusBadRequest, "login.html", gin.H{
			"error": "Invalid input",
		})
		return
	}

	user, token, err := h.authService.Login(input.Email, input.Password)
	if err != nil {
		c.HTML(http.StatusUnauthorized, "login.html", gin.H{
			"error": "Invalid credentials",
			"email": input.Email,
		})
		return
	}

	// 设置 cookie
	c.SetCookie("token", token, 3600*24*7, "/", "", false, true)

	// HTMX 重定向
	c.Header("HX-Redirect", "/dashboard")
	c.Status(http.StatusOK)
}

func (h *Handlers) RegisterPage(c *gin.Context) {
	c.HTML(http.StatusOK, "register.html", gin.H{
		"title": "Register",
	})
}

func (h *Handlers) Register(c *gin.Context) {
	var input struct {
		Username string `form:"username" binding:"required"`
		Email    string `form:"email" binding:"required,email"`
		Password string `form:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBind(&input); err != nil {
		c.HTML(http.StatusBadRequest, "register.html", gin.H{
			"error": "Invalid input",
		})
		return
	}

	user, err := h.authService.Register(input.Username, input.Email, input.Password)
	if err != nil {
		c.HTML(http.StatusBadRequest, "register.html", gin.H{
			"error": err.Error(),
		})
		return
	}

	// 自动登录
	_, token, _ := h.authService.Login(input.Email, input.Password)
	c.SetCookie("token", token, 3600*24*7, "/", "", false, true)

	// HTMX 重定向
	c.Header("HX-Redirect", "/dashboard")
	c.Status(http.StatusOK)
}

func (h *Handlers) Logout(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.Header("HX-Redirect", "/")
	c.Status(http.StatusOK)
}
```

### 5. HTML 模板

```html
<!-- templates/layouts/base.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ .title }} | HTMX + Gin App</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- HTMX -->
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    
    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <style>
        /* HTMX 指示器 */
        .htmx-request .htmx-indicator {
            display: inline-block;
        }
        .htmx-request .htmx-hide {
            display: none;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- 导航栏 -->
    {{ template "navbar" . }}
    
    <!-- 主要内容 -->
    <main class="container mx-auto px-4 py-8">
        {{ template "content" . }}
    </main>
    
    <!-- 页脚 -->
    {{ template "footer" . }}
    
    <!-- Toast 通知 -->
    <div id="toast" class="fixed bottom-4 right-4 hidden"></div>
    
    <!-- HTMX 配置 -->
    <script>
        htmx.config.includeIndicatorClasses = true;
        
        // 显示通知
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            toast.innerHTML = `
                <div class="bg-${type === 'success' ? 'green' : 'red'}-500 text-white px-6 py-3 rounded-lg shadow-lg">
                    ${message}
                </div>
            `;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3000);
        }
        
        // HTMX 事件监听
        document.body.addEventListener('htmx:responseError', function(evt) {
            showToast('An error occurred', 'error');
        });
    </script>
</body>
</html>

<!-- templates/partials/navbar.html -->
{{ define "navbar" }}
<nav class="bg-white shadow-sm">
    <div class="container mx-auto px-4">
        <div class="flex justify-between h-16">
            <div class="flex items-center">
                <a href="/" class="text-xl font-bold text-gray-900">HTMX + Gin</a>
                
                <div class="ml-10 flex space-x-4">
                    <a href="/" class="text-gray-700 hover:text-gray-900">Home</a>
                    <a href="/posts" class="text-gray-700 hover:text-gray-900">Posts</a>
                    <a href="/about" class="text-gray-700 hover:text-gray-900">About</a>
                </div>
            </div>
            
            <div class="flex items-center space-x-4">
                {{ if .user }}
                    <a href="/dashboard" class="text-gray-700 hover:text-gray-900">Dashboard</a>
                    <button 
                        hx-post="/logout"
                        hx-swap="none"
                        class="text-gray-700 hover:text-gray-900"
                    >
                        Logout
                    </button>
                {{ else }}
                    <a href="/login" class="text-gray-700 hover:text-gray-900">Login</a>
                    <a href="/register" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Register</a>
                {{ end }}
            </div>
        </div>
    </div>
</nav>
{{ end }}

<!-- templates/partials/post-card.html -->
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
    <img 
        src="{{ if .post.FeaturedImg }}{{ .post.FeaturedImg }}{{ else }}https://via.placeholder.com/400x200{{ end }}"
        alt="{{ .post.Title }}"
        class="w-full h-48 object-cover"
    >
    
    <div class="p-6">
        <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600">{{ .post.Category.Name }}</span>
            <span class="text-sm text-gray-600">{{ .post.CreatedAt.Format "Jan 02, 2006" }}</span>
        </div>
        
        <h3 class="text-xl font-semibold mb-2">
            <a href="/posts/{{ .post.ID }}" class="hover:text-blue-600">
                {{ .post.Title }}
            </a>
        </h3>
        
        <p class="text-gray-600 text-sm mb-4">
            {{ if .post.Excerpt }}
                {{ .post.Excerpt }}
            {{ else }}
                {{ .post.Content | truncate 150 }}
            {{ end }}
        </p>
        
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <img 
                    src="{{ if .post.Author.Avatar }}{{ .post.Author.Avatar }}{{ else }}https://via.placeholder.com/32{{ end }}"
                    alt="{{ .post.Author.Name }}"
                    class="w-8 h-8 rounded-full"
                >
                <span class="text-sm text-gray-700">{{ .post.Author.Name }}</span>
            </div>
            
            <div class="flex items-center space-x-2 text-sm text-gray-600">
                <span>{{ .post.ViewCount }} views</span>
            </div>
        </div>
    </div>
</div>

<!-- templates/partials/pagination.html -->
<div class="flex items-center justify-center space-x-2 mt-8" id="pagination">
    {{ if gt .page 1 }}
    <button 
        hx-get="/api/posts?page={{ sub .page 1 }}"
        hx-target="#post-list"
        hx-swap="innerHTML transition:true"
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
    >
        Previous
    </button>
    {{ end }}
    
    <span class="text-gray-600">Page {{ .page }}</span>
    
    <button 
        hx-get="/api/posts?page={{ add .page 1 }}"
        hx-target="#post-list"
        hx-swap="innerHTML transition:true"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
        Next
    </button>
</div>

<!-- templates/pages/posts.html -->
{{ define "content" }}
<div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold">Posts</h1>
        
        {{ if .user }}
        <a href="/posts/new" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Create Post
        </a>
        {{ end }}
    </div>
    
    <!-- 文章列表（支持 HTMX 更新） -->
    <div id="post-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {{ range .posts }}
            {{ template "post-card" (dict "post" .) }}
        {{ end }}
    </div>
    
    <!-- 分页 -->
    {{ template "pagination" . }}
</div>
{{ end }}

<!-- templates/pages/post-detail.html -->
{{ define "content" }}
<article class="max-w-4xl mx-auto">
    <!-- 文章头部 -->
    <header class="mb-8">
        <div class="flex items-center space-x-2 mb-4">
            <span class="text-sm text-gray-600">{{ .post.Category.Name }}</span>
            <span class="text-sm text-gray-600">•</span>
            <span class="text-sm text-gray-600">{{ .post.CreatedAt.Format "January 02, 2006" }}</span>
        </div>
        
        <h1 class="text-4xl font-bold mb-4">{{ .post.Title }}</h1>
        
        <div class="flex items-center space-x-4">
            <img 
                src="{{ if .post.Author.Avatar }}{{ .post.Author.Avatar }}{{ else }}https://via.placeholder.com/48{{ end }}"
                alt="{{ .post.Author.Name }}"
                class="w-12 h-12 rounded-full"
            >
            <div>
                <p class="font-semibold">{{ .post.Author.Name }}</p>
                <p class="text-sm text-gray-600">{{ .post.ViewCount }} views</p>
            </div>
        </div>
    </header>
    
    <!-- 特色图片 -->
    {{ if .post.FeaturedImg }}
    <img 
        src="{{ .post.FeaturedImg }}"
        alt="{{ .post.Title }}"
        class="w-full h-96 object-cover rounded-lg mb-8"
    >
    {{ end }}
    
    <!-- 文章内容 -->
    <div class="prose max-w-none mb-12">
        {{ .post.Content | safeHTML }}
    </div>
    
    <!-- 标签 -->
    <div class="flex flex-wrap gap-2 mb-12">
        {{ range .post.Tags }}
        <span class="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
            #{{ .Name }}
        </span>
        {{ end }}
    </div>
    
    <!-- 评论区 -->
    <section class="border-t pt-8">
        <h2 class="text-2xl font-bold mb-6">Comments ({{ len .post.Comments }})</h2>
        
        <!-- 评论表单 -->
        {{ if .user }}
        <form 
            hx-post="/api/posts/{{ .post.ID }}/comments"
            hx-target="#comments-list"
            hx-swap="beforeend"
            class="mb-8"
            _="on htmx:afterRequest reset() me"
        >
            <textarea 
                name="content"
                rows="3"
                placeholder="Write a comment..."
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            ></textarea>
            
            <button 
                type="submit"
                class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                <span class="htmx-indicator">Posting...</span>
                <span class="htmx-hide">Post Comment</span>
            </button>
        </form>
        {{ else }}
        <p class="mb-8 text-gray-600">
            <a href="/login" class="text-blue-500 hover:underline">Login</a> to comment.
        </p>
        {{ end }}
        
        <!-- 评论列表 -->
        <div id="comments-list" class="space-y-4">
            {{ range .post.Comments }}
                {{ template "comment" (dict "comment" . "user" $.user) }}
            {{ end }}
        </div>
    </section>
</article>
{{ end }}

<!-- templates/partials/comment.html -->
<div class="bg-gray-50 p-4 rounded-lg" id="comment-{{ .comment.ID }}">
    <div class="flex items-start space-x-4">
        <img 
            src="{{ if .comment.User.Avatar }}{{ .comment.User.Avatar }}{{ else }}https://via.placeholder.com/40{{ end }}"
            alt="{{ .comment.User.Name }}"
            class="w-10 h-10 rounded-full"
        >
        
        <div class="flex-1">
            <div class="flex items-center justify-between mb-2">
                <div>
                    <span class="font-semibold">{{ .comment.User.Name }}</span>
                    <span class="text-sm text-gray-600 ml-2">
                        {{ .comment.CreatedAt.Format "Jan 02, 2006 15:04" }}
                    </span>
                </div>
                
                {{ if eq .user.ID .comment.UserID }}
                <button 
                    hx-delete="/api/comments/{{ .comment.ID }}"
                    hx-target="#comment-{{ .comment.ID }}"
                    hx-swap="outerHTML"
                    hx-confirm="Are you sure you want to delete this comment?"
                    class="text-red-500 hover:text-red-700 text-sm"
                >
                    Delete
                </button>
                {{ end }}
            </div>
            
            <p class="text-gray-700">{{ .comment.Content }}</p>
        </div>
    </div>
</div>
```

### 6. 中间件

```go
// internal/middleware/auth.go
package middleware

import (
	"net/http"
	"strings"
	
	"github.com/gin-gonic/gin"
	
	"htmx-gin-app/internal/services"
)

func AuthRequired(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从 cookie 获取 token
		token, err := c.Cookie("token")
		if err != nil {
			// HTMX 重定向到登录页
			if c.GetHeader("HX-Request") == "true" {
				c.Header("HX-Redirect", "/login")
				c.Abort()
				return
			}
			
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return
		}

		// 验证 token
		userID, err := authService.ValidateToken(token)
		if err != nil {
			c.SetCookie("token", "", -1, "/", "", false, true)
			
			if c.GetHeader("HX-Request") == "true" {
				c.Header("HX-Redirect", "/login")
				c.Abort()
				return
			}
			
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return
		}

		// 将用户 ID 存储到上下文
		c.Set("userID", userID)
		c.Next()
	}
}

// internal/middleware/csrf.go
package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/utrack/gin-csrf"
)

func CSRF() gin.HandlerFunc {
	return csrf.Middleware(csrf.Options{
		Secret: "csrf-secret-key",
		ErrorFunc: func(c *gin.Context) {
			c.String(400, "CSRF token mismatch")
			c.Abort()
		},
	})
}

// internal/middleware/logger.go
package middleware

import (
	"time"
	
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func Logger() gin.HandlerFunc {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	
	return func(c *gin.Context) {
		startTime := time.Now()
		
		c.Next()
		
		latency := time.Since(startTime)
		
		logger.WithFields(logrus.Fields{
			"status":     c.Writer.Status(),
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"latency":    latency,
			"client_ip":  c.ClientIP(),
			"user_agent": c.Request.UserAgent(),
		}).Info("Request")
	}
}
```

### 7. 服务层

```go
// internal/services/post.go
package services

import (
	"errors"
	
	"github.com/google/uuid"
	"gorm.io/gorm"
	
	"htmx-gin-app/internal/models"
	"htmx-gin-app/internal/repository"
)

type PostService struct {
	postRepo *repository.PostRepository
}

func NewPostService(postRepo *repository.PostRepository) *PostService {
	return &PostService{postRepo: postRepo}
}

func (s *PostService) GetPublishedPosts(page, limit int) ([]models.Post, error) {
	offset := (page - 1) * limit
	return s.postRepo.GetPublished(offset, limit)
}

func (s *PostService) GetPostByID(id string) (*models.Post, error) {
	return s.postRepo.GetByID(id)
}

func (s *PostService) CreatePost(title, content, excerpt, categoryID, authorID string) (*models.Post, error) {
	post := &models.Post{
		Title:      title,
		Slug:       generateSlug(title),
		Content:    content,
		Excerpt:    excerpt,
		Status:     "published",
		AuthorID:   uuid.MustParse(authorID),
		CategoryID: uuid.MustParse(categoryID),
	}
	
	if err := s.postRepo.Create(post); err != nil {
		return nil, err
	}
	
	return post, nil
}

func (s *PostService) AddComment(postID, userID, content string) (*models.Comment, error) {
	comment := &models.Comment{
		Content: content,
		PostID:  uuid.MustParse(postID),
		UserID:  uuid.MustParse(userID),
	}
	
	if err := s.postRepo.AddComment(comment); err != nil {
		return nil, err
	}
	
	return comment, nil
}

func (s *PostService) DeleteComment(commentID, userID string) error {
	comment, err := s.postRepo.GetCommentByID(commentID)
	if err != nil {
		return err
	}
	
	// 检查权限
	if comment.UserID.String() != userID {
		return errors.New("unauthorized")
	}
	
	return s.postRepo.DeleteComment(commentID)
}

func (s *PostService) IncrementViewCount(postID string) {
	s.postRepo.IncrementViewCount(postID)
}

func generateSlug(title string) string {
	// 实现slug生成逻辑
	return strings.ToLower(strings.ReplaceAll(title, " ", "-"))
}

// internal/services/auth.go
package services

import (
	"errors"
	"time"
	
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	
	"htmx-gin-app/internal/models"
	"htmx-gin-app/internal/repository"
)

type AuthService struct {
	userRepo   *repository.UserRepository
	jwtSecret  string
	jwtExpiry  int
}

func NewAuthService(userRepo *repository.UserRepository, jwtSecret string, jwtExpiry int) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
		jwtExpiry: jwtExpiry,
	}
}

func (s *AuthService) Register(username, email, password string) (*models.User, error) {
	// 检查邮箱是否已存在
	if _, err := s.userRepo.GetByEmail(email); err == nil {
		return nil, errors.New("email already exists")
	}
	
	// 检查用户名是否已存在
	if _, err := s.userRepo.GetByUsername(username); err == nil {
		return nil, errors.New("username already exists")
	}
	
	// 哈希密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	
	user := &models.User{
		Username: username,
		Email:    email,
		Password: string(hashedPassword),
		Name:     username,
		Role:     "user",
	}
	
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}
	
	return user, nil
}

func (s *AuthService) Login(email, password string) (*models.User, string, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}
	
	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}
	
	// 生成 JWT
	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, "", err
	}
	
	return user, token, nil
}

func (s *AuthService) ValidateToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})
	
	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}
	
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid token claims")
	}
	
	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", errors.New("invalid user id in token")
	}
	
	return userID, nil
}

func (s *AuthService) generateToken(userID uuid.UUID) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     time.Now().Add(time.Hour * time.Duration(s.jwtExpiry)).Unix(),
		"iat":     time.Now().Unix(),
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
```

## 最佳实践

### 1. HTMX 模式

```html
<!-- 加载指示器 -->
<button 
    hx-post="/api/posts"
    hx-target="#post-list"
    class="btn"
>
    <span class="htmx-indicator">Loading...</span>
    <span class="htmx-hide">Load Posts</span>
</button>

<!-- 确认对话框 -->
<button 
    hx-delete="/api/posts/123"
    hx-confirm="Are you sure you want to delete this post?"
>
    Delete
</button>

<!-- 加载更多（无限滚动） -->
<div 
    hx-get="/api/posts?page=2"
    hx-trigger="revealed"
    hx-swap="beforeend"
    hx-target="#post-list"
>
    Loading more...
</div>

<!-- 实时搜索 -->
<input 
    type="search"
    hx-get="/api/search"
    hx-trigger="keyup changed delay:500ms"
    hx-target="#search-results"
    name="q"
    placeholder="Search..."
>

<!-- 表单提交 -->
<form 
    hx-post="/api/posts"
    hx-target="#post-list"
    hx-swap="beforeend"
    _="on htmx:afterRequest reset() me"
>
    <input type="text" name="title" required>
    <textarea name="content" required></textarea>
    <button type="submit">Create</button>
</form>

<!-- 轮询更新 -->
<div 
    hx-get="/api/notifications"
    hx-trigger="every 30s"
    hx-swap="innerHTML"
>
    Loading notifications...
</div>

<!-- WebSocket -->
<div 
    hx-ws="connect:/ws/chat"
    hx-swap="beforeend"
>
    <!-- 消息会实时添加到这里 -->
</div>

<!-- 服务器发送事件 -->
<div 
    hx-ext="sse"
    sse-connect="/api/events"
    sse-swap="message"
    hx-swap="beforeend"
>
    <!-- 事件消息 -->
</div>
```

### 2. 错误处理

```go
// 自定义错误页面
func (h *Handlers) handleError(c *gin.Context, statusCode int, message string) {
	if c.GetHeader("HX-Request") == "true" {
		// 返回错误片段
		c.HTML(statusCode, "partials/error.html", gin.H{
			"error": message,
		})
	} else {
		// 返回完整错误页面
		c.HTML(statusCode, "error.html", gin.H{
			"title": "Error",
			"error": message,
		})
	}
}
```

```html
<!-- 错误提示片段 -->
<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <span class="block sm:inline">{{ .error }}</span>
    <button 
        class="absolute top-0 bottom-0 right-0 px-4 py-3"
        onclick="this.parentElement.remove()"
    >
        <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
        </svg>
    </button>
</div>
```

### 3. 性能优化

```go
// 使用缓存
func (h *Handlers) ListPosts(c *gin.Context) {
	cacheKey := fmt.Sprintf("posts_page_%s", c.Query("page"))
	
	// 尝试从缓存获取
	cached, err := h.cache.Get(cacheKey)
	if err == nil {
		c.Data(http.StatusOK, "text/html", cached)
		return
	}
	
	// 从数据库获取
	posts, err := h.postService.GetPublishedPosts(page, 10)
	if err != nil {
		h.handleError(c, http.StatusInternalServerError, "Failed to load posts")
		return
	}
	
	// 渲染模板
	var buf bytes.Buffer
	if err := h.templates.ExecuteTemplate(&buf, "partials/post-list.html", gin.H{
		"posts": posts,
	}); err != nil {
		h.handleError(c, http.StatusInternalServerError, "Failed to render template")
		return
	}
	
	// 缓存结果
	h.cache.Set(cacheKey, buf.Bytes(), 5*time.Minute)
	
	c.Data(http.StatusOK, "text/html", buf.Bytes())
}
```

### 4. 安全措施

```go
// 输入验证
type CreatePostInput struct {
	Title    string `json:"title" binding:"required,min=5,max=200"`
	Content  string `json:"content" binding:"required,min=50"`
	Excerpt  string `json:"excerpt" binding:"max=300"`
}

func (h *Handlers) APICreatePost(c *gin.Context) {
	var input CreatePostInput
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// 清理 HTML
	input.Title = sanitize.HTML(input.Title)
	input.Content = sanitize.HTML(input.Content)
	
	// ... 创建文章
}

// CSRF 保护
func (h *Handlers) renderForm(c *gin.Context) {
	c.HTML(http.StatusOK, "form.html", gin.H{
		"csrfToken": csrf.GetToken(c),
	})
}
```

```html
<!-- 表单中包含 CSRF token -->
<form hx-post="/api/posts">
    <input type="hidden" name="_csrf" value="{{ .csrfToken }}">
    <!-- 其他字段 -->
</form>
```

## 常用命令

```bash
# 开发
make run              # 运行开发服务器
make build            # 构建生产版本
make test             # 运行测试
make migrate-up       # 运行数据库迁移
make migrate-down     # 回滚迁移

# 热重载
air                   # 使用 Air 热重载

# 数据库
make db-create        # 创建数据库
make db-drop          # 删除数据库
make db-migrate       # 运行迁移
make db-seed          # 填充数据

# Docker
docker-compose up     # 启动服务
docker-compose down   # 停止服务
docker-compose build  # 构建镜像
```

## 部署配置

### Docker 部署

```dockerfile
# Dockerfile
# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装依赖
RUN apk add --no-cache git

# 复制 go mod 文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

# 运行阶段
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# 从构建阶段复制二进制文件
COPY --from=builder /app/main .
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/static ./static

EXPOSE 8080

CMD ["./main"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=password
      - DB_NAME=htmx_gin
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./templates:/root/templates
      - ./static:/root/static
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=htmx_gin
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes 部署

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: htmx-gin-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: htmx-gin
  template:
    metadata:
      labels:
        app: htmx-gin
    spec:
      containers:
      - name: app
        image: htmx-gin-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          value: "postgres-service"
        - name: DB_PORT
          value: "5432"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        - name: DB_NAME
          value: "htmx_gin"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: htmx-gin-service
spec:
  selector:
    app: htmx-gin
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

### Makefile

```makefile
# Makefile
.PHONY: run build test migrate-up migrate-down db-create db-drop

APP_NAME=htmx-gin-app
VERSION=1.0.0
BUILD_DIR=build

run:
	go run cmd/server/main.go

build:
	go build -o $(BUILD_DIR)/$(APP_NAME) cmd/server/main.go

test:
	go test ./... -v

migrate-up:
	migrate -path migrations -database "postgres://postgres:password@localhost:5432/htmx_gin?sslmode=disable" up

migrate-down:
	migrate -path migrations -database "postgres://postgres:password@localhost:5432/htmx_gin?sslmode=disable" down

db-create:
	createdb -h localhost -U postgres htmx_gin

db-drop:
	dropdb -h localhost -U postgres htmx_gin

docker-build:
	docker build -t $(APP_NAME):$(VERSION) .

docker-run:
	docker-compose up -d

docker-stop:
	docker-compose down

clean:
	rm -rf $(BUILD_DIR)
```

## 参考资源

- [HTMX 官方文档](https://htmx.org/)
- [HTMX 示例](https://htmx.org/examples/)
- [Gin 框架文档](https://gin-gonic.com/docs/)
- [GORM 文档](https://gorm.io/docs/)
- [Go Templates 文档](https://pkg.go.dev/html/template)
- [Alpine.js 文档](https://alpinejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
