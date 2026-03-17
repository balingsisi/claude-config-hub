# RxJS Template

## Project Overview

Reactive Extensions for JavaScript (RxJS) - a library for reactive programming using Observables, making it easier to compose asynchronous or callback-based code.

## Tech Stack

- **Library**: RxJS 7+
- **Language**: TypeScript
- **Patterns**: Observer Pattern, Iterator Pattern, Functional Programming
- **Use Cases**: Event handling, HTTP requests, State management, Animations

## Project Structure

```
rxjs-project/
├── src/
│   ├── observables/
│   │   ├── basic.ts          # Basic observable patterns
│   │   ├── custom.ts         # Custom observables
│   │   └── subjects.ts       # Subject variants
│   ├── operators/
│   │   ├── transformation.ts # map, mergeMap, switchMap
│   │   ├── filtering.ts      # filter, take, debounce
│   │   ├── combination.ts    # combineLatest, forkJoin
│   │   └── error-handling.ts # catchError, retry
│   ├── patterns/
│   │   ├── event-bus.ts      # Event bus pattern
│   │   ├── state-store.ts    # State management
│   │   └── websocket.ts      # WebSocket integration
│   └── utils/
│       ├── debug.ts          # Debugging utilities
│       └── testing.ts        # Testing helpers
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Patterns

### 1. Creating Observables

```typescript
// src/observables/basic.ts
import { Observable, of, from, fromEvent, interval, timer } from 'rxjs';

// Basic observable
const basic$ = new Observable<string>((subscriber) => {
  subscriber.next('Hello');
  subscriber.next('World');
  subscriber.complete();
});

// Creation operators
const of$ = of(1, 2, 3, 4, 5);
const from$ = from([1, 2, 3]);
const fromPromise$ = from(fetch('/api/data'));
const fromEvent$ = fromEvent(document, 'click');
const interval$ = interval(1000);
const timer$ = timer(2000, 1000); // Delay 2s, then every 1s

// Custom observable with cleanup
function httpObservable<T>(url: string): Observable<T> {
  return new Observable((subscriber) => {
    const controller = new AbortController();
    
    fetch(url, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        subscriber.next(data);
        subscriber.complete();
      })
      .catch((err) => subscriber.error(err));
    
    // Cleanup function
    return () => controller.abort();
  });
}
```

### 2. Subjects (Multicasting)

```typescript
// src/observables/subjects.ts
import { 
  Subject, 
  BehaviorSubject, 
  ReplaySubject, 
  AsyncSubject 
} from 'rxjs';

// Subject - basic multicast observable
const subject = new Subject<number>();
subject.subscribe((x) => console.log('A:', x));
subject.next(1); // A: 1
subject.subscribe((x) => console.log('B:', x));
subject.next(2); // A: 2, B: 2

// BehaviorSubject - requires initial value, emits latest
const behaviorSubject = new BehaviorSubject<number>(0);
behaviorSubject.subscribe((x) => console.log(x)); // 0
behaviorSubject.next(1);
behaviorSubject.next(2);
console.log(behaviorSubject.value); // 2

// ReplaySubject - replays X values to new subscribers
const replaySubject = new ReplaySubject<number>(3); // Buffer size 3
replaySubject.next(1);
replaySubject.next(2);
replaySubject.next(3);
replaySubject.next(4);
replaySubject.subscribe((x) => console.log(x)); // 2, 3, 4

// AsyncSubject - emits last value on complete
const asyncSubject = new AsyncSubject<number>();
asyncSubject.subscribe((x) => console.log(x));
asyncSubject.next(1);
asyncSubject.next(2);
asyncSubject.next(3);
asyncSubject.complete(); // Only emits: 3
```

### 3. Transformation Operators

```typescript
// src/operators/transformation.ts
import { 
  of, 
  map, 
  pluck, 
  mergeMap, 
  switchMap, 
  concatMap, 
  exhaustMap 
} from 'rxjs';

const data$ = of({ id: 1, name: 'Alice' });

// map - transform each value
data$.pipe(
  map((user) => user.name.toUpperCase())
).subscribe(console.log); // 'ALICE'

// pluck - extract nested property
data$.pipe(
  pluck('name')
).subscribe(console.log); // 'Alice'

// mergeMap (flatMap) - parallel inner observables
of(1, 2, 3).pipe(
  mergeMap((id) => fetch(`/api/user/${id}`).then((r) => r.json()))
).subscribe(console.log);

// switchMap - cancel previous, switch to new
const searchInput$ = fromEvent(searchInput, 'input').pipe(
  map((e) => e.target.value),
  debounceTime(300),
  switchMap((query) => fetch(`/api/search?q=${query}`))
);

// concatMap - queue inner observables sequentially
of(1, 2, 3).pipe(
  concatMap((id) => fetch(`/api/user/${id}`))
);

// exhaustMap - ignore new until current completes
const saveClick$ = fromEvent(saveButton, 'click').pipe(
  exhaustMap(() => saveData(data))
);
```

### 4. Filtering Operators

```typescript
// src/operators/filtering.ts
import { 
  of, 
  fromEvent, 
  filter, 
  take, 
  takeUntil, 
  takeWhile, 
  skip, 
  debounceTime, 
  throttleTime, 
  distinctUntilChanged, 
  first, 
  last 
} from 'rxjs';

const numbers$ = of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// filter - conditional filtering
numbers$.pipe(
  filter((n) => n % 2 === 0)
).subscribe(console.log); // 2, 4, 6, 8, 10

// take - take first N values
numbers$.pipe(take(3)).subscribe(console.log); // 1, 2, 3

// takeUntil - take until notifier emits
const stop$ = fromEvent(stopButton, 'click');
interval(1000).pipe(
  takeUntil(stop$)
).subscribe(console.log);

// takeWhile - take while condition is true
numbers$.pipe(
  takeWhile((n) => n < 5)
).subscribe(console.log); // 1, 2, 3, 4

// debounceTime - emit after silence period
fromEvent(input, 'input').pipe(
  map((e) => e.target.value),
  debounceTime(300)
);

// throttleTime - emit first, then ignore for duration
fromEvent(window, 'scroll').pipe(
  throttleTime(200)
);

// distinctUntilChanged - filter consecutive duplicates
of(1, 1, 2, 2, 2, 3, 3, 1).pipe(
  distinctUntilChanged()
).subscribe(console.log); // 1, 2, 3, 1

// first/last
numbers$.pipe(first()).subscribe(console.log); // 1
numbers$.pipe(last()).subscribe(console.log); // 10
```

### 5. Combination Operators

```typescript
// src/operators/combination.ts
import { 
  of, 
  combineLatest, 
  forkJoin, 
  zip, 
  merge, 
  concat, 
  race,
  withLatestFrom,
  startWith 
} from 'rxjs';

const obs1$ = of(1, 2, 3);
const obs2$ = of('A', 'B', 'C');

// combineLatest - emit when any observable emits
combineLatest([obs1$, obs2$]).subscribe(console.log);
// [1, 'A'], [2, 'A'], [2, 'B'], [3, 'B'], [3, 'C']

// forkJoin - wait for all to complete, emit last values
forkJoin({
  users: fetch('/api/users').then((r) => r.json()),
  posts: fetch('/api/posts').then((r) => r.json()),
}).subscribe(({ users, posts }) => {
  console.log(users, posts);
});

// zip - combine by index
zip(obs1$, obs2$).subscribe(console.log);
// [1, 'A'], [2, 'B'], [3, 'C']

// merge - interleave emissions
merge(obs1$, obs2$).subscribe(console.log);
// 1, 2, 3, 'A', 'B', 'C' (or interleaved)

// concat - sequential concatenation
concat(obs1$, obs2$).subscribe(console.log);
// 1, 2, 3, 'A', 'B', 'C'

// race - first to emit wins
race(obs1$, obs2$).subscribe(console.log);

// withLatestFrom - combine with latest from another
fromEvent(button, 'click').pipe(
  withLatestFrom(inputValue$)
).subscribe(([click, value]) => {
  console.log('Clicked with:', value);
});

// startWith - emit initial value
of(1, 2, 3).pipe(
  startWith(0)
).subscribe(console.log); // 0, 1, 2, 3
```

### 6. Error Handling

```typescript
// src/operators/error-handling.ts
import { 
  of, 
  throwError, 
  catchError, 
  retry, 
  retryWhen, 
  delay, 
  scan, 
  tap 
} from 'rxjs';

// catchError - handle errors gracefully
const http$ = from(fetch('/api/data')).pipe(
  catchError((error) => {
    console.error('HTTP Error:', error);
    return of({ fallback: true });
  })
);

// retry - retry N times
const api$ = from(fetch('/api/data')).pipe(
  retry(3),
  catchError(() => of(null))
);

// retryWhen - custom retry logic
api$.pipe(
  retryWhen((errors) =>
    errors.pipe(
      scan((count, err) => {
        if (count >= 3) throw err;
        return count + 1;
      }, 0),
      delay(1000),
      tap(() => console.log('Retrying...'))
    )
  )
);

// finalize - cleanup on complete or error
const resource$ = new Observable((subscriber) => {
  const resource = acquireResource();
  
  return () => {
    resource.release();
  };
}).pipe(
  finalize(() => console.log('Cleanup complete'))
);
```

### 7. State Management Pattern

```typescript
// src/patterns/state-store.ts
import { BehaviorSubject, Observable, map, distinctUntilChanged } from 'rxjs';

interface State {
  user: { id: string; name: string } | null;
  isLoading: boolean;
  error: string | null;
}

class StateStore {
  private state$ = new BehaviorSubject<State>({
    user: null,
    isLoading: false,
    error: null,
  });

  // Select state slice
  select<K extends keyof State>(key: K): Observable<State[K]> {
    return this.state$.pipe(
      map((state) => state[key]),
      distinctUntilChanged()
    );
  }

  // Get current state
  get state(): State {
    return this.state$.value;
  }

  // Update state
  setState(partial: Partial<State>) {
    this.state$.next({
      ...this.state,
      ...partial,
    });
  }

  // Async action
  async loadUser(id: string) {
    this.setState({ isLoading: true, error: null });
    
    try {
      const user = await fetch(`/api/user/${id}`).then((r) => r.json());
      this.setState({ user, isLoading: false });
    } catch (error) {
      this.setState({ error: error.message, isLoading: false });
    }
  }
}

// Usage
const store = new StateStore();
store.select('user').subscribe((user) => console.log('User:', user));
store.select('isLoading').subscribe((loading) => console.log('Loading:', loading));
```

### 8. Event Bus Pattern

```typescript
// src/patterns/event-bus.ts
import { Subject, Observable, filter, map } from 'rxjs';

interface Event {
  type: string;
  payload?: any;
}

class EventBus {
  private bus$ = new Subject<Event>();

  emit(type: string, payload?: any) {
    this.bus$.next({ type, payload });
  }

  on(type: string): Observable<any> {
    return this.bus$.pipe(
      filter((event) => event.type === type),
      map((event) => event.payload)
    );
  }

  onAll(): Observable<Event> {
    return this.bus$.asObservable();
  }
}

// Usage
const eventBus = new EventBus();

// Emit events
eventBus.emit('user:login', { userId: '123' });
eventBus.emit('notification:show', { message: 'Hello!' });

// Subscribe to events
eventBus.on('user:login').subscribe((payload) => {
  console.log('User logged in:', payload.userId);
});
```

### 9. WebSocket Integration

```typescript
// src/patterns/websocket.ts
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retry, catchError, of } from 'rxjs';

interface WSMessage {
  type: string;
  data: any;
}

class WebSocketService {
  private socket$: WebSocketSubject<WSMessage>;

  connect(url: string) {
    this.socket$ = webSocket<WSMessage>({
      url,
      openObserver: {
        next: () => console.log('WebSocket connected'),
      },
      closeObserver: {
        next: () => console.log('WebSocket disconnected'),
      },
    });

    return this.socket$.pipe(
      retry({
        count: 3,
        delay: 1000,
      }),
      catchError((error) => {
        console.error('WebSocket error:', error);
        return of({ type: 'error', data: error });
      })
    );
  }

  send(message: WSMessage) {
    this.socket$.next(message);
  }

  close() {
    this.socket$.complete();
  }
}

// Usage
const ws = new WebSocketService();
ws.connect('wss://api.example.com/ws').subscribe((message) => {
  console.log('Received:', message);
});

ws.send({ type: 'ping', data: { timestamp: Date.now() } });
```

### 10. Debugging Utilities

```typescript
// src/utils/debug.ts
import { tap, Observable } from 'rxjs';

export function debug<T>(label: string): (source: Observable<T>) => Observable<T> {
  return tap<T>({
    next: (value) => console.log(`[${label}] Next:`, value),
    error: (error) => console.error(`[${label}] Error:`, error),
    complete: () => console.log(`[${label}] Complete`),
  });
}

// Usage
of(1, 2, 3).pipe(
  debug('source'),
  map((x) => x * 2),
  debug('doubled')
).subscribe();
// [source] Next: 1
// [doubled] Next: 2
// [source] Next: 2
// [doubled] Next: 4
// ...
```

## Configuration

### package.json

```json
{
  "name": "rxjs-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.10.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Testing

```typescript
// src/utils/testing.ts
import { TestScheduler } from 'rxjs/testing';
import { map, debounceTime } from 'rxjs/operators';

describe('RxJS Operators', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  test('debounceTime should debounce values', () => {
    testScheduler.run(({ cold, expectObservable, time }) => {
      const source = cold('a-b-c-----d|');
      const expected = '    ------c---d|';
      const duration = time('-----|');

      const result = source.pipe(debounceTime(duration));
      expectObservable(result).toBe(expected);
    });
  });

  test('map should transform values', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source = cold('1-2-3|');
      const expected = '    a-b-c|', values = { a: 2, b: 4, c: 6 };

      const result = source.pipe(map((x: string) => parseInt(x) * 2));
      expectObservable(result).toBe(expected, values);
    });
  });
});
```

## Best Practices

### 1. Unsubscribe Properly

```typescript
import { Subject, takeUntil } from 'rxjs';

@Component
class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    observable$.pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 2. Avoid Memory Leaks

```typescript
// Bad - multiple subscriptions
data$.subscribe((data) => {
  processData(data);
  updateUI(data);
});

// Good - single subscription with multiple effects
data$.pipe(
  tap((data) => processData(data)),
  tap((data) => updateUI(data))
).subscribe();
```

### 3. Use shareReplay for HTTP

```typescript
import { shareReplay } from 'rxjs/operators';

// Cache HTTP response
const data$ = http.get('/api/data').pipe(
  shareReplay(1)
);

// Multiple subscribers share same HTTP call
data$.subscribe();
data$.subscribe();
```

### 4. Error Boundary Pattern

```typescript
const safeObservable$ = source$.pipe(
  catchError((error) => {
    logError(error);
    return EMPTY;
  })
);
```

## Resources

- [RxJS Official Documentation](https://rxjs.dev/)
- [RxJS Marbles](https://rxmarbles.com/)
- [Learn RxJS](https://www.learnrxjs.io/)
- [RxJS Patterns](https://blog.strongbrew.io/category/RxJS/)
