# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Angular Enterprise Application
**Type**: Large-scale Enterprise Frontend
**Tech Stack**: Angular 17 + TypeScript + RxJS + NgRx
**Goal**: Production-ready enterprise application with scalable architecture and best practices

---

## Tech Stack

### Core
- **Framework**: Angular 17+ (Standalone Components)
- **Language**: TypeScript 5.2+
- **Reactive Programming**: RxJS 7.8+
- **State Management**: NgRx 17+ (Signals + Store)
- **Routing**: Angular Router 17+
- **Forms**: Reactive Forms + Formly
- **HTTP**: Angular HttpClient + Interceptors

### UI & Styling
- **Component Library**: Angular Material 17+
- **Styling**: SCSS + Tailwind CSS
- **Icons**: Material Icons + SVG
- **Animations**: Angular Animations

### Development
- **Package Manager**: pnpm
- **Build**: Angular CLI + esbuild
- **Testing**: Jest + Spectator + Cypress
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged

---

## Code Standards

### TypeScript Rules
- Enable strict mode in `tsconfig.json`
- No `any` types - use `unknown` with type guards
- Prefer `interface` for data models
- Use `type` for unions and utility types
- Enable `noUncheckedIndexedAccess`

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

type UserRole = 'admin' | 'user' | 'guest'

async function getUser(id: string): Promise<User | undefined> {
  const response = await this.http.get<User>(`/api/users/${id}`).toPromise()
  return response
}

// ❌ Bad
async function getUser(id: any): any {
  return this.http.get(`/api/users/${id}`)
}
```

### Naming Conventions
- **Components**: PascalCase with suffix (`UserProfileComponent`)
- **Services**: PascalCase with suffix (`UserService`)
- **Directives**: PascalCase with suffix (`HighlightDirective`)
- **Pipes**: PascalCase with suffix (`DateFormaPipe`)
- **Interfaces**: PascalCase (`User`, `Product`)
- **Files**: kebab-case (`user-profile.component.ts`)
- **Selectors**: app-prefix (`app-user-profile`)

### Angular Best Practices

#### Use Standalone Components
```typescript
// ✅ Good - Standalone Component
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent {
  @Input() user = input.required<User>()
  
  constructor(private userService: UserService) {}
}

// ❌ Bad - NgModule-based
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent {}
```

#### Use Signals for State
```typescript
// ✅ Good - Signals
export class UserListComponent {
  private userService = inject(UserService)
  
  users = this.userService.users
  selectedUserId = signal<string | null>(null)
  
  selectedUser = computed(() => 
    this.users().find(u => u.id === this.selectedUserId())
  )
  
  selectUser(id: string) {
    this.selectedUserId.set(id)
  }
}

// ❌ Bad - BehaviorSubject in components
export class UserListComponent {
  private users$ = new BehaviorSubject<User[]>([])
  selectedUserId$ = new BehaviorSubject<string | null>(null)
}
```

---

## Directory Structure

```
src/
├── app/
│   ├── core/                  # Core module (singleton services)
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── api.service.ts
│   │   │   └── logger.service.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── loading.interceptor.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── role.guard.ts
│   │   │   └── lazy.guard.ts
│   │   └── models/
│   │       ├── user.model.ts
│   │       └── api-response.model.ts
│   │
│   ├── features/              # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── services/
│   │   │   │   └── auth.facade.ts
│   │   │   ├── guards/
│   │   │   └── auth.routes.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── dashboard.routes.ts
│   │   │
│   │   └── users/
│   │       ├── components/
│   │       ├── services/
│   │       └── users.routes.ts
│   │
│   ├── shared/                # Shared module
│   │   ├── components/
│   │   │   ├── button/
│   │   │   ├── input/
│   │   │   ├── modal/
│   │   │   └── loading/
│   │   ├── directives/
│   │   │   ├── highlight.directive.ts
│   │   │   └── permission.directive.ts
│   │   ├── pipes/
│   │   │   ├── truncate.pipe.ts
│   │   │   └── safe.pipe.ts
│   │   └── validators/
│   │       └── custom.validators.ts
│   │
│   ├── store/                 # NgRx State Management
│   │   ├── actions/
│   │   │   ├── user.actions.ts
│   │   │   └── auth.actions.ts
│   │   ├── reducers/
│   │   │   ├── user.reducer.ts
│   │   │   └── index.ts
│   │   ├── selectors/
│   │   │   ├── user.selectors.ts
│   │   │   └── auth.selectors.ts
│   │   ├── effects/
│   │   │   ├── user.effects.ts
│   │   │   └── auth.effects.ts
│   │   └── facades/
│   │       ├── user.facade.ts
│   │       └── auth.facade.ts
│   │
│   ├── layout/                # Layout components
│   │   ├── header/
│   │   ├── sidebar/
│   │   ├── footer/
│   │   └── main-layout/
│   │
│   ├── app.component.ts
│   ├── app.config.ts          # Application config
│   └── app.routes.ts          # Root routing
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── i18n/
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
└── styles/
    ├── _variables.scss
    ├── _mixins.scss
    └── styles.scss
```

---

## Architecture Patterns

### Route Configuration
```typescript
// app.routes.ts
import { Routes } from '@angular/router'

export const APP_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        canActivate: [authGuard]
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes')
          .then(m => m.USER_ROUTES),
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' }
      }
    ]
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component')
      .then(m => m.AuthComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
]
```

### Service Pattern
```typescript
// core/services/user.service.ts
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/users`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    )
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    )
  }

  createUser(user: CreateUserDto): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/users`, user).pipe(
      map(response => response.data),
      catchError(this.handleError)
    )
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error)
    return throwError(() => new Error(error.message))
  }
}
```

### HTTP Interceptor
```typescript
// core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const token = authService.token()

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    return next(authReq)
  }

  return next(req)
}

// core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router)
  const toastService = inject(ToastService)

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        router.navigate(['/auth/login'])
      } else if (error.status === 403) {
        toastService.error('Access denied')
      } else if (error.status === 500) {
        toastService.error('Server error. Please try again later.')
      }
      return throwError(() => error)
    })
  )
}
```

### Route Guards
```typescript
// core/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (authService.isAuthenticated()) {
    return true
  }

  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  })
  return false
}

// core/guards/role.guard.ts
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  const router = inject(Router)
  const requiredRole = route.data['role']

  if (authService.hasRole(requiredRole)) {
    return true
  }

  router.navigate(['/unauthorized'])
  return false
}
```

---

## NgRx State Management

### Actions
```typescript
// store/actions/user.actions.ts
export const loadUsers = createAction('[User] Load Users')
export const loadUsersSuccess = createAction(
  '[User] Load Users Success',
  props<{ users: User[] }>()
)
export const loadUsersFailure = createAction(
  '[User] Load Users Failure',
  props<{ error: string }>()
)
export const selectUser = createAction(
  '[User] Select User',
  props<{ userId: string }>()
)
```

### Reducer
```typescript
// store/reducers/user.reducer.ts
export interface UserState {
  users: User[]
  selectedUserId: string | null
  loading: boolean
  error: string | null
}

export const initialState: UserState = {
  users: [],
  selectedUserId: null,
  loading: false,
  error: null
}

export const userReducer = createReducer(
  initialState,
  on(loadUsers, (state) => ({ ...state, loading: true })),
  on(loadUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loading: false
  })),
  on(loadUsersFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  on(selectUser, (state, { userId }) => ({
    ...state,
    selectedUserId: userId
  }))
)
```

### Effects
```typescript
// store/effects/user.effects.ts
@Injectable()
export class UserEffects {
  private actions$ = inject(Actions)
  private userService = inject(UserService)

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      switchMap(() =>
        this.userService.getUsers().pipe(
          map(users => loadUsersSuccess({ users })),
          catchError(error => of(loadUsersFailure({ error: error.message })))
        )
      )
    )
  )
}
```

### Selectors
```typescript
// store/selectors/user.selectors.ts
export const selectUserState = createFeatureSelector<UserState>('users')

export const selectAllUsers = createSelector(
  selectUserState,
  (state) => state.users
)

export const selectUserLoading = createSelector(
  selectUserState,
  (state) => state.loading
)

export const selectSelectedUser = createSelector(
  selectUserState,
  (state) => state.users.find(u => u.id === state.selectedUserId)
)
```

### Facade Pattern
```typescript
// store/facades/user.facade.ts
@Injectable({ providedIn: 'root' })
export class UserFacade {
  private store = inject(Store)

  users$ = this.store.select(selectAllUsers)
  loading$ = this.store.select(selectUserLoading)
  selectedUser$ = this.store.select(selectSelectedUser)

  loadUsers() {
    this.store.dispatch(loadUsers())
  }

  selectUser(userId: string) {
    this.store.dispatch(selectUser({ userId }))
  }
}
```

---

## Reactive Forms

### Form Component
```typescript
// features/users/components/user-form/user-form.component.ts
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './user-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormComponent {
  @Input() user = input<User>()
  @Output() save = output<User>()

  private fb = inject(FormBuilder)

  userForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['user', Validators.required],
    phone: ['', Validators.pattern(/^\+?[\d\s-]+$/)]
  })

  ngOnInit() {
    if (this.user()) {
      this.userForm.patchValue(this.user()!)
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.save.emit(this.userForm.value as User)
    }
  }

  get nameControl() {
    return this.userForm.get('name')!
  }

  get emailControl() {
    return this.userForm.get('email')!
  }
}
```

### Template
```html
<!-- user-form.component.html -->
<form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form">
  <mat-form-field appearance="outline">
    <mat-label>Name</mat-label>
    <input matInput formControlName="name" placeholder="Enter name">
    <mat-error *ngIf="nameControl.hasError('required')">
      Name is required
    </mat-error>
    <mat-error *ngIf="nameControl.hasError('minlength')">
      Name must be at least 2 characters
    </mat-error>
  </mat-form-field>

  <mat-form-field appearance="outline">
    <mat-label>Email</mat-label>
    <input matInput formControlName="email" type="email" placeholder="Enter email">
    <mat-error *ngIf="emailControl.hasError('required')">
      Email is required
    </mat-error>
    <mat-error *ngIf="emailControl.hasError('email')">
      Please enter a valid email
    </mat-error>
  </mat-form-field>

  <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid">
    Save User
  </button>
</form>
```

---

## Testing

### Component Testing with Spectator
```typescript
// features/users/components/user-list/user-list.component.spec.ts
describe('UserListComponent', () => {
  let spectator: Spectator<UserListComponent>
  let userFacade: UserFacade

  const createComponent = createComponentFactory({
    component: UserListComponent,
    mocks: [UserFacade],
    imports: [MatListModule]
  })

  beforeEach(() => {
    spectator = createComponent()
    userFacade = spectator.inject(UserFacade)
  })

  it('should create', () => {
    expect(spectator.component).toBeTruthy()
  })

  it('should display users', () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
    ]

    userFacade.users$ = of(mockUsers)
    spectator.detectChanges()

    expect(spectator.queryAll('.user-item')).toHaveLength(2)
    expect(spectator.query('.user-name')).toHaveText('John Doe')
  })

  it('should call loadUsers on init', () => {
    expect(userFacade.loadUsers).toHaveBeenCalled()
  })

  it('should select user on click', () => {
    const mockUsers = [{ id: '1', name: 'John Doe', email: 'john@example.com' }]
    userFacade.users$ = of(mockUsers)
    spectator.detectChanges()

    spectator.click('.user-item')
    expect(userFacade.selectUser).toHaveBeenCalledWith('1')
  })
})
```

### Service Testing
```typescript
// core/services/user.service.spec.ts
describe('UserService', () => {
  let service: UserService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    })

    service = TestBed.inject(UserService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should retrieve users', () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' }
    ]

    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers)
    })

    const req = httpMock.expectOne('/api/users')
    expect(req.request.method).toBe('GET')
    req.flush({ data: mockUsers })
  })
})
```

---

## Performance Optimization

### Change Detection
- Use `OnPush` strategy by default
- Use `async` pipe in templates
- Avoid complex computations in templates
- Use `trackBy` for `ngFor`

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  users$ = this.userFacade.users$

  trackByUserId(index: number, user: User): string {
    return user.id
  }
}
```

```html
<div *ngFor="let user of users$ | async; trackBy: trackByUserId">
  {{ user.name }}
</div>
```

### Lazy Loading
```typescript
// app.routes.ts
export const APP_ROUTES: Routes = [
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes')
      .then(m => m.USER_ROUTES)
  }
]
```

---

## Security

### Input Sanitization
```typescript
// shared/pipes/safe.pipe.ts
@Pipe({ name: 'safe', standalone: true })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }
}
```

### Permission Directive
```typescript
// shared/directives/permission.directive.ts
@Directive({
  selector: '[appPermission]',
  standalone: true
})
export class PermissionDirective {
  private authService = inject(AuthService)
  private templateRef = inject(TemplateRef<any>)
  private viewContainer = inject(ViewContainerRef)

  @Input() set appPermission(role: string) {
    if (this.authService.hasRole(role)) {
      this.viewContainer.createEmbeddedView(this.templateRef)
    } else {
      this.viewContainer.clear()
    }
  }
}
```

---

## Best Practices Summary

1. **Use Standalone Components** - Migrate from NgModule-based architecture
2. **Signals over RxJS** - Use signals for local component state
3. **OnPush Change Detection** - Always use OnPush for performance
4. **Facade Pattern** - Simplify NgRx store interactions
5. **Lazy Loading** - Load feature modules on demand
6. **Type Safety** - Enable strict mode, no `any` types
7. **Testing** - Write unit tests with Spectator, E2E with Cypress
8. **Interceptors** - Centralize HTTP concerns (auth, error, logging)
9. **Route Guards** - Protect routes with auth and role checks
10. **Performance** - Use trackBy, async pipe, and OnPush
