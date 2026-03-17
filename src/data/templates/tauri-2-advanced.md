# Tauri 2 Advanced Template

## Tech Stack
- @tauri-apps/api v2.x
- @tauri-apps/cli v2.x
- React 18+
- Rust

## Core Patterns

### IPC Commands
```typescript
// Frontend
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('greet', { name: 'World' });

// Backend (Rust)
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

### File System
```typescript
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

const content = await readTextFile('config.json');
await writeTextFile('output.txt', 'Hello World');
```

### Shell Commands
```typescript
import { Command } from '@tauri-apps/plugin-shell';

const output = await Command.create('echo', ['hello']).execute();
console.log(output.stdout);
```

### Window Management
```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const window = getCurrentWindow();
await window.minimize();
await window.maximize();
await window.close();
```

### Dialog
```typescript
import { open, save } from '@tauri-apps/plugin-dialog';

const filePath = await open({
  multiple: false,
  filters: [{ name: 'Images', extensions: ['png', 'jpg'] }],
});
```

## Common Commands

```bash
npm create tauri-app@latest
npm run tauri dev
npm run tauri build
```

## Related Resources
- [Tauri 2 Documentation](https://v2.tauri.app/)
