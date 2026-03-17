# Tauri Desktop Application Template

## Project Overview

Lightweight, secure desktop application built with Tauri, combining a Rust backend with modern web frontend. Tauri apps are significantly smaller than Electron equivalents, with better security and native performance.

## Tech Stack

- **Core**: Tauri 2.x
- **Frontend**: React 18 + TypeScript / Vue 3 / Svelte
- **Build**: Vite 5
- **Backend**: Rust
- **Styling**: Tailwind CSS
- **State**: Zustand / Pinia
- **Testing**: Vitest, Tauri WebDriver

## Project Structure

```
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── ui/                   # UI primitives
│   │   ├── layout/               # Layout components
│   │   └── features/             # Feature components
│   ├── hooks/                    # Custom hooks
│   │   ├── useTauri.ts           # Tauri commands hook
│   │   └── useStore.ts
│   ├── lib/                      # Utilities
│   │   ├── tauri.ts              # Tauri API wrapper
│   │   └── utils.ts
│   ├── stores/                   # State management
│   │   └── appStore.ts
│   ├── types/                    # TypeScript types
│   │   └── index.ts
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── src-tauri/                    # Rust backend
│   ├── src/                      # Rust source
│   │   ├── main.rs               # Main entry
│   │   ├── lib.rs                # Library exports
│   │   ├── commands/             # Tauri commands
│   │   │   ├── mod.rs
│   │   │   ├── fs.rs             # File system ops
│   │   │   └── system.rs         # System info
│   │   ├── utils/                # Rust utilities
│   │   │   └── mod.rs
│   │   └── models/               # Data models
│   │       └── mod.rs
│   ├── icons/                    # App icons
│   ├── tauri.conf.json           # Tauri configuration
│   ├── Cargo.toml                # Rust dependencies
│   └── build.rs                  # Build script
├── public/                       # Static assets
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## Key Patterns

### 1. Tauri Configuration

```json
// src-tauri/tauri.conf.json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "MyApp",
  "version": "1.0.0",
  "identifier": "com.mycompany.myapp",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "My App",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self'"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "deb", "appimage"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "publisher": "My Company",
    "category": "Utility",
    "shortDescription": "My awesome desktop app",
    "longDescription": "A modern desktop application built with Tauri"
  },
  "plugins": {
    "fs": {},
    "shell": {
      "open": true
    },
    "dialog": {},
    "notification": {}
  }
}
```

### 2. Rust Commands

```rust
// src-tauri/src/commands/fs.rs
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    name: String,
    path: String,
    is_dir: bool,
    size: u64,
}

#[command]
pub async fn read_directory(path: String) -> Result<Vec<FileInfo>, String> {
    let dir_path = PathBuf::from(&path);
    
    let entries = fs::read_dir(&dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    let mut files = Vec::new();
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to get metadata: {}", e))?;
        
        files.push(FileInfo {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
        });
    }
    
    Ok(files)
}

#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}
```

```rust
// src-tauri/src/commands/system.rs
use serde::{Deserialize, Serialize};
use sysinfo::System;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    os_name: String,
    os_version: String,
    cpu_usage: f32,
    total_memory: u64,
    used_memory: u64,
}

#[command]
pub async fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    SystemInfo {
        os_name: System::name().unwrap_or_default(),
        os_version: System::os_version().unwrap_or_default(),
        cpu_usage: sys.global_cpu_usage(),
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
    }
}
```

### 3. Register Commands

```rust
// src-tauri/src/lib.rs
mod commands;

use commands::{fs, system};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            fs::read_directory,
            fs::read_file,
            fs::write_file,
            system::get_system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```rust
// src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    my_app_lib::run()
}
```

### 4. Frontend Tauri Hook

```tsx
// src/hooks/useTauri.ts
import { invoke } from '@tauri-apps/api/core'
import { useState, useCallback } from 'react'

export function useTauriCommand<T, Args extends unknown[]>(
  command: string
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (...args: Args) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await invoke<T>(command, { 
        args: args.length === 1 ? args[0] : args 
      })
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [command])

  return { data, loading, error, execute }
}

// Usage
export function useFileSystem() {
  const readDir = useTauriCommand<FileInfo[], [string]>('read_directory')
  const readFile = useTauriCommand<string, [string]>('read_file')
  const writeFile = useTauriCommand<void, [string, string]>('write_file')
  
  return { readDir, readFile, writeFile }
}
```

### 5. Dialog & Notification

```tsx
// src/lib/tauri.ts
import { open, save } from '@tauri-apps/plugin-dialog'
import {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} from '@tauri-apps/plugin-notification'

export async function openFilePicker() {
  const selected = await open({
    multiple: false,
    filters: [
      { name: 'Text', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  return selected
}

export async function saveFilePicker(defaultPath?: string) {
  const selected = await save({
    defaultPath,
    filters: [
      { name: 'Text', extensions: ['txt'] },
    ],
  })
  return selected
}

export async function showNotification(title: string, body: string) {
  let permissionGranted = await isPermissionGranted()
  
  if (!permissionGranted) {
    const permission = await requestPermission()
    permissionGranted = permission === 'granted'
  }
  
  if (permissionGranted) {
    await sendNotification({ title, body })
  }
}
```

### 6. Zustand Store with Tauri Persistence

```tsx
// src/stores/appStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { writeFile, readFile } from '@tauri-apps/plugin-fs'
import { appDataDir } from '@tauri-apps/api/path'

interface AppState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  recentFiles: string[]
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  addRecentFile: (path: string) => void
}

// Custom Tauri storage
const tauriStorage = {
  getItem: async (name: string) => {
    try {
      const appDir = await appDataDir()
      const data = await readFile(`${appDir}${name}.json`, 'utf-8')
      return data
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string) => {
    const appDir = await appDataDir()
    await writeFile(`${appDir}${name}.json`, value)
  },
  removeItem: async (name: string) => {
    const appDir = await appDataDir()
    await writeFile(`${appDir}${name}.json`, '')
  },
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      recentFiles: [],
      
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      addRecentFile: (path) => set((state) => ({
        recentFiles: [path, ...state.recentFiles.filter(p => p !== path)].slice(0, 10)
      })),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => tauriStorage),
    }
  )
)
```

### 7. Main Component

```tsx
// src/App.tsx
import { useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import { MainLayout } from './components/layout/MainLayout'
import { useSystemInfo } from './hooks/useTauri'

export default function App() {
  const { theme } = useAppStore()
  const { execute: loadSystemInfo, data: systemInfo } = useSystemInfo()

  useEffect(() => {
    loadSystemInfo()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainLayout>
        <header>
          <h1>System Info</h1>
          {systemInfo && (
            <div>
              <p>OS: {systemInfo.os_name} {systemInfo.os_version}</p>
              <p>Memory: {systemInfo.used_memory / 1024 / 1024} MB / {systemInfo.total_memory / 1024 / 1024} MB</p>
            </div>
          )}
        </header>
      </MainLayout>
    </div>
  )
}
```

## Best Practices

1. **Security**: Use CSP headers, validate all inputs in Rust
2. **Error Handling**: Return Result types from Rust commands
3. **Async Commands**: Use async for I/O operations
4. **Bundle Size**: Use Vite tree-shaking, avoid large dependencies
5. **Platform-specific**: Use cfg attributes for platform differences

## Common Commands

```bash
# Development
pnpm tauri dev

# Build
pnpm tauri build

# Build specific platform
pnpm tauri build --target x86_64-pc-windows-msvc
pnpm tauri build --target aarch64-apple-darwin

# Info
pnpm tauri info

# Add plugin
pnpm tauri add fs
pnpm tauri add dialog
pnpm tauri add notification
pnpm tauri add shell

# Icon generation
pnpm tauri icon /path/to/icon.png

# Sign (macOS)
pnpm tauri sign

# Test
pnpm test
cargo test
```

## Rust Dependencies

```toml
# src-tauri/Cargo.toml
[package]
name = "my-app"
version = "1.0.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-fs = "2"
tauri-plugin-shell = "2"
tauri-plugin-dialog = "2"
tauri-plugin-notification = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
sysinfo = "0.30"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

## Platform-Specific Notes

### macOS
- Sign with Developer ID certificate
- Notarize with `xcrun notarytool`
- Use hardened runtime

### Windows
- Sign with code signing certificate
- Use MSIX for Microsoft Store
- Consider NSIS installer

### Linux
- Build DEB, RPM, AppImage
- Use `.desktop` file for menu entry
- Consider Flatpak/Snap

## Resources

- [Tauri Documentation](https://v2.tauri.app/)
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Tauri Discord](https://discord.com/invite/tauri)
