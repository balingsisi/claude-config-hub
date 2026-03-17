# Wails Desktop Application Template

## Project Overview

Cross-platform desktop application with Wails, featuring Go backend, modern web frontend, and native performance with small binary size. Alternative to Electron with Go instead of Node.js.

## Tech Stack

- **Framework**: Wails v2
- **Frontend**: React / Vue / Svelte / Vanilla JS
- **Backend**: Go 1.21+
- **Build**: Vite / Webpack
- **Language**: TypeScript + Go
- **Deployment**: Cross-platform (Windows / macOS / Linux)

## Project Structure

```
project/
├── frontend/                  # Web frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── app.go                     # Main application logic
├── main.go                    # Entry point
├── wails.json                 # Wails configuration
├── build/
│   ├── appicon.png
│   ├── windows/
│   │   └── icon.ico
│   └── darwin/
│       └── icon.icns
└── go.mod
```

## Key Patterns

### 1. Wails Configuration

```json
// wails.json
{
  "$schema": "https://wails.io/schemas/config.v2.json",
  "name": "my-app",
  "outputfilename": "MyApp",
  "frontend:install": "npm install",
  "frontend:build": "npm run build",
  "frontend:dev:watcher": "npm run dev",
  "frontend:dev:serverUrl": "auto",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "info": {
    "companyName": "My Company",
    "productName": "My App",
    "productVersion": "1.0.0",
    "copyright": "Copyright © 2024",
    "comments": "Built with Wails"
  }
}
```

### 2. Go Backend

```go
// app.go
package main

import (
	"context"
	"fmt"
	"encoding/json"
)

// App application struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, Welcome to Wails!", name)
}

// User represents a user model
type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// GetUser retrieves a user by ID
func (a *App) GetUser(id int) (User, error) {
	// Fetch from database or API
	return User{
		ID:    id,
		Name:  "John Doe",
		Email: "john@example.com",
	}, nil
}

// GetUsers retrieves all users
func (a *App) GetUsers() ([]User, error) {
	users := []User{
		{ID: 1, Name: "John Doe", Email: "john@example.com"},
		{ID: 2, Name: "Jane Smith", Email: "jane@example.com"},
	}
	return users, nil
}

// SaveUser saves a user
func (a *App) SaveUser(userJSON string) error {
	var user User
	if err := json.Unmarshal([]byte(userJSON), &user); err != nil {
		return err
	}
	
	// Save to database
	fmt.Printf("Saving user: %+v\n", user)
	return nil
}
```

### 3. Main Entry Point

```go
// main.go
package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "My App",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
				HideTitle:                  false,
				HideTitleBar:               false,
				FullSizeContent:            true,
				UseToolbar:                 false,
			},
			Appearance:           mac.NSAppearanceNameAqua,
		},
		Windows: &windows.Options{
			WebviewIsTransparent:              false,
			WindowIsTranslucent:               false,
			DisableWindowIcon:                 false,
			DisableFramelessWindowDecorations: false,
			WebviewUserDataPath:               "",
			WebviewBrowserPath:                "",
			Theme:                             windows.SystemDefault,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
```

### 4. Frontend Integration

```typescript
// frontend/src/services/wails.ts
import { GetUser, GetUsers, SaveUser, Greet } from '../../wailsjs/go/main/App';

export async function greet(name: string): Promise<string> {
  return await Greet(name);
}

export async function getUser(id: number) {
  return await GetUser(id);
}

export async function getUsers() {
  return await GetUsers();
}

export async function saveUser(user: any) {
  const userJSON = JSON.stringify(user);
  return await SaveUser(userJSON);
}
```

### 5. React Components

```typescript
// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { GetUsers } from '../wailsjs/go/main/App';
import './App.css';

interface User {
  id: number;
  name: string;
  email: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await GetUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Wails Desktop App</h1>
      </header>
      
      <main>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default App;
```

### 6. File System Operations

```go
// filesystem.go
package main

import (
	"io/ioutil"
	"os"
	"path/filepath"
)

// ReadFile reads a file and returns its contents
func (a *App) ReadFile(path string) (string, error) {
	content, err := ioutil.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// WriteFile writes content to a file
func (a *App) WriteFile(path, content string) error {
	return ioutil.WriteFile(path, []byte(content), 0644)
}

// ListDirectory lists files in a directory
func (a *App) ListDirectory(path string) ([]string, error) {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var names []string
	for _, file := range files {
		names = append(names, file.Name())
	}
	return names, nil
}

// GetHomeDir returns the user's home directory
func (a *App) GetHomeDir() (string, error) {
	return os.UserHomeDir()
}

// GetAppDir returns the application data directory
func (a *App) GetAppDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".myapp"), nil
}
```

### 7. Database Integration

```go
// database.go
package main

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

type Database struct {
	db *sql.DB
}

func NewDatabase() (*Database, error) {
	db, err := sql.Open("sqlite3", "./app.db")
	if err != nil {
		return nil, err
	}

	// Create tables
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT UNIQUE NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return nil, err
	}

	return &Database{db: db}, nil
}

func (d *Database) Close() error {
	return d.db.Close()
}

func (d *Database) InsertUser(name, email string) (int64, error) {
	result, err := d.db.Exec(
		"INSERT INTO users (name, email) VALUES (?, ?)",
		name, email,
	)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

func (d *Database) GetUser(id int) (*User, error) {
	user := &User{}
	err := d.db.QueryRow(
		"SELECT id, name, email FROM users WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Name, &user.Email)
	if err != nil {
		return nil, err
	}

	return user, nil
}
```

### 8. Events System

```go
// events.go
package main

import (
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// EmitEvent emits an event to the frontend
func (a *App) EmitEvent(eventName string, data interface{}) {
	runtime.EventsEmit(a.ctx, eventName, data)
}

// OnEvent registers an event listener
func (a *App) OnEvent(eventName string) {
	runtime.EventsOn(a.ctx, eventName, func(optionalData ...interface{}) {
		// Handle event from frontend
		fmt.Printf("Received event %s: %+v\n", eventName, optionalData)
	})
}
```

```typescript
// frontend/src/services/events.ts
import { EventsOn, EventsEmit } from '../../wailsjs/runtime';

export function onFileChanged(callback: (path: string) => void) {
  EventsOn('file-changed', (path: string) => {
    callback(path);
  });
}

export function emitFileSaved(path: string) {
  EventsEmit('file-saved', path);
}
```

## Best Practices

1. **Context Management**: Pass context to all long-running operations
2. **Error Handling**: Return errors from Go to frontend properly
3. **Concurrency**: Use goroutines for blocking operations
4. **State Management**: Keep state in Go, render in frontend
5. **Security**: Validate all inputs from frontend

## Common Commands

```bash
# Initialize new project
wails init -n my-app -t react

# Development mode with hot reload
wails dev

# Build for production
wails build

# Build for specific platform
wails build -platform windows/amd64
wails build -platform darwin/amd64
wails build -platform darwin/arm64
wails build -platform linux/amd64

# Generate bindings
wails generate module

# Check system requirements
wails doctor
```

## Go Dependencies

```go
// go.mod
module myapp

go 1.21

require (
	github.com/wailsapp/wails/v2 v2.7.0
	github.com/mattn/go-sqlite3 v1.14.19
)
```

## Window Configuration

```go
// main.go - Advanced window options
err := wails.Run(&options.App{
	Title:  "My App",
	Width:  1024,
	Height: 768,
	MinWidth: 800,
	MinHeight: 600,
	MaxWidth: 1920,
	MaxHeight: 1080,
	Resizable: true,
	Frameless: false,
	AlwaysOnTop: false,
	HideWindowOnClose: false,
	BackgroundColor: &options.RGBA{R: 255, G: 255, B: 255, A: 255},
	// ...
})
```

## System Tray

```go
// systray.go
package main

import (
	"github.com/wailsapp/wails/v2/pkg/systray"
)

func setupSystray(app *App) {
	systray.Run(func() {
		systray.SetTitle("My App")
		systray.SetTooltip("My Application")
		
		mQuit := systray.AddMenuItem("Quit", "Quit the app")
		
		go func() {
			<-mQuit.ClickedCh
			systray.Quit()
		}()
	}, nil)
}
```

## Auto-Update

```go
// update.go
package main

import (
	"encoding/json"
	"net/http"
)

type Release struct {
	TagName string `json:"tag_name"`
	Assets  []struct {
		Name string `json:"name"`
		URL  string `json:"browser_download_url"`
	} `json:"assets"`
}

func (a *App) CheckForUpdate() (*Release, error) {
	resp, err := http.Get("https://api.github.com/repos/yourname/myapp/releases/latest")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var release Release
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}

	return &release, nil
}
```

## Deployment

### Build Scripts

```bash
#!/bin/bash
# build.sh

# Build all platforms
wails build -platform windows/amd64
wails build -platform darwin/amd64
wails build -platform darwin/arm64
wails build -platform linux/amd64

# Create release archives
cd build/bin
zip -r myapp-windows.zip windows/
zip -r myapp-macos-amd64.zip darwin-amd64/
zip -r myapp-macos-arm64.zip darwin-arm64/
zip -r myapp-linux.zip linux/
```

### GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build

on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Wails
        run: go install github.com/wailsapp/wails/v2/cmd/wails@latest
      
      - name: Build
        run: wails build
      
      - name: Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: app-${{ matrix.os }}
          path: build/bin/
```

## Testing

```go
// app_test.go
package main

import (
	"testing"
)

func TestGreet(t *testing.T) {
	app := NewApp()
	result := app.Greet("World")
	expected := "Hello World, Welcome to Wails!"
	
	if result != expected {
		t.Errorf("Expected %s, got %s", expected, result)
	}
}

func TestGetUser(t *testing.T) {
	app := NewApp()
	user, err := app.GetUser(1)
	
	if err != nil {
		t.Fatalf("Failed to get user: %v", err)
	}
	
	if user.ID != 1 {
		t.Errorf("Expected user ID 1, got %d", user.ID)
	}
}
```

## Performance Tips

1. **Minimize IPC Calls**: Batch operations to reduce frontend-backend communication
2. **Use Goroutines**: Run blocking operations asynchronously
3. **Optimize Assets**: Compress images and minimize frontend bundle
4. **Lazy Loading**: Load data only when needed
5. **Caching**: Cache frequently accessed data in memory

## Resources

- [Wails Documentation](https://wails.io/docs/introduction)
- [Wails GitHub](https://github.com/wailsapp/wails)
- [Go Documentation](https://golang.org/doc/)
- [Awesome Wails](https://github.com/wailsapp/awesome-wails)
- [Wails Examples](https://github.com/wailsapp/wails/tree/master/v2/examples)
