# Tauri 2.0 Template

## Project Overview

Cross-platform desktop application with Tauri 2.0, featuring Rust backend, modern web frontend, and native performance with minimal bundle size.

## Tech Stack

- **Framework**: Tauri 2.0
- **Frontend**: React / Vue / Svelte / SolidJS
- **Backend**: Rust
- **Build**: Vite
- **Language**: TypeScript + Rust
- **Deployment**: Cross-platform (Windows / macOS / Linux)

## Project Structure

```
project/
├── src/                      # Frontend source code
│   ├── components/           # UI components
│   ├── pages/                # Page components
│   ├── hooks/                # Custom hooks
│   ├── utils/                # Helper functions
│   ├── services/             # API services
│   ├── store/                # State management
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs           # Main entry point
│   │   ├── lib.rs            # Library exports
│   │   ├── commands/         # Tauri commands
│   │   ├── utils/            # Rust utilities
│   │   └── models/           # Data models
│   ├── icons/                # App icons
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── public/                   # Static assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Key Patterns

### 1. Tauri Configuration

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "My App",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": ["$APPDATA", "$APPDATA/**"]
      },
      "shell": {
        "open": true
      },
      "dialog": {
        "all": true
      },
      "http": {
        "all": true,
        "request": true,
        "scope": ["https://**"]
      },
      "notification": {
        "all": true
      }
    },
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.example.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "windows": [
      {
        "title": "My App",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false
      }
    ]
  }
}
```

### 2. Rust Commands

```rust
// src-tauri/src/commands/mod.rs
use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: u32,
    pub name: String,
    pub email: String,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Tauri 2.0", name)
}

#[tauri::command]
pub fn get_user(id: u32) -> Result<User, String> {
    // Fetch user from database or API
    Ok(User {
        id,
        name: "John Doe".to_string(),
        email: "john@example.com".to_string(),
    })
}

#[tauri::command]
pub async fn fetch_data(url: String) -> Result<String, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?;
    
    let body = response.text()
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(body)
}

// State management
pub struct AppState {
    pub counter: Mutex<i32>,
}

#[tauri::command]
pub fn increment_counter(state: State<'_, AppState>) -> Result<i32, String> {
    let mut counter = state.counter.lock().map_err(|e| e.to_string())?;
    *counter += 1;
    Ok(*counter)
}
```

### 3. Frontend Integration

```typescript
// src/services/tauri.ts
import { invoke } from '@tauri-apps/api/tauri';

export async function greet(name: string): Promise<string> {
  return await invoke('greet', { name });
}

export async function getUser(id: number) {
  return await invoke<User>('get_user', { id });
}

export async function fetchData(url: string): Promise<string> {
  return await invoke('fetch_data', { url });
}

export async function incrementCounter(): Promise<number> {
  return await invoke('increment_counter');
}
```

### 4. File System Operations

```rust
// src-tauri/src/commands/filesystem.rs
use std::fs;
use std::path::PathBuf;
use tauri::api::path::app_data_dir;

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<String>, String> {
    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    let files: Vec<String> = entries
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.file_name().to_string_lossy().to_string())
        .collect();
    
    Ok(files)
}
```

```typescript
// src/hooks/useFileSystem.ts
import { invoke } from '@tauri-apps/api/tauri';

export function useFileSystem() {
  const readFile = async (path: string) => {
    return await invoke<string>('read_file', { path });
  };

  const writeFile = async (path: string, content: string) => {
    await invoke('write_file', { path, content });
  };

  const listDirectory = async (path: string) => {
    return await invoke<string[]>('list_directory', { path });
  };

  return { readFile, writeFile, listDirectory };
}
```

### 5. Dialog and Notifications

```typescript
// src/services/dialogs.ts
import { open, save } from '@tauri-apps/api/dialog';
import { sendNotification } from '@tauri-apps/api/notification';

export async function openFileDialog() {
  const selected = await open({
    multiple: false,
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] },
    ],
  });
  
  return selected as string | null;
}

export async function saveFileDialog() {
  const path = await save({
    defaultPath: 'untitled.txt',
    filters: [
      { name: 'Text', extensions: ['txt'] },
    ],
  });
  
  return path;
}

export async function notify(title: string, body: string) {
  await sendNotification({
    title,
    body,
    icon: 'icons/32x32.png',
  });
}
```

### 6. Window Management

```typescript
// src/services/window.ts
import { appWindow } from '@tauri-apps/api/window';
import { getCurrent } from '@tauri-apps/api/window';

export async function minimizeWindow() {
  await appWindow.minimize();
}

export async function maximizeWindow() {
  await appWindow.maximize();
}

export async function closeWindow() {
  await appWindow.close();
}

export async function setWindowTitle(title: string) {
  await appWindow.setTitle(title);
}

export async function getWindowSize() {
  const size = await appWindow.innerSize();
  return { width: size.width, height: size.height };
}

export async function setWindowSize(width: number, height: number) {
  await appWindow.setSize({ width, height });
}
```

### 7. Event System

```rust
// src-tauri/src/main.rs
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Emit event from Rust to frontend
            app.emit_all("backend-ready", {}).unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```typescript
// src/hooks/useEvents.ts
import { listen } from '@tauri-apps/api/event';

export function useEvents() {
  const onBackendReady = async () => {
    return await listen('backend-ready', (event) => {
      console.log('Backend is ready!', event.payload);
    });
  };

  const onFileChanged = async (callback: (path: string) => void) => {
    return await listen<{ path: string }>('file-changed', (event) => {
      callback(event.payload.path);
    });
  };

  return { onBackendReady, onFileChanged };
}
```

## Best Practices

1. **Security**: Use allowlist to restrict API access
2. **Performance**: Minimize IPC calls, batch operations
3. **Error Handling**: Proper error propagation from Rust to TypeScript
4. **State Management**: Use Tauri state for shared data
5. **Bundle Size**: Optimize assets, tree-shake dependencies

## Common Commands

```bash
# Development
npm run tauri dev

# Build for production
npm run tauri build

# Build specific platform
npm run tauri build -- --target universal-apple-darwin  # macOS
npm run tauri build -- --target x86_64-pc-windows-msvc  # Windows
npm run tauri build -- --target x86_64-unknown-linux-gnu  # Linux

# Generate icons
npm run tauri icon /path/to/icon.png

# Info about environment
npm run tauri info

# Add Tauri to existing project
npm run tauri init
```

## Rust Dependencies

```toml
# src-tauri/Cargo.toml
[package]
name = "my-app"
version = "1.0.0"
edition = "2021"

[dependencies]
tauri = { version = "2.0", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "sqlite"] }

[build-dependencies]
tauri-build = { version = "2.0", features = [] }
```

## Database Integration

```rust
// src-tauri/src/database.rs
use sqlx::sqlite::SqlitePool;
use sqlx::Sqlite;

pub async fn init_database() -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePool::connect("sqlite:app.db").await?;
    
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await?;
    
    Ok(pool)
}
```

## Auto-Updater

```rust
// src-tauri/src/main.rs
use tauri::updater::UpdaterBuilder;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Check for updates
            let updater = UpdaterBuilder::new(app.handle()).build();
            
            tauri::async_runtime::spawn(async move {
                match updater.check().await {
                    Ok(update) => {
                        if update.is_update_available() {
                            update.download_and_install().await.unwrap();
                        }
                    }
                    Err(e) => eprintln!("Update check failed: {}", e),
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```json
// src-tauri/tauri.conf.json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": ["https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

## System Tray

```rust
// src-tauri/src/main.rs
use tauri::{
    CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(quit)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide);
    
    let system_tray = SystemTray::new().with_menu(tray_menu);
    
    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => std::process::exit(0),
                    "hide" => {
                        app.get_window("main").unwrap().hide().unwrap();
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Security Configuration

```json
// src-tauri/tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "scope": {
          "allow": ["$APPDATA/**", "$RESOURCE/**"],
          "deny": ["$APPDATA/../**"]
        }
      },
      "shell": {
        "scope": [
          {
            "name": "run-script",
            "cmd": "scripts/run.sh",
            "args": true
          }
        ]
      }
    },
    "security": {
      "csp": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'",
      "dangerousDisableAssetCspModification": false
    }
  }
}
```

## Performance Optimization

1. **Lazy Loading**: Load components on demand
2. **Code Splitting**: Split bundles by route
3. **Asset Optimization**: Compress images and media
4. **IPC Batching**: Combine multiple operations
5. **State Management**: Use efficient state updates

## Platform-Specific Features

### macOS

```rust
// Transparent window
let window = app.get_window("main").unwrap();
window.set_decorations(false);
window.set_transparent(true);
```

### Windows

```rust
// Use Windows-specific APIs
#[cfg(target_os = "windows")]
use winapi::um::winuser::MessageBoxW;
```

### Linux

```rust
// AppImage bundling
// Configure in tauri.conf.json
{
  "bundle": {
    "targets": ["appimage", "deb"]
  }
}
```

## Testing

```rust
// src-tauri/tests/commands.rs
use my_app::commands::{greet, get_user};

#[test]
fn test_greet() {
    let result = greet("World");
    assert_eq!(result, "Hello, World! Welcome to Tauri 2.0");
}

#[tokio::test]
async fn test_get_user() {
    let user = get_user(1).await.unwrap();
    assert_eq!(user.id, 1);
}
```

## Resources

- [Tauri Documentation](https://tauri.app/v2/guides/)
- [Tauri API Reference](https://tauri.app/v2/api/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [Awesome Tauri](https://github.com/tauri-apps/awesome-tauri)
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)
