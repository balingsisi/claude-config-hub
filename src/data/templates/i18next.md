# i18next 国际化模板

## 技术栈

- **核心**: i18next, react-i18next
- **框架支持**: React, Next.js, Vue, Node.js
- **格式**: JSON, YAML, PO, ICU Message Format
- **工具**: i18next-scanner, i18next-parser
- **检测**: i18next-browser-languagedetector

## 项目结构

```
project/
├── public/
│   └── locales/
│       ├── en/
│       │   ├── common.json
│       │   ├── home.json
│       │   └── errors.json
│       ├── zh-CN/
│       │   ├── common.json
│       │   ├── home.json
│       │   └── errors.json
│       └── ja/
│           ├── common.json
│           ├── home.json
│           └── errors.json
├── src/
│   ├── i18n/
│   │   ├── index.ts           # i18next 配置
│   │   ├── react.tsx          # React 初始化
│   │   └── server.ts          # 服务端配置
│   ├── components/
│   │   └── LanguageSwitcher.tsx
│   └── app.tsx
├── i18next-scanner.config.js  # 扫描配置
└── package.json
```

## 代码模式

### 基础配置

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    ns: ['common', 'home', 'errors'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false, // React 已处理
    },
    
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    react: {
      useSuspense: true,
    },
  });

export default i18n;
```

### Next.js SSR 配置

```typescript
// src/i18n/server.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-fs-backend';
import { resolve } from 'path';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'home'],
    defaultNS: 'common',
    
    backend: {
      loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
    },
    
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

// 获取翻译资源
export function getServerSideTranslations(locale: string, namespaces: string[] = ['common']) {
  return i18n.getFixedT(locale, namespaces);
}
```

### React 组件使用

```typescript
// src/app.tsx
import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}

function HomePage() {
  const { t, i18n } = useTranslation('home');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description', { name: 'John' })}</p>
      <button onClick={() => i18n.changeLanguage('zh-CN')}>
        切换中文
      </button>
    </div>
  );
}

export default App;
```

### 翻译键使用

```typescript
// 基础使用
const { t } = useTranslation();
t('key'); // 简单键
t('namespace:key'); // 带命名空间

// 插值
t('greeting', { name: 'Alice' }); // "Hello, Alice!"
t('message', { count: 5, name: 'Bob' }); // "Bob has 5 items"

// 复数
t('item', { count: 1 }); // "1 item"
t('item', { count: 5 }); // "5 items"
t('item_other', { count: 5 }); // 明确指定复数形式

// 嵌套
t('deep.nested.key'); // 访问嵌套对象

// 默认值
t('missing_key', 'Default Text'); // 使用默认值

// 数组
t('array.0'); // 访问数组元素
t('array', { returnObjects: true }); // 返回整个对象

// 上下文
t('friend', { context: 'male' }); // "boyfriend"
t('friend', { context: 'female' }); // "girlfriend"
```

### 语言切换器

```typescript
// src/components/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={i18n.language === lang.code ? 'active' : ''}
        >
          <span className="flag">{lang.flag}</span>
          <span className="name">{lang.name}</span>
        </button>
      ))}
    </div>
  );
}

// 下拉选择器
export function LanguageSelect() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}
```

### Trans 组件（富文本）

```typescript
import { Trans } from 'react-i18next';

function RichTextExample() {
  return (
    <div>
      {/* HTML 标签 */}
      <Trans i18nKey="welcome">
        Welcome to <strong>our app</strong>!
      </Trans>

      {/* React 组件 */}
      <Trans i18nKey="linkText">
        Click <Link to="/help">here</Link> for help.
      </Trans>

      {/* 插值 + 组件 */}
      <Trans i18nKey="greeting" values={{ name: 'Alice' }}>
        Hello, {{ name }}! Please <Link to="/profile">view your profile</Link>.
      </Trans>

      {/* 复数 */}
      <Trans i18nKey="items" count={5}>
        You have {{ count }} items in your cart.
      </Trans>
    </div>
  );
}
```

### 复数规则

```json
// public/locales/en/common.json
{
  "item": "{{count}} item",
  "item_other": "{{count}} items",
  "item_0": "no items",
  "item_1": "one item"
}

// public/locales/zh-CN/common.json
{
  "item": "{{count}} 个项目",
  "item_0": "没有项目"
}

// public/locales/ar/common.json (阿拉伯语复杂复数)
{
  "item_0": "{{count}} عنصر",
  "item_1": "{{count}} عنصر",
  "item_2": "{{count}} عنصرين",
  "item_3": "{{count}} عناصر",
  "item_11": "{{count}} عنصرا",
  "item_100": "{{count}} عنصر"
}
```

### ICU Message Format

```typescript
import ICU from 'i18next-icu';

i18n.use(ICU).init({
  // ...
});

// 使用
t('select', { gender: 'female' });

// ICU 格式
{
  "select": "{gender, select, male{He} female{She} other{They}} likes this.",
  "plural": "You have {count, plural, =0{no items} one{# item} other{# items}}.",
  "number": "Price: {value, number, ::currency/USD}",
  "date": "Today is {date, date, medium}",
  "time": "Time: {time, time, short}"
}
```

### 命名空间

```typescript
// 加载多个命名空间
const { t } = useTranslation(['common', 'errors']);

// 使用
t('common:hello'); // 或
t('hello', { ns: 'common' }); // 或
t('errors:not_found'); // 明确指定

// 懒加载命名空间
const { t } = useTranslation('admin', { useSuspense: false });

// 动态加载
i18n.loadNamespaces(['admin', 'dashboard']).then(() => {
  // 加载完成
});
```

### 服务端使用

```typescript
// Express 中间件
import i18next from 'i18next';
import middleware from 'i18next-http-middleware';
import Backend from 'i18next-fs-backend';

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    initImmediate: false,
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['querystring', 'cookie', 'header'],
      caches: ['cookie'],
    },
  });

app.use(middleware.handle(i18next));

// 路由中使用
app.get('/api/message', (req, res) => {
  const t = req.t;
  res.json({
    message: t('greeting'),
  });
});
```

## 最佳实践

### 1. 翻译文件组织

```json
// public/locales/en/common.json
{
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save"
  },
  "errors": {
    "required": "This field is required",
    "email": "Invalid email address"
  },
  "validation": {
    "minLength": "Minimum {{min}} characters required",
    "maxLength": "Maximum {{max}} characters allowed"
  }
}

// 按功能模块分离
// home.json - 首页
// dashboard.json - 仪表板
// settings.json - 设置页
// errors.json - 错误消息
```

### 2. 键命名约定

```typescript
// ✅ 好的命名
'user.profile.title'
'errors.validation.required'
'buttons.submit'

// ❌ 避免的命名
'title' // 太通用
'btn1'  // 无意义
'This is a title' // 使用文本作为键
```

### 3. 性能优化

```typescript
// 懒加载命名空间
const AdminPanel = React.lazy(() => import('./AdminPanel'));

function App() {
  const { i18n } = useTranslation();
  
  const loadAdminNS = () => {
    i18n.loadNamespaces('admin');
  };

  return <div onMouseEnter={loadAdminNS}>...</div>;
}

// 缓存翻译
const { t } = useTranslation('common', { useSuspense: false });

// 服务端缓存
i18n.init({
  initImmediate: false, // 同步加载
  cache: {
    enabled: true,
    expirationTime: 7 * 24 * 60 * 60 * 1000, // 7 天
  },
});
```

### 4. 类型安全

```typescript
// types/i18next.d.ts
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    ns: ['common', 'home', 'errors'];
    resources: {
      common: typeof import('../public/locales/en/common.json');
      home: typeof import('../public/locales/en/home.json');
      errors: typeof import('../public/locales/en/errors.json');
    };
  }
}

// 使用时有类型提示
t('buttons.submit'); // ✅ 自动补全
t('nonexistent.key'); // ❌ 类型错误
```

## 常用命令

### 安装依赖

```bash
# React
npm install i18next react-i18next

# 浏览器检测
npm install i18next-browser-languagedetector

# HTTP 后端
npm install i18next-http-backend

# ICU 格式
npm install i18next-icu

# 扫描工具
npm install -D i18next-scanner
npm install -D i18next-parser
```

### 扫描翻译键

```javascript
// i18next-scanner.config.js
module.exports = {
  input: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
  ],
  output: 'public/locales',
  options: {
    debug: false,
    sort: true,
    func: {
      list: ['t', 'i18n.t'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    lngs: ['en', 'zh-CN', 'ja'],
    ns: ['common', 'home', 'errors'],
    defaultLng: 'en',
    defaultNs: 'common',
    defaultValue: '__STRING_NOT_TRANSLATED__',
    resource: {
      loadPath: 'public/locales/{{lng}}/{{ns}}.json',
      savePath: 'public/locales/{{lng}}/{{ns}}.json',
    },
  },
};
```

```bash
# 运行扫描
npx i18next-scanner

# 监听模式
npx i18next-scanner --watch
```

## 部署配置

### Next.js 配置

```javascript
// next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN', 'ja'],
    localeDetection: true,
  },
};

// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const locale = request.cookies.get('locale') || 'en';
  
  const response = NextResponse.next();
  response.cookies.set('locale', locale);
  
  return response;
}
```

### CDN 部署

```typescript
i18n.use(Backend).init({
  backend: {
    loadPath: 'https://cdn.example.com/locales/{{lng}}/{{ns}}.json',
    crossDomain: true,
  },
});

// 版本控制
backend: {
  loadPath: 'https://cdn.example.com/locales/v{{version}}/{{lng}}/{{ns}}.json',
  customHeaders: {
    'Cache-Control': 'public, max-age=31536000',
  },
}
```

### Docker 多语言

```dockerfile
# Dockerfile
FROM node:18-alpine

# 复制翻译文件
COPY public/locales /app/public/locales

# 环境变量
ENV DEFAULT_LOCALE=en

CMD ["npm", "start"]
```

## 翻译管理

### 导出/导入

```typescript
// 导出为 CSV
import { convertJsonToCsv } from 'i18next-json-to-csv';

convertJsonToCsv({
  inputPath: './public/locales',
  outputPath: './translations.csv',
  languages: ['en', 'zh-CN', 'ja'],
});

// 从 CSV 导入
import { convertCsvToJson } from 'i18next-csv-to-json';

convertCsvToJson({
  inputPath: './translations.csv',
  outputPath: './public/locales',
  languages: ['en', 'zh-CN', 'ja'],
});
```

### 翻译平台集成

```typescript
// Crowdin, Lokalise, Phrase 等
import { Lokalise } from '@lokalise/node-api';

const lokalise = new Lokalise({ apiKey: process.env.LOKALISE_API_KEY });

// 下载翻译
await lokalise.files.download('projectId', {
  format: 'json',
  original_filenames: true,
});

// 上传翻译
await lokalise.files.upload('projectId', {
  data: base64EncodedFile,
  filename: 'en.json',
  lang_iso: 'en',
});
```

## RTL 支持

```typescript
// 检测 RTL 语言
const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

function isRTL(lng: string): boolean {
  return rtlLanguages.includes(lng);
}

// 应用 RTL 样式
function App() {
  const { i18n } = useTranslation();
  
  return (
    <div dir={isRTL(i18n.language) ? 'rtl' : 'ltr'}>
      {/* content */}
    </div>
  );
}
```

## 测试

```typescript
// 测试翻译
import i18n from './i18n';

describe('i18n', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should translate key', () => {
    expect(i18n.t('hello')).toBe('Hello');
  });

  it('should support interpolation', () => {
    expect(i18n.t('greeting', { name: 'Alice' })).toBe('Hello, Alice!');
  });

  it('should change language', async () => {
    await i18n.changeLanguage('zh-CN');
    expect(i18n.t('hello')).toBe('你好');
  });
});
```

## 参考资料

- [i18next 官方文档](https://www.i18next.com/)
- [react-i18next 文档](https://react.i18next.com/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [翻译管理工具](https://www.i18next.com/how-to/translation-management)
