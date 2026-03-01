# Supabase 数据库设置指南

本指南将帮助你设置 Supabase 数据库用于 Claude Config Hub 项目。

## 🚀 快速开始

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 点击 **"Start your project"**
3. 使用 GitHub 账号登录（推荐）
4. 创建新组织（可选）
5. 点击 **"New Project"**

### 2. 配置项目

填写以下信息：

```yaml
项目名称: Claude Config Hub
数据库密码: [生成一个强密码并保存]
区域: 选择离你最近的区域（如：Southeast Asia (Singapore)
定价计划: Free Plan
```

> ⚠️ **重要**: 请记住你的数据库密码，后续无法找回！

### 3. 获取数据库连接字符串

项目创建完成后（约需 2 分钟）：

1. 进入项目 Dashboard
2. 点击左侧菜单 **"Settings"** → **"Database"**
3. 找到 **"Connection string"** 部分
4. 选择 **"URI"** 标签页
5. 复制连接字符串，格式类似：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 4. 配置项目环境变量

1. 复制项目根目录的 `.env.local.example` 为 `.env.local`（如果还没有）
2. 将你的数据库连接字符串粘贴到 `DATABASE_URL` 变量中：

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 5. 运行数据库迁移

在项目根目录执行：

```bash
# 生成 Prisma Client
npm run prisma:generate

# 推送 schema 到数据库
npm run prisma:dbpush

# 或者使用 Prisma Migrate（生产环境推荐）
npm run prisma:migrate
```

### 6. 验证数据库设置

1. 访问 Supabase Dashboard
2. 点击 **"Table Editor"** 查看创建的表：
   - `users`
   - `templates`
   - `favorites`
   - `ratings`
   - `comments`

## 📋 数据库 Schema 说明

### users 表
存储用户信息（通过 GitHub OAuth 同步）

```yaml
id: 用户唯一标识
githubId: GitHub 用户 ID
name: 用户名称
email: 用户邮箱
image: 用户头像
login: GitHub 用户名
```

### templates 表
存储 CLAUDE.md 模板

```yaml
id: 模板唯一标识
slug: URL 友好的标识符
name: 模板名称
description: 模板描述
content: Markdown 内容
techStack: 技术栈信息 (JSON)
status: 审核状态
```

### favorites 表
用户收藏关系

```yaml
userId: 用户 ID
templateId: 模板 ID
createdAt: 收藏时间
```

### ratings 表
用户评分

```yaml
userId: 用户 ID
templateId: 模板 ID
score: 评分 (1-5)
```

### comments 表
用户评论

```yaml
userId: 用户 ID
templateId: 模板 ID
content: 评论内容
createdAt: 评论时间
```

## 🔧 常用命令

```bash
# 生成 Prisma Client
npm run prisma:generate

# 推送 schema 到数据库（开发环境）
npm run prisma:dbpush

# 创建并应用迁移（生产环境）
npm run prisma:migrate

# 打开 Prisma Studio（可视化数据库管理）
npm run prisma:studio

# 重置数据库（⚠️ 会删除所有数据）
npm run prisma:dbpush -- --force-reset
```

## 📊 Prisma Studio

Prisma Studio 是一个可视化的数据库管理工具：

```bash
npm run prisma:studio
```

然后访问 http://localhost:5555 查看和编辑数据。

## 🌍 环境变量

### 开发环境 (.env.local)
```env
DATABASE_URL="your-local-or-supabase-database-url"
```

### 生产环境 (Vercel)
在 Vercel 项目设置中添加 `DATABASE_URL` 环境变量。

## 🚨 故障排除

### 问题 1: 连接失败
```yaml
错误: Can't reach database server
解决:
  1. 检查 DATABASE_URL 是否正确
  2. 确认 Supabase 项目是否正在运行
  3. 检查防火墙设置
```

### 问题 2: 迁移失败
```yaml
错误: Migration failed
解决:
  1. 运行 npm run prisma:dbpush --force-reset
  2. 重新运行迁移
```

### 问题 3: 类型错误
```yaml
错误: Type errors in Prisma Client
解决:
  1. 运行 npm run prisma:generate
  2. 重启开发服务器
```

## 📚 下一步

数据库设置完成后：

1. ✅ 测试用户登录（会自动同步到数据库）
2. ✅ 测试收藏功能
3. ✅ 测试评分和评论
4. ✅ 添加更多模板到数据库

## 💡 提示

- Supabase 免费计划包含 500MB 数据库存储
- 免费计划有 50MB 文件存储（可用于用户头像等）
- 数据库会自动备份
- 可以在 Supabase Dashboard 直接查看和编辑数据

---

**需要帮助？**
- [Supabase 文档](https://supabase.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)
