# PostCSS - 强大的CSS处理工具

## 技术栈

- **核心**: PostCSS 8.x
- **插件**: Autoprefixer, cssnano, PurgeCSS等
- **语法**: CSS, SCSS, SugarSS, CSS-in-JS
- **集成**: Webpack, Vite, Rollup, Gulp
- **用途**: CSS转换、优化、兼容性处理

## 项目结构

```
my-project/
├── src/
│   ├── styles/
│   │   ├── main.css
│   │   ├── components/
│   │   └── utilities/
│   └── index.ts
├── postcss.config.js    # PostCSS配置
├── .browserslistrc      # 浏览器兼容配置
├── package.json
└── dist/
    └── styles.css
```

## 代码模式

### 1. PostCSS配置 (postcss.config.js)

```javascript
module.exports = {
  plugins: [
    // 基础插件
    require('postcss-import'), // 处理@import
    require('postcss-nested'), // 嵌套规则
    require('postcss-custom-properties'), // CSS变量
    require('autoprefixer')({ // 自动添加前缀
      overrideBrowserslist: ['> 1%', 'last 2 versions']
    }),
    
    // 生产环境插件
    process.env.NODE_ENV === 'production' && require('cssnano')({
      preset: ['advanced', {
        discardComments: { removeAll: true },
        normalizeWhitespace: true
      }]
    }),
    
    // PurgeCSS移除未使用的CSS
    process.env.NODE_ENV === 'production' && require('@fullhuman/postcss-purgecss')({
      content: ['./src/**/*.html', './src/**/*.js'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
    })
  ].filter(Boolean)
}
```

### 2. 浏览器兼容配置 (.browserslistrc)

```
# .browserslistrc
> 1%
last 2 versions
not dead
not IE 11
maintained node versions
```

```json
// package.json
{
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

### 3. CSS语法示例

```css
/* main.css */
@import './variables.css';
@import './components/button.css';

:root {
  --primary-color: #3b82f6;
  --text-color: #1f2937;
  --spacing: 1rem;
}

.container {
  display: flex;
  gap: var(--spacing);
  
  /* 嵌套规则 */
  & .item {
    flex: 1;
    
    &:hover {
      background: var(--primary-color);
    }
    
    &-active {
      border: 2px solid var(--primary-color);
    }
  }
}

/* 自定义媒体查询 */
@custom-media --mobile (max-width: 640px);

@media (--mobile) {
  .container {
    flex-direction: column;
  }
}
```

### 4. Webpack集成

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: 'postcss.config.js'
              }
            }
          }
        ]
      }
    ]
  }
}
```

### 5. Vite集成

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('postcss-nested')
      ]
    }
  }
})
```

### 6. CLI使用

```javascript
// package.json
{
  "scripts": {
    "build:css": "postcss src/styles/main.css -o dist/styles.css",
    "watch:css": "postcss src/styles/main.css -o dist/styles.css --watch",
    "minify:css": "postcss src/styles/main.css -o dist/styles.min.css --config postcss.prod.js"
  }
}
```

## 最佳实践

### 1. 插件选择与配置

- ✅ 使用Autoprefixer自动添加浏览器前缀
- ✅ 使用cssnano压缩CSS
- ✅ 使用PurgeCSS移除未使用的CSS
- ✅ 使用postcss-import模块化CSS

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    // 1. 导入处理
    require('postcss-import')({
      root: './src',
      path: ['src/styles']
    }),
    
    // 2. 嵌套规则
    require('postcss-nested'),
    
    // 3. 自定义属性
    require('postcss-custom-properties')({
      preserve: true
    }),
    
    // 4. 自动前缀
    require('autoprefixer'),
    
    // 5. 压缩（生产环境）
    process.env.NODE_ENV === 'production' && require('cssnano')({
      preset: 'default'
    })
  ].filter(Boolean)
}
```

### 2. CSS模块化

```css
/* components/button.css */
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 0.5rem;
  
  &--primary {
    background: var(--primary-color);
    color: white;
  }
  
  &--secondary {
    background: transparent;
    border: 1px solid var(--primary-color);
  }
}
```

```javascript
// button.js
import styles from './button.css'

const button = `
  <button class="${styles.button} ${styles['button--primary']}">
    Click me
  </button>
`
```

### 3. CSS-in-JS支持

```javascript
// postcss.config.js for styled-components
module.exports = {
  plugins: [
    require('postcss-styled-components')(),
    require('autoprefixer')
  ]
}

// 或使用emotion
module.exports = {
  plugins: [
    require('@emotion/babel-plugin'),
    require('autoprefixer')
  ]
}
```

### 4. 性能优化

```javascript
// postcss.prod.js
module.exports = {
  plugins: [
    require('cssnano')({
      preset: ['advanced', {
        discardComments: { removeAll: true },
        reduceIdents: false, // 保留动画名称
        zindex: false, // 不修改z-index
        colormin: true, // 压缩颜色
        optimizeFont: true // 优化字体
      }]
    }),
    require('@fullhuman/postcss-purgecss')({
      content: [
        './src/**/*.html',
        './src/**/*.js',
        './src/**/*.jsx',
        './src/**/*.ts',
        './src/**/*.tsx'
      ],
      defaultExtractor: content => 
        content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: {
        standard: [/^ant-/, /^el-/], // 保留第三方库类名
        deep: [/modal$/],
        greedy: [/modal$/]
      }
    })
  ]
}
```

### 5. 开发工具

```javascript
// postcss.dev.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-nested'),
    require('autoprefixer'),
    // 开发环境添加source map
    require('postcss-sourcemaps')
  ]
}
```

## 常用命令

### CLI命令

```bash
# 安装
pnpm add -D postcss postcss-cli

# 基础构建
postcss src/styles/main.css -o dist/styles.css

# 监听模式
postcss src/styles/main.css -o dist/styles.css --watch

# 使用配置文件
postcss src/styles/main.css -o dist/styles.css --config

# 输出source map
postcss src/styles/main.css -o dist/styles.css --map

# 处理目录
postcss src/styles/*.css -d dist/styles/

# 详细输出
postcss src/styles/main.css -o dist/styles.css --verbose
```

### API使用

```javascript
const postcss = require('postcss')
const autoprefixer = require('autoprefixer')

async function processCSS(css) {
  const result = await postcss([autoprefixer]).process(css, {
    from: 'src/styles/main.css',
    to: 'dist/styles.css'
  })
  
  console.log(result.css)
  console.log(result.map) // source map
  console.log(result.messages) // 警告和错误
}

// 或使用配置文件
const { readFileSync, writeFileSync } = require('fs')
const postcssConfig = require('./postcss.config')

async function build() {
  const css = readFileSync('src/styles/main.css')
  const result = await postcss(postcssConfig.plugins).process(css, {
    from: 'src/styles/main.css',
    to: 'dist/styles.css'
  })
  
  writeFileSync('dist/styles.css', result.css)
  if (result.map) {
    writeFileSync('dist/styles.css.map', result.map)
  }
}
```

## 部署配置

### 1. 生产环境配置

```javascript
// postcss.prod.js
const cssnano = require('cssnano')
const purgecss = require('@fullhuman/postcss-purgecss')

module.exports = {
  plugins: [
    purgecss({
      content: ['./dist/**/*.html', './dist/**/*.js'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
    }),
    cssnano({
      preset: 'advanced'
    })
  ]
}
```

### 2. CI/CD集成

```yaml
# GitHub Actions
name: Build CSS

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build:css
      - uses: actions/upload-artifact@v4
        with:
          name: styles
          path: dist/styles.css
```

### 3. NPM脚本

```json
// package.json
{
  "scripts": {
    "dev:css": "postcss src/styles/main.css -o dist/styles.css --watch",
    "build:css": "cross-env NODE_ENV=production postcss src/styles/main.css -o dist/styles.css",
    "lint:css": "stylelint 'src/**/*.css'",
    "analyze:css": "css-stats dist/styles.css"
  }
}
```

### 4. 预处理器集成

```javascript
// postcss.config.js with SCSS
module.exports = {
  parser: 'postcss-scss', // 使用SCSS解析器
  plugins: [
    require('precss'), // SCSS-like语法
    require('autoprefixer'),
    require('cssnano')
  ]
}

// 或使用SugarSS
module.exports = {
  parser: 'sugarss', // 缩进语法
  plugins: [
    require('autoprefixer')
  ]
}
```

### 5. 监控与优化

```javascript
// 分析CSS大小
const analyzeCSS = require('css-analyzer')

async function analyze() {
  const css = readFileSync('dist/styles.css', 'utf-8')
  const stats = await analyzeCSS(css)
  
  console.log('Total selectors:', stats.selectors.total)
  console.log('Total declarations:', stats.declarations.total)
  console.log('Average selector complexity:', stats.selectors.averageComplexity)
  console.log('File size:', stats.size)
}

analyze()
```

## 关键特性

- 🔌 **插件系统**: 丰富的插件生态
- ⚡ **高性能**: 基于Node.js流处理
- 🛠️ **灵活配置**: 支持多种语法和处理器
- 🎨 **CSS转换**: 自动前缀、嵌套、变量等
- 📦 **压缩优化**: cssnano、PurgeCSS集成
- 🌐 **兼容性**: 自动处理浏览器差异
- 🔄 **开发体验**: Source map、watch模式
