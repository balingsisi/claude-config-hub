# 贡献指南

感谢您对 Claude Config Hub 的关注！我们欢迎各种形式的贡献。

## 📑 目录

- [如何贡献](#如何贡献)
- [贡献 CLAUDE.md 模板](#贡献-claudemd-模板)
- [模板文件结构](#模板文件结构)
- [命名规范](#命名规范)
- [提交 PR 流程](#提交-pr-流程)
- [代码规范](#代码规范)
- [测试](#测试)

---

## 🤝 如何贡献

### 报告 Bug

如果您发现了 bug，请：

1. 检查 [Issues](https://github.com/yourusername/claude-config-hub/issues) 确认问题未被报告
2. 创建新的 Issue，包含：
   - 清晰的标题
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（操作系统、浏览器版本等）

### 提交代码

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

## 📝 贡献 CLAUDE.md 模板

我们欢迎新的 CLAUDE.md 模板贡献！请遵循以下指南。

### 为什么贡献模板？

CLAUDE.md 模板帮助 Claude Code 更好地理解不同类型的项目，提供：
- 项目特定的代码规范
- 技术栈最佳实践
- 架构决策指导
- 常见命令和约束

### 模板质量标准

提交的模板应该：

✅ **完整性**
- 覆盖项目的主要技术栈
- 包含代码规范和最佳实践
- 提供实用的命令示例
- 说明重要约束和禁止事项

✅ **准确性**
- 技术信息正确且最新
- 代码示例可运行
- 命令经过验证

✅ **实用性**
- 解决实际问题
- 提供清晰指导
- 易于理解和应用

✅ **格式规范**
- 遵循模板结构
- Markdown 格式正确
- 包含必要的章节

---

## 🏗️ 模板文件结构

每个 CLAUDE.md 模板应包含以下核心章节：

### 1. 文件头部

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
```

### 2. Project Overview（必需）

```markdown
## Project Overview

**Project Name**: [项目名称]
**Type**: [项目类型，如：Full-stack Web Application, REST API, Mobile App]
**Tech Stack**: [主要技术栈]
**Goal**: [项目目标简述]
```

### 3. Tech Stack（必需）

详细列出技术栈，按类别组织：

```markdown
## Tech Stack

### Frontend / Core
- **Framework**: [框架名称和版本]
- **Language**: [编程语言]
- **Styling**: [样式方案]

### Backend / APIs
- **API**: [API 框架]
- **Database**: [数据库]
- **Authentication**: [认证方案]

### Development
- **Package Manager**: [包管理器]
- **Testing**: [测试框架]
- **Linting**: [代码检查工具]
```

### 4. Code Standards（必需）

定义代码规范：

```markdown
## Code Standards

### TypeScript/JavaScript Rules
- 使用示例说明 ✅ Good 和 ❌ Bad
- 类型安全要求
- 命名约定

### Naming Conventions
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case

### File Organization
```
项目目录结构示例
```
```

### 5. Architecture Patterns（推荐）

说明架构模式（如适用）：

```markdown
## Architecture Patterns

### [Pattern Name]
- 模式说明
- 使用场景
- 代码示例
```

### 6. Key Constraints（必需）

列出重要约束：

```markdown
## Key Constraints

### Security
- ✅ 必须做的事项
- ❌ 禁止的事项

### Performance
- ✅ 优化建议
- ❌ 避免的做法

### Database
- ✅ 数据库最佳实践
- ❌ 禁止的操作
```

### 7. Common Commands（必需）

提供常用命令：

```markdown
## Common Commands

### Development
\`\`\`bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm test         # 运行测试
\`\`\`

### Database
\`\`\`bash
pnpm db:migrate   # 运行迁移
pnpm db:seed      # 填充数据
\`\`\`
```

### 8. Important Prohibitions（必需）

明确禁止事项：

```markdown
## Important Prohibitions

### ❌ Never Do
- 列出绝对禁止的做法

### ⚠️ Use with Caution
- 需要谨慎使用的功能
```

### 9. Best Practices（推荐）

提供最佳实践：

```markdown
## Best Practices

### [Topic]
- 实践说明
- 代码示例（✅ Good vs ❌ Bad）
```

### 10. Quick Reference（推荐）

快速参考信息：

```markdown
## Quick Reference

### File Locations
- Pages: `src/app/**/page.tsx`
- Components: `src/components/**`

### Environment Variables
\`\`\`env
DATABASE_URL=...
API_KEY=...
\`\`\`
```

### 11. Last Updated（必需）

```markdown
---

**Last Updated**: YYYY-MM-DD
```

---

## 📋 命名规范

### 模板文件命名

模板文件应遵循以下命名规范：

```
<framework>-<type>.md
```

**示例**：
- `nextjs-saas.md` - Next.js SaaS 应用
- `react-component-library.md` - React 组件库
- `django-rest-api.md` - Django REST API
- `vue-3-vite.md` - Vue 3 + Vite 项目
- `spring-boot-api.md` - Spring Boot API
- `flutter-mobile.md` - Flutter 移动应用

**命名规则**：
- 使用小写字母
- 单词间用连字符 `-` 分隔
- 框架名在前，类型在后
- 避免使用缩写（除非广为人知）

### 模板元数据

在 `src/data/templates/index.ts` 中添加模板元数据：

```typescript
{
  id: 'your-template-id',
  name: 'Your Template Name',
  description: '简短描述模板的用途和特点',
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'library',
  framework: 'Framework Name',
  language: 'Language',
  tags: ['tag1', 'tag2', 'tag3'],
  author: 'Your Name',
  filename: 'your-template-name.md',
  popularity: 0, // 初始为 0
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
```

---

## 🚀 提交 PR 流程

### 1. 准备工作

```bash
# Fork 并克隆仓库
git clone https://github.com/YOUR_USERNAME/claude-config-hub.git
cd claude-config-hub

# 安装依赖
pnpm install

# 创建分支
git checkout -b template/your-template-name
```

### 2. 创建模板

```bash
# 创建模板文件
touch src/data/templates/your-template-name.md

# 参考现有模板
# 查看 src/data/templates/ 目录下的其他模板
```

### 3. 编写模板

参考 [docs/template-example.md](docs/template-example.md) 的标准结构编写模板。

**检查清单**：
- [ ] 包含所有必需章节
- [ ] 代码示例准确可运行
- [ ] 命令经过验证
- [ ] Markdown 格式正确
- [ ] 添加最后更新日期

### 4. 更新索引

在 `src/data/templates/index.ts` 中添加模板元数据：

```typescript
import yourTemplate from './your-template-name.md?raw'

export const templates: Template[] = [
  // ... 现有模板
  {
    id: 'your-template-id',
    name: 'Your Template Name',
    // ... 其他元数据
    filename: 'your-template-name.md',
  }
]

export const templateContents: Record<string, string> = {
  // ... 现有内容
  'your-template-id': yourTemplate,
}
```

### 5. 本地测试

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
# 验证模板显示正确
# 测试搜索和筛选功能
```

### 6. 提交更改

```bash
# 添加文件
git add src/data/templates/your-template-name.md
git add src/data/templates/index.ts

# 提交
git commit -m "feat: add your-template-name template

- Add template for [description]
- Include [key features]
- Update template index"

# 推送
git push origin template/your-template-name
```

### 7. 创建 Pull Request

1. 访问 GitHub 仓库
2. 点击 "Compare & pull request"
3. 填写 PR 描述：
   - **标题**：`feat: add [template-name] template`
   - **描述**：
     - 模板的用途
     - 包含的主要特性
     - 测试结果
     - 截图（如有必要）

### PR 模板

```markdown
## 描述
添加 [模板名称] CLAUDE.md 模板

## 模板类型
- [ ] Frontend
- [ ] Backend
- [ ] Full-stack
- [ ] Mobile
- [ ] Library

## 检查清单
- [ ] 遵循模板结构规范
- [ ] 代码示例准确
- [ ] 命令经过验证
- [ ] 更新了模板索引
- [ ] 本地测试通过

## 截图
[如有必要，添加截图]

## 相关 Issue
Closes #[issue-number]
```

---

## 🎨 代码规范

### 代码风格

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写清晰的注释

### Commit 消息

使用约定式提交（Conventional Commits）：

```bash
# 功能
git commit -m "feat: add template search functionality"

# 修复
git commit -m "fix: resolve layout issue on mobile"

# 文档
git commit -m "docs: update README with new features"

# 样式
git commit -m "style: format code with prettier"

# 重构
git commit -m "refactor: simplify template rendering logic"

# 模板
git commit -m "feat: add nextjs-saas template"
```

### Markdown 规范

- 使用 ATX 风格标题（`#`）
- 代码块指定语言
- 使用相对链接
- 添加适当的空行

---

## 🧪 测试

在提交 PR 前，请确保：

1. ✅ 所有测试通过
2. ✅ 添加必要的单元测试
3. ✅ 在不同浏览器中测试
4. ✅ 模板在网站上正确显示

```bash
# 运行测试
pnpm test

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 构建测试
pnpm build
```

---

## 💡 提示

### 模板灵感

不确定要贡献什么模板？查看：
- [GitHub Trending](https://github.com/trending)
- [State of JS](https://stateofjs.com/)
- [State of CSS](https://stateofcss.com/)
- 流行的开源项目

### 参考资源

- [Claude Code 官方文档](https://claude.ai/code)
- [现有模板](src/data/templates/) - 学习最佳实践
- [模板示例](docs/template-example.md) - 完整结构参考

### 获取帮助

- 💬 [GitHub Discussions](https://github.com/yourusername/claude-config-hub/discussions)
- 🐛 [GitHub Issues](https://github.com/yourusername/claude-config-hub/issues)
- 📧 Email: support@claudeconfig.com

---

## 📄 许可证

通过贡献代码，您同意您的贡献将根据 [MIT 许可证](LICENSE) 授权。

---

再次感谢您的贡献！🎉

**Made with ❤️ by the Claude Config Hub community**
