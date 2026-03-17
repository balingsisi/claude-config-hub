# Directus 无头 CMS 模板

## 项目概述

使用 Directus 构建现代无头 CMS 应用的完整模板，支持自定义数据模型、RESTful API、GraphQL、文件管理和用户权限控制。

## 技术栈

- **CMS 核心**: Directus 10+
- **数据库**: PostgreSQL / MySQL / SQLite / CockroachDB / OracleDB / MSSQL
- **API**: RESTful + GraphQL
- **认证**: JWT / OAuth 2.0 / SSO
- **文件存储**: Local / S3 / GCS / Azure Blob
- **缓存**: Redis
- **前端 SDK**: Directus JS SDK
- **部署**: Docker / Node.js

## 项目结构

```
directus-cms/
├── extensions/              # 扩展目录
│   ├── hooks/              # 钩子扩展
│   │   ├── email-notification/
│   │   │   ├── index.js
│   │   │   └── package.json
│   │   └── data-validation/
│   ├── endpoints/          # 自定义端点
│   │   ├── custom-api/
│   │   │   ├── index.js
│   │   │   └── package.json
│   │   └── webhooks/
│   ├── interfaces/         # 自定义界面
│   │   ├── color-picker/
│   │   │   ├── index.js
│   │   │   └── src/
│   │   └── map-input/
│   ├── displays/           # 自定义显示
│   │   └── status-badge/
│   ├── panels/             # 自定义面板
│   │   └── analytics-chart/
│   └── operations/         # 自定义操作
│       └── data-export/
├── snapshots/              # Schema 快照
│   ├── current.yaml        # 当前 schema
│   └── migrations/         # Schema 迁移
├── uploads/                # 上传文件（本地存储）
├── .env                    # 环境变量
├── docker-compose.yml      # Docker 编排
├── directus.config.js      # Directus 配置
├── package.json
└── ecosystem.config.js     # PM2 配置
```

## 代码模式

### 1. 环境配置

```bash
# .env
# 数据库配置
DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=your_password

# Directus 配置
KEY=your-secret-key
SECRET=your-jwt-secret

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password

# 服务器配置
HOST=0.0.0.0
PORT=8055
PUBLIC_URL=http://localhost:8055

# 文件存储
STORAGE_LOCATIONS=local,s3
STORAGE_LOCAL_ROOT=./uploads
STORAGE_S3_KEY=your_s3_key
STORAGE_S3_SECRET=your_s3_secret
STORAGE_S3_BUCKET=your_bucket
STORAGE_S3_REGION=us-east-1

# 缓存
CACHE_ENABLED=true
CACHE_STORE=redis
CACHE_REDIS=redis://localhost:6379

# 邮件
EMAIL_FROM=no-reply@example.com
EMAIL_TRANSPORT=smtp
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your_email
EMAIL_SMTP_PASSWORD=your_password

# 认证
AUTH_PROVIDERS=google,github
AUTH_GOOGLE_CLIENT_ID=your_google_client_id
AUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_GOOGLE_ISSUER_URL=https://accounts.google.com
AUTH_GITHUB_CLIENT_ID=your_github_client_id
AUTH_GITHUB_CLIENT_SECRET=your_github_client_secret

# 速率限制
RATE_LIMITER_ENABLED=true
RATE_LIMITER_POINTS=25
RATE_LIMITER_DURATION=1

# CORS
CORS_ENABLED=true
CORS_ORIGIN=true
```

### 2. Docker 部署配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  directus:
    image: directus/directus:10
    ports:
      - 8055:8055
    volumes:
      - ./database:/directus/database
      - ./uploads:/directus/uploads
      - ./extensions:/directus/extensions
      - ./snapshots:/directus/snapshots
    environment:
      KEY: ${KEY}
      SECRET: ${SECRET}
      
      DB_CLIENT: pg
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: ${DB_DATABASE}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      
      PUBLIC_URL: ${PUBLIC_URL}
      
      CACHE_ENABLED: "true"
      CACHE_STORE: redis
      CACHE_REDIS: redis://redis:6379
      
      EMAIL_FROM: ${EMAIL_FROM}
      EMAIL_TRANSPORT: smtp
      EMAIL_SMTP_HOST: ${EMAIL_SMTP_HOST}
      EMAIL_SMTP_PORT: ${EMAIL_SMTP_PORT}
      EMAIL_SMTP_USER: ${EMAIL_SMTP_USER}
      EMAIL_SMTP_PASSWORD: ${EMAIL_SMTP_PASSWORD}
      
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - ./data/redis:/data
    restart: unless-stopped

  # 可选：反向代理
  nginx:
    image: nginx:alpine
    ports:
      - 80:80
      - 443:443
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - directus
    restart: unless-stopped
```

### 3. 数据模型定义

```yaml
# snapshots/current.yaml
version: 1
directus: 10.0.0

collections:
  - collection: articles
    meta:
      accountability: all
      archive_app_filter: true
      archive_field: status
      archive_value: archived
      collapse: open
      color: null
      display_template: null
      group: null
      hidden: false
      icon: article
      item_duplication_fields: null
      note: null
      singleton: false
      sort: null
      sort_field: null
      translations: null
      unarchive_value: draft
    schema:
      name: articles

  - collection: categories
    meta:
      accountability: all
      archive_app_filter: true
      archive_field: null
      archive_value: null
      collapse: open
      color: null
      display_template: null
      group: null
      hidden: false
      icon: folder
      item_duplication_fields: null
      note: null
      singleton: false
      sort: null
      sort_field: null
      translations: null
      unarchive_value: null
    schema:
      name: categories

  - collection: tags
    meta:
      accountability: all
      archive_app_filter: true
      archive_field: null
      archive_value: null
      collapse: open
      color: null
      display_template: null
      group: null
      hidden: false
      icon: label
      item_duplication_fields: null
      note: null
      singleton: false
      sort: null
      sort_field: null
      translations: null
      unarchive_value: null
    schema:
      name: tags

fields:
  # Articles 字段
  - collection: articles
    field: id
    meta:
      interface: input
      special:
        - uuid
      display: related-values
      readonly: true
      hidden: true
    schema:
      is_primary_key: true
      data_type: uuid

  - collection: articles
    field: status
    meta:
      interface: select-dropdown
      display: badges
      options:
        choices:
          - text: 草稿
            value: draft
            color: '#B1B1B1'
          - text: 已发布
            value: published
            color: '#00C897'
          - text: 已归档
            value: archived
            color: '#A2A2A2'
      display_options:
        choices:
          draft:
            color: '#B1B1B1'
          published:
            color: '#00C897'
            foreground: '#FFFFFF'
          archived:
            color: '#A2A2A2'
      width: half
    schema:
      default_value: draft
      data_type: string

  - collection: articles
    field: title
    meta:
      interface: input
      display: raw
      options:
        placeholder: 输入文章标题
      width: full
      sort: 1
    schema:
      is_nullable: false
      data_type: string

  - collection: articles
    field: slug
    meta:
      interface: input
      special:
        - slug
      display: raw
      options:
        placeholder: 自动生成或手动输入
        slug: true
      width: half
    schema:
      is_nullable: false
      data_type: string

  - collection: articles
    field: content
    meta:
      interface: input-rich-text-html
      display: raw
      options:
        toolbar:
          - bold
          - italic
          - underline
          - link
          - heading
          - bullist
          - numlist
          - image
        image: true
      width: full
    schema:
      data_type: text

  - collection: articles
    field: excerpt
    meta:
      interface: input-multiline
      display: raw
      options:
        placeholder: 输入文章摘要
      width: full
    schema:
      data_type: text

  - collection: articles
    field: featured_image
    meta:
      interface: file
      display: image
      width: half
    schema:
      data_type: uuid
      foreign_key_table: directus_files
      foreign_key_column: id

  - collection: articles
    field: category
    meta:
      interface: select-dropdown-m2o
      display: related-values
      options:
        template: '{{name}}'
      width: half
    schema:
      data_type: integer
      foreign_key_table: categories
      foreign_key_column: id

  - collection: articles
    field: tags
    meta:
      interface: list-m2m
      display: related-values
      options:
        template: '{{tags_id.name}}'
      width: full
    schema:
      data_type: alias

  - collection: articles
    field: author
    meta:
      interface: select-dropdown-m2o
      display: related-values
      special:
        - user-created
      options:
        template: '{{avatar}} {{first_name}} {{last_name}}'
      width: half
    schema:
      data_type: uuid
      foreign_key_table: directus_users
      foreign_key_column: id

  - collection: articles
    field: published_at
    meta:
      interface: datetime
      display: datetime
      special:
        - date-created
      width: half
      readonly: true
    schema:
      data_type: timestamp

  - collection: articles
    field: created_at
    meta:
      interface: datetime
      display: datetime
      special:
        - date-created
      width: half
      readonly: true
      hidden: true
    schema:
      data_type: timestamp

  - collection: articles
    field: updated_at
    meta:
      interface: datetime
      display: datetime
      special:
        - date-updated
      width: half
      readonly: true
      hidden: true
    schema:
      data_type: timestamp

  # Categories 字段
  - collection: categories
    field: id
    meta:
      interface: input
      special:
        - increment
      hidden: true
    schema:
      is_primary_key: true
      has_auto_increment: true
      data_type: integer

  - collection: categories
    field: name
    meta:
      interface: input
      display: raw
      options:
        placeholder: 输入分类名称
      width: full
    schema:
      is_nullable: false
      data_type: string

  - collection: categories
    field: slug
    meta:
      interface: input
      special:
        - slug
      display: raw
      options:
        placeholder: 自动生成
        slug: true
      width: half
    schema:
      is_nullable: false
      data_type: string

  - collection: categories
    field: description
    meta:
      interface: input-multiline
      display: raw
      width: full
    schema:
      data_type: text

  # Tags 字段
  - collection: tags
    field: id
    meta:
      interface: input
      special:
        - increment
      hidden: true
    schema:
      is_primary_key: true
      has_auto_increment: true
      data_type: integer

  - collection: tags
    field: name
    meta:
      interface: input
      display: raw
      options:
        placeholder: 输入标签名称
      width: full
    schema:
      is_nullable: false
      data_type: string

  - collection: tags
    field: slug
    meta:
      interface: input
      special:
        - slug
      display: raw
      options:
        placeholder: 自动生成
        slug: true
      width: half
    schema:
      is_nullable: false
      data_type: string

relations:
  - collection: articles
    field: category
    related_collection: categories
    meta:
      junction_field: null
    schema:
      on_delete: SET NULL

  - collection: articles
    field: author
    related_collection: directus_users
    meta:
      junction_field: null
    schema:
      on_delete: SET NULL

  - collection: articles_tags
    field: articles_id
    related_collection: articles
    meta:
      junction_field: tags_id
    schema:
      on_delete: CASCADE

  - collection: articles_tags
    field: tags_id
    related_collection: tags
    meta:
      junction_field: articles_id
    schema:
      on_delete: CASCADE
```

### 4. 自定义钩子扩展

```javascript
// extensions/hooks/email-notification/index.js
export default ({ action }, { logger, services, exceptions }) => {
  const { MailService } = services;
  const { ServiceUnavailableException } = exceptions;

  // 文章发布时发送邮件通知
  action('items.update', async (meta, { schema, database }) => {
    if (meta.collection !== 'articles') return;
    
    const { status } = meta.payload;
    const { status: previousStatus } = meta.keys;

    // 检查是否从草稿变为发布
    if (previousStatus === 'draft' && status === 'published') {
      try {
        const mailService = new MailService({ schema, knex: database });
        
        // 获取文章详情
        const article = await database('articles')
          .where({ id: meta.keys[0] })
          .first();

        // 获取订阅用户
        const subscribers = await database('subscribers')
          .where({ active: true });

        // 发送邮件
        for (const subscriber of subscribers) {
          await mailService.send({
            to: subscriber.email,
            subject: `新文章发布：${article.title}`,
            template: {
              name: 'article-published',
              data: {
                title: article.title,
                excerpt: article.excerpt,
                url: `${process.env.PUBLIC_URL}/articles/${article.slug}`,
              },
            },
          });
        }

        logger.info(`Notification sent to ${subscribers.length} subscribers`);
      } catch (error) {
        logger.error(error);
        throw new ServiceUnavailableException(error.message);
      }
    }
  });

  // 用户注册时发送欢迎邮件
  action('users.create', async (meta, { schema, database }) => {
    try {
      const mailService = new MailService({ schema, knex: database });
      
      await mailService.send({
        to: meta.payload.email,
        subject: '欢迎加入',
        template: {
          name: 'welcome',
          data: {
            name: meta.payload.first_name,
          },
        },
      });

      logger.info(`Welcome email sent to ${meta.payload.email}`);
    } catch (error) {
      logger.error(error);
    }
  });
};
```

### 5. 自定义端点扩展

```javascript
// extensions/endpoints/custom-api/index.js
export default (router, { services, database, exceptions }) => {
  const { ItemsService } = services;
  const { ForbiddenException, NotFoundException } = exceptions;

  // 获取热门文章
  router.get('/popular-articles', async (req, res) => {
    try {
      const articles = await database('articles')
        .select('articles.*', 'directus_files.filename_disk as image')
        .leftJoin('directus_files', 'articles.featured_image', 'directus_files.id')
        .where({ status: 'published' })
        .orderBy('views', 'desc')
        .limit(10);

      res.json({ data: articles });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 搜索文章
  router.get('/search', async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const articles = await database('articles')
        .select('articles.*', 'categories.name as category_name')
        .leftJoin('categories', 'articles.category', 'categories.id')
        .where({ 'articles.status': 'published' })
        .andWhere(function () {
          this.where('articles.title', 'like', `%${q}%`)
            .orWhere('articles.content', 'like', `%${q}%`)
            .orWhere('articles.excerpt', 'like', `%${q}%`);
        })
        .limit(20);

      res.json({ data: articles, query: q });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 增加文章浏览次数
  router.post('/articles/:id/view', async (req, res) => {
    try {
      const { id } = req.params;

      await database('articles')
        .where({ id })
        .increment('views', 1);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 获取统计数据
  router.get('/stats', async (req, res) => {
    try {
      const [
        totalArticles,
        publishedArticles,
        totalCategories,
        totalTags,
        totalViews,
      ] = await Promise.all([
        database('articles').count('* as count').first(),
        database('articles').where({ status: 'published' }).count('* as count').first(),
        database('categories').count('* as count').first(),
        database('tags').count('* as count').first(),
        database('articles').sum('views as total').first(),
      ]);

      res.json({
        data: {
          totalArticles: totalArticles.count,
          publishedArticles: publishedArticles.count,
          totalCategories: totalCategories.count,
          totalTags: totalTags.count,
          totalViews: totalViews.total || 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 批量操作
  router.post('/batch-update', async (req, res) => {
    try {
      const { collection, ids, action } = req.body;

      if (!req.accountability.admin) {
        throw new ForbiddenException('Only admins can perform batch operations');
      }

      switch (action) {
        case 'publish':
          await database(collection).whereIn('id', ids).update({ status: 'published' });
          break;
        case 'archive':
          await database(collection).whereIn('id', ids).update({ status: 'archived' });
          break;
        case 'delete':
          await database(collection).whereIn('id', ids).del();
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      res.json({ success: true, affected: ids.length });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });
};
```

### 6. 自定义界面扩展

```javascript
// extensions/interfaces/color-picker/index.js
import ColorPickerComponent from './src/color-picker.vue';

export default {
  id: 'color-picker',
  name: 'Color Picker',
  icon: 'palette',
  description: 'Advanced color picker with hex, rgb, and hsl support',
  component: ColorPickerComponent,
  options: {
    showAlpha: {
      name: 'Show Alpha',
      type: 'boolean',
      default: true,
    },
    format: {
      name: 'Output Format',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'HEX', value: 'hex' },
            { text: 'RGB', value: 'rgb' },
            { text: 'HSL', value: 'hsl' },
          ],
        },
      },
      default: 'hex',
    },
    presetColors: {
      name: 'Preset Colors',
      type: 'json',
      default: ['#FF0000', '#00FF00', '#0000FF'],
    },
  },
};
```

```vue
<!-- extensions/interfaces/color-picker/src/color-picker.vue -->
<template>
  <div class="color-picker">
    <div class="preview" :style="{ backgroundColor: value }" @click="showPicker = !showPicker"></div>
    
    <div v-if="showPicker" class="picker-dropdown">
      <input type="color" v-model="colorValue" @input="handleInput" />
      
      <div class="presets" v-if="presetColors.length">
        <div
          v-for="color in presetColors"
          :key="color"
          class="preset-color"
          :style="{ backgroundColor: color }"
          @click="selectColor(color)"
        ></div>
      </div>
      
      <div class="input-group">
        <input
          type="text"
          v-model="colorValue"
          :placeholder="format.toUpperCase()"
          @input="handleManualInput"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  props: {
    value: String,
    showAlpha: Boolean,
    format: String,
    presetColors: Array,
  },
  emits: ['input'],
  setup(props, { emit }) {
    const showPicker = ref(false);
    const colorValue = ref(props.value || '#000000');

    const handleInput = () => {
      const formattedColor = formatColor(colorValue.value, props.format);
      emit('input', formattedColor);
    };

    const handleManualInput = () => {
      emit('input', colorValue.value);
    };

    const selectColor = (color) => {
      colorValue.value = color;
      handleInput();
    };

    const formatColor = (color, format) => {
      // 实现颜色格式转换逻辑
      return color;
    };

    return {
      showPicker,
      colorValue,
      handleInput,
      handleManualInput,
      selectColor,
    };
  },
};
</script>

<style scoped>
.color-picker {
  position: relative;
}

.preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 2px solid #e0e0e0;
  cursor: pointer;
}

.picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.presets {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.preset-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #e0e0e0;
}

.input-group {
  margin-top: 8px;
}

.input-group input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
</style>
```

### 7. 前端 SDK 使用

```typescript
// frontend/src/lib/directus.ts
import { createDirectus, rest, graphql, authentication } from '@directus/sdk';
import type { Schema } from './schema';

const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

export const directus = createDirectus<Schema>(directusUrl)
  .with(authentication())
  .with(rest())
  .with(graphql());

// 认证服务
export const authService = {
  async login(email: string, password: string) {
    return await directus.login(email, password);
  },

  async logout() {
    return await directus.logout();
  },

  async refresh() {
    return await directus.refresh();
  },

  async getCurrentUser() {
    return await directus.request(
      rest.readMe({
        fields: ['*', 'role.*'],
      })
    );
  },

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    return await directus.request(
      rest.createUser({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      })
    );
  },

  async requestPasswordReset(email: string) {
    return await directus.request(rest.passwordRequest(email));
  },

  async resetPassword(token: string, password: string) {
    return await directus.request(rest.passwordReset(token, password));
  },
};

// 文章服务
export const articleService = {
  async getAll(params: {
    page?: number;
    limit?: number;
    filter?: any;
    sort?: string[];
  } = {}) {
    return await directus.request(
      rest.readItems('articles', {
        page: params.page || 1,
        limit: params.limit || 10,
        filter: params.filter,
        sort: params.sort || ['-created_at'],
        fields: [
          '*',
          'category.*',
          'author.*',
          'tags.tags_id.*',
        ],
      })
    );
  },

  async getBySlug(slug: string) {
    const articles = await directus.request(
      rest.readItems('articles', {
        filter: {
          slug: { _eq: slug },
        },
        fields: [
          '*',
          'category.*',
          'author.*',
          'tags.tags_id.*',
        ],
        limit: 1,
      })
    );

    return articles[0];
  },

  async search(query: string) {
    return await directus.request(
      rest.readItems('articles', {
        filter: {
          _or: [
            { title: { _contains: query } },
            { content: { _contains: query } },
            { excerpt: { _contains: query } },
          ],
        },
        fields: ['*', 'category.*'],
        limit: 20,
      })
    );
  },

  async create(data: any) {
    return await directus.request(
      rest.createItem('articles', data)
    );
  },

  async update(id: string, data: any) {
    return await directus.request(
      rest.updateItem('articles', id, data)
    );
  },

  async delete(id: string) {
    return await directus.request(
      rest.deleteItem('articles', id)
    );
  },
};

// 分类服务
export const categoryService = {
  async getAll() {
    return await directus.request(
      rest.readItems('categories', {
        fields: ['*', 'count(articles)'],
        sort: ['name'],
      })
    );
  },

  async getBySlug(slug: string) {
    const categories = await directus.request(
      rest.readItems('categories', {
        filter: {
          slug: { _eq: slug },
        },
        limit: 1,
      })
    );

    return categories[0];
  },
};

// 标签服务
export const tagService = {
  async getAll() {
    return await directus.request(
      rest.readItems('tags', {
        fields: ['*', 'count(articles)'],
        sort: ['name'],
      })
    );
  },
};

// 文件上传服务
export const fileService = {
  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return await directus.request(
      rest.uploadFiles(formData)
    );
  },

  async delete(id: string) {
    return await directus.request(
      rest.deleteFile(id)
    );
  },
};

// GraphQL 使用示例
export const graphqlService = {
  async getArticles() {
    const query = `
      query {
        articles {
          id
          title
          slug
          excerpt
          content
          status
          featured_image {
            id
            filename_disk
          }
          category {
            id
            name
            slug
          }
          author {
            id
            first_name
            last_name
          }
          tags {
            tags_id {
              id
              name
              slug
            }
          }
          created_at
          updated_at
        }
      }
    `;

    return await directus.graphql(query);
  },

  async getArticleBySlug(slug: string) {
    const query = `
      query($slug: String) {
        articles(filter: { slug: { _eq: $slug } }) {
          id
          title
          slug
          content
          excerpt
          status
          featured_image {
            id
            filename_disk
          }
          category {
            id
            name
            slug
          }
          author {
            id
            first_name
            last_name
            avatar {
              id
              filename_disk
            }
          }
          tags {
            tags_id {
              id
              name
              slug
            }
          }
          created_at
          updated_at
        }
      }
    `;

    const result = await directus.graphql(query, { slug });
    return result.articles[0];
  },
};
```

### 8. TypeScript 类型定义

```typescript
// frontend/src/lib/schema.ts
export interface Schema {
  articles: Article[];
  categories: Category[];
  tags: Tag[];
  articles_tags: ArticleTag[];
  directus_users: DirectusUser[];
  directus_files: DirectusFile[];
}

export interface Article {
  id: string;
  status: 'draft' | 'published' | 'archived';
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: DirectusFile | string;
  category: Category | number;
  tags: ArticleTag[];
  author: DirectusUser | string;
  views: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  articles?: Article[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  articles?: Article[];
}

export interface ArticleTag {
  id: number;
  articles_id: Article | string;
  tags_id: Tag | number;
}

export interface DirectusUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: DirectusFile | string;
  role: DirectusRole | string;
}

export interface DirectusFile {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  folder: string | null;
  uploaded_by: string;
  uploaded_on: string;
  modified_by: string | null;
  modified_on: string | null;
  charset: string | null;
  filesize: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  embed: string | null;
  description: string | null;
  location: string | null;
  tags: string | null;
  metadata: any;
}

export interface DirectusRole {
  id: string;
  name: string;
  icon: string;
  description: string;
  admin_access: boolean;
  enforce_tfa: boolean;
}
```

## 最佳实践

### 1. 权限配置

```yaml
# 权限配置示例
# 通过管理界面配置或 API

# 公开角色 - 未登录用户
public_permissions:
  articles:
    read:
      filter:
        status: _eq: published
      fields:
        - id
        - title
        - slug
        - excerpt
        - featured_image
        - category
        - tags
        - author
        - published_at
    create: false
    update: false
    delete: false

  categories:
    read: true
    create: false
    update: false
    delete: false

  tags:
    read: true
    create: false
    update: false
    delete: false

# 作者角色 - 登录用户
author_permissions:
  articles:
    read:
      filter:
        author: _eq: $CURRENT_USER
    create: true
    update:
      filter:
        author: _eq: $CURRENT_USER
    delete:
      filter:
        author: _eq: $CURRENT_USER

# 编辑角色
editor_permissions:
  articles:
    read: true
    create: true
    update: true
    delete: false

  categories:
    read: true
    create: true
    update: true
    delete: false

  tags:
    read: true
    create: true
    update: true
    delete: false

# 管理员角色 - 完全权限
admin_permissions:
  articles:
    read: true
    create: true
    update: true
    delete: true

  categories:
    read: true
    create: true
    update: true
    delete: true

  tags:
    read: true
    create: true
    update: true
    delete: true
```

### 2. 缓存策略

```javascript
// extensions/hooks/cache-invalidation/index.js
export default ({ filter }, { services, logger }) => {
  const { CacheService } = services;

  // 文章更新时清除缓存
  filter('items.update', async (payload, meta, { schema }) => {
    if (meta.collection === 'articles') {
      const cacheService = new CacheService({ schema });
      
      // 清除文章列表缓存
      await cacheService.clear('articles*');
      
      // 清除特定文章缓存
      await cacheService.clear(`article_${meta.keys[0]}`);
      
      logger.info(`Cache cleared for article ${meta.keys[0]}`);
    }
    
    return payload;
  });

  // 分类更新时清除缓存
  filter('items.update', async (payload, meta, { schema }) => {
    if (meta.collection === 'categories') {
      const cacheService = new CacheService({ schema });
      await cacheService.clear('categories*');
      await cacheService.clear('articles*');
    }
    
    return payload;
  });
};
```

### 3. 数据验证

```javascript
// extensions/hooks/data-validation/index.js
export default ({ filter }, { exceptions }) => {
  const { InvalidPayloadException } = exceptions;

  filter('items.create', async (payload, meta) => {
    if (meta.collection === 'articles') {
      // 验证标题长度
      if (payload.title && payload.title.length < 5) {
        throw new InvalidPayloadException('标题长度至少为5个字符');
      }

      // 验证内容长度
      if (payload.content && payload.content.length < 50) {
        throw new InvalidPayloadException('内容长度至少为50个字符');
      }

      // 验证 slug 格式
      if (payload.slug && !/^[a-z0-9-]+$/.test(payload.slug)) {
        throw new InvalidPayloadException('Slug 只能包含小写字母、数字和连字符');
      }
    }

    return payload;
  });

  filter('items.update', async (payload, meta) => {
    if (meta.collection === 'articles') {
      // 发布前验证必填字段
      if (payload.status === 'published') {
        if (!payload.title || !payload.content || !payload.category) {
          throw new InvalidPayloadException('发布文章前必须填写标题、内容和分类');
        }
      }
    }

    return payload;
  });
};
```

### 4. 文件处理

```javascript
// extensions/hooks/file-processing/index.js
export default ({ action }, { services, logger }) => {
  const { FilesService } = services;

  // 图片上传后自动压缩
  action('files.upload', async (meta, { schema, database }) => {
    const filesService = new FilesService({ schema, knex: database });

    if (meta.payload.type.startsWith('image/')) {
      try {
        // 这里可以集成图片处理库（如 Sharp）
        // await filesService.processImage(meta.key);
        
        logger.info(`Image processed: ${meta.key}`);
      } catch (error) {
        logger.error(`Failed to process image: ${error.message}`);
      }
    }
  });

  // 生成缩略图
  action('files.upload', async (meta, { schema, database }) => {
    if (meta.payload.type.startsWith('image/')) {
      // 生成不同尺寸的缩略图
      const sizes = [150, 300, 600, 1200];
      
      for (const size of sizes) {
        // await generateThumbnail(meta.key, size);
      }
    }
  });
};
```

### 5. 定时任务

```javascript
// extensions/hooks/scheduled-tasks/index.js
import cron from 'node-cron';

export default ({ schedule }, { services, database, logger }) => {
  const { ItemsService } = services;

  // 每天凌晨清理过期数据
  schedule('0 0 * * *', async () => {
    logger.info('Starting daily cleanup...');
    
    try {
      // 删除30天前的草稿
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await database('articles')
        .where({ status: 'draft' })
        .andWhere('updated_at', '<', thirtyDaysAgo)
        .del();

      logger.info('Daily cleanup completed');
    } catch (error) {
      logger.error('Daily cleanup failed:', error);
    }
  });

  // 每小时生成统计报告
  schedule('0 * * * *', async () => {
    logger.info('Generating hourly stats...');
    
    try {
      const stats = {
        total_articles: await database('articles').count('* as count').first(),
        published_articles: await database('articles')
          .where({ status: 'published' })
          .count('* as count')
          .first(),
        total_views: await database('articles').sum('views as total').first(),
      };

      await database('stats').insert({
        data: JSON.stringify(stats),
        created_at: new Date(),
      });

      logger.info('Hourly stats generated');
    } catch (error) {
      logger.error('Failed to generate stats:', error);
    }
  });

  // 每周备份
  schedule('0 2 * * 0', async () => {
    logger.info('Starting weekly backup...');
    // 执行备份逻辑
  });
};
```

## 常用命令

### 开发命令
```bash
# 启动开发服务器
npx directus start

# 启动开发服务器（带热重载）
npx directus start --watch

# 引导配置
npx directus bootstrap

# 数据库迁移
npx directus database migrate:latest
npx directus database migrate:rollback

# 创建管理员用户
npx directus users create --email admin@example.com --password admin123

# 重置密码
npx directus users passwd --email admin@example.com --password newpassword
```

### Schema 管理
```bash
# 创建 schema 快照
npx directus schema snapshot ./snapshots/current.yaml

# 应用 schema 快照
npx directus schema apply ./snapshots/current.yaml

# 差异比较
npx directus schema diff ./snapshots/current.yaml

# 导出数据
npx directus dump --export ./data/export.yaml

# 导入数据
npx directus apply ./data/export.yaml
```

### 扩展管理
```bash
# 创建扩展
npx directus extension create my-extension

# 安装扩展
npm install @directus/extension-my-extension

# 构建扩展
npm run build

# 发布扩展
npm publish
```

### Docker 命令
```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f directus

# 重启服务
docker-compose restart directus

# 停止服务
docker-compose down

# 备份数据库
docker-compose exec postgres pg_dump -U directus directus > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U directus directus < backup.sql
```

## 部署配置

### PM2 部署

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'directus',
      script: 'npx',
      args: 'directus start',
      cwd: '/var/www/directus',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8055,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/directus/error.log',
      out_file: '/var/log/directus/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

### Nginx 反向代理

```nginx
# /etc/nginx/sites-available/directus
upstream directus {
    server 127.0.0.1:8055;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name cms.example.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cms.example.com;

    ssl_certificate /etc/letsencrypt/live/cms.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cms.example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src * data: 'unsafe-eval' 'unsafe-inline'" always;

    # 文件上传大小限制
    client_max_body_size 100M;

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;

        proxy_pass http://directus;
        proxy_redirect off;

        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;

        # 缓存配置
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        expires 1h;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://directus;
        proxy_cache_valid 200 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 访问日志
    access_log /var/log/nginx/directus-access.log;
    error_log /var/log/nginx/directus-error.log;
}
```

### Kubernetes 部署

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: directus
  labels:
    app: directus
spec:
  replicas: 3
  selector:
    matchLabels:
      app: directus
  template:
    metadata:
      labels:
        app: directus
    spec:
      containers:
      - name: directus
        image: directus/directus:10
        ports:
        - containerPort: 8055
        env:
        - name: KEY
          valueFrom:
            secretKeyRef:
              name: directus-secret
              key: key
        - name: SECRET
          valueFrom:
            secretKeyRef:
              name: directus-secret
              key: secret
        - name: DB_CLIENT
          value: "pg"
        - name: DB_HOST
          value: "postgres-service"
        - name: DB_PORT
          value: "5432"
        - name: DB_DATABASE
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: database
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: ADMIN_EMAIL
          valueFrom:
            secretKeyRef:
              name: directus-secret
              key: admin-email
        - name: ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: directus-secret
              key: admin-password
        - name: PUBLIC_URL
          value: "https://cms.example.com"
        volumeMounts:
        - name: uploads
          mountPath: /directus/uploads
        - name: extensions
          mountPath: /directus/extensions
        livenessProbe:
          httpGet:
            path: /server/health
            port: 8055
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /server/health
            port: 8055
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: directus-uploads-pvc
      - name: extensions
        configMap:
          name: directus-extensions

---
apiVersion: v1
kind: Service
metadata:
  name: directus-service
spec:
  selector:
    app: directus
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8055
  type: LoadBalancer

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: directus-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
spec:
  tls:
  - hosts:
    - cms.example.com
    secretName: directus-tls
  rules:
  - host: cms.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: directus-service
            port:
              number: 80
```

## 性能优化

### 1. 数据库优化
- 为常用查询字段创建索引
- 使用连接池
- 定期清理和优化数据库
- 使用读写分离（大规模应用）

### 2. 缓存策略
- 启用 Redis 缓存
- 使用 CDN 加速静态资源
- 实现客户端缓存
- 配置合适的缓存过期时间

### 3. 文件存储优化
- 使用云存储（S3、GCS）
- 启用文件压缩
- 使用图片 CDN
- 实现懒加载

### 4. API 优化
- 使用字段选择减少数据传输
- 实现分页
- 批量操作
- 使用 GraphQL 替代多个 REST 请求

## 安全建议

- 定期更新 Directus 版本
- 使用强密码和双因素认证
- 配置防火墙规则
- 启用 HTTPS
- 定期备份数据
- 监控异常登录
- 限制文件上传类型和大小
- 配置适当的权限

## 参考资源

- [Directus 官方文档](https://docs.directus.io/)
- [Directus GitHub](https://github.com/directus/directus)
- [Directus 扩展市场](https://directus.market/)
- [Directus Discord 社区](https://discord.com/invite/directus)
- [Directus REST API](https://docs.directus.io/reference/introduction.html)
- [Directus GraphQL](https://docs.directus.io/guides/graphql.html)
