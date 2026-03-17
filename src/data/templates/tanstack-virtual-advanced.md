# TanStack Virtual Advanced Template

## Tech Stack
- @tanstack/react-virtual v3.x
- React 18+
- TypeScript 5+

## Core Patterns

### Virtualized List
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualList = ({ items }: { items: Item[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              transform: `translateY(${virtualRow.start}px)`,
              height: `${virtualRow.size}px`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Virtualized Grid
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualGrid = ({ items }: { items: Item[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(items.length / COLUMNS),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.key} style={{ position: 'absolute', transform: `translateY(${virtualRow.start}px)` }}>
            {items.slice(virtualRow.index * COLUMNS, (virtualRow.index + 1) * COLUMNS).map((item) => (
              <div key={item.id}>{item.name}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Infinite Scroll
```typescript
const { fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['items'],
  queryFn: ({ pageParam = 0 }) => fetchItems(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

const virtualizer = useVirtualizer({
  count: hasNextPage ? Infinity : items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});

// Fetch more when near bottom
useEffect(() => {
  const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
  if (lastItem && lastItem.index >= items.length - 5 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, [virtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage]);
```

## Common Commands

```bash
npm install @tanstack/react-virtual
npm run dev
```

## Related Resources
- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
