# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Strapi Headless CMS
**Type**: Content Management System
**Tech Stack**: Strapi 5 + Node.js + PostgreSQL/SQLite + REST/GraphQL API
**Goal**: Build a customizable headless CMS with content APIs for frontend applications

---

## Tech Stack

### Backend
- **Framework**: Strapi 5.x
- **Runtime**: Node.js 18+ / 20+
- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: Knex.js / Bookshelf (built-in)
- **Authentication**: JWT (built-in)
- **API**: REST + GraphQL

### Frontend Integration
- **Framework**: Any (Next.js, React, Vue, Nuxt, etc.)
- **HTTP Client**: Fetch / Axios / Apollo Client
- **Authentication**: JWT tokens

### Development
- **Package Manager**: npm/yarn/pnpm
- **Testing**: Jest
- **Database GUI**: Strapi Admin Panel

---

## Code Standards

### JavaScript/TypeScript Rules
- Use TypeScript for type safety
- Follow Strapi's file structure
- Use lifecycle hooks for business logic
- Keep controllers and services focused

```javascript
// ✅ Good - Service with proper typing
export default factories.createCoreService('api::article.article', ({ strapi }) => ({
  async findPublished(params) {
    const data = await strapi.entityService.findMany('api::article.article', {
      filters: { publishedAt: { $notNull: true } },
      ...params,
    })
    return data
  }
}))

// ❌ Bad - Inline complex logic
export default factories.createCoreService('api::article.article', ({ strapi }) => ({
  async processArticle(id) {
    // 100 lines of business logic...
  }
}))
```

### Naming Conventions
- **Content Types**: kebab-case (`blog-post`)
- **API Routes**: kebab-case (`/blog-posts`)
- **Fields**: camelCase (`publishedAt`)
- **Components**: PascalCase (`HeroSection`)
- **Services**: camelCase (`articleService`)

### File Organization
```
config/
├── database.js      # Database configuration
├── plugins.js       # Plugin configuration
├── server.js        # Server configuration
└── middlewares.js   # Middleware configuration
src/
├── api/             # API endpoints
│   ├── article/
│   │   ├── content-types/
│   │   │   └── article/
│   │   │       └── schema.json
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── middlewares/
├── components/      # Reusable components
│   └── shared/
│       └── hero-section.json
├── extensions/      # Plugin extensions
├── middlewares/     # Custom middleware
├── policies/        # Authorization policies
└── webhooks/        # Webhook handlers
public/
└── uploads/         # Uploaded files
database/
├── migrations/      # Database migrations
└── seeds/           # Database seeds
```

---

## Architecture Patterns

### Content Type Definition
- Define content types with schemas
- Use components for reusable fields
- Configure relations and validations
- Use lifecycle hooks for automation

```json
// ✅ Good - Content type schema
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article",
    "description": "Blog articles"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "content": {
      "type": "richtext"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::author.author"
    },
    "publishedAt": {
      "type": "datetime"
    }
  }
}
```

### Controller Pattern
- Use core controllers for CRUD operations
- Override methods for custom logic
- Use services for business logic
- Handle errors properly

```javascript
// ✅ Good - Custom controller
export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx
    
    // Custom logic
    const entities = await strapi.service('api::article.article').find({
      ...query,
      filters: {
        ...query.filters,
        publishedAt: { $notNull: true }
      }
    })
    
    const sanitizedEntities = await this.sanitizeOutput(entities, ctx)
    return this.transformResponse(sanitizedEntities)
  }
}))
```

### Service Layer
- Extract business logic to services
- Use entityService for database operations
- Implement custom methods
- Keep services focused

```javascript
// ✅ Good - Service with business logic
export default factories.createCoreService('api::article.article', ({ strapi }) => ({
  async publish(id) {
    const article = await strapi.entityService.update('api::article.article', id, {
      data: { publishedAt: new Date() }
    })
    
    // Trigger webhook
    await strapi.service('api::webhook.webhook').trigger('article.published', article)
    
    return article
  }
}))
```

### Lifecycle Hooks
- Use hooks for automation
- Validate data before save
- Trigger side effects after operations
- Handle errors gracefully

```javascript
// ✅ Good - Lifecycle hooks
export default {
  async beforeCreate(event) {
    const { data } = event.params
    
    // Auto-generate slug
    if (!data.slug) {
      data.slug = slugify(data.title)
    }
    
    // Validate author
    const author = await strapi.entityService.findOne('api::author.author', data.author)
    if (!author) {
      throw new Error('Author not found')
    }
  },
  
  async afterCreate(event) {
    const { result } = event
    
    // Send notification
    await strapi.service('api::notification.notification').send({
      type: 'article.created',
      data: result
    })
  }
}
```

---

## Key Constraints

### Security
- ✅ Configure proper CORS settings
- ✅ Use authentication for admin panel
- ✅ Validate user input in controllers
- ✅ Use environment variables for secrets
- ✅ Configure rate limiting
- ❌ Never expose admin panel publicly without auth
- ❌ Never store sensitive data in content types
- ❌ Never disable security middleware

### Performance
- ✅ Use database indexes for frequently queried fields
- ✅ Implement caching for API responses
- ✅ Use pagination for large datasets
- ✅ Optimize images on upload
- ❌ Don't fetch unnecessary relations
- ❌ Don't return all fields by default
- ❌ Don't skip pagination

### Content Modeling
- ✅ Use components for reusable field groups
- ✅ Define proper relations
- ✅ Use draft/publish for content workflow
- ✅ Validate field values
- ❌ Don't create overly complex content types
- ❌ Don't use dynamic zones excessively
- ❌ Don't duplicate common fields

---

## Common Commands

### Development
```bash
npm run develop        # Start development server with auto-reload
npm run start          # Start production server
npm run build          # Build admin panel
npm run strapi         # Run Strapi CLI commands
```

### Content Types
```bash
npm run strapi generate:content-type  # Generate content type interactively
npm run strapi generate:api           # Generate API (content type + routes + controller)
```

### Database
```bash
npm run strapi migration:generate     # Generate migration
npm run strapi migration:run          # Run migrations
```

### Installation
```bash
npx create-strapi-app@latest my-project  # Create new Strapi project
npm install @strapi/plugin-graphql       # Install GraphQL plugin
npm install @strapi/plugin-i18n          # Install i18n plugin
```

---

## Important Prohibitions

### ❌ Never Do
- Don't modify core files
- Don't skip input validation
- Don't store secrets in config files
- Don't expose admin panel without authentication
- Don't use SQLite in production
- Don't ignore security warnings
- Don't modify database schema manually
- Don't disable CORS without reason

### ⚠️ Use with Caution
- Raw database queries - use entityService instead
- Direct file system access - use upload plugin
- Custom authentication - prefer built-in JWT
- Webhooks with external services - ensure reliability

---

## Best Practices

### API Structure
- Use RESTful conventions
- Version your APIs
- Implement proper filtering and sorting
- Use GraphQL for complex queries

```javascript
// ✅ Good - RESTful API with filtering
// GET /api/articles?filters[category]=tech&sort=publishedAt:desc&pagination[limit]=10

// GraphQL query
query {
  articles(
    filters: { category: { eq: "tech" } }
    sort: "publishedAt:desc"
    pagination: { limit: 10 }
  ) {
    data {
      id
      attributes {
        title
        content
        publishedAt
      }
    }
  }
}
```

### Authentication
- Use built-in JWT authentication
- Implement role-based access control (RBAC)
- Secure API routes with policies
- Use API tokens for server-to-server

```javascript
// ✅ Good - Route with policy
{
  routes: [
    {
      method: 'GET',
      path: '/articles',
      handler: 'article.find',
      config: {
        policies: ['isAuthenticated']
      }
    }
  ]
}
```

### Webhooks
- Use webhooks for external integrations
- Implement retry logic
- Validate webhook payloads
- Use queue for heavy processing

```javascript
// ✅ Good - Webhook handler
module.exports = {
  async trigger(event, data) {
    const webhooks = await strapi.entityService.findMany('api::webhook.webhook', {
      filters: { event }
    })
    
    for (const webhook of webhooks) {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, data })
        })
      } catch (error) {
        strapi.log.error(`Webhook failed: ${webhook.url}`)
      }
    }
  }
}
```

---

## Quick Reference

### Content Type Fields
- `string` - Short text
- `text` - Long text
- `richtext` - Rich text editor
- `email` - Email address
- `password` - Password
- `number` - Number (integer, decimal, float)
- `date` / `datetime` / `time` - Date/time fields
- `boolean` - True/false
- `enumeration` - Enum values
- `json` - JSON data
- `media` - File uploads (single, multiple)
- `relation` - Relations to other content types
- `component` - Reusable field groups
- `dynamiczone` - Flexible component container

### Relations
- `oneToOne` - One-to-one
- `oneToMany` - One-to-many
- `manyToOne` - Many-to-one
- `manyToMany` - Many-to-many

### Common Plugins
- `@strapi/plugin-graphql` - GraphQL API
- `@strapi/plugin-i18n` - Internationalization
- `@strapi/plugin-users-permissions` - User authentication
- `@strapi/plugin-upload` - File upload
- `@strapi/plugin-email` - Email sending
- `@strapi/plugin-sentry` - Error tracking

---

**Last Updated**: 2026-03-17
