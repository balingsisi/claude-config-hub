# Parcel Bundler Template

## Tech Stack
- parcel v2.x
- React 18+
- TypeScript 5+

## Project Structure
```
src/
├── index.html
├── index.tsx
├── App.tsx
└── styles/
    └── main.css
```

## Configuration

### package.json
```json
{
  "name": "parcel-react-app",
  "source": "src/index.html",
  "scripts": {
    "dev": "parcel",
    "build": "parcel build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@parcel/transformer-typescript-tsc": "^2.0.0",
    "parcel": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### HTML Entry
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parcel React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./index.tsx"></script>
</body>
</html>
```

### React Entry
```typescript
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/main.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

## Common Commands

```bash
npm install -D parcel
npm run dev
npm run build
```

## Related Resources
- [Parcel Documentation](https://parceljs.org/)
- [Getting Started](https://parceljs.org/docs/)
