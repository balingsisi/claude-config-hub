# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Alpine.js Application
**Type**: Lightweight Frontend Application
**Tech Stack**: Alpine.js + Tailwind CSS + Vite
**Goal**: Build reactive UI components without complex build tools or heavy frameworks

---

## Tech Stack

### Frontend
- **Framework**: Alpine.js 3.x
- **Language**: JavaScript/TypeScript
- **Styling**: Tailwind CSS 3.x
- **Build Tool**: Vite 5.x
- **Utilities**: Alpine.js plugins (Persist, Focus, Trap, Intersect)

### Development
- **Package Manager**: npm/pnpm/yarn
- **Linting**: ESLint
- **Formatting**: Prettier
- **Hot Reload**: Vite HMR

### Optional Enhancements
- **Routing**: Alpine Router or simple hash routing
- **HTTP Client**: Fetch API or Axios
- **Icons**: Heroicons or Lucide

---

## Code Standards

### JavaScript/TypeScript Rules
- Use Alpine.js directives in HTML templates
- Keep component logic small and focused
- Use `x-data` for component state
- Prefer reactive data binding over manual DOM manipulation

```javascript
// ✅ Good - Reactive component
<div x-data="{ count: 0 }">
  <button @click="count++">Increment</button>
  <span x-text="count"></span>
</div>

// ❌ Bad - Manual DOM manipulation
<div id="counter">
  <button onclick="increment()">Increment</button>
  <span id="count">0</span>
</div>
```

### Naming Conventions
- **Components**: camelCase (`userProfile`)
- **State variables**: camelCase (`isOpen`, `isLoading`)
- **Methods**: camelCase (`toggleModal`, `fetchData`)
- **Custom directives**: camelCase (`x-custom-directive`)

### File Organization
```
src/
├── components/      # Alpine.js components
│   ├── modals.js
│   ├── dropdowns.js
│   └── forms.js
├── stores/         # Global state stores
│   ├── cart.js
│   └── user.js
├── directives/     # Custom directives
│   └── click-outside.js
├── utils/          # Utility functions
├── styles/         # Global styles
│   └── main.css
└── main.js         # Entry point
```

---

## Architecture Patterns

### Component Structure
- Use `x-data` to define component state
- Use `x-init` for initialization logic
- Use `x-show`/`x-if` for conditional rendering
- Use `x-for` for lists
- Extract reusable logic into functions

```html
<!-- ✅ Good - Well-structured component -->
<div x-data="userProfile()" x-init="init()">
  <div x-show="loading">Loading...</div>
  <div x-show="!loading && user">
    <h1 x-text="user.name"></h1>
    <button @click="edit()">Edit Profile</button>
  </div>
</div>

<script>
function userProfile() {
  return {
    user: null,
    loading: true,
    
    async init() {
      this.user = await fetchUser()
      this.loading = false
    },
    
    edit() {
      // Edit logic
    }
  }
}
</script>
```

### Global Stores
- Use Alpine.store() for shared state
- Keep stores focused on specific domains
- Use reactive data for automatic updates

```javascript
// ✅ Good - Global store
document.addEventListener('alpine:init', () => {
  Alpine.store('cart', {
    items: [],
    total: 0,
    
    add(item) {
      this.items.push(item)
      this.updateTotal()
    },
    
    remove(index) {
      this.items.splice(index, 1)
      this.updateTotal()
    },
    
    updateTotal() {
      this.total = this.items.reduce((sum, item) => sum + item.price, 0)
    }
  })
})

// Usage
<div x-data x-text="$store.cart.total"></div>
```

### Custom Directives
- Create reusable directives for common behaviors
- Use `Alpine.directive()` to register
- Provide clear, semantic names

```javascript
// ✅ Good - Custom directive
Alpine.directive('click-outside', (el, { expression }, { evaluate }) => {
  el._clickOutside = (event) => {
    if (!el.contains(event.target)) {
      evaluate(expression)
    }
  }
  document.addEventListener('click', el._clickOutside)
})

// Usage
<div x-data="{ show: true }" x-click-outside="show = false">
  <button @click="show = true">Open</button>
</div>
```

---

## Key Constraints

### Performance
- ✅ Use `x-cloak` to hide un-initialized components
- ✅ Use `x-show` for toggling (keeps in DOM) vs `x-if` (removes from DOM)
- ✅ Lazy load heavy components
- ✅ Use `x-intersect` for lazy loading
- ❌ Don't overuse `x-if` on frequently toggled elements
- ❌ Don't fetch data on every render without caching

### Security
- ✅ Sanitize user input before display
- ✅ Use `x-html` carefully (XSS risk)
- ✅ Validate data on server-side
- ❌ Never trust user-provided HTML

### Maintainability
- ✅ Keep component logic simple (< 100 lines)
- ✅ Extract complex logic into separate functions
- ✅ Use TypeScript for type safety
- ✅ Document complex components
- ❌ Don't nest components too deeply
- ❌ Don't create monolithic components

---

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Alpine.js Plugins
```bash
npm install @alpinejs/persist    # Persist state to localStorage
npm install @alpinejs/focus      # Focus management
npm install @alpinejs/trap       # Focus trap
npm install @alpinejs/intersect  # Intersection observer
npm install @alpinejs/anchor     # Anchor positioning
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use jQuery with Alpine.js - use Alpine's reactivity instead
- Don't manipulate DOM directly - use Alpine directives
- Don't create large monolithic components
- Don't ignore accessibility (ARIA attributes)
- Don't forget to add `x-cloak` styling
- Don't use `x-html` with unsanitized user input
- Don't create circular dependencies in stores

### ⚠️ Use with Caution
- `x-html` - ensure content is sanitized
- `x-effect` - can cause performance issues if overused
- Nested `x-for` loops - can impact performance
- Deep reactivity - may not be needed for simple data

---

## Best Practices

### Component Design
- Keep components focused and small
- Use composition over inheritance
- Extract reusable logic into utilities
- Use semantic HTML elements

```html
<!-- ✅ Good - Focused component -->
<div x-data="modal()" class="modal">
  <button @click="open()" class="btn">Open Modal</button>
  
  <div x-show="isOpen" class="modal-overlay" @click.self="close()">
    <div class="modal-content">
      <slot></slot>
      <button @click="close()">Close</button>
    </div>
  </div>
</div>

<script>
function modal() {
  return {
    isOpen: false,
    open() { this.isOpen = true },
    close() { this.isOpen = false }
  }
}
</script>
```

### State Management
- Use local state for component-specific data
- Use stores for shared/global state
- Use `x-model` for two-way binding
- Use `x-modelable` for custom two-way bindings

```html
<!-- ✅ Good - Two-way binding -->
<div x-data="{ search: '' }">
  <input x-model="search" placeholder="Search...">
  <p>Searching for: <span x-text="search"></span></p>
</div>
```

### Transitions
- Use `x-transition` for smooth animations
- Define custom transition classes
- Use `x-transition:enter`/`x-transition:leave` for control

```html
<!-- ✅ Good - Smooth transitions -->
<div x-show="isOpen" x-transition>
  <!-- Content -->
</div>

<!-- With custom classes -->
<div 
  x-show="isOpen"
  x-transition:enter="transition ease-out duration-300"
  x-transition:enter-start="opacity-0 transform scale-90"
  x-transition:enter-end="opacity-100 transform scale-100"
  x-transition:leave="transition ease-in duration-200"
  x-transition:leave-start="opacity-100 transform scale-100"
  x-transition:leave-end="opacity-0 transform scale-90"
>
  <!-- Content -->
</div>
```

### Event Handling
- Use `@click` for click events
- Use `@keydown` for keyboard events
- Use `.prevent`, `.stop` modifiers
- Use `.window` for global events

```html
<!-- ✅ Good - Event handling -->
<form @submit.prevent="submit()">
  <input @keydown.escape="cancel()" />
  <button @click.once="save()">Save</button>
</form>

<div @click.away="close()">Click outside to close</div>
```

---

## Quick Reference

### Common Directives
- `x-data` - Define component state
- `x-init` - Run initialization code
- `x-show` - Show/hide elements (keeps in DOM)
- `x-if` - Add/remove elements from DOM
- `x-for` - Loop over arrays
- `x-model` - Two-way data binding
- `x-text` - Set text content
- `x-html` - Set HTML content (⚠️ XSS risk)
- `x-bind` - Bind attributes (shorthand: `:attr`)
- `x-on` - Event listeners (shorthand: `@event`)
- `x-transition` - Apply transitions

### Lifecycle Hooks
- `x-init` - Run on component initialization
- `x-effect` - Run when dependencies change
- `x-ref` - Reference elements in component

### Modifiers
- `.prevent` - Call `event.preventDefault()`
- `.stop` - Call `event.stopPropagation()`
- `.once` - Run handler only once
- `.window` - Listen on window
- `.document` - Listen on document
- `.away` - Trigger when clicked outside
- `.debounce` - Debounce handler
- `.throttle` - Throttle handler

---

**Last Updated**: 2026-03-17
