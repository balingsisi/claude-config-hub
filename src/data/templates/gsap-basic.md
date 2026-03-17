# GSAP Animation Template

## Tech Stack
- gsap v3.12+
- React 18+
- TypeScript 5+

## Core Patterns

### Basic Tween
```typescript
import gsap from 'gsap';

gsap.to('.box', {
  x: 100,
  rotation: 360,
  duration: 2,
  ease: 'power2.inOut'
});
```

### Timeline
```typescript
const tl = gsap.timeline();

tl.to('.box', { x: 100, duration: 1 })
  .to('.box', { y: 50, duration: 0.5 })
  .to('.box', { opacity: 0, duration: 0.5 });
```

### React Hook
```typescript
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export const useGSAP = (callback: (context: gsap.Context) => void) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => callback(ctx), ref);
    return () => ctx.revert();
  }, []);

  return ref;
};

// Usage
const MyComponent = () => {
  const ref = useGSAP(() => {
    gsap.from('.item', { opacity: 0, y: 50, stagger: 0.1 });
  });

  return <div ref={ref}>...</div>;
};
```

### ScrollTrigger
```typescript
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

gsap.to('.box', {
  x: 500,
  scrollTrigger: {
    trigger: '.box',
    start: 'top center',
    end: 'bottom center',
    scrub: true
  }
});
```

## Common Commands

```bash
npm install gsap
npm run dev
```

## Related Resources
- [GSAP Documentation](https://greensock.com/docs/)
- [ScrollTrigger](https://greensock.com/scrolltrigger/)
