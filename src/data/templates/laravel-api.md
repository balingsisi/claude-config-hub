# Laravel API Template

## Project Overview

Laravel is a PHP web application framework with elegant syntax and expressive code. This template focuses on building modern REST APIs with Laravel 11, featuring API resources, form requests, service classes, and best practices for scalable API development.

## Tech Stack

- **Framework**: Laravel 11
- **Language**: PHP 8.2+
- **Database**: PostgreSQL / MySQL
- **ORM**: Eloquent
- **API Resources**: Laravel API Resources
- **Authentication**: Laravel Sanctum / Passport
- **Validation**: Form Request Classes
- **Testing**: PHPUnit / Pest

## Project Structure

```
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── V1/
│   │   │   │   │   ├── AuthController.php
│   │   │   │   │   ├── UserController.php
│   │   │   │   │   └── PostController.php
│   │   │   │   └── BaseController.php
│   │   │   └── Controller.php
│   │   ├── Middleware/
│   │   │   ├── Authenticate.php
│   │   │   └── CheckRole.php
│   │   └── Requests/
│   │       ├── Auth/
│   │       │   ├── LoginRequest.php
│   │       │   └── RegisterRequest.php
│   │       ├── User/
│   │       │   ├── StoreUserRequest.php
│   │       │   └── UpdateUserRequest.php
│   │       └── Post/
│   │           └── StorePostRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Post.php
│   │   └── Comment.php
│   ├── Services/
│   │   ├── UserService.php
│   │   ├── PostService.php
│   │   └── PaymentService.php
│   ├── Repositories/
│   │   ├── Contracts/
│   │   │   └── UserRepositoryInterface.php
│   │   └── UserRepository.php
│   ├── Resources/
│   │   ├── UserResource.php
│   │   ├── UserCollection.php
│   │   ├── PostResource.php
│   │   └── PostCollection.php
│   ├── Policies/
│   │   ├── UserPolicy.php
│   │   └── PostPolicy.php
│   ├── Events/
│   │   └── UserRegistered.php
│   ├── Listeners/
│   │   └── SendWelcomeEmail.php
│   ├── Jobs/
│   │   └── ProcessPodcast.php
│   └── Exceptions/
│       └── Handler.php
├── bootstrap/
│   └── app.php
├── config/
│   ├── app.php
│   ├── database.php
│   ├── sanctum.php
│   └── cors.php
├── database/
│   ├── migrations/
│   │   ├── 2024_01_01_create_users_table.php
│   │   └── 2024_01_02_create_posts_table.php
│   ├── seeders/
│   │   └── DatabaseSeeder.php
│   └── factories/
│       ├── UserFactory.php
│       └── PostFactory.php
├── routes/
│   ├── api.php
│   └── console.php
├── tests/
│   ├── Feature/
│   │   ├── AuthTest.php
│   │   └── UserTest.php
│   └── Unit/
│       └── Services/
│           └── UserServiceTest.php
├── composer.json
└── .env.example
```

## Key Patterns

### 1. Controller Structure

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\UserCollection;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService
    ) {}

    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);
        $users = $this->userService->getPaginated($perPage);

        return response()->json(
            new UserCollection($users)
        );
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        return response()->json(
            new UserResource($user),
            201
        );
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json(
            new UserResource($user)
        );
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->userService->update($user, $request->validated());

        return response()->json(
            new UserResource($user)
        );
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->userService->delete($user);

        return response()->json(null, 204);
    }
}
```

### 2. Form Request Validation

```php
<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
            'role' => ['sometimes', 'in:admin,user,editor'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The name field is required.',
            'email.unique' => 'This email is already registered.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower($this->email),
        ]);
    }
}
```

### 3. API Resource

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'avatar' => $this->avatar_url,
            'posts_count' => $this->whenCounted('posts'),
            'posts' => PostResource::collection(
                $this->whenLoaded('posts')
            ),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'links' => [
                'self' => route('api.v1.users.show', $this->id),
                'posts' => route('api.v1.users.posts.index', $this->id),
            ],
        ];
    }
}
```

### 4. Service Class

```php
<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserService
{
    public function __construct(
        private UserRepositoryInterface $userRepository
    ) {}

    /**
     * Get paginated users.
     */
    public function getPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return $this->userRepository->paginate($perPage);
    }

    /**
     * Create a new user.
     */
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            // Handle file upload
            if (isset($data['avatar'])) {
                $data['avatar_url'] = $this->uploadAvatar($data['avatar']);
                unset($data['avatar']);
            }

            // Hash password
            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            return $this->userRepository->create($data);
        });
    }

    /**
     * Update an existing user.
     */
    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            // Handle file upload
            if (isset($data['avatar'])) {
                // Delete old avatar
                if ($user->avatar_url) {
                    Storage::disk('public')->delete($user->avatar_url);
                }
                $data['avatar_url'] = $this->uploadAvatar($data['avatar']);
                unset($data['avatar']);
            }

            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            return $this->userRepository->update($user, $data);
        });
    }

    /**
     * Delete a user.
     */
    public function delete(User $user): bool
    {
        return DB::transaction(function () use ($user) {
            // Delete avatar
            if ($user->avatar_url) {
                Storage::disk('public')->delete($user->avatar_url);
            }

            return $this->userRepository->delete($user);
        });
    }

    /**
     * Upload avatar file.
     */
    private function uploadAvatar($file): string
    {
        return $file->store('avatars', 'public');
    }
}
```

### 5. Repository Pattern

```php
<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function find(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    public function create(array $data): User;
    public function update(User $user, array $data): User;
    public function delete(User $user): bool;
}

<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryInterface
{
    public function find(int $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return User::query()
            ->withCount('posts')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    public function delete(User $user): bool
    {
        return $user->delete();
    }
}
```

### 6. API Authentication with Sanctum

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Login user and create token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Register new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Logout user (revoke token).
     */
    public function logout(): JsonResponse
    {
        auth()->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user.
     */
    public function me(): JsonResponse
    {
        return response()->json(auth()->user());
    }
}
```

### 7. Policy Authorization

```php
<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Post;
use Illuminate\Auth\Access\HandlesAuthorization;

class PostPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any posts.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the post.
     */
    public function view(User $user, Post $post): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create posts.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the post.
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the post.
     */
    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->isAdmin();
    }
}
```

### 8. API Routes

```php
<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\PostController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Version prefix
Route::prefix('v1')->group(function () {

    // Public routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Posts - public read
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{post}', [PostController::class, 'show']);

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {
        // Auth
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // Users - protected
        Route::apiResource('users', UserController::class);

        // Posts - protected actions
        Route::post('/posts', [PostController::class, 'store']);
        Route::put('/posts/{post}', [PostController::class, 'update']);
        Route::delete('/posts/{post}', [PostController::class, 'delete']);
    });
});
```

## Best Practices

### 1. API Versioning
- Use URL versioning (`/api/v1/`)
- Keep backward compatibility
- Plan for deprecation strategy

### 2. Response Formatting
- Use consistent JSON structure
- Include proper HTTP status codes
- Provide meaningful error messages

### 3. Eager Loading
- Prevent N+1 queries
- Use `with()` for relationships
- Load only necessary fields

### 4. Validation
- Use Form Request classes
- Keep controllers clean
- Provide clear error messages

### 5. Security
- Use Sanctum for API tokens
- Implement rate limiting
- Validate and sanitize all input

## Common Commands

```bash
# Development
php artisan serve              # Start dev server
php artisan serve --port=8080  # Custom port

# Database
php artisan migrate            # Run migrations
php artisan migrate:fresh      # Reset and migrate
php artisan migrate:rollback   # Rollback last batch
php artisan db:seed            # Run seeders
php artisan migrate:fresh --seed  # Fresh + seed

# Make Commands
php artisan make:model Post -m   # Model + migration
php artisan make:controller Api/V1/PostController --api
php artisan make:request StorePostRequest
php artisan make:resource PostResource
php artisan make:policy PostPolicy --model=Post
php artisan make:middleware CheckRole
php artisan make:factory PostFactory
php artisan make:seeder PostSeeder

# Testing
php artisan test               # Run all tests
php artisan test --filter=UserTest  # Specific test
php artisan test --parallel    # Parallel testing
php artisan pest               # Using Pest

# Code Quality
./vendor/bin/phpcs             # Code sniffer
./vendor/bin/phpcbf            # Fix code style
./vendor/bin/phpstan           # Static analysis

# Optimization
php artisan config:cache       # Cache config
php artisan route:cache        # Cache routes
php artisan view:cache         # Cache views
php artisan optimize           # All optimizations

# API Documentation
php artisan l5-swagger:generate  # Generate Swagger docs
```

## Laravel Configuration

```php
// bootstrap/app.php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);

        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

## Environment Configuration

```env
# .env.example

APP_NAME="Laravel API"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=http://localhost

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=laravel_api
DB_USERNAME=postgres
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
SESSION_DRIVER=database
SESSION_LIFETIME=120

CACHE_DRIVER=redis
CACHE_PREFIX=laravel_api_

QUEUE_CONNECTION=redis

LOG_CHANNEL=stack
LOG_LEVEL=debug
```

## Testing

### Feature Test Example

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function it_can_list_users(): void
    {
        User::factory()->count(5)->create();

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'created_at']
                ],
                'links',
                'meta',
            ]);
    }

    /** @test */
    public function it_can_create_a_user(): void
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/users', $data);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'John Doe')
            ->assertJsonPath('data.email', 'john@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
        ]);
    }

    /** @test */
    public function it_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/users', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }
}
```

## Deployment

### Docker

```dockerfile
FROM php:8.2-fpm-alpine

WORKDIR /var/www/html

# Install dependencies
RUN apk add --no-cache \
    postgresql-dev \
    zip \
    unzip \
    git

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.example.com;
    root /var/www/html/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass php:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## Performance Tips

1. **Eager Loading**: Use `with()` to prevent N+1
2. **Caching**: Cache frequent queries
3. **Database Indexing**: Index frequently queried columns
4. **Queue Jobs**: Offload heavy tasks
5. **OPcache**: Enable in production

## Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [Eloquent ORM](https://laravel.com/docs/eloquent)
- [Pest PHP](https://pestphp.com/)
- [Laravel API Resources](https://laravel.com/docs/eloquent-resources)

---

**Last Updated**: 2026-03-17
