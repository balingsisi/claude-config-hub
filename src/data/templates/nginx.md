# Nginx Web Server & Reverse Proxy Template

## Project Overview

Nginx is a high-performance web server, reverse proxy, load balancer, and HTTP cache. Known for its high concurrency, low memory usage, and ability to handle thousands of simultaneous connections, Nginx powers over 30% of the world's busiest websites.

## Tech Stack

- **Server**: Nginx 1.25+
- **OS**: Linux (Ubuntu/Debian/CentOS)
- **SSL**: Let's Encrypt / Certbot
- **Monitoring**: Prometheus + Grafana / NGINX Amplify
- **Logging**: ELK Stack / Loki
- **Load Balancing**: Upstream modules
- **Caching**: FastCGI / Proxy cache

## Project Structure

```
├── /etc/nginx/
│   ├── nginx.conf                 # Main configuration
│   ├── sites-available/           # Available site configs
│   │   ├── default
│   │   ├── api.example.com
│   │   ├── app.example.com
│   │   └── websocket.example.com
│   ├── sites-enabled/             # Enabled sites (symlinks)
│   │   └── default -> ../sites-available/default
│   ├── conf.d/                    # Additional configurations
│   │   ├── security.conf
│   │   ├── ssl.conf
│   │   ├── gzip.conf
│   │   ├── cache.conf
│   │   ├── rate-limit.conf
│   │   └── logging.conf
│   ├── snippets/                  # Reusable configuration blocks
│   │   ├── ssl-params.conf
│   │   ├── proxy-params.conf
│   │   └── fastcgi-params.conf
│   ├── modules-available/         # Available modules
│   └── modules-enabled/           # Enabled modules
├── /var/www/
│   └── html/                      # Default web root
│       ├── index.html
│       └── 50x.html
├── /var/log/nginx/
│   ├── access.log
│   ├── error.log
│   └── sites/
│       ├── api.access.log
│       └── app.access.log
├── /etc/letsencrypt/              # SSL certificates
│   ├── live/
│   │   └── example.com/
│   │       ├── fullchain.pem
│   │       └── privkey.pem
│   └── renewal/
└── /usr/local/bin/
    └── nginx-health-check.sh      # Health check script
```

## Key Patterns

### 1. Main Configuration

```nginx
# /etc/nginx/nginx.conf

user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log warn;

# Events block
events {
    worker_connections 2048;
    multi_accept on;
    use epoll;
}

# HTTP block
http {
    # Basic settings
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Buffer sizes
    client_body_buffer_size 16K;
    client_header_buffer_size 1k;
    client_max_body_size 100M;
    large_client_header_buffers 4 8k;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';
    
    access_log /var/log/nginx/access.log main;
    
    # Gzip compression
    include /etc/nginx/conf.d/gzip.conf;
    
    # Rate limiting
    include /etc/nginx/conf.d/rate-limit.conf;
    
    # Security headers
    include /etc/nginx/conf.d/security.conf;
    
    # Upstream backends
    upstream backend_api {
        least_conn;
        server 127.0.0.1:3000 weight=5;
        server 127.0.0.1:3001 weight=5;
        server 127.0.0.1:3002 backup;
        keepalive 32;
    }
    
    upstream backend_ws {
        ip_hash;
        server 127.0.0.1:4000;
        server 127.0.0.1:4001;
    }
    
    # Include site configurations
    include /etc/nginx/sites-enabled/*;
}
```

### 2. Static Site Configuration

```nginx
# /etc/nginx/sites-available/app.example.com

server {
    listen 80;
    listen [::]:80;
    server_name app.example.com www.app.example.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.example.com www.app.example.com;
    
    # SSL configuration
    include snippets/ssl-params.conf;
    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    
    # Document root
    root /var/www/app.example.com/html;
    index index.html index.htm;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|txt|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /var/www/html;
    }
}
```

### 3. API Reverse Proxy

```nginx
# /etc/nginx/sites-available/api.example.com

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.example.com;
    
    # SSL
    include snippets/ssl-params.conf;
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    
    # Access logging
    access_log /var/log/nginx/sites/api.access.log main;
    error_log /var/log/nginx/sites/api.error.log warn;
    
    # Proxy settings
    include snippets/proxy-params.conf;
    
    # API rate limiting
    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;
    
    # API proxy
    location / {
        proxy_pass http://backend_api;
        
        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # WebSocket upgrade
    location /ws {
        proxy_pass http://backend_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
    
    # Health check
    location /health {
        access_log off;
        proxy_pass http://backend_api/health;
        proxy_connect_timeout 2s;
    }
}
```

### 4. Load Balancer Configuration

```nginx
# /etc/nginx/conf.d/load-balancer.conf

# Upstream with health checks
upstream web_backend {
    zone web_backend 64k;
    
    # Load balancing method
    least_conn;  # Options: round-robin (default), ip_hash, least_conn, hash
    
    # Backend servers
    server 10.0.1.10:80 weight=5 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:80 weight=5 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:80 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.1.13:80 backup;
    
    # Keepalive connections
    keepalive 32;
    
    # Health check (requires nginx plus or third-party module)
    # health_check interval=5s fails=3 passes=2;
}

server {
    listen 80;
    server_name lb.example.com;
    
    location / {
        proxy_pass http://web_backend;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_redirect off;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Status endpoint
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
    }
}
```

### 5. SSL/TLS Configuration

```nginx
# /etc/nginx/snippets/ssl-params.conf

# SSL protocols
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

# SSL session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# HSTS (uncomment if you're sure)
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# SSL buffer size
ssl_buffer_size 4k;
```

### 6. Proxy Parameters

```nginx
# /etc/nginx/snippets/proxy-params.conf

# Proxy buffering
proxy_buffering on;
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;

# Proxy headers
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# Proxy timeouts
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# Proxy redirect
proxy_redirect off;

# Intercept errors
proxy_intercept_errors off;
```

### 7. Rate Limiting

```nginx
# /etc/nginx/conf.d/rate-limit.conf

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/s;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=addr:10m;

# Whitelist internal IPs
geo $limit {
    default 1;
    10.0.0.0/8 0;
    127.0.0.1 0;
}

map $limit $limit_key {
    0 "";
    1 $binary_remote_addr;
}

# Custom error page for rate limiting
limit_req_status 429;
error_page 429 = @rate_limit_exceeded;

location @rate_limit_exceeded {
    default_type application/json;
    return 429 '{"error": "Too many requests", "message": "Please slow down"}';
}
```

### 8. Caching Configuration

```nginx
# /etc/nginx/conf.d/cache.conf

# Proxy cache path
proxy_cache_path /var/cache/nginx/proxy levels=1:2 keys_zone=api_cache:10m 
                 max_size=1g inactive=60m use_temp_path=off;

# FastCGI cache path
fastcgi_cache_path /var/cache/nginx/fastcgi levels=1:2 keys_zone=php_cache:10m 
                   max_size=1g inactive=60m use_temp_path=off;

# Cache key zone
map $request_method $purge_method {
    PURGE 1;
    default 0;
}

# Usage in server block:
# location /api/data {
#     proxy_cache api_cache;
#     proxy_cache_valid 200 302 10m;
#     proxy_cache_valid 404 1m;
#     proxy_cache_key $scheme$request_method$host$request_uri;
#     proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
#     add_header X-Cache-Status $upstream_cache_status;
#     proxy_pass http://backend_api;
# }
```

### 9. Security Headers

```nginx
# /etc/nginx/conf.d/security.conf

# Hide nginx version
server_tokens off;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Content Security Policy (adjust for your needs)
# add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.example.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;" always;

# Block common attack patterns
if ($request_method !~ ^(GET|HEAD|POST|PUT|DELETE|OPTIONS|PATCH)$ ) {
    return 405;
}

# Block suspicious user agents
if ($http_user_agent ~* (bot|crawl|spider|scan|nikto|sqlmap|nmap|masscan)) {
    return 403;
}

# Block requests with empty user agent
if ($http_user_agent = "") {
    return 403;
}
```

### 10. Logging Configuration

```nginx
# /etc/nginx/conf.d/logging.conf

# JSON log format for ELK/Logstash
log_format json_combined escape=json '{'
    '"time_local":"$time_local",'
    '"remote_addr":"$remote_addr",'
    '"remote_user":"$remote_user",'
    '"request":"$request",'
    '"status":"$status",'
    '"body_bytes_sent":"$body_bytes_sent",'
    '"request_time":"$request_time",'
    '"http_referrer":"$http_referer",'
    '"http_user_agent":"$http_user_agent",'
    '"http_x_forwarded_for":"$http_x_forwarded_for",'
    '"upstream_response_time":"$upstream_response_time",'
    '"upstream_connect_time":"$upstream_connect_time",'
    '"request_id":"$request_id"'
'}';

# Conditional logging (skip health checks)
map $uri $loggable {
    /health 0;
    /metrics 0;
    default 1;
}

# Usage:
# access_log /var/log/nginx/access.log json_combined if=$loggable;
```

## Best Practices

### 1. Performance
- Enable gzip compression
- Use HTTP/2
- Implement caching strategies
- Optimize buffer sizes
- Use keepalive connections
- Enable sendfile

### 2. Security
- Use HTTPS with TLS 1.2+
- Implement rate limiting
- Hide nginx version
- Set security headers
- Block malicious requests
- Use fail2ban

### 3. Reliability
- Implement health checks
- Configure proper timeouts
- Use upstream backup servers
- Enable graceful shutdown
- Monitor error logs

### 4. Operations
- Use configuration includes
- Test configs before reload
- Implement log rotation
- Monitor with Prometheus/Grafana
- Set up alerts

## Common Commands

```bash
# Service management
sudo systemctl start nginx      # Start nginx
sudo systemctl stop nginx       # Stop nginx
sudo systemctl restart nginx    # Restart nginx
sudo systemctl reload nginx     # Reload config (graceful)
sudo systemctl status nginx     # Check status

# Configuration
sudo nginx -t                   # Test configuration
sudo nginx -T                   # Test and display config
sudo nginx -s reload            # Send reload signal

# SSL/TLS
sudo certbot certonly --nginx -d example.com
sudo certbot renew              # Renew certificates
sudo certbot certificates       # List certificates

# Monitoring
curl -I http://localhost/nginx_status  # Check status
tail -f /var/log/nginx/access.log      # Watch access logs
tail -f /var/log/nginx/error.log       # Watch error logs

# Performance testing
ab -n 1000 -c 100 http://localhost/   # Apache Bench
wrk -t12 -c400 -d30s http://localhost/ # wrk

# Debugging
sudo nginx -g "daemon off;"     # Run in foreground
sudo nginx -g "error_log /dev/stderr debug;"  # Debug mode

# Maintenance
sudo nginx -s stop              # Quick shutdown
sudo nginx -s quit              # Graceful shutdown
sudo nginx -s reopen            # Reopen log files
```

## Configuration Management

```bash
#!/bin/bash
# /usr/local/bin/nginx-reload.sh

# Test configuration
if sudo nginx -t; then
    echo "Configuration test passed. Reloading nginx..."
    sudo systemctl reload nginx
    echo "Nginx reloaded successfully."
else
    echo "Configuration test failed! Aborting reload."
    exit 1
fi
```

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM nginx:1.25-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY sites-available/ /etc/nginx/sites-available/
COPY snippets/ /etc/nginx/snippets/
COPY conf.d/ /etc/nginx/conf.d/

# Create log directories
RUN mkdir -p /var/log/nginx/sites

# Create cache directories
RUN mkdir -p /var/cache/nginx/proxy /var/cache/nginx/fastcgi

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.25-alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./sites-available:/etc/nginx/sites-available:ro
      - ./sites-enabled:/etc/nginx/sites-enabled:ro
      - ./snippets:/etc/nginx/snippets:ro
      - ./conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./html:/var/www/html:ro
      - nginx_logs:/var/log/nginx
      - nginx_cache:/var/cache/nginx
    depends_on:
      - app
      - api
    networks:
      - frontend
    restart: unless-stopped
    
  app:
    image: myapp:latest
    expose:
      - "3000"
    networks:
      - frontend
    restart: unless-stopped
    
  api:
    image: myapi:latest
    expose:
      - "8000"
    networks:
      - frontend
    restart: unless-stopped

volumes:
  nginx_logs:
  nginx_cache:

networks:
  frontend:
    driver: bridge
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: default
data:
  nginx.conf: |
    user nginx;
    worker_processes auto;
    
    events {
        worker_connections 1024;
    }
    
    http {
        include /etc/nginx/mime.types;
        default_type application/octet-stream;
        
        sendfile on;
        keepalive_timeout 65;
        
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;
        
        upstream backend {
            server api-service:8000;
        }
        
        server {
            listen 80;
            server_name _;
            
            location / {
                proxy_pass http://backend;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }
        }
    }
```

## Monitoring

```nginx
# Enable stub status
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    allow 10.0.0.0/8;
    deny all;
}

# Enable Prometheus exporter (requires third-party module or sidecar)
# location /metrics {
#     prometheus_metrics on;
# }
```

## Resources

- [Nginx Official Documentation](https://nginx.org/en/docs/)
- [Nginx Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Nginx Admin Guide](https://docs.nginx.com/nginx/admin-guide/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Nginx Performance Tuning](https://www.nginx.com/blog/tuning-nginx/)

---

**Last Updated**: 2026-03-17
