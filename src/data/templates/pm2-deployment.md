# PM2 进程管理模板

## 技术栈

- **PM2**: Node.js 进程管理器
- **Node.js**: 运行时环境
- **Nginx**: 反向代理
- **Logrotate**: 日志轮转
- **Systemd**: 系统服务管理

## 项目结构

```
pm2-deployment/
├── ecosystem.config.js        # PM2 配置文件
├── deploy/
│   ├── production.config.js   # 生产环境配置
│   ├── staging.config.js      # 测试环境配置
│   └── development.config.js  # 开发环境配置
├── scripts/
│   ├── deploy.sh              # 部署脚本
│   ├── start.sh               # 启动脚本
│   ├── stop.sh                # 停止脚本
│   ├── restart.sh             # 重启脚本
│   ├── logs.sh                # 日志查看
│   ├── monitor.sh             # 监控脚本
│   └── backup.sh              # 备份脚本
├── nginx/
│   └── app.conf               # Nginx 配置
├── systemd/
│   └── pm2-app.service        # Systemd 服务
├── monitoring/
│   ├── pm2-metrics.js         # 自定义指标
│   └── health-check.js        # 健康检查
├── .pm2/
│   └── module_conf.json       # PM2 模块配置
├── logs/                      # 日志目录
│   ├── app-out.log
│   ├── app-error.log
│   └── access.log
└── package.json
```

## 代码模式

### PM2 配置文件

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'my-app',
      script: './dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://...',
        REDIS_URL: 'redis://...'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        DATABASE_URL: 'postgresql://...',
        REDIS_URL: 'redis://...'
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      merge_logs: true,
      
      // 进程管理
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: true,
      
      // 自动重启策略
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,
      
      // 定时重启
      cron_restart: '0 2 * * *', // 每天凌晨2点
      
      // 源码映射支持
      source_map_support: true,
      
      // 实例变量
      instance_var: 'INSTANCE_ID'
    },
    
    // 微服务配置
    {
      name: 'api-gateway',
      script: './services/api-gateway/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    },
    
    {
      name: 'user-service',
      script: './services/user-service/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        PORT: 3002,
        NODE_ENV: 'production'
      }
    },
    
    {
      name: 'order-service',
      script: './services/order-service/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        PORT: 3003,
        NODE_ENV: 'production'
      }
    },
    
    // 后台任务
    {
      name: 'worker-email',
      script: './workers/email-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 */6 * * *', // 每6小时重启
      env_production: {
        NODE_ENV: 'production'
      }
    },
    
    {
      name: 'worker-notification',
      script: './workers/notification-worker/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ],
  
  // 部署配置
  deploy: {
    production: {
      user: 'deploy',
      host: ['192.168.1.100', '192.168.1.101'],
      ref: 'origin/main',
      repo: 'git@github.com:user/repo.git',
      path: '/var/www/production',
      'pre-deploy-local': './scripts/pre-deploy.sh',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git -y',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'deploy',
      host: '192.168.1.102',
      ref: 'origin/develop',
      repo: 'git@github.com:user/repo.git',
      path: '/var/www/staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
```

### 环境特定配置

```javascript
// deploy/production.config.js
module.exports = {
  apps: [
    {
      name: 'my-app-production',
      script: './dist/app.js',
      instances: 4,
      exec_mode: 'cluster',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info',
        DATABASE_POOL_SIZE: 20,
        REDIS_MAX_CONNECTIONS: 50
      },
      // 生产环境特定配置
      error_file: '/var/log/pm2/my-app-error.log',
      out_file: '/var/log/pm2/my-app-out.log',
      pid_file: '/var/run/pm2/my-app.pid',
      
      // 生产环境监控
      monitoring: true,
      
      // 定时重启（避开高峰期）
      cron_restart: '0 3 * * *'
    }
  ]
};
```

```javascript
// deploy/staging.config.js
module.exports = {
  apps: [
    {
      name: 'my-app-staging',
      script: './dist/app.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'staging',
        PORT: 3000,
        LOG_LEVEL: 'debug',
        DATABASE_POOL_SIZE: 10,
        REDIS_MAX_CONNECTIONS: 20
      },
      watch: true,
      ignore_watch: ['node_modules', 'logs', '.git']
    }
  ]
};
```

### 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=$1
VERSION=$2

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./deploy.sh <environment> [version]"
  echo "Example: ./deploy.sh production v1.2.3"
  exit 1
fi

echo "🚀 开始部署到 $ENVIRONMENT 环境..."

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin
git checkout $VERSION || git checkout main
git pull origin main

# 2. 安装依赖
echo "📦 安装依赖..."
npm ci --production

# 3. 构建
echo "🔨 构建项目..."
npm run build

# 4. 数据库迁移
echo "🗄️  运行数据库迁移..."
npm run migrate:$ENVIRONMENT

# 5. 重启服务
echo "🔄 重启 PM2 服务..."
if [ "$ENVIRONMENT" = "production" ]; then
  pm2 reload deploy/production.config.js --env production
elif [ "$ENVIRONMENT" = "staging" ]; then
  pm2 reload deploy/staging.config.js --env staging
fi

# 6. 保存 PM2 配置
pm2 save

# 7. 健康检查
echo "🏥 执行健康检查..."
sleep 10
./scripts/health-check.sh

echo "✅ 部署完成！"
```

```bash
#!/bin/bash
# scripts/start.sh

ENVIRONMENT=${1:-development}

echo "🚀 启动应用 ($ENVIRONMENT)..."

if [ "$ENVIRONMENT" = "production" ]; then
  pm2 start deploy/production.config.js --env production
elif [ "$ENVIRONMENT" = "staging" ]; then
  pm2 start deploy/staging.config.js --env staging
else
  pm2 start ecosystem.config.js
fi

pm2 save

echo "✅ 应用已启动"
pm2 status
```

```bash
#!/bin/bash
# scripts/stop.sh

APP_NAME=${1:-all}

if [ "$APP_NAME" = "all" ]; then
  echo "🛑 停止所有应用..."
  pm2 stop all
else
  echo "🛑 停止应用: $APP_NAME"
  pm2 stop $APP_NAME
fi

echo "✅ 应用已停止"
pm2 status
```

```bash
#!/bin/bash
# scripts/restart.sh

APP_NAME=${1:-all}

if [ "$APP_NAME" = "all" ]; then
  echo "🔄 重启所有应用..."
  pm2 restart all
else
  echo "🔄 重启应用: $APP_NAME"
  pm2 restart $APP_NAME
fi

pm2 save

echo "✅ 应用已重启"
pm2 status
```

```bash
#!/bin/bash
# scripts/logs.sh

APP_NAME=${1:-all}
LINES=${2:-100}

if [ "$APP_NAME" = "all" ]; then
  pm2 logs --lines $LINES
else
  pm2 logs $APP_NAME --lines $LINES
fi
```

```bash
#!/bin/bash
# scripts/monitor.sh

echo "📊 PM2 监控..."
pm2 monit
```

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/var/backups/pm2"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pm2-backup-$DATE.tar.gz"

echo "📦 备份 PM2 配置..."

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份 PM2 配置和日志
tar -czf $BACKUP_FILE \
  ecosystem.config.js \
  deploy/ \
  .pm2/ \
  logs/

echo "✅ 备份完成: $BACKUP_FILE"

# 清理旧备份（保留最近7天）
find $BACKUP_DIR -name "pm2-backup-*.tar.gz" -mtime +7 -delete
echo "🧹 清理完成"
```

```bash
#!/bin/bash
# scripts/health-check.sh

APP_NAME=${1:-my-app}
MAX_RETRIES=5
RETRY_INTERVAL=5

echo "🏥 健康检查: $APP_NAME"

for i in $(seq 1 $MAX_RETRIES); do
  echo "尝试 $i/$MAX_RETRIES..."
  
  # 检查进程状态
  STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status")
  
  if [ "$STATUS" = "online" ]; then
    # 检查 HTTP 端点
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
    
    if [ "$HTTP_CODE" = "200" ]; then
      echo "✅ 健康检查通过"
      exit 0
    else
      echo "⚠️  HTTP 健康检查失败: $HTTP_CODE"
    fi
  else
    echo "⚠️  进程状态异常: $STATUS"
  fi
  
  sleep $RETRY_INTERVAL
done

echo "❌ 健康检查失败"
exit 1
```

### Nginx 配置

```nginx
# nginx/app.conf
upstream my_app {
  least_conn;
  server 127.0.0.1:3000 weight=5 max_fails=3 fail_timeout=30s;
  server 127.0.0.1:3001 weight=5 max_fails=3 fail_timeout=30s;
  server 127.0.0.1:3002 backup;
  keepalive 64;
}

# HTTP 重定向到 HTTPS
server {
  listen 80;
  server_name example.com www.example.com;
  return 301 https://$server_name$request_uri;
}

# HTTPS 服务器
server {
  listen 443 ssl http2;
  server_name example.com www.example.com;

  # SSL 配置
  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # 安全头
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # 日志
  access_log /var/log/nginx/app-access.log;
  error_log /var/log/nginx/app-error.log;

  # 静态文件
  location /static/ {
    alias /var/www/app/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # API 代理
  location / {
    proxy_pass http://my_app;
    proxy_http_version 1.1;
    
    # 请求头
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Request-ID $request_id;
    
    # 连接配置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # 缓冲
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;
    
    # WebSocket 支持
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  # 健康检查
  location /health {
    access_log off;
    proxy_pass http://my_app/health;
  }

  # 限流
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
  location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://my_app;
  }
}
```

### Systemd 服务

```ini
# systemd/pm2-app.service
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=deploy
Group=deploy
ExecStart=/usr/local/bin/pm2 start /var/www/app/ecosystem.config.js --env production
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 stop all
PIDFile=/home/deploy/.pm2/pm2.pid
Restart=on-failure

# 环境变量
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin

# 安全配置
PrivateTmp=true
NoNewPrivileges=true

# 资源限制
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

### 自定义监控

```javascript
// monitoring/pm2-metrics.js
const pm2 = require('pm2');
const client = require('prom-client');

// 创建注册表
const register = new client.Registry();

// 自定义指标
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const cpuUsage = new client.Gauge({
  name: 'process_cpu_usage_percent',
  help: 'Process CPU usage percentage',
  labelNames: ['process_name', 'instance_id']
});

const memoryUsage = new client.Gauge({
  name: 'process_memory_usage_bytes',
  help: 'Process memory usage in bytes',
  labelNames: ['process_name', 'instance_id']
});

const activeConnections = new client.Gauge({
  name: 'process_active_connections',
  help: 'Number of active connections',
  labelNames: ['process_name', 'instance_id']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(cpuUsage);
register.registerMetric(memoryUsage);
register.registerMetric(activeConnections);

// 连接到 PM2
pm2.connect((err) => {
  if (err) {
    console.error('PM2 连接失败:', err);
    process.exit(2);
  }

  // 每秒采集指标
  setInterval(() => {
    pm2.list((err, processList) => {
      if (err) {
        console.error('获取进程列表失败:', err);
        return;
      }

      processList.forEach((proc) => {
        const processName = proc.name;
        const instanceId = proc.pm2_env.instance_var || '0';

        // CPU 使用率
        cpuUsage.set(
          { process_name: processName, instance_id: instanceId },
          proc.monit.cpu
        );

        // 内存使用
        memoryUsage.set(
          { process_name: processName, instance_id: instanceId },
          proc.monit.memory
        );

        // 活跃连接
        activeConnections.set(
          { process_name: processName, instance_id: instanceId },
          proc.pm2_env.axm_actions?.active_connections || 0
        );
      });
    });
  }, 1000);
});

// 导出指标端点
module.exports = {
  register,
  httpRequestDuration
};
```

```javascript
// monitoring/health-check.js
const axios = require('axios');

const APPS = [
  { name: 'my-app', url: 'http://localhost:3000/health' },
  { name: 'api-gateway', url: 'http://localhost:3001/health' },
  { name: 'user-service', url: 'http://localhost:3002/health' },
  { name: 'order-service', url: 'http://localhost:3003/health' }
];

async function checkHealth(app) {
  try {
    const response = await axios.get(app.url, {
      timeout: 5000
    });

    return {
      name: app.name,
      status: response.status === 200 ? 'healthy' : 'unhealthy',
      responseTime: response.headers['x-response-time'],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: app.name,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function runHealthChecks() {
  console.log('🏥 运行健康检查...\n');

  const results = await Promise.all(APPS.map(checkHealth));

  results.forEach((result) => {
    const icon = result.status === 'healthy' ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
    if (result.responseTime) {
      console.log(`   响应时间: ${result.responseTime}`);
    }
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });

  const unhealthyApps = results.filter((r) => r.status === 'unhealthy');
  if (unhealthyApps.length > 0) {
    console.log('\n⚠️  检测到不健康的应用!');
    process.exit(1);
  }

  console.log('\n✅ 所有应用健康');
}

// 每30秒运行一次
setInterval(runHealthChecks, 30000);
runHealthChecks();
```

### PM2 模块配置

```json
// .pm2/module_conf.json
{
  "pm2-logrotate": {
    "max_size": "10M",
    "retain": "7",
    "compress": true,
    "dateFormat": "YYYY-MM-DD-HH-mm-ss",
    "rotateModule": true,
    "workerInterval": "30",
    "rotateInterval": "0 0 * * *"
  },
  "pm2-server-monit": {
    "cron": "* * * * *",
    "axm": {
      "actions": {
        "eventLoopDump": true,
        "profilingCpu": true,
        "profilingHeap": true
      }
    }
  }
}
```

### 应用代码集成

```typescript
// src/app.ts
import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// 健康检查端点
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  
  try {
    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).send(healthcheck);
  }
});

// 就绪检查端点
app.get('/ready', async (req, res) => {
  try {
    // 检查数据库连接
    await checkDatabase();
    // 检查 Redis 连接
    await checkRedis();
    
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭...');
  
  server.close(() => {
    console.log('HTTP 服务器已关闭');
    
    // 关闭数据库连接
    closeDatabase().then(() => {
      console.log('数据库连接已关闭');
      process.exit(0);
    });
  });
  
  // 强制关闭超时
  setTimeout(() => {
    console.error('强制关闭');
    process.exit(1);
  }, 5000);
});

// PM2 就绪信号
if (process.send) {
  process.send('ready');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

export default app;
```

## 最佳实践

### 1. 零停机部署

```bash
# 使用 reload 而非 restart
pm2 reload ecosystem.config.js --env production

# 优雅关闭配置
# 在 ecosystem.config.js 中设置
kill_timeout: 5000,
wait_ready: true,
listen_timeout: 3000
```

### 2. 自动重启策略

```javascript
// ecosystem.config.js
{
  max_restarts: 10,
  min_uptime: '10s',
  restart_delay: 1000,
  exp_backoff_restart_delay: 100, // 指数退避
  autorestart: true
}
```

### 3. 日志管理

```bash
# 安装日志轮转模块
pm2 install pm2-logrotate

# 配置
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 4. 监控和告警

```bash
# 安装监控模块
pm2 install pm2-server-monit

# 连接到 PM2 Plus
pm2 link <secret_key> <public_key>

# 自定义指标
pm2.set('metric_name', value)
```

### 5. 环境变量管理

```bash
# 使用 .env 文件
pm2 start ecosystem.config.js --env-file .env.production

# 在配置中引用环境变量
env: {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT
}
```

### 6. 集群模式最佳实践

```javascript
// 根据CPU核心数自动设置实例数
const numCPUs = require('os').cpus().length;

{
  instances: numCPUs,
  exec_mode: 'cluster'
}

// 或者使用 'max'
{
  instances: 'max',
  exec_mode: 'cluster'
}
```

### 7. 资源限制

```javascript
{
  max_memory_restart: '1G', // 内存超过1G自动重启
  node_args: '--max-old-space-size=2048', // Node.js 堆内存限制
  kill_timeout: 5000, // 强制关闭超时
}
```

## 常用命令

### 进程管理

```bash
# 启动应用
pm2 start app.js
pm2 start ecosystem.config.js

# 停止应用
pm2 stop all
pm2 stop app-name

# 重启应用
pm2 restart all
pm2 restart app-name

# 重载应用（零停机）
pm2 reload all
pm2 reload app-name

# 删除应用
pm2 delete all
pm2 delete app-name

# 查看状态
pm2 list
pm2 status
pm2 show app-name
```

### 日志管理

```bash
# 查看日志
pm2 logs
pm2 logs app-name
pm2 logs --lines 100

# 清空日志
pm2 flush
pm2 flush app-name

# 实时日志
pm2 logs --raw
```

### 监控

```bash
# 监控面板
pm2 monit

# 查看详细信息
pm2 show app-name
pm2 describe app-name

# 查看环境
pm2 env 0
```

### 部署

```bash
# 部署到生产环境
pm2 deploy ecosystem.config.js production setup
pm2 deploy ecosystem.config.js production

# 部署到测试环境
pm2 deploy ecosystem.config.js staging

# 回滚
pm2 deploy ecosystem.config.js production revert 1
```

### 集群和扩容

```bash
# 扩容实例
pm2 scale app-name +2
pm2 scale app-name 4

# 切换模式
pm2 restart app-name --update-env CLUSTER
```

### 保存和恢复

```bash
# 保存进程列表
pm2 save

# 恢复进程列表
pm2 resurrect

# 启动时自动恢复
pm2 startup
```

### 清理

```bash
# 停止并删除所有进程
pm2 delete all

# 清空日志
pm2 flush

# 重置重启计数
pm2 reset
```

## 部署配置

### package.json

```json
{
  "name": "pm2-deployment",
  "version": "1.0.0",
  "scripts": {
    "start": "pm2 start ecosystem.config.js",
    "start:prod": "pm2 start deploy/production.config.js --env production",
    "start:staging": "pm2 start deploy/staging.config.js --env staging",
    "stop": "pm2 stop all",
    "restart": "pm2 restart all",
    "reload": "pm2 reload all",
    "logs": "pm2 logs",
    "monit": "pm2 monit",
    "deploy:prod": "./scripts/deploy.sh production",
    "deploy:staging": "./scripts/deploy.sh staging",
    "backup": "./scripts/backup.sh"
  },
  "devDependencies": {
    "pm2": "^5.3.0"
  }
}
```

### 环境变量

```env
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
LOG_LEVEL=info
```

### Systemd 启动

```bash
# 安装 PM2
npm install -g pm2

# 生成启动脚本
pm2 startup systemd

# 保存当前进程列表
pm2 save

# 启动服务
sudo systemctl start pm2-deploy

# 开机自启
sudo systemctl enable pm2-deploy
```

### Docker 集成

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# 安装 PM2
RUN npm install -g pm2

EXPOSE 3000

# 使用 PM2 启动
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    command: pm2-runtime ecosystem.config.js --env production
```
