# Claude Code 智能记忆系统 - 产品需求文档 (PRD)

**项目名称**: Claude Code 智能记忆系统构建器
**文档版本**: v1.0
**创建日期**: 2026-03-01
**最后更新**: 2026-03-01
**文档状态**: 需求定义阶段
**目标发布**: MVP v1.0

---

## 📋 文档修订历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-03-01 | - | 初始版本，完成需求定义 |

---

## 📑 目录

- [1. 项目概述](#1-项目概述)
- [2. 用户分析](#2-用户分析)
- [3. 用户故事](#3-用户故事)
- [4. 功能需求](#4-功能需求)
- [5. 任务分解结构 (WBS)](#5-任务分解结构-wbs)
- [6. 验收标准](#6-验收标准)
- [7. 非功能性需求](#7-非功能性需求)
- [8. 技术架构](#8-技术架构)
- [9. 数据模型](#9-数据模型)
- [10. 接口设计](#10-接口设计)
- [11. 风险评估](#11-风险评估)
- [12. 发布计划](#12-发布计划)

---

## 1. 项目概述

### 1.1 项目背景

Claude Code 是一个强大的 AI 编程助手，但其核心功能 CLAUDE.md 记忆系统需要手动配置。这对新手用户造成了显著的使用门槛：

- **新手痛点**：不知道如何编写 CLAUDE.md，反复解释项目规范
- **效率问题**：每次新项目都要重复配置，浪费时间
- **质量不一致**：配置质量因人而异，影响 Claude Code 的效果
- **维护困难**：项目演进后，记忆系统难以同步更新

### 1.2 项目目标

**核心目标**：让 Claude Code 的第一次使用就像有经验的工程师在旁边指导

**具体目标**：
1. **零配置启动** - 新手打开项目即可自动获得高质量的记忆系统
2. **智能适应** - 自动识别项目类型、技术栈、代码风格
3. **持续进化** - 记忆系统随项目演进自动更新优化
4. **用户友好** - 交互式确认流程，不给新手压力

### 1.3 项目范围

**MVP v1.0 范围**：
- ✅ 基础项目分析引擎
- ✅ 智能模板匹配系统
- ✅ 规则生成引擎
- ✅ 交互式确认流程
- ✅ 基础文档和帮助系统

**后续版本范围**（不在 MVP 内）：
- ⏸️ 持续学习系统 (Hooks + Instinct)
- ⏸️ 规则自动更新机制
- ⏸️ 团队协作功能
- ⏸️ 高级 Agent 生成

### 1.4 成功指标

**用户层面**：
- 新手用户配置时间从 30+ 分钟降低到 2 分钟以内
- 配置质量评分达到 80%+ (基于用户反馈)
- 用户满意度 > 4.5/5.0

**技术层面**：
- 项目分析准确率 > 90%
- 模板匹配准确率 > 85%
- 生成的 CLAUDE.md 语法正确率 100%

---

## 2. 用户分析

### 2.1 目标用户

**主要用户**：新手开发者 (Primary)
- **特征**：0-6 个月开发经验，首次使用 Claude Code
- **痛点**：不知道如何配置 CLAUDE.md，不了解项目规范
- **需求**：快速上手，零学习成本

**次要用户**：中级开发者 (Secondary)
- **特征**：6-24 个月开发经验，用过 Claude Code
- **痛点**：每次新项目重复配置，维护成本高
- **需求**：自动化配置，智能更新

**高级用户**：高级开发者 (Tertiary)
- **特征**：2+ 年经验，熟悉 Claude Code 高级功能
- **痛点**：团队协作时配置不一致
- **需求**：团队共享配置，高级定制

### 2.2 用户场景

**场景 1：新项目初始化**
```
用户 Alice 刚克隆了一个新项目
→ 打开 Claude Code
→ 系统自动分析项目
→ 生成记忆系统
→ Alice 确认后开始使用
```

**场景 2：项目升级更新**
```
用户 Bob 的项目升级了框架版本
→ 运行更新命令
→ 系统检测到变化
→ 提示更新记忆系统
→ Bob 确认更新
```

**场景 3：团队协作**
``→ 团队共享 CLAUDE.md
→ 新成员加入项目
→ 自动获得团队规范
→ 统一开发体验
```

---

## 3. 用户故事

### 3.1 核心用户故事 (Must Have)

**US-001: 自动项目分析**
```
作为一个 新手开发者
我想要 Claude Code 自动分析我的项目
以便我不需要手动配置记忆系统

验收标准:
- 系统能识别项目使用的主要框架
- 系统能提取代码风格特征
- 系统能生成合理的规则建议
- 分析时间不超过 30 秒
```

**US-002: 智能模板匹配**
```
作为一个 新手开发者
我想要系统自动匹配适合我项目的模板
以便获得高质量的配置

验收标准:
- 系统能从模板库中找到最佳匹配
- 匹配结果有置信度评分
- 提供 2-3 个备选模板
```

**US-003: 交互式确认流程**
```
作为一个 新手开发者
我想要在应用配置前能够查看和调整
以便确保配置符合我的项目需求

验收标准:
- 分步骤展示配置内容
- 每个步骤可以编辑
- 提供默认选项快速跳过
- 有清晰的操作指引
```

**US-004: 生成结构化规则**
```
作为一个 开发者
我想要系统生成规范的 CLAUDE.md 和规则文件
以便后续易于维护和更新

验收标准:
- 生成符合规范的 CLAUDE.md
- 规则文件分类清晰
- 文件内容格式正确
- 包含必要的注释说明
```

### 3.2 重要用户故事 (Should Have)

**US-005: 配置更新机制**
```
作为一个 开发者
我想要在项目变化时能够更新记忆系统
以便保持配置与项目同步

验收标准:
- 能检测项目重大变化
- 提示用户更新配置
- 保留用户自定义规则
```

**US-006: 配置预览功能**
```
作为一个 开发者
我想要在应用配置前预览将要生成的内容
以便了解配置的详细情况

验收标准:
- 以友好的格式展示配置
- 高亮显示关键信息
- 支持分页浏览
```

**US-007: 快速规则添加**
```
作为一个 开发者
我想要快速添加新的规则
以便在开发过程中持续优化配置

验收标准:
- 支持命令行快速添加
- 自动追加到合适的位置
- 验证规则格式
```

### 3.3 可选用户故事 (Could Have)

**US-008: 多项目配置管理**
```
作为一个 开发者
我想要管理多个项目的配置
以便在不同项目间切换

验收标准:
- 支持项目配置列表
- 支持配置导入导出
- 支持配置模板共享
```

**US-009: 配置质量评分**
```
作为一个 开发者
我想要获得配置质量评分
以便了解配置的完善程度

验收标准:
- 提供配置完整性评分
- 指出缺失的重要配置
- 给出改进建议
```

**US-010: 团队配置同步**
```
作为一个 团队成员
我想要与团队共享配置
以便保持团队开发规范一致

验收标准:
- 配置文件纳入版本控制
- 支持团队配置模板
- 支持个人配置覆盖
```

### 3.4 未来版本用户故事 (Won't Have - MVP)

**US-101: 持续学习系统**
```
作为一个 开发者
我想要系统能从我的使用习惯中学习
以便自动优化配置

计划: v2.0 实现
```

**US-102: 智能 Instinct 提取**
```
作为一个 开发者
我想要系统能自动识别我的编码偏好
以便生成更个性化的配置

计划: v2.0 实现
```

---

## 4. 功能需求

### 4.1 功能优先级分类 (MoSCoW)

#### Must Have (必须有 - MVP 核心功能)

| 功能 ID | 功能名称 | 描述 | 优先级 |
|---------|----------|------|--------|
| F-001 | 项目配置分析 | 自动读取和分析项目配置文件 | P0 |
| F-002 | 技术栈识别 | 识别项目使用的技术栈和框架 | P0 |
| F-003 | 代码风格分析 | 提取项目的代码风格特征 | P0 |
| F-004 | 模板匹配引擎 | 从模板库中匹配最佳模板 | P0 |
| F-005 | 规则生成器 | 生成 CLAUDE.md 和规则文件 | P0 |
| F-006 | 交互式确认 UI | 分步骤确认和调整配置 | P0 |
| F-007 | 文件写入 | 将配置写入文件系统 | P0 |
| F-008 | 基础错误处理 | 处理常见错误情况 | P0 |

#### Should Have (应该有 - 重要功能)

| 功能 ID | 功能名称 | 描述 | 优先级 |
|---------|----------|------|--------|
| F-009 | 置信度评分 | 对分析结果进行置信度评分 | P1 |
| F-010 | 配置预览 | 预览将要生成的配置内容 | P1 |
| F-011 | 快速规则添加 | 支持 # 语法快速添加规则 | P1 |
| F-012 | 配置更新检测 | 检测项目变化并提示更新 | P1 |
| F-013 | 多模板选择 | 提供多个备选模板供选择 | P1 |
| F-014 | 规则验证 | 验证生成的规则格式正确性 | P1 |
| F-015 | 帮助文档 | 内置帮助和使用说明 | P1 |

#### Could Have (可以有 - 增强功能)

| 功能 ID | 功能名称 | 描述 | 优先级 |
|---------|----------|------|--------|
| F-016 | 配置导入导出 | 支持配置的导入和导出 | P2 |
| F-017 | 配置质量评分 | 对配置完整性进行评分 | P2 |
| F-018 | 自定义模板 | 支持用户创建自定义模板 | P2 |
| F-019 | 配置历史 | 保存配置的历史版本 | P2 |
| F-020 | 批量更新 | 批量更新多个项目的配置 | P2 |

#### Won't Have (不会有 - MVP 之外)

| 功能 ID | 功能名称 | 描述 | 计划版本 |
|---------|----------|------|----------|
| F-101 | 持续学习系统 | Hooks + Instinct 自动学习 | v2.0 |
| F-102 | Agent 自动生成 | 根据项目自动生成 Agent | v2.0 |
| F-103 | 团队协作 | 团队配置同步和冲突解决 | v2.0 |
| F-104 | 云端模板库 | 在线模板库和分享 | v3.0 |

---

### 4.2 功能详细规格

#### F-001: 项目配置分析

**功能描述**：自动读取和分析项目的配置文件

**输入**：
- 项目根目录路径
- 支持的配置文件类型：
  - `package.json` / `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`
  - `tsconfig.json`
  - `.eslintrc.*`
  - `.prettierrc.*`
  - `requirements.txt` / `pyproject.toml`
  - `go.mod`
  - `Cargo.toml`

**处理逻辑**：
1. 扫描项目根目录，查找配置文件
2. 解析配置文件内容
3. 提取关键信息：
   - 项目名称
   - 依赖和版本
   - 脚本命令
   - 配置选项
4. 验证数据完整性

**输出**：
```json
{
  "projectName": "my-app",
  "configFiles": ["package.json", "tsconfig.json"],
  "dependencies": {
    "next": "15.0.0",
    "react": "19.0.0",
    "typescript": "5.9.0"
  },
  "devDependencies": {
    "vitest": "2.0.0",
    "playwright": "1.40.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest"
  }
}
```

**错误处理**：
- 配置文件不存在：返回警告，继续分析
- 配置文件格式错误：返回错误信息，跳过该文件
- JSON 解析失败：返回具体错误位置

**验收标准**：
- [ ] 能正确解析 package.json
- [ ] 能正确解析 tsconfig.json
- [ ] 能处理配置文件不存在的情况
- [ ] 能处理格式错误的配置文件
- [ ] 分析时间 < 5 秒

---

#### F-002: 技术栈识别

**功能描述**：基于配置分析结果，识别项目的技术栈

**识别规则**：

**前端框架**：
```javascript
if (dependencies.includes('next')) return 'Next.js'
if (dependencies.includes('react')) return 'React'
if (dependencies.includes('vue')) return 'Vue'
if (dependencies.includes('svelte')) return 'Svelte'
if (dependencies.includes('@angular/core')) return 'Angular'
```

**后端框架**：
```javascript
if (dependencies.includes('express')) return 'Express'
if (dependencies.includes('fastify')) return 'Fastify'
if (dependencies.includes('django')) return 'Django'
if (dependencies.includes('flask')) return 'Flask'
if (dependencies.includes('gin-gonic')) return 'Gin'
```

**数据库**：
```javascript
if (dependencies.includes('prisma')) return 'Prisma'
if (dependencies.includes('@supabase/supabase-js')) return 'Supabase'
if (dependencies.includes('mongodb')) return 'MongoDB'
if (dependencies.includes('pg')) return 'PostgreSQL (raw)'
```

**测试框架**：
```javascript
if (devDependencies.includes('vitest')) return 'Vitest'
if (devDependencies.includes('jest')) return 'Jest'
if (devDependencies.includes('pytest')) return 'Pytest'
```

**输出**：
```json
{
  "framework": "Next.js",
  "frameworkVersion": "15.0.0",
  "language": "TypeScript",
  "languageVersion": "5.9.0",
  "uiLibrary": "React",
  "uiLibraryVersion": "19.0.0",
  "database": "Supabase",
  "testing": "Vitest",
  "buildTool": "Turbopack (Next.js built-in)",
  "styling": "CSS Modules / Tailwind"
}
```

**置信度计算**：
```javascript
confidence = {
  high: 0.9,   // 从明确依赖推断 (如 next, react)
  medium: 0.7, // 从相关依赖推断 (如 @types/node)
  low: 0.5     // 从目录结构推断
}
```

**验收标准**：
- [ ] 能准确识别主流框架 (React, Vue, Next.js)
- [ ] 能识别测试框架
- [ ] 能识别数据库类型
- [ ] 置信度评分合理
- [ ] 识别准确率 > 90%

---

#### F-003: 代码风格分析

**功能描述**：通过抽样分析代码文件，提取项目的代码风格特征

**抽样策略**：
1. 优先级文件：
   - `src/index.{ts,js,tsx,jsx}`
   - `src/App.{ts,js,tsx,jsx}`
   - `src/components/*.{ts,js,tsx,jsx}`
2. 抽样数量：10-20 个文件
3. 文件大小限制：< 1000 行

**分析维度**：

**缩进风格**：
```javascript
// 检测前 100 行
const tabCount = lines.filter(line => line.startsWith('\t')).length
const space2Count = lines.filter(line => /^  /).length
const space4Count = lines.filter(line => /^    /).length

// 返回最大值
return max(['tab', '2-space', '4-space'])
```

**引号风格**：
```javascript
const singleQuoteCount = (content.match(/'/g) || []).length
const doubleQuoteCount = (content.match(/"/g) || []).length

return singleQuoteCount > doubleQuoteCount ? 'single' : 'double'
```

**命名风格**：
```javascript
// 分析变量名
const camelCase = /^[a-z][a-zA-Z0-9]*$/
const snake_case = /^[a-z][a-z0-9_]*$/
const PascalCase = /^[A-Z][a-zA-Z0-9]*$/

// 统计各类命名占比
return {
  variables: 'camelCase',
  components: 'PascalCase',
  constants: 'UPPER_SNAKE_CASE'
}
```

**Import 风格**：
```javascript
// 检测导入方式
const hasDefaultExport = content.includes('export default')
const hasNamedExport = content.includes('export {')
const hasTypeImport = content.match(/import type \{/)

return {
  importStyle: 'named', // or 'default' or 'mixed'
  hasTypeImports: true,
  importOrder: ['react', 'libraries', 'components', 'relative']
}
```

**输出**：
```json
{
  "indentation": {
    "style": "space",
    "size": 2,
    "confidence": 0.95
  },
  "quotes": {
    "style": "double",
    "confidence": 0.88
  },
  "naming": {
    "components": "PascalCase",
    "utilities": "camelCase",
    "constants": "UPPER_SNAKE_CASE",
    "confidence": 0.92
  },
  "exports": {
    "style": "named", // vs default
    "confidence": 0.85
  },
  "semicolons": true,
  "trailingCommas": true,
  "fileSize": {
    "average": 245,
    "max": 580,
    "min": 45
  },
  "complexity": {
    "averageFunctionLength": 18,
    "maxNestingDepth": 3
  }
}
```

**验收标准**：
- [ ] 能准确检测缩进风格
- [ ] 能准确检测引号风格
- [ ] 能准确检测命名规范
- [ ] 置信度评分准确
- [ ] 分析时间 < 10 秒

---

#### F-004: 模板匹配引擎

**功能描述**：根据项目分析结果，从模板库中匹配最佳模板

**模板库结构**：
```javascript
const templateLibrary = [
  {
    id: 'nextjs-saas',
    name: 'Next.js SaaS Template',
    description: '适用于 Next.js 全栈 SaaS 应用',
    techStack: {
      framework: 'Next.js',
      version: '>=14.0.0',
      language: 'TypeScript',
      database: ['Supabase', 'PostgreSQL'],
      styling: ['Tailwind', 'CSS Modules']
    },
    structure: {
      hasAppDir: true,
      hasPagesDir: false,
      hasSrcDir: true
    },
    characteristics: {
      serverComponents: true,
      apiRoutes: true,
      serverActions: true
    },
    confidence: 0
  },
  // ... 更多模板
]
```

**匹配算法**：
```javascript
function matchTemplate(analysis, library) {
  const scores = library.map(template => {
    let score = 0
    let maxScore = 0

    // 技术栈匹配 (权重 40%)
    maxScore += 40
    if (analysis.framework === template.techStack.framework) {
      score += 15
      if (compareVersion(analysis.frameworkVersion, template.techStack.version) >= 0) {
        score += 10
      }
    }
    if (analysis.language === template.techStack.language) score += 10
    if (template.techStack.database.includes(analysis.database)) score += 5

    // 目录结构匹配 (权重 30%)
    maxScore += 30
    if (analysis.hasAppDir === template.structure.hasAppDir) score += 10
    if (analysis.hasSrcDir === template.structure.hasSrcDir) score += 10
    if (analysis.hasApiRoutes === template.structure.apiRoutes) score += 10

    // 特征匹配 (权重 20%)
    maxScore += 20
    if (analysis.serverComponents === template.characteristics.serverComponents) score += 10
    if (analysis.serverActions === template.characteristics.serverActions) score += 10

    // 代码风格匹配 (权重 10%)
    maxScore += 10
    const styleMatch = compareStyle(analysis.style, template.preferredStyle)
    score += styleMatch * 10

    return {
      ...template,
      matchScore: score,
      matchPercentage: (score / maxScore) * 100
    }
  })

  return scores.sort((a, b) => b.matchScore - a.matchScore)
}
```

**输出**：
```json
{
  "bestMatch": {
    "id": "nextjs-saas",
    "name": "Next.js SaaS Template",
    "matchScore": 92,
    "matchPercentage": 92,
    "matchDetails": {
      "techStack": "100%",
      "structure": "90%",
      "characteristics": "85%",
      "style": "80%"
    }
  },
  "alternatives": [
    {
      "id": "nextjs-standard",
      "name": "Next.js Standard Template",
      "matchScore": 75,
      "matchPercentage": 75
    }
  ]
}
```

**验收标准**：
- [ ] 能正确匹配主流项目类型
- [ ] 匹配算法合理
- [ ] 提供多个备选方案
- [ ] 匹配准确率 > 85%
- [ ] 匹配时间 < 2 秒

---

#### F-005: 规则生成器

**功能描述**：基于项目分析和模板匹配结果，生成 CLAUDE.md 和规则文件

**生成流程**：
```javascript
async function generateRules(analysis, template, userPreferences) {
  // 1. 合并分析和模板
  const merged = merge(analysis, template)

  // 2. 应用用户偏好
  const customized = applyPreferences(merged, userPreferences)

  // 3. 判断是否需要拆分规则
  const shouldSplit = customized.totalRules > 50 || customized.complexity > 'medium'

  // 4. 生成文件
  if (shouldSplit) {
    return await generateSplitRules(customized)
  } else {
    return await generateSingleFile(customized)
  }
}
```

**主文件生成 (CLAUDE.md)**：
```markdown
# Project: {{projectName}}

## 技术栈
- 前端: {{framework}} {{version}} + {{language}}
- 后端: {{backend}}
- 数据库: {{database}}
- 测试: {{testingFramework}}
- 包管理: {{packageManager}}

## 代码规范
{{#each codingRules}}
- {{this}}
{{/each}}

## 关键架构约束
{{#each constraints}}
- {{this}}
{{/each}}

## 常用命令
{{#each scripts}}
- {{@key}}: {{this}}
{{/each}}

## 重要禁止项
{{#each prohibitions}}
- {{this}}
{{/each}}

{{#if hasSplitRules}}
## 规则模块
{{#each ruleFiles}}
- {{name}} → @{{path}}
{{/each}}
{{/if}}

## Compact Instructions
使用 /compact 时，保留：
- 所有架构决策和 API 变更
- 测试命令和测试结果
- 已修改的文件列表和关键 diff

丢弃：
- 冗长的日志输出
- 探索性搜索的死胡同
```

**拆分规则文件**：

**tech-stack.md**:
```markdown
---
paths:
- "**/*"
---

# 技术栈规则

## 框架版本
- {{framework}}: {{version}}
- {{language}}: {{languageVersion}}

## 依赖管理
- 使用 {{packageManager}} 管理依赖
- 禁止直接提交 node_modules
- 定期更新依赖，关注安全公告
```

**coding-style.md**:
```markdown
---
paths:
- "src/**"
---

# 代码风格

## 命名规范
- 组件: {{naming.components}}
- 工具函数: {{naming.utilities}}
- 常量: {{naming.constants}}

## 代码组织
- 每个文件 {{fileSize.average}} 行为宜
- 函数不超过 {{complexity.maxFunctionLength}} 行
- 嵌套不超过 {{complexity.maxNestingDepth}} 层

## Import 顺序
{{#each importOrder}}
{{@index}}. {{this}}
{{/each}}
```

**testing.md**:
```markdown
---
paths:
- "src/**/*.test.{ts,js,tsx,jsx}"
- "tests/**"
---

# 测试规范

## 测试框架
- 使用 {{testingFramework}}

## 测试要求
- 新功能必须编写测试
- 测试覆盖率要求 > {{coverageTarget}}%
- 测试文件命名: *.test.{{ext}}

## 测试类型
- 单元测试: 测试独立函数
- 集成测试: 测试模块交互
- E2E 测试: 测试完整流程
```

**security.md**:
```markdown
---
paths:
- "src/**"
---

# 安全规则

## 禁止事项
- ❌ 禁止硬编码密钥和密码
- ❌ 禁止在客户端暴露敏感数据
- ❌ 禁止直接拼接 SQL

## 必须事项
- ✅ 所有用户输入必须校验
- ✅ 敏感操作必须鉴权
- ✅ API 必须实现速率限制
```

**输出结构**：
```
.claude/
├── CLAUDE.md (124 行)
├── CLAUDE.local.md (gitignore)
└── rules/
    ├── tech-stack.md (45 行)
    ├── coding-style.md (78 行)
    ├── testing.md (56 行)
    ├── security.md (34 行)
    └── git-workflow.md (23 行)
```

**验收标准**：
- [ ] 生成的 CLAUDE.md 格式正确
- [ ] 规则文件分类合理
- [ ] 内容完整且准确
- [ ] 包含必要的示例
- [ ] 生成时间 < 5 秒

---

#### F-006: 交互式确认 UI

**功能描述**：提供分步骤的交互式界面，让用户查看和调整配置

**界面流程**：

**步骤 1: 分析进度**
```
┌────────────────────────────────────────┐
│ 🔍 正在分析您的项目...                 │
├────────────────────────────────────────┤
│ ✓ 读取配置文件 (2s)                    │
│ ✓ 识别技术栈 (1s)                      │
│ ✓ 分析代码风格 (5s)                    │
│ ✓ 匹配模板 (1s)                        │
│                                        │
│ ████████████░░░░░░░░ 80%              │
└────────────────────────────────────────┘
```

**步骤 2: 分析结果概览**
```
┌────────────────────────────────────────┐
│ 📊 分析结果                            │
├────────────────────────────────────────┤
│ 技术栈:                                │
│   ✓ Next.js 15 + TypeScript 5.9       │
│   ✓ Supabase 数据库                    │
│                                        │
│ 代码风格 (置信度 92%):                 │
│   ✓ 2 空格缩进                         │
│   ✓ 双引号                             │
│   ✓ named export                       │
│                                        │
│ 匹配模板:                              │
│   🎯 Next.js SaaS 模板 (92% 匹配)      │
│                                        │
│ [查看详情]  [接受]  [选择其他]         │
└────────────────────────────────────────┘
```

**步骤 3: 配置详细查看**
```
┌────────────────────────────────────────┐
│ 📝 配置详情 - 第 1/3 页                │
├────────────────────────────────────────┤
│ 技术栈:                                │
│   • Next.js 15.0.0        [编辑]      │
│   • TypeScript 5.9.0      [编辑]      │
│   • Supabase              [编辑]      │
│                                        │
│ 核心约束:                              │
│   ✓ 使用 Server Components             │
│   ✓ 价格验证在服务端                   │
│   ✓ RLS 策略覆盖 CRUD                  │
│   [+ 添加约束]                         │
│                                        │
│ [上一页]  [下一页]  [接受全部]         │
└────────────────────────────────────────┘
```

**步骤 4: 确认并生成**
```
┌────────────────────────────────────────┐
│ ✅ 准备生成                            │
├────────────────────────────────────────┤
│ 将要生成的文件:                        │
│   ✓ CLAUDE.md (124 行)                 │
│   ✓ .claude/rules/tech-stack.md        │
│   ✓ .claude/rules/coding-style.md      │
│   ✓ .claude/rules/testing.md           │
│   ✓ .claude/rules/security.md          │
│                                        │
│ [取消]  [返回修改]  [确认生成]         │
└────────────────────────────────────────┘
```

**步骤 5: 完成**
```
┌────────────────────────────────────────┐
│ 🎉 配置生成完成！                      │
├────────────────────────────────────────┤
│ 记忆系统已就绪，您可以开始使用！       │
│                                        │
│ 下一步:                                │
│   1. 试用: 让 Claude 创建一个组件      │
│   2. 查看: cat CLAUDE.md               │
│   3. 调整: # 添加新规则                │
│                                        │
│ [开始使用]  [查看文档]                 │
└────────────────────────────────────────┘
```

**交互命令**：
```javascript
// 支持的命令
const commands = {
  '/init': '开始初始化流程',
  '/init --quick': '跳过确认，使用默认配置',
  '/init --custom': '完全自定义模式',
  '/refresh': '重新分析并更新配置',
  '# <rule>': '快速添加单条规则',
  '/memory': '打开编辑器修改配置',
  '/help': '显示帮助信息'
}
```

**验收标准**：
- [ ] 界面友好易懂
- [ ] 每个步骤都有清晰说明
- [ ] 支持快速跳过和自定义
- [ ] 错误提示清晰
- [ ] 支持中断和恢复

---

#### F-007: 文件写入

**功能描述**：将生成的配置内容写入文件系统

**写入流程**：
```javascript
async function writeConfigFiles(config, projectPath) {
  const results = []

  // 1. 创建 .claude 目录
  await createDirectory(join(projectPath, '.claude'))
  await createDirectory(join(projectPath, '.claude/rules'))

  // 2. 写入主文件
  const mainPath = join(projectPath, 'CLAUDE.md')
  await writeFile(mainPath, config.mainFile)
  results.push({ path: 'CLAUDE.md', status: 'created' })

  // 3. 写入规则文件
  for (const [name, content] of Object.entries(config.ruleFiles)) {
    const rulePath = join(projectPath, '.claude', 'rules', `${name}.md`)
    await writeFile(rulePath, content)
    results.push({ path: `.claude/rules/${name}.md`, status: 'created' })
  }

  // 4. 创建本地覆盖文件
  const localPath = join(projectPath, 'CLAUDE.local.md')
  await writeFile(localPath, '# 本地配置 (不提交到 Git)\n')
  results.push({ path: 'CLAUDE.local.md', status: 'created' })

  // 5. 更新 .gitignore
  await updateGitignore(projectPath, ['CLAUDE.local.md'])

  return results
}
```

**安全检查**：
```javascript
// 写入前检查
async function safeWrite(filePath, content) {
  // 1. 检查文件是否已存在
  if (await fileExists(filePath)) {
    const backupPath = `${filePath}.backup`
    await copyFile(filePath, backupPath)
  }

  // 2. 验证内容格式
  if (!validateMarkdown(content)) {
    throw new Error('Invalid markdown format')
  }

  // 3. 写入临时文件
  const tempPath = `${filePath}.tmp`
  await writeFile(tempPath, content)

  // 4. 验证写入结果
  const written = await readFile(tempPath)
  if (written !== content) {
    throw new Error('Write verification failed')
  }

  // 5. 重命名为最终文件
  await rename(tempPath, filePath)

  return { success: true, path: filePath }
}
```

**输出**：
```json
{
  "status": "success",
  "files": [
    {
      "path": "CLAUDE.md",
      "status": "created",
      "size": 4521
    },
    {
      "path": ".claude/rules/tech-stack.md",
      "status": "created",
      "size": 1234
    }
  ],
  "gitignoreUpdated": true,
  "backupCreated": false
}
```

**验收标准**：
- [ ] 能正确创建目录结构
- [ ] 文件内容写入完整
- [ ] 自动备份已存在文件
- [ ] 更新 .gitignore
- [ ] 提供详细的成功/失败反馈

---

#### F-008: 基础错误处理

**功能描述**：处理系统运行过程中的常见错误

**错误类型和处理**：

**E001: 项目目录无效**
```javascript
if (!await isDirectory(projectPath)) {
  return {
    error: 'E001',
    message: '无效的项目目录',
    details: `${projectPath} 不是一个有效的目录`,
    suggestion: '请检查路径是否正确，或在正确的项目目录下运行命令'
  }
}
```

**E002: 找不到配置文件**
```javascript
if (configFiles.length === 0) {
  return {
    error: 'E002',
    message: '未找到配置文件',
    details: '无法识别项目类型',
    suggestion: '请确保项目根目录有 package.json 或其他配置文件',
    canContinue: false
  }
}
```

**E003: 配置文件格式错误**
```javascript
try {
  const config = JSON.parse(content)
} catch (error) {
  return {
    error: 'E003',
    message: '配置文件格式错误',
    details: `${fileName}: ${error.message}`,
    location: error.line,
    suggestion: '请检查 JSON 格式是否正确',
    canContinue: true,
    skipFile: true
  }
}
```

**E004: 没有匹配的模板**
```javascript
if (bestMatch.matchPercentage < 50) {
  return {
    error: 'E004',
    message: '没有找到合适的模板',
    details: `最佳匹配度仅 ${bestMatch.matchPercentage}%`,
    suggestion: '选择"通用模板"或手动配置',
    alternatives: ['generic-template', 'custom']
  }
}
```

**E005: 文件写入失败**
```javascript
try {
  await writeFile(filePath, content)
} catch (error) {
  return {
    error: 'E005',
    message: '文件写入失败',
    details: `${filePath}: ${error.message}`,
    suggestion: '检查文件权限或磁盘空间',
    canRecover: true
  }
}
```

**E006: Git 操作失败**
```javascript
if (!await gitUpdateGitignore(projectPath, entries)) {
  return {
    error: 'E006',
    message: 'Git 操作失败',
    details: '无法更新 .gitignore',
    suggestion: '请手动更新 .gitignore',
    severity: 'warning'
  }
}
```

**错误输出格式**：
```javascript
{
  "success": false,
  "error": {
    "code": "E003",
    "message": "配置文件格式错误",
    "details": "package.json: Unexpected token } at line 15",
    "location": {
      "file": "package.json",
      "line": 15,
      "column": 23
    },
    "severity": "error", // error | warning | info
    "canContinue": true,
    "suggestion": "请检查 JSON 格式是否正确",
    "documentation": "https://docs.example.com/errors/e003"
  }
}
```

**验收标准**：
- [ ] 覆盖所有常见错误场景
- [ ] 错误信息清晰易懂
- [ ] 提供具体的解决建议
- [ ] 严重程度分类合理
- [ ] 支持错误恢复

---

## 5. 任务分解结构 (WBS)

### 5.1 Epic 层级

```
Epic 1: 项目分析引擎
├── Story 1.1: 配置文件读取
├── Story 1.2: 技术栈识别
└── Story 1.3: 代码风格分析

Epic 2: 模板系统
├── Story 2.1: 模板库创建
├── Story 2.2: 模板匹配引擎
└── Story 2.3: 模板自定义

Epic 3: 规则生成引擎
├── Story 3.1: CLAUDE.md 生成
├── Story 3.2: 规则文件生成
└── Story 3.3: 规则验证

Epic 4: 用户界面
├── Story 4.1: 命令行界面
├── Story 4.2: 交互式确认流程
└── Story 4.3: 帮助文档

Epic 5: 文件操作
├── Story 5.1: 文件写入
├── Story 5.2: Git 集成
└── Story 5.3: 备份和恢复

Epic 6: 测试和文档
├── Story 6.1: 单元测试
├── Story 6.2: 集成测试
└── Story 6.3: 用户文档
```

### 5.2 Story 级别详细任务

#### Epic 1: 项目分析引擎

**Story 1.1: 配置文件读取**
```
作为 开发者
我想要系统自动读取项目的配置文件
以便获得项目的基本信息

任务:
- Task 1.1.1: 实现 package.json 解析器
  - AC: 能正确解析 dependencies
  - AC: 能正确解析 devDependencies
  - AC: 能正确解析 scripts
  - AC: 能处理不存在的文件

- Task 1.1.2: 实现 tsconfig.json 解析器
  - AC: 能提取 compilerOptions
  - AC: 能识别 paths 配置
  - AC: 能处理 extends 字段

- Task 1.1.3: 实现其他配置文件解析器
  - AC: 支持 .eslintrc.*
  - AC: 支持 .prettierrc.*
  - AC: 支持 requirements.txt (Python)
  - AC: 支持 go.mod (Go)

验收标准:
- [ ] 所有解析器能正确处理格式正确的文件
- [ ] 所有解析器能优雅处理格式错误的文件
- [ ] 解析时间 < 5 秒
```

**Story 1.2: 技术栈识别**
```
作为 开发者
我想要系统自动识别项目的技术栈
以便匹配正确的模板

任务:
- Task 1.2.1: 实现前端框架识别
  - AC: 能识别 React, Vue, Angular, Svelte
  - AC: 能提取框架版本号
  - AC: 置信度评分合理

- Task 1.2.2: 实现后端框架识别
  - AC: 能识别 Express, Fastify, Django, Flask, Gin
  - AC: 能识别全栈框架 (Next.js, Nuxt)

- Task 1.2.3: 实现数据库识别
  - AC: 能识别 ORM (Prisma, TypeORM, SQLAlchemy)
  - AC: 能识别数据库驱动 (pg, mongodb)
  - AC: 能识别 BaaS (Supabase, Firebase)

- Task 1.2.4: 实现测试框架识别
  - AC: 能识别 Jest, Vitest, Pytest, Go test
  - AC: 能识别 E2E 框架 (Playwright, Cypress)

验收标准:
- [ ] 主流框架识别准确率 > 95%
- [ ] 置信度评分合理
- [ ] 识别时间 < 2 秒
```

**Story 1.3: 代码风格分析**
```
作为 开发者
我想要系统分析项目的代码风格
以便生成的规则符合项目习惯

任务:
- Task 1.3.1: 实现文件抽样逻辑
  - AC: 能智能选择代表性文件
  - AC: 抽样数量可配置 (默认 10-20 个)
  - AC: 能过滤过大的文件

- Task 1.3.2: 实现缩进风格检测
  - AC: 能识别 Tab vs 空格
  - AC: 能识别 2 空格 vs 4 空格
  - AC: 置信度 > 90%

- Task 1.3.3: 实现引号风格检测
  - AC: 能识别单引号 vs 双引号
  - AC: 能处理模板字符串
  - AC: 置信度 > 85%

- Task 1.3.4: 实现命名风格检测
  - AC: 能识别 camelCase, snake_case, PascalCase
  - AC: 能区分不同类型命名 (变量 vs 组件 vs 常量)
  - AC: 置信度 > 85%

- Task 1.3.5: 实现代码复杂度分析
  - AC: 能计算平均函数长度
  - AC: 能计算最大嵌套深度
  - AC: 能计算平均文件大小

验收标准:
- [ ] 所有检测准确率 > 85%
- [ ] 分析时间 < 10 秒
- [ ] 对低质量代码有容错性
```

#### Epic 2: 模板系统

**Story 2.1: 模板库创建**
```
作为 开发者
我想要系统提供丰富的模板库
以便匹配不同类型的项目

任务:
- Task 2.1.1: 创建 Next.js SaaS 模板
  - AC: 包含 50+ 条规则
  - AC: 覆盖 App Router 特性
  - AC: 包含安全规则
  - AC: 包含性能优化规则

- Task 2.1.2: 创建 React 组件库模板
  - AC: 包含组件开发规范
  - AC: 包含构建和发布规则
  - AC: 包含测试规范

- Task 2.1.3: 创建 Node.js API 模板
  - AC: 包含 API 设计规范
  - AC: 包含错误处理规范
  - AC: 包含安全最佳实践

- Task 2.1.4: 创建 Python Django 模板
  - AC: 包含 Django 项目结构规范
  - AC: 包含 ORM 使用规范
  - AC: 包含迁移管理规范

- Task 2.1.5: 创建通用模板
  - AC: 适用于任何项目
  - AC: 包含基础规则结构
  - AC: 易于定制

验收标准:
- [ ] 至少 5 个核心模板
- [ ] 每个模板包含 30+ 条规则
- [ ] 模板格式统一
- [ ] 模板文档完整
```

**Story 2.2: 模板匹配引擎**
```
作为 开发者
我想要系统能自动匹配最佳模板
以便获得最相关的配置

任务:
- Task 2.2.1: 实现匹配算法
  - AC: 技术栈权重 40%
  - AC: 目录结构权重 30%
  - AC: 特征权重 20%
  - AC: 代码风格权重 10%

- Task 2.2.2: 实现置信度计算
  - AC: 评分范围 0-100
  - AC: 提供匹配详情
  - AC: 低匹配时有提示

- Task 2.2.3: 实现备选方案
  - AC: 提供前 3 个备选模板
  - AC: 显示每个模板的匹配度
  - AC: 支持用户手动选择

验收标准:
- [ ] 匹配准确率 > 85%
- [ ] 匹配时间 < 2 秒
- [ ] 提供有意义的备选方案
```

**Story 2.3: 模板自定义**
```
作为 开发者
我想要能够自定义模板
以便满足特殊需求

任务:
- Task 2.3.1: 支持模板继承
  - AC: 可以从基础模板继承
  - AC: 可以覆盖特定规则
  - AC: 可以添加新规则

- Task 2.3.2: 支持模板变量
  - AC: 支持变量替换
  - AC: 支持条件渲染
  - AC: 支持循环渲染

- Task 2.3.3: 提供模板示例
  - AC: 至少 3 个自定义示例
  - AC: 示例文档清晰
  - AC: 易于理解和修改

验收标准:
- [ ] 继承机制工作正常
- [ ] 变量替换正确
- [ ] 示例易于理解
```

#### Epic 3: 规则生成引擎

**Story 3.1: CLAUDE.md 生成**
```
作为 开发者
我想要系统生成高质量的 CLAUDE.md
以便快速上手

任务:
- Task 3.1.1: 实现模板引擎
  - AC: 支持变量插值
  - AC: 支持条件渲染
  - AC: 支持循环渲染

- Task 3.1.2: 实现内容合并逻辑
  - AC: 合并分析结果和模板
  - AC: 应用用户偏好
  - AC: 去重和排序

- Task 3.1.3: 实现格式化
  - AC: Markdown 格式正确
  - AC: 缩进和换行正确
  - AC: 符合最佳实践

验收标准:
- [ ] 生成的文件格式正确
- [ ] 内容完整且准确
- [ ] 文件大小合理 (100-150 行)
```

**Story 3.2: 规则文件生成**
```
作为 开发者
我想要系统能生成拆分的规则文件
以便更好地组织和维护

任务:
- Task 3.2.1: 实现拆分决策逻辑
  - AC: 规则数 > 50 时拆分
  - AC: 复杂度高时拆分
  - AC: 用户可以强制拆分

- Task 3.2.2: 实现规则分类
  - AC: 按主题分类 (技术栈, 风格, 测试, 安全)
  - AC: 每个文件 30-50 行
  - AC: 文件名清晰

- Task 3.2.3: 实现 paths 配置
  - AC: 为每个规则文件配置 paths
  - AC: 支持 glob 模式
  - AC: 验证路径有效性

验收标准:
- [ ] 拆分逻辑合理
- [ ] 规则分类清晰
- [ ] paths 配置正确
```

**Story 3.3: 规则验证**
```
作为 开发者
我想要系统能验证生成的规则
以便确保质量

任务:
- Task 3.3.1: 实现语法验证
  - AC: 验证 Markdown 格式
  - AC: 验证 frontmatter 格式
  - AC: 验证链接有效性

- Task 3.3.2: 实现内容验证
  - AC: 检查必填字段
  - AC: 检查规则冲突
  - AC: 检查循环引用

- Task 3.3.3: 实现质量评分
  - AC: 评估完整性
  - AC: 评估准确性
  - AC: 提供改进建议

验收标准:
- [ ] 能捕获常见错误
- [ ] 错误提示清晰
- [ ] 质量评分合理
```

#### Epic 4: 用户界面

**Story 4.1: 命令行界面**
```
作为 用户
我想要通过简单的命令使用系统
以便快速完成配置

任务:
- Task 4.1.1: 实现基础命令
  - AC: /init 初始化
  - AC: /refresh 更新配置
  - AC: /help 显示帮助
  - AC: #<rule> 快速添加规则

- Task 4.1.2: 实现命令参数
  - AC: /init --quick 快速模式
  - AC: /init --custom 自定义模式
  - AC: /init --force 强制覆盖

- Task 4.1.3: 实现命令别名
  - AC: 支持短别名
  - AC: 支持自定义别名
  - AC: 别名文档清晰

验收标准:
- [ ] 所有命令工作正常
- [ ] 参数解析正确
- [ ] 错误提示清晰
```

**Story 4.2: 交互式确认流程**
```
作为 用户
我想要通过交互式界面确认配置
以便确保符合需求

任务:
- Task 4.2.1: 实现进度显示
  - AC: 显示当前步骤
  - AC: 显示进度条
  - AC: 显示预计剩余时间

- Task 4.2.2: 实现分页展示
  - AC: 支持多页展示
  - AC: 支持上下翻页
  - AC: 支持跳转到指定页

- Task 4.2.3: 实现编辑功能
  - AC: 支持内联编辑
  - AC: 支持取消编辑
  - AC: 支持恢复默认

- Task 4.2.4: 实现快速跳过
  - AC: 支持"全部接受"
  - AC: 支持"跳过此步"
  - AC: 支持"中断流程"

验收标准:
- [ ] 界面友好易用
- [ ] 响应及时
- [ ] 支持键盘快捷键
```

**Story 4.3: 帮助文档**
```
作为 用户
我想要获得清晰的帮助文档
以便更好地使用系统

任务:
- Task 4.3.1: 编写命令帮助
  - AC: 每个命令有详细说明
  - AC: 包含使用示例
  - AC: 包含常见问题

- Task 4.3.2: 编写配置指南
  - AC: 解释 CLAUDE.md 的作用
  - AC: 解释规则文件的结构
  - AC: 提供配置示例

- Task 4.3.3: 编写最佳实践
  - AC: 提供配置建议
  - AC: 提供常见模式
  - AC: 提供故障排除指南

验收标准:
- [ ] 文档完整且准确
- [ ] 示例易于理解
- [ ] 包含常见问题解答
```

#### Epic 5: 文件操作

**Story 5.1: 文件写入**
```
作为 系统
我想要安全地写入配置文件
以便避免数据丢失

任务:
- Task 5.1.1: 实现安全写入
  - AC: 写入前备份已存在文件
  - AC: 写入到临时文件后重命名
  - AC: 验证写入内容

- Task 5.1.2: 实现原子操作
  - AC: 要么全部成功，要么全部失败
  - AC: 失败时回滚
  - AC: 清理临时文件

- Task 5.1.3: 实现权限检查
  - AC: 检查写入权限
  - AC: 检查磁盘空间
  - AC: 提供清晰的错误提示

验收标准:
- [ ] 不会丢失用户数据
- [ ] 原子操作可靠
- [ ] 权限错误提示清晰
```

**Story 5.2: Git 集成**
```
作为 用户
我想要系统能集成 Git
以便更好地管理配置

任务:
- Task 5.2.1: 实现 .gitignore 更新
  - AC: 自动添加 CLAUDE.local.md
  - AC: 避免重复添加
  - AC: 支持自定义规则

- Task 5.2.2: 实现配置版本管理
  - AC: 配置文件纳入版本控制
  - AC: 提供配置历史
  - AC: 支持配置回滚

验收标准:
- [ ] Git 集成工作正常
- [ ] 不会破坏现有配置
- [ ] 支持团队协作
```

**Story 5.3: 备份和恢复**
```
作为 用户
我想要系统能备份和恢复配置
以便避免意外损失

任务:
- Task 5.3.1: 实现自动备份
  - AC: 覆盖前自动备份
  - AC: 保留最近 N 个备份
  - AC: 支持自定义备份位置

- Task 5.3.2: 实现恢复功能
  - AC: 列出所有备份
  - AC: 支持选择备份恢复
  - AC: 恢复前确认

验收标准:
- [ ] 备份可靠
- [ ] 恢复功能正常
- [ ] 不会占用过多空间
```

#### Epic 6: 测试和文档

**Story 6.1: 单元测试**
```
作为 开发者
我想要完善的单元测试
以便确保代码质量

任务:
- Task 6.1.1: 测试项目分析模块
  - AC: 覆盖率 > 80%
  - AC: 包含边界测试
  - AC: 包含错误处理测试

- Task 6.1.2: 测试模板匹配模块
  - AC: 覆盖率 > 80%
  - AC: 包含各种项目类型
  - AC: 包含边界情况

- Task 6.1.3: 测试规则生成模块
  - AC: 覆盖率 > 80%
  - AC: 包含格式验证
  - AC: 包含内容验证

验收标准:
- [ ] 整体覆盖率 > 75%
- [ ] 所有核心功能有测试
- [ ] 测试运行时间 < 30 秒
```

**Story 6.2: 集成测试**
```
作为 开发者
我想要完整的集成测试
以便确保各模块协同工作

任务:
- Task 6.2.1: 测试完整流程
  - AC: 从分析到生成的完整流程
  - AC: 包含各种项目类型
  - AC: 包含错误场景

- Task 6.2.2: 测试真实项目
  - AC: 至少测试 10 个真实项目
  - AC: 包含不同技术栈
  - AC: 记录和分析结果

验收标准:
- [ ] 所有测试通过
- [ ] 真实项目测试成功率 > 85%
```

**Story 6.3: 用户文档**
```
作为 用户
我想要完善的文档
以便快速上手

任务:
- Task 6.3.1: 编写快速开始指南
  - AC: 包含安装步骤
  - AC: 包含基本使用
  - AC: 包含示例输出

- Task 6.3.2: 编写完整文档
  - AC: 包含所有功能说明
  - AC: 包含配置参考
  - AC: 包含故障排除

- Task 6.3.3: 编写 API 文档
  - AC: 包含所有接口
  - AC: 包含参数说明
  - AC: 包含示例代码

验收标准:
- [ ] 文档完整且准确
- [ ] 新手能在 5 分钟内上手
- [ ] 文档易于维护
```

---

## 6. 验收标准

### 6.1 功能验收标准

#### F-001: 项目配置分析
- [ ] 能正确解析 package.json
- [ ] 能正确解析 tsconfig.json
- [ ] 能处理配置文件不存在的情况
- [ ] 能处理格式错误的配置文件
- [ ] 分析时间 < 5 秒

#### F-002: 技术栈识别
- [ ] 能准确识别主流框架 (React, Vue, Next.js)
- [ ] 能识别测试框架
- [ ] 能识别数据库类型
- [ ] 置信度评分合理
- [ ] 识别准确率 > 90%

#### F-003: 代码风格分析
- [ ] 能准确检测缩进风格
- [ ] 能准确检测引号风格
- [ ] 能准确检测命名规范
- [ ] 置信度评分准确
- [ ] 分析时间 < 10 秒

#### F-004: 模板匹配引擎
- [ ] 能正确匹配主流项目类型
- [ ] 匹配算法合理
- [ ] 提供多个备选方案
- [ ] 匹配准确率 > 85%
- [ ] 匹配时间 < 2 秒

#### F-005: 规则生成器
- [ ] 生成的 CLAUDE.md 格式正确
- [ ] 规则文件分类合理
- [ ] 内容完整且准确
- [ ] 包含必要的示例
- [ ] 生成时间 < 5 秒

#### F-006: 交互式确认 UI
- [ ] 界面友好易懂
- [ ] 每个步骤都有清晰说明
- [ ] 支持快速跳过和自定义
- [ ] 错误提示清晰
- [ ] 支持中断和恢复

#### F-007: 文件写入
- [ ] 能正确创建目录结构
- [ ] 文件内容写入完整
- [ ] 自动备份已存在文件
- [ ] 更新 .gitignore
- [ ] 提供详细的成功/失败反馈

#### F-008: 基础错误处理
- [ ] 覆盖所有常见错误场景
- [ ] 错误信息清晰易懂
- [ ] 提供具体的解决建议
- [ ] 严重程度分类合理
- [ ] 支持错误恢复

### 6.2 性能验收标准

- [ ] 项目分析时间 < 30 秒 (完整流程)
- [ ] 快速模式 < 10 秒
- [ ] 内存占用 < 200MB
- [ ] 启动时间 < 2 秒

### 6.3 质量验收标准

- [ ] 单元测试覆盖率 > 75%
- [ ] 集成测试覆盖所有主要流程
- [ ] 代码审查通过
- [ ] 无已知严重 Bug
- [ ] 文档完整

### 6.4 用户体验验收标准

- [ ] 新手能在 5 分钟内完成配置
- [ ] 配置成功率 > 95%
- [ ] 用户满意度 > 4.5/5.0
- [ ] 帮助文档完整且易懂

---

## 7. 非功能性需求

### 7.1 性能需求

| 指标 | 要求 | 测量方法 |
|------|------|----------|
| 响应时间 | 项目分析 < 30s | 性能测试 |
| 启动时间 | < 2s | 基准测试 |
| 内存占用 | < 200MB | 运行时监控 |
| CPU 占用 | < 50% (单核) | 性能分析 |
| 并发处理 | 支持 10+ 并发项目 | 压力测试 |

### 7.2 可靠性需求

| 指标 | 要求 | 测量方法 |
|------|------|----------|
| 可用性 | 99.9% | 运行统计 |
| MTBF | > 1000 小时 | 故障统计 |
| MTTR | < 10 分钟 | 恢复测试 |
| 数据完整性 | 100% | 校验测试 |

### 7.3 安全性需求

| 指标 | 要求 | 测量方法 |
|------|------|----------|
| 文件访问 | 仅访问项目目录 | 权限检查 |
| 数据传输 | 本地处理，无网络传输 | 代码审查 |
| 敏感信息 | 不读取敏感文件 | 安全扫描 |
| 依赖安全 | 无已知漏洞 | 依赖扫描 |

### 7.4 可维护性需求

| 指标 | 要求 | 测量方法 |
|------|------|----------|
| 代码质量 | 符合 ESLint 规范 | Lint 检查 |
| 测试覆盖 | > 75% | 覆盖率工具 |
| 文档完整 | 所有公共 API 有文档 | 文档审查 |
| 日志完整 | 关键操作有日志 | 日志审查 |

### 7.5 兼容性需求

| 指标 | 要求 | 测量方法 |
|------|------|----------|
| 操作系统 | Windows, macOS, Linux | 兼容性测试 |
| Node.js | >= 18.0.0 | 版本测试 |
| Claude Code | >= 1.0.0 | 版本测试 |
| 项目类型 | Web, 后端, 全栈 | 功能测试 |

### 7.6 可扩展性需求

| 指标 | 要求 | 测量方法 |
|------|------|----------|
| 模板扩展 | 支持自定义模板 | 功能测试 |
| 规则扩展 | 支持添加新规则 | 功能测试 |
| 插件系统 | 预留插件接口 | 架构审查 |

---

## 8. 技术架构

### 8.1 整体架构

```
┌─────────────────────────────────────────────────────┐
│                     CLI 层                          │
│  (命令解析、用户交互、进度显示)                       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                    业务逻辑层                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ 分析引擎 │  │ 匹配引擎 │  │ 生成引擎 │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                    数据访问层                        │
│  (文件读写、Git 操作、配置解析)                       │
└─────────────────────────────────────────────────────┘
```

### 8.2 技术栈

**核心技术**：
- **语言**: TypeScript 5.9+
- **运行时**: Node.js 18+
- **包管理**: pnpm
- **构建工具**: tsup
- **测试框架**: Vitest
- **CLI 框架**: Commander.js / Inquirer.js

**依赖库**：
- `chalk` - 终端颜色输出
- `ora` - 加载动画
- `inquirer` - 交互式提示
- `fs-extra` - 文件系统操作
- `glob` - 文件匹配
- `yaml` - YAML 解析
- `json5` - JSON5 解析

### 8.3 目录结构

```
claude-memory-system/
├── src/
│   ├── cli/              # CLI 层
│   │   ├── commands/     # 命令实现
│   │   ├── prompts/      # 交互式提示
│   │   └── utils/        # 工具函数
│   ├── core/             # 核心业务逻辑
│   │   ├── analyzer/     # 分析引擎
│   │   ├── matcher/      # 匹配引擎
│   │   └── generator/    # 生成引擎
│   ├── templates/        # 模板库
│   │   ├── nextjs-saas/
│   │   ├── react-lib/
│   │   └── ...
│   ├── utils/            # 通用工具
│   └── types/            # 类型定义
├── tests/                # 测试
│   ├── unit/
│   └── integration/
├── docs/                 # 文档
├── templates/            # 模板文件
└── package.json
```

### 8.4 核心模块设计

#### 8.4.1 分析引擎

```typescript
// src/core/analyzer/index.ts
export interface Analyzer {
  analyze(projectPath: string): Promise<AnalysisResult>
  analyzeConfigFiles(projectPath: string): Promise<ConfigAnalysis>
  analyzeTechStack(config: ConfigAnalysis): Promise<TechStack>
  analyzeCodeStyle(projectPath: string): Promise<CodeStyle>
}

export interface AnalysisResult {
  projectPath: string
  projectName: string
  configFiles: string[]
  techStack: TechStack
  codeStyle: CodeStyle
  structure: ProjectStructure
  confidence: number
}
```

#### 8.4.2 匹配引擎

```typescript
// src/core/matcher/index.ts
export interface Matcher {
  match(analysis: AnalysisResult): Promise<MatchResult>
  calculateScore(analysis: AnalysisResult, template: Template): number
}

export interface MatchResult {
  bestMatch: Template
  alternatives: Template[]
  matchDetails: MatchDetails
}
```

#### 8.4.3 生成引擎

```typescript
// src/core/generator/index.ts
export interface Generator {
  generate(analysis: AnalysisResult, template: Template): Promise<GeneratedFiles>
  generateMainFile(config: GenerationConfig): Promise<string>
  generateRuleFiles(config: GenerationConfig): Promise<Record<string, string>>
}
```

---

## 9. 数据模型

### 9.1 核心数据结构

#### ProjectAnalysis
```typescript
interface ProjectAnalysis {
  // 项目基本信息
  projectPath: string
  projectName: string

  // 配置文件分析
  configs: {
    packageJson?: PackageJson
    tsconfigJson?: TsConfigJson
    eslintConfig?: ESLintConfig
    prettierConfig?: PrettierConfig
  }

  // 技术栈
  techStack: {
    framework: string
    frameworkVersion: string
    language: string
    languageVersion: string
    database?: string
    testing: string[]
    buildTool: string
  }

  // 代码风格
  codeStyle: {
    indentation: { style: 'tab' | 'space', size: number }
    quotes: 'single' | 'double'
    naming: NamingStyle
    exports: 'named' | 'default' | 'mixed'
    semicolons: boolean
  }

  // 项目结构
  structure: {
    hasAppDir: boolean
    hasSrcDir: boolean
    hasTestsDir: boolean
  }

  // 置信度
  confidence: number
}
```

#### Template
```typescript
interface Template {
  id: string
  name: string
  description: string

  // 技术栈要求
  techStack: {
    framework?: string
    version?: string
    language?: string
    database?: string[]
  }

  // 目录结构
  structure?: {
    hasAppDir?: boolean
    hasSrcDir?: boolean
  }

  // 特征
  characteristics?: {
    serverComponents?: boolean
    apiRoutes?: boolean
  }

  // 首选代码风格
  preferredStyle?: CodeStyle

  // 规则内容
  rules: {
    main: string
    techStack?: string
    codingStyle?: string
    testing?: string
    security?: string
  }
}
```

#### GeneratedFiles
```typescript
interface GeneratedFiles {
  // 主文件
  mainFile: {
    path: string
    content: string
  }

  // 规则文件
  ruleFiles: {
    name: string
    path: string
    content: string
    paths?: string[]  // glob 模式
  }[]

  // 元数据
  metadata: {
    template: string
    confidence: number
    generatedAt: Date
  }
}
```

---

## 10. 接口设计

### 10.1 CLI 命令接口

#### /init
```bash
# 基础用法
claude-memory init

# 快速模式 (跳过确认)
claude-memory init --quick

# 自定义模式
claude-memory init --custom

# 强制覆盖
claude-memory init --force

# 选择模板
claude-memory init --template nextjs-saas

# 输出目录
claude-memory init --output /path/to/project
```

#### /refresh
```bash
# 更新配置
claude-memory refresh

# 仅分析不应用
claude-memory refresh --dry-run

# 显示详细差异
claude-memory refresh --diff
```

#### 其他命令
```bash
# 快速添加规则
claude-memory add "所有 API 必须使用 Zod 校验"

# 验证配置
claude-memory validate

# 显示帮助
claude-memory --help

# 显示版本
claude-memory --version
```

### 10.2 程序接口 (API)

#### 分析接口
```typescript
import { analyzeProject } from 'claude-memory-system'

const result = await analyzeProject({
  projectPath: '/path/to/project',
  options: {
    deepAnalysis: true,
    sampleSize: 20
  }
})
```

#### 生成接口
```typescript
import { generateMemory } from 'claude-memory-system'

const files = await generateMemory({
  analysis: result,
  template: 'nextjs-saas',
  customizations: {
    coverageTarget: 90,
    additionalRules: ['我的自定义规则']
  }
})
```

---

## 11. 风险评估

### 11.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 项目类型识别不准确 | 高 | 中 | 提供模板选择、置信度提示 |
| 代码风格分析错误 | 中 | 中 | 人工确认、提供编辑功能 |
| 模板库不完整 | 中 | 低 | 持续扩充、提供自定义模板 |
| 性能问题 (大项目) | 中 | 低 | 抽样分析、异步处理 |

### 11.2 产品风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 用户不信任自动生成的配置 | 高 | 中 | 提供透明度、人工确认 |
| 配置质量不满足需求 | 高 | 中 | 持续优化模板、收集反馈 |
| 学习曲线仍然存在 | 中 | 低 | 完善文档、提供示例 |
| 与 Claude Code 版本不兼容 | 中 | 低 | 版本锁定、兼容性测试 |

### 11.3 项目风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 开发时间超出预期 | 中 | 中 | MVP 范围控制、迭代开发 |
| 资源不足 | 高 | 低 | 分阶段实施、核心功能优先 |
| 需求变更 | 中 | 中 | 灵活架构、模块化设计 |

---

## 12. 发布计划

### 12.1 MVP 版本 (v1.0)

**目标**: 实现核心功能，验证产品价值

**时间**: 8 周

**功能范围**:
- ✅ 项目分析引擎
- ✅ 模板匹配系统
- ✅ 规则生成引擎
- ✅ 交互式确认 UI
- ✅ 基础错误处理
- ✅ 核心模板 (5 个)

**里程碑**:
- Week 1-2: 项目框架、分析引擎
- Week 3-4: 模板系统、匹配引擎
- Week 5-6: 生成引擎、UI
- Week 7-8: 测试、文档、修复

### 12.2 后续版本

**v1.1** (MVP + 4 周)
- 配置更新机制
- 更多模板 (10+)
- 配置质量评分
- 性能优化

**v2.0** (MVP + 12 周)
- 持续学习系统
- Hooks 自动观测
- Instinct 提取
- 规则自动进化

**v3.0** (MVP + 24 周)
- 云端模板库
- 团队协作功能
- Agent 自动生成
- 插件系统

---

## 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| CLAUDE.md | Claude Code 的项目记忆文件 |
| Skill | Claude Code 的可复用指令集 |
| Hook | Claude Code 的事件触发器 |
| Agent | 专业化的子代理 |
| Instinct | 提取的行为模式 |
| MVP | 最小可行产品 |
| WBS | 工作分解结构 |

### B. 参考资料

- [Claude Code 官方文档](https://docs.anthropic.com/claude-code)
- [everything-claude-code](https://github.com/...) (50,000+ Stars)
- [Markdown 规范](https://commonmark.org/)
- [TypeScript 最佳实践](https://typescript-eslint.io/)

### C. 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|----------|------|
| 2026-03-01 | v1.0 | 初始版本 | - |

---

**文档结束**
