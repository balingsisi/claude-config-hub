# Caddy Web 服务器模板

## 技术栈

- **核心**: Caddy 2.x
- **配置语言**: Caddyfile (原生) / JSON (API)
- **自动 HTTPS**: Let's Encrypt / ZeroSSL
- **反向代理**: HTTP/1.1, HTTP/2, HTTP/3 (QUIC)
- **负载均衡**: 多种策略
- **模板引擎**: Caddy Templates

## 项目结构

```
caddy-project/
├── Caddyfile                # Caddy 配置文件
├── caddy.json               # JSON 配置（可选）
├── static/                  # 静态文件
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── images/
├── api/                     # API 反向代理
├── logs/                    # 日志目录
│   ├── access.log
│   └── error.log
├── certs/                   # SSL 证书（可选）
├── sites/                   # 多站点配置
│   ├── site1.caddyfile
│   └── site2.caddyfile
├── docker-compose.yml
└── .env
```

## 代码模式

### 基础 Caddyfile

```caddyfile
# Caddyfile - 基础配置
{
  # 全局配置
  email admin@example.com
  acme_ca https://acme-v02.api.letsencrypt.org/directory
  # 测试环境
  # acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
}

# 单站点配置
example.com {
  # 根目录
  root * /var/www/html
  
  # 静态文件服务
  file_server browse
  
  # 日志
  log {
    output file /var/log/caddy/access.log
    format json
  }
  
  # 编码
  encode gzip zstd
  
  # PHP-FPM（如果需要）
  # php_fastcgi unix//run/php/php-fpm.sock
  
  # 自定义错误页
  handle_errors {
    @404 {
      expression {http.error.status_code} == 404
    }
    rewrite @404 /404.html
    file_server
  }
}

# 重定向 www 到非 www
www.example.com {
  redir https://example.com{uri} permanent
}
```

### 反向代理配置

```caddyfile
# API 反向代理
api.example.com {
  # 基础反向代理
  reverse_proxy localhost:3000
  
  # 日志
  log {
    output file /var/log/caddy/api.log
    format json
  }
  
  # 安全头
  header {
    # 移除服务器信息
    -Server
    # 安全头
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    X-XSS-Protection "1; mode=block"
    Referrer-Policy "strict-origin-when-cross-origin"
    Content-Security-Policy "default-src 'self'"
  }
}

# 多个后端负载均衡
app.example.com {
  reverse_proxy {
    # 负载均衡策略
    lb_policy round_robin
    # lb_policy least_conn
    # lb_policy ip_hash
    # lb_policy random
    
    # 后端服务器
    to localhost:3001
    to localhost:3002
    to localhost:3003
    
    # 健康检查
    health_uri /health
    health_interval 10s
    health_timeout 5s
    
    # 失败重试
    fail_duration 30s
    max_fails 3
    
    # 头部转发
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
  }
}

# WebSocket 代理
ws.example.com {
  reverse_proxy localhost:8080 {
    # WebSocket 支持
    header_up Connection {>Connection}
    header_up Upgrade {>Upgrade}
  }
}
```

### 静态网站配置

```caddyfile
# 静态网站
static.example.com {
  root * /var/www/static
  
  # 文件服务器
  file_server {
    # 启用浏览
    browse
    # 预压缩文件
    precompressed gzip br zstd
  }
  
  # 编码
  encode gzip zstd br
  
  # 缓存控制
  @static {
    path *.css *.js *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2 *.ttf
  }
  header @static Cache-Control "public, max-age=31536000, immutable"
  
  # HTML 不缓存
  @html {
    path *.html
  }
  header @html Cache-Control "no-cache, no-store, must-revalidate"
  
  # 自定义 404
  handle_errors {
    @404 {
      expression {http.error.status_code} == 404
    }
    rewrite @404 /404.html
    file_server
  }
}

# SPA 应用（单页应用）
spa.example.com {
  root * /var/www/spa
  
  # 尝试文件，回退到 index.html
  try_files {path} /index.html
  
  file_server
  
  # 编码
  encode gzip zstd br
  
  # 静态资源缓存
  @assets {
    path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2
  }
  header @assets Cache-Control "public, max-age=31536000, immutable"
  
  # HTML 不缓存
  @html path *.html
  header @html Cache-Control "no-cache, no-store, must-revalidate"
}
```

### API 网关配置

```caddyfile
# API 网关
gateway.example.com {
  # 用户服务
  handle /api/users/* {
    reverse_proxy user-service:3001 {
      # 去掉前缀
      handle_path /api/users/* {
        reverse_proxy user-service:3001
      }
    }
  }
  
  # 订单服务
  handle /api/orders/* {
    reverse_proxy order-service:3002
  }
  
  # 产品服务
  handle /api/products/* {
    reverse_proxy product-service:3003
  }
  
  # GraphQL
  handle /graphql {
    reverse_proxy graphql-service:4000
  }
  
  # 限流
  rate_limit {
    zone dynamic {
      key {remote_host}
      events 100
      window 1m
    }
  }
  
  # CORS
  @api path /api/*
  header @api {
    Access-Control-Allow-Origin *
    Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers "Content-Type, Authorization"
  }
  
  # OPTIONS 预检请求
  @options method OPTIONS
  respond @options 204
}
```

### 带认证的配置

```caddyfile
# 基础认证
protected.example.com {
  # 基础认证
  basicauth {
    # 用户: 密码（使用 caddy hash-password 生成）
    admin $2a$14$ZkD9hGbQ6ZcFgNlCqFJbAO3F7hH9nQcQj7pQ9kM6vWZLqGzR8XKuS
  }
  
  root * /var/www/protected
  file_server
}

# JWT 认证（需要 caddy-security 插件）
api.example.com {
  # JWT 验证
  authenticate {
    provide jwt {
      token_source header Authorization
      token_source cookie access_token
      issuer https://auth.example.com
      audience https://api.example.com
      jwk_url https://auth.example.com/.well-known/jwks.json
    }
  }
  
  # 需要认证的路由
  handle /api/private/* {
    authenticate
    reverse_proxy backend:3000
  }
  
  # 公开路由
  handle /api/public/* {
    reverse_proxy backend:3000
  }
}
```

### Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./static:/var/www/html
      - ./logs:/var/log/caddy
      - caddy_data:/data
      - caddy_config:/config
    environment:
      - TZ=Asia/Shanghai
      - ACME_AGREE=true
    networks:
      - web
    depends_on:
      - app

  # 示例应用
  app:
    image: node:20-alpine
    container_name: app
    restart: unless-stopped
    working_dir: /app
    volumes:
      - ./app:/app
    command: npm start
    expose:
      - "3000"
    networks:
      - web

volumes:
  caddy_data:
  caddy_config:

networks:
  web:
    driver: bridge
```

### 多站点配置

```caddyfile
# Caddyfile - 多站点
{
  email admin@example.com
}

# 导入其他配置文件
import sites/*.caddyfile

# 站点 1
site1.example.com {
  root * /var/www/site1
  file_server
  encode gzip
  
  log {
    output file /var/log/caddy/site1.log
  }
}

# 站点 2
site2.example.com {
  reverse_proxy localhost:4000
  
  log {
    output file /var/log/caddy/site2.log
  }
}

# 子路径代理
example.com/blog {
  reverse_proxy blog-service:5000
}

example.com/docs {
  reverse_proxy docs-service:6000
}
```

### 模板渲染

```caddyfile
# Caddy 模板
example.com {
  root * /var/www/templates
  
  # 模板渲染
  templates {
    # 模板文件扩展名
    extensions .html .htm
    # MIME 类型
    mime text/html text/plain
  }
  
  file_server
  
  # 在模板中可用的变量
  # {{.OriginalReq.Host}}
  # {{.OriginalReq.Method}}
  # {{.OriginalReq.URL.Path}}
  # {{.RemoteIP}}
  # {{.ClientIP}}
  # {{.Host}}
  # {{.Req.Header.Get "User-Agent"}}
}

# 示例模板文件
# templates/index.html
<!DOCTYPE html>
<html>
<head>
  <title>{{.OriginalReq.Host}}</title>
</head>
<body>
  <h1>Welcome to {{.OriginalReq.Host}}</h1>
  <p>Your IP: {{.RemoteIP}}</p>
  <p>Request Path: {{.OriginalReq.URL.Path}}</p>
  <p>Time: {{now.Format "2006-01-02 15:04:05"}}</p>
</body>
</html>
```

### JSON API 配置

```json
{
  "apps": {
    "http": {
      "servers": {
        "example": {
          "listen": [":443"],
          "routes": [
            {
              "match": [
                {
                  "host": ["example.com"]
                }
              ],
              "handle": [
                {
                  "handler": "subroute",
                  "routes": [
                    {
                      "handle": [
                        {
                          "handler": "file_server",
                          "root": "/var/www/html",
                          "browse": {}
                        }
                      ]
                    }
                  ]
                }
              ],
              "terminal": true
            }
          ],
          "automatic_https": {
            "disable": false
          }
        }
      }
    },
    "tls": {
      "certificates": {
        "automate": ["example.com"]
      },
      "automation": {
        "policies": [
          {
            "subjects": ["example.com"],
            "issuer": {
              "email": "admin@example.com",
              "module": "acme"
            }
          }
        ]
      }
    }
  }
}
```

## 最佳实践

### 1. 安全头配置

```caddyfile
example.com {
  header {
    # 移除服务器信息
    -Server
    
    # HSTS
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    
    # 防止 MIME 类型嗅探
    X-Content-Type-Options "nosniff"
    
    # 点击劫持保护
    X-Frame-Options "SAMEORIGIN"
    
    # XSS 保护
    X-XSS-Protection "1; mode=block"
    
    # 引用策略
    Referrer-Policy "strict-origin-when-cross-origin"
    
    # 权限策略
    Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
    
    # CSP（根据需求调整）
    Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  }
}
```

### 2. 日志配置

```caddyfile
example.com {
  log {
    # 输出到文件
    output file /var/log/caddy/access.log {
      # 日志轮转
      roll_size 100mb
      roll_keep 10
      roll_keep_days 30
    }
    
    # JSON 格式
    format json {
      # 时间格式
      time_format rfc3339
    }
    
    # 日志级别
    level INFO
  }
}

# 全局日志
{
  log default {
    output file /var/log/caddy/caddy.log
    format json
    level INFO
  }
}
```

### 3. 缓存优化

```caddyfile
example.com {
  # 编码
  encode gzip zstd br
  
  # 静态资源
  @static {
    path *.css *.js *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2 *.ttf *.eot
  }
  header @static {
    Cache-Control "public, max-age=31536000, immutable"
    # 移除 ETag（使用文件名哈希）
    -ETag
  }
  
  # HTML 和数据
  @dynamic {
    path *.html *.json *.xml
  }
  header @dynamic {
    Cache-Control "no-cache, no-store, must-revalidate"
  }
  
  # 预压缩文件
  file_server {
    precompressed gzip br zstd
  }
}
```

### 4. 限流配置

```caddyfile
example.com {
  # 限流（需要 rate_limit 插件）
  rate_limit {
    # 全局限流
    zone global {
      key {remote_host}
      events 1000
      window 1m
    }
    
    # API 限流
    zone api {
      key {remote_host}
      events 100
      window 1m
    }
  }
  
  # API 路由
  handle /api/* {
    rate_limit api
    reverse_proxy backend:3000
  }
}
```

### 5. 重定向规则

```caddyfile
example.com {
  # HTTP 到 HTTPS（自动）
  # Caddy 自动处理
  
  # www 到非 www
  @www host www.example.com
  redir @www https://example.com{uri} permanent
  
  # 域名迁移
  redir https://newdomain.com{uri} permanent
  
  # 路径重定向
  redir /old-path /new-path permanent
  
  # 正则重定向
  @old path_regexp old ^/blog/(.*)$
  redir @old /posts/{re.old.1} permanent
}
```

### 6. 健康检查

```caddyfile
example.com {
  reverse_proxy {
    to localhost:3001
    to localhost:3002
    to localhost:3003
    
    # 健康检查
    health_uri /health
    health_interval 10s
    health_timeout 5s
    health_status 200
    
    # 主动健康检查
    health_body "OK"
    
    # 被动健康检查
    fail_duration 30s
    max_fails 5
    unhealthy_status 500 502 503 504
    unhealthy_latency 5s
  }
}
```

## 常用命令

```bash
# 启动 Caddy
caddy run
caddy run --config Caddyfile
caddy run --config caddy.json --adapter json

# 后台运行
caddy start
caddy start --config Caddyfile

# 停止
caddy stop

# 重载配置（无停机）
caddy reload
caddy reload --config Caddyfile

# 验证配置
caddy validate --config Caddyfile
caddy validate --config caddy.json --adapter json

# 格式化配置
caddy fmt --overwrite Caddyfile

# 生成密码
caddy hash-password
caddy hash-password --plaintext 'your-password'

# 生成 JSON 配置
caddy adapt --config Caddyfile
caddy adapt --config Caddyfile --pretty

# 查看环境变量
caddy environ

# 查看版本
caddy version

# 列出模块
caddy list-modules

# 信任证书（本地开发）
caddy trust

# API 操作
# 获取配置
curl localhost:2019/config/

# 更新配置
curl -X POST -H "Content-Type: application/json" -d @caddy.json localhost:2019/load

# 停止服务
curl -X POST localhost:2019/stop
```

## 部署配置

### Systemd 服务

```ini
# /etc/systemd/system/caddy.service
[Unit]
Description=Caddy Web Server
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=512
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable caddy
sudo systemctl start caddy
sudo systemctl status caddy
```

### Kubernetes 部署

```yaml
# caddy-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: caddy
spec:
  replicas: 2
  selector:
    matchLabels:
      app: caddy
  template:
    metadata:
      labels:
        app: caddy
    spec:
      containers:
        - name: caddy
          image: caddy:2-alpine
          ports:
            - containerPort: 80
            - containerPort: 443
          volumeMounts:
            - name: caddy-config
              mountPath: /etc/caddy
            - name: caddy-data
              mountPath: /data
            - name: static-files
              mountPath: /var/www/html
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
      volumes:
        - name: caddy-config
          configMap:
            name: caddy-config
        - name: caddy-data
          persistentVolumeClaim:
            claimName: caddy-data-pvc
        - name: static-files
          persistentVolumeClaim:
            claimName: static-files-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: caddy
spec:
  selector:
    app: caddy
  ports:
    - name: http
      port: 80
      targetPort: 80
    - name: https
      port: 443
      targetPort: 443
  type: LoadBalancer
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: caddy-config
data:
  Caddyfile: |
    example.com {
      root * /var/www/html
      file_server
      encode gzip
    }
```

### 环境变量配置

```bash
# .env
CADDY_ADMIN=0.0.0.0:2019
SITE_ADDRESS=:80
SITE_ROOT=/var/www/html
LOG_FILE=/var/log/caddy/access.log
BACKEND_URL=http://localhost:3000
```

```caddyfile
# Caddyfile 使用环境变量
{$SITE_ADDRESS:localhost} {
  root * {$SITE_ROOT:/var/www/html}
  
  log {
    output file {$LOG_FILE:/var/log/caddy/access.log}
  }
  
  reverse_proxy {$BACKEND_URL:http://localhost:3000}
}
```

## 性能优化

### 1. 启用 HTTP/3

```caddyfile
{
  # 全局启用 HTTP/3
  servers {
    protocols h1 h2 h3
  }
}

example.com {
  # HTTP/3 自动启用
  reverse_proxy localhost:3000
}
```

### 2. 调整缓冲区

```caddyfile
{
  servers {
    # 读缓冲区
    read_timeout 30s
    write_timeout 30s
    # 最大头部大小
    max_header_size 16KB
  }
}
```

### 3. 连接复用

```caddyfile
example.com {
  reverse_proxy localhost:3000 {
    # 保持连接
    keepalive 5m
    keepalive_idle_conns 10
  }
}
```

## 故障排查

```bash
# 查看日志
journalctl -u caddy -f

# 测试配置
caddy validate --config Caddyfile

# 查看监听端口
ss -tlnp | grep caddy

# 测试 HTTPS
curl -vI https://example.com

# 测试 HTTP/3
curl --http3 -I https://example.com

# 检查证书
caddy list-certificates

# API 调试
curl localhost:2019/config/
curl localhost:2019/reverse_proxy/upstreams
```

## 参考资源

- [Caddy 官方文档](https://caddyserver.com/docs/)
- [Caddyfile 语法](https://caddyserver.com/docs/caddyfile-tutorial)
- [Caddy GitHub](https://github.com/caddyserver/caddy)
- [Caddy 社区](https://caddy.community/)
- [Caddy Docker](https://hub.docker.com/_/caddy)
