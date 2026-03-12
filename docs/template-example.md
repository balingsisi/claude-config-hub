# CLAUDE.md 模板示例

本文档展示了一个标准的 CLAUDE.md 模板结构，供贡献者参考。

---

## 完整模板示例

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: [Your Project Name]
**Type**: [Project Type: Web App / API / Mobile App / Library / CLI Tool]
**Tech Stack**: [Main technologies: Framework + Language + Database]
**Goal**: [Brief description of project goal]

---

## Tech Stack

### Frontend / Core
- **Framework**: [Framework name and version, e.g., Next.js 15, React 19]
- **Language**: [Programming language, e.g., TypeScript 5.9+]
- **Styling**: [CSS solution, e.g., Tailwind CSS 4.0]
- **UI Components**: [Component library, e.g., shadcn/ui]

### Backend / APIs (if applicable)
- **API**: [API framework, e.g., Next.js API Routes, Express]
- **Database**: [Database, e.g., PostgreSQL, MongoDB]
- **ORM**: [ORM tool, e.g., Prisma, Drizzle]
- **Authentication**: [Auth solution, e.g., NextAuth.js, Clerk]

### Development
- **Package Manager**: [Package manager, e.g., pnpm, npm, yarn]
- **Testing**: [Testing frameworks, e.g., Vitest, Jest, Playwright]
- **Linting**: [Linting tools, e.g., ESLint + Prettier]
- **Git Hooks**: [Git hooks, e.g., Husky + lint-staged]

---

## Code Standards

### Language Rules

#### TypeScript Rules (if using TypeScript)
- Use strict mode
- No `any` types without explicit justification
- Prefer explicit return types for public functions
- Use `interface` for object shapes, `type` for unions

\`\`\`typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
}

async function getUser(id: string): Promise<User | null> {
  const user = await db.user.findUnique({ where: { id } })
  return user
}

// ❌ Bad
async function getUser(id: any): any {
  // ...
}
\`\`\`

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`fetchUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserData`)
- **Files**: kebab-case (`user-profile.tsx`)
- **Folders**: kebab-case (`user-profile/`)

### File Organization
\`\`\`
project-root/
├── src/
│   ├── app/              # Application pages/routes
│   ├── components/       # Reusable components
│   │   ├── ui/          # Base UI components
│   │   └── features/    # Feature-specific components
│   ├── lib/             # Utility functions
│   ├── hooks/           # Custom hooks
│   ├── types/           # TypeScript types
│   ├── styles/          # Global styles
│   └── utils/           # Helper utilities
├── tests/               # Test files
├── docs/                # Documentation
└── public/              # Static assets
\`\`\`

---

## Architecture Patterns

### [Pattern Name 1] (e.g., Server Components)

**When to use**: [Description of use case]

\`\`\`typescript
// Example implementation
export default async function Page() {
  const data = await fetchData()
  return <Component data={data} />
}
\`\`\`

### [Pattern Name 2] (e.g., Repository Pattern)

**When to use**: [Description of use case]

\`\`\`typescript
// Example implementation
export class UserRepository {
  async findById(id: string) {
    return await db.user.findUnique({ where: { id } })
  }
}
\`\`\`

---

## Key Constraints

### Security
- ✅ All API routes must validate input
- ✅ Use parameterized queries for database operations
- ✅ Implement proper authentication and authorization
- ✅ Use environment variables for secrets
- ❌ No hardcoded API keys or secrets
- ❌ No SQL injection vulnerabilities
- ❌ No exposing sensitive data in client-side code

### Performance
- ✅ Implement proper caching strategies
- ✅ Optimize database queries
- ✅ Use lazy loading for large components
- ✅ Minimize bundle size
- ❌ No N+1 query problems
- ❌ No unnecessary re-renders
- ❌ No blocking the main thread

### Database (if applicable)
- ✅ Always use transactions for multi-step operations
- ✅ Implement proper indexes
- ✅ Use migrations for schema changes
- ❌ No raw SQL queries unless necessary
- ❌ No deleting data without backups
- ❌ No unindexed queries on large tables

---

## Common Commands

### Development
\`\`\`bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm type-check   # Run TypeScript type checking
\`\`\`

### Testing
\`\`\`bash
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e     # Run E2E tests
pnpm test:coverage # Run tests with coverage report
\`\`\`

### Database (if applicable)
\`\`\`bash
pnpm db:migrate   # Run database migrations
pnpm db:seed      # Seed database with sample data
pnpm db:studio    # Open database GUI tool
pnpm db:reset     # Reset database
\`\`\`

### Deployment
\`\`\`bash
pnpm build        # Build application
pnpm start        # Start production server
\`\`\`

---

## Important Prohibitions

### ❌ Never Do
- Don't use `any` type without explicit justification
- Don't commit `.env` files or secrets
- Don't skip error handling
- Don't ignore TypeScript errors
- Don't disable ESLint rules without good reason
- Don't create files larger than 300 lines - split them up
- Don't use `console.log` in production - use proper logging
- Don't bypass authentication or authorization checks

### ⚠️ Use with Caution
- `useEffect` - only for side effects, not data fetching
- `any` type - only when absolutely necessary
- Global state - prefer local state when possible
- Inline styles - use CSS classes instead
- Dynamic imports - only when code splitting is beneficial

---

## Best Practices

### Error Handling

\`\`\`typescript
// ✅ Good - Comprehensive error handling
export async function createUser(data: UserData) {
  try {
    // Validate input
    const validated = UserSchema.parse(data)
    
    // Create user
    const user = await db.user.create({
      data: validated
    })
    
    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' }
    }
    if (error instanceof DatabaseError) {
      logger.error('Database error:', error)
      return { success: false, error: 'Failed to create user' }
    }
    throw error
  }
}

// ❌ Bad - No error handling
export async function createUser(data: any) {
  return await db.user.create({ data })
}
\`\`\`

### Component Design

\`\`\`typescript
// ✅ Good - Small, focused component
interface ButtonProps {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export function Button({ 
  variant, 
  size, 
  children, 
  onClick,
  disabled 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'base-button-styles',
        variants[variant],
        sizes[size]
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// ❌ Bad - Large, unfocused component
export function MegaButton(props: any) {
  // 300+ lines of code
  // Multiple responsibilities
  // Hard to test and maintain
}
\`\`\`

### Data Fetching

\`\`\`typescript
// ✅ Good - Server Component with proper error handling
export default async function UserPage({ params }: { params: { id: string } }) {
  try {
    const user = await getUser(params.id)
    
    if (!user) {
      notFound()
    }
    
    return <UserProfile user={user} />
  } catch (error) {
    logger.error('Failed to fetch user:', error)
    throw error
  }
}

// ❌ Bad - Client-side fetching with useEffect
'use client'
export default function UserPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    fetch(\`/api/users/\${params.id}\`)
      .then(r => r.json())
      .then(setUser)
  }, [params.id])
  
  if (!user) return <Loading />
  return <UserProfile user={user} />
}
\`\`\`

---

## Quick Reference

### File Locations
- **Pages/Routes**: `src/app/**/page.tsx` or `src/pages/**`
- **API Routes**: `src/app/api/**/route.ts` or `src/pages/api/**`
- **Components**: `src/components/**`
- **Utilities**: `src/lib/**` or `src/utils/**`
- **Types**: `src/types/**`
- **Styles**: `src/styles/**`
- **Tests**: `tests/**` or `__tests__/**`

### Environment Variables
\`\`\`env
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://...

# Authentication (if applicable)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# External Services
API_KEY=...
STRIPE_SECRET_KEY=...
\`\`\`

### Git Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `chore/description` - Maintenance tasks

---

**Last Updated**: YYYY-MM-DD
```

---

## 模板编写清单

创建新模板时，请确保包含以下内容：

### ✅ 必需章节
- [ ] Project Overview
- [ ] Tech Stack
- [ ] Code Standards
- [ ] Key Constraints
- [ ] Common Commands
- [ ] Important Prohibitions
- [ ] Last Updated 日期

### ✅ 推荐章节
- [ ] Architecture Patterns
- [ ] Best Practices
- [ ] Quick Reference

### ✅ 质量检查
- [ ] 所有代码示例准确可运行
- [ ] 使用 ✅ Good 和 ❌ Bad 对比
- [ ] 命令经过验证
- [ ] Markdown 格式正确
- [ ] 链接有效
- [ ] 没有拼写错误

### ✅ 最佳实践
- [ ] 提供实际可用的示例
- [ ] 解释"为什么"而不仅是"是什么"
- [ ] 考虑不同场景和边缘情况
- [ ] 保持简洁但完整
- [ ] 使用清晰的标题和子标题

---

## 示例：不同类型项目的模板特点

### 前端项目（React/Vue/Angular）
- 重点：组件设计、状态管理、性能优化
- 包含：组件结构、样式方案、测试策略

### 后端 API（Node/Django/Spring）
- 重点：API 设计、数据库、认证授权
- 包含：路由结构、中间件、错误处理

### 全栈应用（Next.js/Nuxt）
- 重点：前后端集成、数据流、部署
- 包含：Server Components、API Routes、环境配置

### 移动应用（React Native/Flutter）
- 重点：跨平台、性能、原生集成
- 包含：导航、状态管理、平台特定代码

### 库/工具（npm package/CLI）
- 重点：API 设计、文档、测试
- 包含：构建配置、发布流程、版本管理

---

## 常见问题

### Q: 模板应该多详细？
A: 模板应该足够详细以提供实用指导，但不要过于冗长。通常 200-400 行为宜。

### Q: 需要包含所有技术细节吗？
A: 不需要。重点是最常用的 80% 场景。高级用法可以通过链接到外部文档。

### Q: 代码示例必须可运行吗？
A: 是的。所有代码示例应该是有效的、可运行的代码片段。

### Q: 如何处理多个技术栈选项？
A: 使用"或"提供选项，并说明何时选择哪个。例如：`ORM: Prisma (or Drizzle)`

### Q: 模板应该多久更新一次？
A: 当主要依赖项有重大更新时，或发现更好的实践时更新。至少每 6 个月审查一次。

---

## 相关资源

- [CONTRIBUTING.md](../CONTRIBUTING.md) - 完整贡献指南
- [现有模板](../src/data/templates/) - 查看其他模板示例
- [Claude Code 文档](https://claude.ai/code) - 官方文档

---

**Happy Contributing! 🎉**

如有疑问，请在 [GitHub Discussions](https://github.com/yourusername/claude-config-hub/discussions) 中提问。
