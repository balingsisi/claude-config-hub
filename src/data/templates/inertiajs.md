# Inertia.js Full-Stack Framework

## Overview
Inertia.js enables building single-page applications using classic server-side routing and controllers. It works with Laravel, Rails, Django, and other backend frameworks, combining with Vue, React, or Svelte on the frontend without building an API.

## When to Use
- Full-stack applications with server-side routing
- Teams familiar with MVC frameworks (Laravel, Rails, Django)
- Projects wanting SPA experience without API development
- Applications requiring SEO and server-side rendering benefits
- Rapid application development with existing backend skills
- Projects transitioning from traditional multi-page apps to SPAs

## Key Concepts

### 1. Installation

#### Backend (Laravel)
```bash
composer require inertiajs/inertia-laravel

# Publish configuration
php artisan vendor:publish --provider="Inertia\ServiceProvider"
```

#### Frontend
```bash
# Vue 3
npm install @inertiajs/vue3 vue

# React
npm install @inertiajs/react react react-dom

# Svelte
npm install @inertiajs/svelte svelte
```

### 2. Laravel + Vue 3 Setup

#### Backend Controller
```php
// routes/web.php
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TaskController;

Route::get('/', function () {
    return Inertia::render('Home', [
        'title' => 'Welcome',
        'description' => 'Inertia.js Application'
    ]);
});

Route::resource('tasks', TaskController::class);

// app/Http/Controllers/TaskController.php
namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Task;

class TaskController extends Controller
{
    public function index()
    {
        $tasks = Task::latest()->get();
        
        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|max:255',
            'description' => 'nullable',
        ]);
        
        Task::create($validated);
        
        return redirect()->route('tasks.index')
            ->with('success', 'Task created successfully');
    }
    
    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'required|max:255',
            'completed' => 'boolean',
        ]);
        
        $task->update($validated);
        
        return redirect()->back()
            ->with('success', 'Task updated');
    }
    
    public function destroy(Task $task)
    {
        $task->delete();
        
        return redirect()->route('tasks.index')
            ->with('success', 'Task deleted');
    }
}
```

#### Frontend (Vue 3)
```vue
<!-- resources/js/Pages/Home.vue -->
<script setup>
import { Head } from '@inertiajs/vue3';

defineProps({
    title: String,
    description: String,
});
</script>

<template>
    <Head :title="title" />
    
    <div class="home">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
    </div>
</template>

<!-- resources/js/Pages/Tasks/Index.vue -->
<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';

const props = defineProps({
    tasks: Array,
    flash: Object,
});

const deleteTask = (taskId) => {
    if (confirm('Are you sure?')) {
        form.delete(route('tasks.destroy', taskId));
    }
};

const toggleComplete = (task) => {
    form.put(route('tasks.update', task.id), {
        completed: !task.completed,
    });
};
</script>

<template>
    <Head title="Tasks" />
    
    <AuthenticatedLayout>
        <template #header>
            <h2>Tasks</h2>
        </template>
        
        <div class="tasks">
            <Link :href="route('tasks.create')" class="btn-primary">
                Create Task
            </Link>
            
            <div v-if="flash.success" class="alert alert-success">
                {{ flash.success }}
            </div>
            
            <div v-for="task in tasks" :key="task.id" class="task-item">
                <input 
                    type="checkbox" 
                    :checked="task.completed"
                    @change="toggleComplete(task)"
                />
                <span :class="{ completed: task.completed }">
                    {{ task.title }}
                </span>
                <Link :href="route('tasks.edit', task.id)">Edit</Link>
                <button @click="deleteTask(task.id)">Delete</button>
            </div>
        </div>
    </AuthenticatedLayout>
</template>

<style scoped>
.completed {
    text-decoration: line-through;
    opacity: 0.6;
}
</style>
```

### 3. React Setup

```tsx
// resources/js/Pages/Home.tsx
import { Head } from '@inertiajs/react';

interface HomeProps {
    title: string;
    description: string;
}

export default function Home({ title, description }: HomeProps) {
    return (
        <>
            <Head title={title} />
            
            <div className="home">
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
        </>
    );
}

// resources/js/Pages/Tasks/Index.tsx
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Task {
    id: number;
    title: string;
    description: string;
    completed: boolean;
}

interface TasksIndexProps {
    tasks: Task[];
    flash?: {
        success?: string;
    };
}

export default function TasksIndex({ tasks, flash }: TasksIndexProps) {
    const { delete: destroy, put } = useForm();
    
    const deleteTask = (taskId: number) => {
        if (confirm('Are you sure?')) {
            destroy(route('tasks.destroy', taskId));
        }
    };
    
    const toggleComplete = (task: Task) => {
        put(route('tasks.update', task.id), {
            completed: !task.completed,
        });
    };
    
    return (
        <>
            <Head title="Tasks" />
            
            <AuthenticatedLayout>
                <div className="tasks">
                    <Link 
                        href={route('tasks.create')} 
                        className="btn-primary"
                    >
                        Create Task
                    </Link>
                    
                    {flash?.success && (
                        <div className="alert alert-success">
                            {flash.success}
                        </div>
                    )}
                    
                    {tasks.map(task => (
                        <div key={task.id} className="task-item">
                            <input 
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleComplete(task)}
                            />
                            <span className={task.completed ? 'completed' : ''}>
                                {task.title}
                            </span>
                            <Link href={route('tasks.edit', task.id)}>
                                Edit
                            </Link>
                            <button onClick={() => deleteTask(task.id)}>
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </AuthenticatedLayout>
        </>
    );
}
```

### 4. Form Handling

```vue
<!-- Vue 3 Form Example -->
<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3';

const form = useForm({
    title: '',
    description: '',
    priority: 'medium',
});

const submit = () => {
    form.post(route('tasks.store'), {
        onSuccess: () => {
            form.reset();
        },
        onError: (errors) => {
            console.log(errors);
        },
    });
};
</script>

<template>
    <Head title="Create Task" />
    
    <form @submit.prevent="submit">
        <div>
            <label>Title</label>
            <input 
                v-model="form.title" 
                type="text"
                :class="{ error: form.errors.title }"
            />
            <span v-if="form.errors.title" class="error">
                {{ form.errors.title }}
            </span>
        </div>
        
        <div>
            <label>Description</label>
            <textarea v-model="form.description"></textarea>
            <span v-if="form.errors.description" class="error">
                {{ form.errors.description }}
            </span>
        </div>
        
        <div>
            <label>Priority</label>
            <select v-model="form.priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
        </div>
        
        <button type="submit" :disabled="form.processing">
            {{ form.processing ? 'Creating...' : 'Create Task' }}
        </button>
    </form>
</template>
```

### 5. Shared Data and Layout

```php
// app/Http/Middleware/HandleInertiaRequests.php
namespace App\Http\Middleware;

use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';
    
    public function share($request)
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'ziggy' => function () use ($request) {
                return array_merge(
                    (new \Tightenco\Ziggy\Ziggy())->toArray(),
                    ['location' => $request->url()]
                );
            },
        ]);
    }
}
```

```vue
<!-- Layout Component -->
<script setup>
import { Link } from '@inertiajs/vue3';

const props = defineProps({
    auth: Object,
    flash: Object,
});
</script>

<template>
    <div class="layout">
        <nav>
            <Link :href="route('dashboard')">Dashboard</Link>
            <Link :href="route('tasks.index')">Tasks</Link>
            
            <div class="auth">
                <span v-if="auth.user">
                    {{ auth.user.name }}
                </span>
                <Link 
                    v-else 
                    :href="route('login')"
                    method="post"
                >
                    Login
                </Link>
            </div>
        </nav>
        
        <main>
            <slot />
        </main>
    </div>
</template>
```

### 6. File Uploads

```php
// Backend
public function store(Request $request)
{
    $validated = $request->validate([
        'avatar' => 'required|image|max:2048',
    ]);
    
    $path = $request->file('avatar')->store('avatars', 'public');
    
    auth()->user()->update(['avatar' => $path]);
    
    return redirect()->back();
}
```

```vue
<!-- Frontend -->
<script setup>
import { useForm } from '@inertiajs/vue3';

const form = useForm({
    avatar: null,
});

const submit = () => {
    form.post(route('profile.update-avatar'), {
        forceFormData: true,
        onSuccess: () => {
            form.reset('avatar');
        },
    });
};
</script>

<template>
    <form @submit.prevent="submit">
        <input 
            type="file" 
            @input="form.avatar = $event.target.files[0]"
        />
        
        <progress v-if="form.progress" :value="form.progress.percentage" max="100">
            {{ form.progress.percentage }}%
        </progress>
        
        <button type="submit" :disabled="form.processing">
            Upload Avatar
        </button>
    </form>
</template>
```

### 7. Pagination

```php
// Backend
public function index()
{
    $tasks = Task::paginate(10);
    
    return Inertia::render('Tasks/Index', [
        'tasks' => $tasks,
    ]);
}
```

```vue
<!-- Frontend -->
<script setup>
import { Link } from '@inertiajs/vue3';

const props = defineProps({
    tasks: Object, // Laravel pagination object
});
</script>

<template>
    <div class="tasks">
        <div v-for="task in tasks.data" :key="task.id">
            {{ task.title }}
        </div>
        
        <div class="pagination">
            <Link 
                v-for="link in tasks.links" 
                :key="link.label"
                :href="link.url"
                :class="{ active: link.active }"
                v-html="link.label"
            />
        </div>
    </div>
</template>
```

### 8. Validation Errors

```php
// Backend
public function store(Request $request)
{
    $validated = $request->validate([
        'title' => 'required|max:255',
        'email' => 'required|email|unique:users',
    ]);
    
    // ...
}
```

```vue
<!-- Frontend -->
<script setup>
import { useForm } from '@inertiajs/vue3';

const form = useForm({
    title: '',
    email: '',
});

const submit = () => {
    form.post(route('users.store'));
};
</script>

<template>
    <form @submit.prevent="submit">
        <div>
            <input v-model="form.title" />
            <div v-if="form.errors.title" class="error">
                {{ form.errors.title }}
            </div>
        </div>
        
        <div>
            <input v-model="form.email" type="email" />
            <div v-if="form.errors.email" class="error">
                {{ form.errors.email }}
            </div>
        </div>
        
        <button type="submit">Submit</button>
    </form>
</template>
```

### 9. Authorization

```php
// Backend - using policies
public function update(Request $request, Task $task)
{
    $this->authorize('update', $task);
    
    // ...
}

// Share authorization data
public function share($request)
{
    return array_merge(parent::share($request), [
        'can' => [
            'createTask' => $request->user()?->can('create', Task::class),
        ],
    ]);
}
```

```vue
<!-- Frontend -->
<script setup>
import { Link } from '@inertiajs/vue3';

defineProps({
    can: Object,
});
</script>

<template>
    <div>
        <Link 
            v-if="can.createTask" 
            :href="route('tasks.create')"
        >
            Create Task
        </Link>
    </div>
</template>
```

### 10. Testing

```php
// tests/Feature/TaskTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Task;
use Inertia\Testing\AssertableInertia as Assert;

class TaskTest extends TestCase
{
    public function test_can_view_tasks_index()
    {
        $user = User::factory()->create();
        
        $this->actingAs($user)
            ->get(route('tasks.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Tasks/Index')
                ->has('tasks')
            );
    }
    
    public function test_can_create_task()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)
            ->post(route('tasks.store'), [
                'title' => 'New Task',
                'description' => 'Task description',
            ]);
        
        $response->assertRedirect(route('tasks.index'));
        
        $this->assertDatabaseHas('tasks', [
            'title' => 'New Task',
        ]);
    }
}
```

## Best Practices

1. **Use form helpers** - Leverage useForm for form handling
2. **Validate on server** - Always validate data on backend
3. **Share common data** - Use middleware for auth and flash messages
4. **Keep components simple** - Extract reusable components
5. **Use route helpers** - Ziggy package provides route() function
6. **Handle errors gracefully** - Show validation errors to users
7. **Optimize assets** - Use Vite for asset bundling

## Common Patterns

```php
// Pattern 1: CRUD Resource
Route::resource('posts', PostController::class);

// Pattern 2: Nested Resources
Route::resource('posts.comments', CommentController::class);

// Pattern 3: API-like routes
Route::prefix('api')->group(function () {
    Route::get('/search', [SearchController::class, 'index']);
});
```

## When to Choose Inertia.js

✅ **Good fit:**
- Full-stack applications with server-side routing
- Teams with backend framework expertise
- Projects wanting SPA without building API
- Applications requiring SEO
- Rapid application development
- Projects transitioning from MPAs to SPAs

❌ **Not ideal:**
- Pure frontend applications
- Projects with separate API team
- Applications requiring native mobile apps
- Projects with complex real-time features
- Teams wanting full API-first architecture

## Alternatives

- **Next.js** - React with SSR and routing
- **Nuxt.js** - Vue with SSR and routing
- **Remix** - React full-stack framework
- **Laravel Livewire** - Server-side reactive components
- **Hotwire (Rails)** - HTML-over-the-wire approach
