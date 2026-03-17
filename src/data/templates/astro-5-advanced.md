# Astro 5 Advanced Template

## Tech Stack
- astro v5.x
- React 18+
- TypeScript 5+
- Tailwind CSS v4.x

## Core Patterns

### Content Collections
```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string(),
    tags: z.array(z.string()),
  }),
});

export const collections = {
  blog: blogCollection,
};
```

### Dynamic Routes
```astro
---
// src/pages/blog/[slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<article>
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

### Server Islands
```astro
---
// src/components/Counter.astro
---
<client:visible>
  <div id="counter">Loading...</div>
</client:visible>

<script>
  document.getElementById('counter').textContent = 'Interactive!';
</script>
```

### API Routes
```typescript
// src/pages/api/contact.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  // Process contact form
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

## Common Commands

```bash
npm create astro@latest
npm run dev
npm run build
```

## Related Resources
- [Astro Documentation](https://docs.astro.build/)
