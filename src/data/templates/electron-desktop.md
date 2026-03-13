# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Electron Desktop Application
**Type**: Cross-platform Desktop Application
**Tech Stack**: Electron 28+ + React + TypeScript
**Goal**: Production-ready desktop app with auto-updates, native features, and cross-platform support

---

## Tech Stack

### Core
- **Framework**: Electron 28+
- **Frontend**: React 18+ / Vue 3 / Svelte
- **Language**: TypeScript 5.3+
- **Build Tool**: Vite / Webpack
- **Styling**: Tailwind CSS / CSS Modules

### Native Features
- **Auto-Update**: electron-updater
- **Installer**: electron-builder / electron-forge
- **Database**: SQLite / electron-store / Dexie.js
- **IPC**: Electron IPC / electron-redux

### Development
- **Package Manager**: pnpm / npm
- **Testing**: Vitest (unit) + Playwright (E2E) + Spectron
- **Linting**: ESLint + Prettier
- **DevTools**: React DevTools + Redux DevTools

---

## Code Standards

### TypeScript Rules
- Use strict mode - no `any` types
- Separate main and renderer process types
- Use `contextBridge` for IPC security
- Prefer `async/await` over callbacks

```typescript
// ✅ Good - Type-safe IPC communication
// main.ts
import { ipcMain } from 'electron'

interface FileOpenResult {
  success: boolean
  content?: string
  error?: string
}

ipcMain.handle('file:open', async (_, filePath: string): Promise<FileOpenResult> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filePath: string): Promise<FileOpenResult> => 
    ipcRenderer.invoke('file:open', filePath)
})

// renderer.ts
const result = await window.electronAPI.openFile('/path/to/file.txt')

// ❌ Bad - No type safety, security risk
ipcMain.on('file:open', (event, filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8') // ❌ Blocking
  event.reply('file:opened', content) // ❌ No error handling
})
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **IPC Channels**: kebab-case with namespace (`file:open`, `user:create`)
- **CSS Classes**: kebab-case (`user-profile-container`)
- **Files**: kebab-case (`user-profile.tsx`)
- **Folders**: kebab-case (`user-profile/`)

### File Organization
```
electron-app/
├── main/                      # Main process code
│   ├── index.ts              # Entry point
│   ├── ipc/                  # IPC handlers
│   │   ├── file-handlers.ts
│   │   └── user-handlers.ts
│   ├── services/             # Main process services
│   │   ├── database.ts
│   │   └── auto-updater.ts
│   └── utils/                # Utility functions
│       └── paths.ts
├── preload/                   # Preload scripts
│   ├── index.ts
│   └── api.ts                # Exposed API
├── renderer/                  # Renderer process (React app)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   └── index.html
├── shared/                    # Shared types and utilities
│   ├── types/
│   │   └── ipc.ts
│   └── constants/
│       └── channels.ts
├── resources/                 # App resources
│   ├── icon.ico              # Windows icon
│   ├── icon.icns             # macOS icon
│   └── icon.png              # Linux icon
├── electron-builder.yml       # Build configuration
├── package.json
└── tsconfig.json
```

---

## Architecture Patterns

### IPC Communication Pattern

**When to use**: Secure communication between main and renderer

```typescript
// ✅ Good - Type-safe IPC with contextBridge
// shared/types/ipc.ts
export interface IpcChannels {
  'file:open': (path: string) => Promise<{ content: string }>
  'file:save': (path: string, content: string) => Promise<void>
  'user:get': () => Promise<User>
}

// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannels } from '../shared/types/ipc'

const electronAPI: IpcChannels = {
  'file:open': (path) => ipcRenderer.invoke('file:open', path),
  'file:save': (path, content) => ipcRenderer.invoke('file:save', path, content),
  'user:get': () => ipcRenderer.invoke('user:get')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// main/ipc/file-handlers.ts
import { ipcMain } from 'electron'
import * as fs from 'fs/promises'

ipcMain.handle('file:open', async (_, path: string) => {
  const content = await fs.readFile(path, 'utf-8')
  return { content }
})

// renderer/src/App.tsx
const openFile = async () => {
  const result = await window.electronAPI['file:open']('/path/to/file')
  console.log(result.content)
}
```

### State Management Pattern

**When to use**: Shared state between main and renderer

```typescript
// ✅ Good - electron-redux for shared state
// main/store.ts
import { createStore } from 'redux'
import { electronEnhancer } from 'electron-redux'

const store = createStore(
  rootReducer,
  electronEnhancer({
    scope: 'main'
  })
)

// renderer/store.ts
import { createStore } from 'redux'
import { electronEnhancer } from 'electron-redux'

const store = createStore(
  rootReducer,
  electronEnhancer({
    scope: 'renderer'
  })
)

// State is automatically synced between processes
```

### Native Menu Pattern

**When to use**: Custom application menus

```typescript
// ✅ Good - Type-safe menu with proper event handling
// main/menu.ts
import { Menu, app, BrowserWindow } from 'electron'

export function createMenu(win: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(win, {
              properties: ['openFile'],
              filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }]
            })
            
            if (!result.canceled && result.filePaths.length > 0) {
              win.webContents.send('file:selected', result.filePaths[0])
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    }
  ]
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
```

---

## Key Constraints

### Security
- ✅ Use `contextBridge` for IPC
- ✅ Enable `contextIsolation: true`
- ✅ Disable `nodeIntegration` in renderer
- ✅ Validate all IPC inputs
- ✅ Use Content Security Policy
- ❌ No `require` in renderer process
- ❌ No `remote` module (deprecated)
- ❌ No `eval()` or `Function()` in renderer
- ❌ No loading remote content without sandbox

### Performance
- ✅ Lazy load heavy components
- ✅ Use web workers for CPU-intensive tasks
- ✅ Optimize bundle size
- ✅ Use V8 code caching
- ❌ No blocking operations in main process
- ❌ No synchronous IPC calls
- ❌ No large objects in IPC messages

### Cross-Platform
- ✅ Test on all target platforms (Windows, macOS, Linux)
- ✅ Use platform-specific paths
- ✅ Handle platform-specific shortcuts
- ✅ Provide platform-specific installers
- ❌ No hardcoded paths
- ❌ No platform-specific code without fallbacks

---

## Common Commands

### Development
```bash
# Start development server
pnpm dev

# Start with DevTools
pnpm dev:inspect

# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format
```

### Building
```bash
# Build for current platform
pnpm build

# Build for all platforms
pnpm build:all

# Build for specific platform
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux

# Package without installer
pnpm package
```

### Testing
```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage

# Debug tests
pnpm test:debug
```

### Debugging
```bash
# Run with Chrome DevTools
pnpm dev --inspect

# View main process logs
tail -f ~/Library/Logs/app-name/main.log  # macOS
tail -f %USERPROFILE%\AppData\Roaming\app-name\logs\main.log  # Windows

# View renderer console
# Open DevTools: View -> Toggle Developer Tools
```

---

## Important Prohibitions

### ❌ Never Do
- Don't disable `contextIsolation`
- Don't enable `nodeIntegration` in renderer
- Don't use the `remote` module (deprecated)
- Don't load remote content without sandbox
- Don't store secrets in localStorage
- Don't skip code signing for production
- Don't ignore auto-updater errors

### ⚠️ Use with Caution
- `shell.openExternal` - validate URLs
- `webview` tag - use with sandbox
- Native modules - ensure cross-platform compatibility
- File system access - validate paths
- Auto-updater - handle failures gracefully

---

## Best Practices

### Window Management

```typescript
// ✅ Good - Proper window lifecycle management
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
    }
  })
  
  mainWindow.loadFile('index.html')
  
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
```

### Auto-Updater

```typescript
// ✅ Good - Robust auto-updater with error handling
import { autoUpdater } from 'electron-updater'
import { dialog } from 'electron'

autoUpdater.logger = logger
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on('update-available', async (info) => {
  const result = await dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `Version ${info.version} is available. Download now?`,
    buttons: ['Download', 'Later']
  })
  
  if (result.response === 0) {
    await autoUpdater.downloadUpdate()
  }
})

autoUpdater.on('update-downloaded', async () => {
  const result = await dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. Install and restart now?',
    buttons: ['Install', 'Later']
  })
  
  if (result.response === 0) {
    autoUpdater.quitAndInstall()
  }
})

autoUpdater.on('error', (error) => {
  logger.error('Auto-updater error:', error)
})

// Check for updates on app start
app.whenReady().then(() => {
  autoUpdater.checkForUpdates()
})
```

### Secure Data Storage

```typescript
// ✅ Good - Encrypted data storage
import { safeStorage } from 'electron'
import Store from 'electron-store'

interface SecureStore {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
}

export class EncryptedStore implements SecureStore {
  private store = new Store({ encryptionSecret: 'your-secret-key' })
  
  async get<T>(key: string): Promise<T | null> {
    const encrypted = this.store.get(key) as string | undefined
    if (!encrypted) return null
    
    const decrypted = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    return JSON.parse(decrypted) as T
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    const plaintext = JSON.stringify(value)
    const encrypted = safeStorage.encryptString(plaintext).toString('base64')
    this.store.set(key, encrypted)
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
}
```

---

## Quick Reference

### BrowserWindow Configuration
```typescript
const win = new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  webPreferences: {
    nodeIntegration: false,       // Security
    contextIsolation: true,       // Security
    sandbox: true,                // Security
    preload: path.join(__dirname, 'preload.js')
  }
})
```

### IPC Patterns
- **Request/Response**: `ipcRenderer.invoke()` + `ipcMain.handle()`
- **Event-based**: `ipcRenderer.send()` + `ipcMain.on()`
- **One-way**: `ipcRenderer.send()` (no response)

### Build Configuration (electron-builder.yml)
```yaml
appId: com.example.app
productName: MyApp
directories:
  output: dist
  buildResources: resources
files:
  - "**/*"
  - "!**/*.ts"
  - "!src/**"
  - "!node_modules/*/{CHANGELOG.md,README.md,readme.md}"
win:
  target: nsis
  icon: resources/icon.ico
mac:
  target: dmg
  icon: resources/icon.icns
linux:
  target: AppImage
  icon: resources/icon.png
```

### Common Events
- `app.whenReady()` - App is ready
- `window-all-closed` - All windows closed
- `activate` - App activated (macOS)
- `before-quit` - App is about to quit
- `web-contents-created` - New web contents created

---

**Last Updated**: 2026-03-13
