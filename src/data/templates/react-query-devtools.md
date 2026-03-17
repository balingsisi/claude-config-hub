# React Query Devtools Template

## Tech Stack
- @tanstack/react-query v5.x
- @tanstack/react-query-devtools v5.x
- React 18+

## Core Patterns

### Setup with Devtools
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
```

### Devtools Panel
```typescript
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';

export const CustomDevtools = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="devtools-container">
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Close' : 'Open'} Devtools
      </button>
      {isOpen && <ReactQueryDevtoolsPanel onClose={() => setIsOpen(false)} />}
    </div>
  );
};
```

### Query Inspector
```typescript
import { useQueryClient } from '@tanstack/react-query';

export const QueryStatus = () => {
  const queryClient = useQueryClient();
  const queries = queryClient.getQueryCache().getAll();

  return (
    <div>
      <h3>Active Queries: {queries.length}</h3>
      {queries.map(query => (
        <div key={query.queryHash}>
          <strong>{query.queryHash}</strong>
          <span>Status: {query.state.status}</span>
          <span>Updated: {query.state.dataUpdatedAt}</span>
        </div>
      ))}
    </div>
  );
};
```

## Common Commands

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
npm run dev
```

## Related Resources
- [React Query Devtools](https://tanstack.com/query/latest/docs/react/devtools)
