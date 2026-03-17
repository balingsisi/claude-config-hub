# Next.js 15 Advanced Template

## Tech Stack
- next v15.x
- React 19
- TypeScript 5+
- Tailwind CSS v4

## Core Patterns

### Server Actions
```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  message: z.string(),
});

export async function submitForm(formData: FormData) {
  const validated = schema.parse({
    email: formData.get('email'),
    message: formData.get('message'),
  });

  await saveMessage(validated);
  revalidatePath('/messages');
}
```

### Parallel Routes
```typescript
// app/layout.tsx
export default function Layout({
  children,
  analytics,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <>
      {children}
      {analytics}
    </>
  );
}
```

### Intercepting Routes
```
app/
  @modal/
    (.)photo/[id]/page.tsx  # Intercepted
  photo/[id]/page.tsx       # Full page
```

### Partial Prerendering
```typescript
// app/page.tsx
import { unstable_setRequestLocale } from 'next-intl/server';

export const experimental_ppr = true;

export default function Page({ params }: { params: { locale: string } }) {
  unstable_setRequestLocale(params.locale);
  return (
    <main>
      <StaticContent />
      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>
    </main>
  );
}
```

## Common Commands

```bash
npx create-next-app@latest
npm run dev
npm run build
```

## Related Resources
- [Next.js Documentation](https://nextjs.org/docs)
