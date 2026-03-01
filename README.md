# Claude Config Hub

> CLAUDE.md 模板库 - 让 Claude Code 更好地理解你的项目

## 🚀 项目简介

Claude Config Hub 是一个专注于 CLAUDE.md 配置模板的社区平台，帮助开发者快速找到和使用高质量的配置模板。

### 核心功能

- 📚 **模板库**: 浏览和搜索各种项目的 CLAUDE.md 模板
- 🔍 **智能搜索**: 按框架、语言、类别快速筛选
- 📋 **一键复制**: 快速复制模板到你的项目
- ⭐ **社区评分**: 查看其他开发者的评分和反馈

## 🛠️ 技术栈

- **框架**: [Next.js 14](https://nextjs.org/) (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **组件**: [shadcn/ui](https://ui.shadcn.com/)
- **部署**: [Vercel](https://vercel.com/)

## 📦 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/claude-config-hub.git
cd claude-config-hub

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看结果。

## 🧰 开发命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
pnpm type-check

# 测试
pnpm test
pnpm test:e2e
```

## 📁 项目结构

```
claude-config-hub/
├── src/
│   ├── app/              # Next.js App Router 页面
│   ├── components/       # React 组件
│   │   ├── ui/          # shadcn/ui 组件
│   │   └── providers/   # Context providers
│   ├── lib/             # 工具函数
│   ├── types/           # TypeScript 类型定义
│   └── data/            # 静态数据
├── public/              # 静态资源
└── docs/               # 文档
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 📄 许可证

[MIT](LICENSE) - Claude Config Hub

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Claude Code](https://claude.ai/code)

---

**Made with ❤️ by the Claude Config Hub team**
