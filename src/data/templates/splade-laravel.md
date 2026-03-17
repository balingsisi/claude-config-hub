# Splade Laravel 全栈模板

## 技术栈

- **Laravel**: v10+ / v11+
- **Splade**: v0.9+ (基于 Inertia.js)
- **Vue 3**: Composition API
- **Tailwind CSS**: v3.4+
- **Vite**: 构建工具
- **TypeScript**: 类型支持（可选）
- **SQLite/MySQL/PostgreSQL**: 数据库

## 项目结构

```
splade-project/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php
│   │   │   ├── DashboardController.php
│   │   │   └── UserController.php
│   │   ├── Middleware/
│   │   │   └── HandleSplade.php
│   │   └── Requests/
│   │       └── StoreUserRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   └── Post.php
│   └── Providers/
│       └── AppServiceProvider.php
├── bootstrap/
│   └── app.php
├── config/
│   ├── app.php
│   ├── database.php
│   └── splade.php
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── resources/
│   ├── views/
│   │   ├── components/
│   │   │   ├── layout.blade.php
│   │   │   ├── navbar.blade.php
│   │   │   └── sidebar.blade.php
│   │   ├── pages/
│   │   │   ├── dashboard.blade.php
│   │   │   ├── users/
│   │   │   │   ├── index.blade.php
│   │   │   │   ├── create.blade.php
│   │   │   │   └── edit.blade.php
│   │   │   └── posts/
│   │   │       ├── index.blade.php
│   │   │       └── show.blade.php
│   │   └── app.blade.php
│   ├── js/
│   │   ├── app.js
│   │   ├── components/
│   │   │   ├── Modal.vue
│   │   │   └── Toast.vue
│   │   └── composables/
│   │       └── useForm.js
│   └── css/
│       └── app.css
├── routes/
│   ├── web.php
│   ├── api.php
│   └── console.php
├── tests/
├── composer.json
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 代码模式

### 1. 安装和配置

```bash
# 创建 Laravel 项目
composer create-project laravel/laravel splade-project

# 安装 Splade
composer require protonemedia/laravel-splade

# 安装前端依赖
npm install @protonemedia/laravel-splade
npm install vue@next
npm install -D @vitejs/plugin-vue

# 发布 Splade 配置
php artisan vendor:publish --tag="splade-config"
```

### 2. Vite 配置

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.js'],
      refresh: true,
    }),
    vue({
      template: {
        transformAssetUrls: {
          base: null,
          includeAbsolute: false,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
});
```

### 3. 主应用文件

```blade
<!-- resources/views/app.blade.php -->
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Splade App</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @spladeHead
</head>
<body class="antialiased">
    @splade
</body>
</html>
```

### 4. JavaScript 入口

```javascript
// resources/js/app.js
import './bootstrap';
import { createApp } from 'vue';
import { renderSpladeApp, SpladePlugin, Splade } from '@protonemedia/laravel-splade';

const el = document.getElementById('app');

createApp({
    render: renderSpladeApp({ el }),
})
    .use(SpladePlugin, {
        max_keep_alive: 10,
        transform_anchors: false,
        progress_bar: true,
        link_component: 'Link',
    })
    .mount(el);

// 全局错误处理
Splade.on('error', (error) => {
    console.error('Splade error:', error);
});
```

### 5. 布局组件

```blade
<!-- resources/views/components/layout.blade.php -->
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Splade App' }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @spladeHead
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex">
        <!-- Sidebar -->
        <x-sidebar />

        <!-- Main Content -->
        <div class="flex-1">
            <x-navbar :title="$title" />

            <main class="p-6">
                {{ $slot }}
            </main>
        </div>
    </div>

    @stack('modals')
</body>
</html>
```

```blade
<!-- resources/views/components/navbar.blade.php -->
<nav class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
        <div>
            @isset($title)
                <h1 class="text-2xl font-semibold text-gray-900">{{ $title }}</h1>
            @endisset
        </div>

        <div class="flex items-center gap-4">
            <!-- Notifications -->
            <button class="p-2 text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </button>

            <!-- User Menu -->
            <x-dropdown>
                <x-slot:trigger>
                    <button class="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                        <img src="{{ Auth::user()->avatar }}" class="w-8 h-8 rounded-full" />
                        <span>{{ Auth::user()->name }}</span>
                    </button>
                </x-slot:trigger>

                <x-dropdown.item href="{{ route('profile.edit') }}">
                    Profile
                </x-dropdown.item>
                <x-dropdown.item href="{{ route('settings') }}">
                    Settings
                </x-dropdown.item>
                <x-dropdown.divider />
                <x-dropdown.item href="{{ route('logout') }}" method="POST" as="button">
                    Logout
                </x-dropdown.item>
            </x-dropdown>
        </div>
    </div>
</nav>
```

```blade
<!-- resources/views/components/sidebar.blade.php -->
<aside class="w-64 bg-white border-r border-gray-200">
    <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900">Splade App</h2>
    </div>

    <nav class="px-4 py-2">
        <x-sidebar.link href="{{ route('dashboard') }}" :active="request()->routeIs('dashboard')">
            Dashboard
        </x-sidebar.link>

        <x-sidebar.group title="Users">
            <x-sidebar.link href="{{ route('users.index') }}" :active="request()->routeIs('users.*')">
                All Users
            </x-sidebar.link>
            <x-sidebar.link href="{{ route('users.create') }}" :active="request()->routeIs('users.create')">
                Add User
            </x-sidebar.link>
        </x-sidebar.group>

        <x-sidebar.group title="Posts">
            <x-sidebar.link href="{{ route('posts.index') }}" :active="request()->routeIs('posts.*')">
                All Posts
            </x-sidebar.link>
        </x-sidebar.group>
    </nav>
</aside>
```

### 6. 路由定义

```php
// routes/web.php
<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PostController;
use Illuminate\Support\Facades\Route;

// Dashboard
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// Users (CRUD)
Route::resource('users', UserController::class);

// Posts
Route::resource('posts', PostController::class)->only(['index', 'show']);

// Profile
Route::prefix('profile')->name('profile.')->group(function () {
    Route::get('/', [ProfileController::class, 'edit'])->name('edit');
    Route::put('/', [ProfileController::class, 'update'])->name('update');
});

// Settings
Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
```

### 7. 控制器

```php
// app/Http/Controllers/DashboardController.php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'users' => User::count(),
            'posts' => Post::count(),
            'published' => Post::published()->count(),
        ];

        $recentPosts = Post::with('user')
            ->latest()
            ->take(5)
            ->get();

        return view('pages.dashboard', [
            'stats' => $stats,
            'recentPosts' => $recentPosts,
        ]);
    }
}

// app/Http/Controllers/UserController.php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->when(request('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return view('pages.users.index', compact('users'));
    }

    public function create()
    {
        return view('pages.users.create');
    }

    public function store(StoreUserRequest $request)
    {
        $user = User::create($request->validated());

        return redirect()->route('users.index')
            ->with('success', "User {$user->name} created successfully!");
    }

    public function edit(User $user)
    {
        return view('pages.users.edit', compact('user'));
    }

    public function update(StoreUserRequest $request, User $user)
    {
        $user->update($request->validated());

        return redirect()->route('users.index')
            ->with('success', "User {$user->name} updated successfully!");
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('users.index')
            ->with('success', "User deleted successfully!");
    }
}
```

### 8. 页面视图

```blade
<!-- resources/views/pages/dashboard.blade.php -->
<x-layout>
    <x-slot:title>Dashboard</x-slot:title>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <x-card>
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600">Total Users</p>
                    <p class="text-3xl font-bold text-gray-900">{{ $stats['users'] }}</p>
                </div>
                <div class="p-3 bg-blue-100 rounded-full">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                </div>
            </div>
        </x-card>

        <x-card>
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600">Total Posts</p>
                    <p class="text-3xl font-bold text-gray-900">{{ $stats['posts'] }}</p>
                </div>
                <div class="p-3 bg-green-100 rounded-full">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
            </div>
        </x-card>

        <x-card>
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600">Published</p>
                    <p class="text-3xl font-bold text-gray-900">{{ $stats['published'] }}</p>
                </div>
                <div class="p-3 bg-purple-100 rounded-full">
                    <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
        </x-card>
    </div>

    <!-- Recent Posts -->
    <x-card>
        <x-slot:title>Recent Posts</x-slot:title>

        <x-table>
            <x-slot:header>
                <x-table.heading>Title</x-table.heading>
                <x-table.heading>Author</x-table.heading>
                <x-table.heading>Date</x-table.heading>
            </x-slot:header>

            @foreach($recentPosts as $post)
                <x-table.row>
                    <x-table.cell>
                        <a href="{{ route('posts.show', $post) }}" class="text-blue-600 hover:underline">
                            {{ $post->title }}
                        </a>
                    </x-table.cell>
                    <x-table.cell>{{ $post->user->name }}</x-table.cell>
                    <x-table.cell>{{ $post->created_at->diffForHumans() }}</x-table.cell>
                </x-table.row>
            @endforeach
        </x-table>
    </x-card>
</x-layout>
```

### 9. 用户列表页面

```blade
<!-- resources/views/pages/users/index.blade.php -->
<x-layout>
    <x-slot:title>Users</x-slot:title>

    <x-card>
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold">All Users</h2>
            <a href="{{ route('users.create') }}" class="btn-primary">
                Add User
            </a>
        </div>

        <!-- Search -->
        <div class="mb-6">
            <x-input
                type="search"
                placeholder="Search users..."
                wire:model.live.debounce.300ms="search"
            />
        </div>

        <!-- Table -->
        <x-splade-table :records="$users">
            <x-slot:columns>
                <x-splade-table.column key="name" sortable>
                    Name
                </x-splade-table.column>

                <x-splade-table.column key="email" sortable>
                    Email
                </x-splade-table.column>

                <x-splade-table.column key="created_at" sortable>
                    Joined
                </x-splade-table.column>

                <x-splade-table.column label="Actions">
                    <template #default="{ item }">
                        <div class="flex gap-2">
                            <a href="{{ route('users.edit', $item) }}" class="btn-sm btn-secondary">
                                Edit
                            </a>
                            <x-danger-button
                                wire:click="delete({{ $item->id }})"
                                wire:confirm="Are you sure?"
                            >
                                Delete
                            </x-danger-button>
                        </div>
                    </template>
                </x-splade-table.column>
            </x-slot:columns>
        </x-splade-table>
    </x-card>
</x-layout>
```

### 10. 创建用户表单

```blade
<!-- resources/views/pages/users/create.blade.php -->
<x-layout>
    <x-slot:title>Create User</x-slot:title>

    <x-card>
        <x-slot:title>New User</x-slot:title>

        <form action="{{ route('users.store') }}" method="POST" class="space-y-6">
            @csrf

            <div>
                <x-label for="name" value="Name" />
                <x-input
                    id="name"
                    type="text"
                    name="name"
                    :value="old('name')"
                    class="mt-1 block w-full"
                    required
                />
                <x-input-error :messages="$errors->get('name')" class="mt-2" />
            </div>

            <div>
                <x-label for="email" value="Email" />
                <x-input
                    id="email"
                    type="email"
                    name="email"
                    :value="old('email')"
                    class="mt-1 block w-full"
                    required
                />
                <x-input-error :messages="$errors->get('email')" class="mt-2" />
            </div>

            <div>
                <x-label for="password" value="Password" />
                <x-input
                    id="password"
                    type="password"
                    name="password"
                    class="mt-1 block w-full"
                    required
                />
                <x-input-error :messages="$errors->get('password')" class="mt-2" />
            </div>

            <div class="flex items-center gap-4">
                <x-button type="submit">
                    Create User
                </x-button>

                <a href="{{ route('users.index') }}" class="btn-secondary">
                    Cancel
                </a>
            </div>
        </form>
    </x-card>
</x-layout>
```

### 11. 表单请求验证

```php
// app/Http/Requests/StoreUserRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user?->id ?? null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', "unique:users,email,{$userId}"],
            'password' => [
                $userId ? 'nullable' : 'required',
                'confirmed',
                Password::defaults(),
            ],
        ];
    }
}
```

### 12. Vue 组件（可选）

```vue
<!-- resources/js/components/Modal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          @click="close"
        ></div>

        <!-- Modal Content -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-lg shadow-xl max-w-md w-full"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ title }}
              </h3>
            </div>

            <!-- Body -->
            <div class="px-6 py-4">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  show: Boolean,
  title: String,
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
```

```vue
<!-- resources/js/components/Toast.vue -->
<template>
  <Transition name="toast">
    <div
      v-if="show"
      :class="toastClasses"
      class="fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg"
    >
      <div class="flex items-center gap-3">
        <component :is="iconComponent" class="w-5 h-5" />
        <span>{{ message }}</span>
        <button @click="close" class="ml-2 hover:opacity-70">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: Boolean,
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value),
  },
  message: String,
});

const emit = defineEmits(['close']);

const toastClasses = computed(() => ({
  'bg-green-500 text-white': props.type === 'success',
  'bg-red-500 text-white': props.type === 'error',
  'bg-yellow-500 text-white': props.type === 'warning',
  'bg-blue-500 text-white': props.type === 'info',
}));

const close = () => {
  emit('close');
};
</script>
```

### 13. Splade 表单处理

```javascript
// resources/js/composables/useForm.js
import { useForm } from '@inertiajs/vue3';

export function useUserForm(user = null) {
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (method, url) => {
        form.submit(method, url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('password', 'password_confirmation');
            },
        });
    };

    return {
        form,
        submit,
    };
}
```

### 14. 模型定义

```php
// app/Models/User.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}
```

## 最佳实践

### 1. 路由组织

```php
// routes/web.php - 使用路由组
Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', AdminUserController::class);
        Route::resource('posts', AdminPostController::class);
    });
});
```

### 2. 组件复用

```blade
<!-- resources/views/components/form/input.blade.php -->
@props(['label', 'type' => 'text', 'error'])

<div class="space-y-1">
    @if($label)
        <x-label :for="$id" :value="$label" />
    @endif

    <x-input
        :id="$id"
        :type="$type"
        :name="$name"
        :value="$value"
        {{ $attributes }}
    />

    @if($error)
        <p class="text-sm text-red-600">{{ $error }}</p>
    @endif
</div>
```

### 3. 数据传递优化

```php
// 使用 only() 减少数据传输
public function index()
{
    $users = User::query()
        ->select(['id', 'name', 'email', 'created_at'])
        ->paginate(10);

    return view('pages.users.index', compact('users'));
}
```

### 4. 缓存策略

```php
// 缓存常用数据
public function index()
{
    $stats = Cache::remember('dashboard.stats', 3600, function () {
        return [
            'users' => User::count(),
            'posts' => Post::count(),
        ];
    });

    return view('pages.dashboard', compact('stats'));
}
```

## 常用命令

```bash
# 启动开发服务器
php artisan serve

# 前端开发
npm run dev

# 构建生产资源
npm run build

# 数据库迁移
php artisan migrate

# 清除缓存
php artisan cache:clear
php artisan view:clear
php artisan config:clear
```

## Package.json

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "autoprefixer": "^10.4.18",
    "laravel-vite-plugin": "^1.0.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "@protonemedia/laravel-splade": "^0.9.0",
    "vue": "^3.4.0"
  }
}
```

## Composer.json

```json
{
  "require": {
    "php": "^8.2",
    "laravel/framework": "^11.0",
    "protonemedia/laravel-splade": "^0.9.0"
  },
  "require-dev": {
    "laravel/pint": "^1.13",
    "laravel/sail": "^1.26",
    "phpunit/phpunit": "^11.0"
  }
}
```

## 资源

- [Splade 官方文档](https://splade.dev/)
- [Laravel 文档](https://laravel.com/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Inertia.js](https://inertiajs.com/)
