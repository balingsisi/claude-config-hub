# 🧪 项目测试和部署指南

**更新日期**: 2026-03-01
**状态**: 准备测试

---

## 🔧 已修复的问题

### 问题 1: Next.js 配置文件 ✅
**问题**: Next.js 不支持 `.ts` 后缀的配置文件
**修复**: 将 `next.config.ts` 重命名为 `next.config.js` 并转换为纯 JavaScript

### 问题 2: 缺少 zod 依赖 ⏳
**状态**: 正在安装中
**解决方案**: `npm install zod --save`

---

## 🚀 启动项目

### 方式 1: 开发模式
```bash
cd D:\ClaudeCode\claude-config-hub
npm run dev
```

服务器将启动在: `http://localhost:3000`

### 方式 2: 生产构建
```bash
# 构建
npm run build

# 启动生产服务器
npm start
```

---

## ✅ 功能测试清单

### 首页 (`/`)
- [ ] 页面正常加载
- [ ] 按钮链接正常
- [ ] 模板卡片显示
- [ ] 页脚信息显示

### 模板列表页 (`/templates`)
- [ ] 页面正常加载
- [ ] 搜索框工作
- [ ] 筛选器显示
- [ ] 排序功能工作
- [ ] 模板卡片信息完整
- [ ] 复制按钮工作
- [ ] 骨架屏显示

### 模板详情页 (`/templates/nextjs-saas`)
- [ ] 页面正常加载
- [ ] 面包屑导航工作
- [ ] 模板内容显示
- [ ] 代码块有语法高亮
- [ ] 复制全部按钮工作
- [ ] 下载按钮工作
- [ ] 相关模板显示

### 关于页面 (`/about`)
- [ ] 页面正常加载
- [ ] 内容显示完整
- [ ] 链接工作正常

---

## 🐛 可能遇到的问题

### 问题 1: 端口被占用
**错误**: `Error: listen EADDRINUSE: address already in use :::3000`
**解决**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 或使用其他端口
PORT=3001 npm run dev
```

### 问题 2: 类型错误
**错误**: TypeScript 类型错误
**解决**:
- 检查 `tsconfig.json` 配置
- 运行 `npm run type-check` 查看具体错误
- 修复类型定义

### 问题 3: 样式不生效
**错误**: Tailwind CSS 样式不显示
**解决**:
- 检查 `tailwind.config.ts` 配置
- 确保 `globals.css` 被导入
- 重启开发服务器

### 问题 4: 图标不显示
**错误**: lucide-react 图标不显示
**解决**:
- 确保组件中正确导入图标
- 检查 `lucide-react` 是否安装
- 重启开发服务器

---

## 📦 必需依赖确认

以下依赖应该已安装：

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-themes": "^0.3.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "@radix-ui/react-slot": "^1.0.2",
    "tailwindcss-animate": "^1.0.7",
    "lucide-react": "^0.344.0",
    "zod": "^3.x.x" // 正在安装
  }
}
```

---

## 🔍 调试命令

### 检查依赖
```bash
npm list --depth=0
```

### 类型检查
```bash
npm run type-check
```

### Lint 检查
```bash
npm run lint
```

### 清理缓存
```bash
# 清理 .next 缓存
rm -rf .next

# 重新构建
npm run dev
```

---

## 📊 性能指标

### 期望的构建性能
- 初始加载: < 3 秒
- 页面转换: < 1 秒
- Lighthouse 分数: > 90

### 检查清单
- [ ] 首页加载速度
- [ ] 模板列表渲染
- [ ] 搜索响应速度
- [ ] 筛选响应速度
- [ ] 移动端适配

---

## 🚀 部署到 Vercel

### 自动部署（推荐）

1. 连接 GitHub 仓库
2. 导入项目到 Vercel
3. Vercel 自动检测 Next.js 项目
4. 配置构建设置
5. 部署！

### 手动部署

```bash
# 构建
npm run build

# 部署
vercel --prod
```

---

## 📝 环境变量

创建 `.env.local` 文件：

```env
# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 主题（可选）
NEXT_PUBLIC_THEME=default
```

---

## ✅ 测试成功标准

项目可以认为测试成功，当：

1. ✅ `npm run dev` 启动无错误
2. ✅ 首页可以访问 (`http://localhost:3000`)
3. ✅ 模板列表页正常显示
4. ✅ 至少一个模板详情页可以打开
5. ✅ 复制功能正常工作
6. ✅ 控制台无严重错误

---

**更新时间**: 2026-03-01 23:30
**状态**: 等待 zod 安装完成后测试

