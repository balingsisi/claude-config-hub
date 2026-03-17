# Grape.js Rich Text Editor

## Overview
Grape.js is a highly customizable, framework-agnostic rich text editor built with vanilla JavaScript. It provides a modular architecture with a plugin system, making it easy to create custom editors for any use case.

## When to Use
- Content management systems needing custom editors
- Applications requiring rich text editing with specific features
- Projects needing a lightweight, customizable editor
- Email template builders or page builders
- Form builders with rich text capabilities
- Applications where you need full control over editor behavior

## Key Concepts

### 1. Installation and Basic Setup
```bash
npm install grapesjs
# or
yarn add grapesjs
# or CDN
<script src="https://unpkg.com/grapesjs"></script>
```

### 2. Basic Editor Initialization
```javascript
import grapesjs from 'grapesjs';

const editor = grapesjs.init({
  container: '#gjs',
  height: '100%',
  width: 'auto',
  storageManager: {
    type: 'local',
    autosave: true,
    autoload: true,
    stepsBeforeSave: 1,
  },
  plugins: [],
  pluginsOpts: {},
});

// Get editor content
const html = editor.getHtml();
const css = editor.getCss();

// Set editor content
editor.setComponents('<div>Hello World</div>');
editor.setStyle('.my-class { color: red; }');
```

### 3. Editor Configuration
```javascript
const editor = grapesjs.init({
  container: '#gjs',
  height: '900px',
  width: 'auto',
  
  // Canvas configuration
  canvas: {
    styles: [
      'https://cdn.example.com/styles.css',
    ],
    scripts: [
      'https://cdn.example.com/script.js',
    ],
  },
  
  // Device manager for responsive design
  deviceManager: {
    devices: [
      { name: 'Desktop', width: '' },
      { name: 'Tablet', width: '768px', widthMedia: '992px' },
      { name: 'Mobile', width: '375px', widthMedia: '576px' },
    ],
  },
  
  // Layer manager for component tree
  layerManager: {
    appendTo: '#layers-container',
  },
  
  // Selector manager for CSS classes
  selectorManager: {
    appendTo: '#selectors-container',
  },
  
  // Style manager for visual style editing
  styleManager: {
    appendTo: '#styles-container',
    sectors: [
      {
        name: 'Dimension',
        open: false,
        properties: ['width', 'height', 'max-width', 'min-height'],
      },
      {
        name: 'Typography',
        open: false,
        properties: ['font-size', 'font-weight', 'letter-spacing'],
      },
    ],
  },
  
  // Trait manager for component attributes
  traitManager: {
    appendTo: '#traits-container',
  },
  
  // Block manager for drag-and-drop blocks
  blockManager: {
    appendTo: '#blocks-container',
    blocks: [
      {
        id: 'heading',
        label: 'Heading',
        content: '<h1>Your heading</h1>',
        category: 'Basic',
        attributes: { class: 'fa fa-heading' },
      },
      {
        id: 'paragraph',
        label: 'Paragraph',
        content: '<p>Your paragraph</p>',
        category: 'Basic',
        attributes: { class: 'fa fa-paragraph' },
      },
    ],
  },
});
```

### 4. Custom Blocks and Components
```javascript
// Add custom blocks
editor.BlockManager.add('custom-card', {
  label: 'Card',
  category: 'Custom',
  content: `
    <div class="card">
      <img src="https://via.placeholder.com/300" class="card-img-top" alt="...">
      <div class="card-body">
        <h5 class="card-title">Card title</h5>
        <p class="card-text">Some quick example text</p>
        <a href="#" class="btn btn-primary">Go somewhere</a>
      </div>
    </div>
  `,
});

// Define custom component types
editor.DomComponents.addType('custom-input', {
  isComponent: el => el.tagName === 'INPUT',
  model: {
    defaults: {
      tagName: 'input',
      attributes: {
        type: 'text',
        placeholder: 'Enter text',
      },
      traits: [
        'type',
        'placeholder',
        'required',
        {
          type: 'select',
          label: 'Type',
          name: 'type',
          options: [
            { value: 'text', name: 'Text' },
            { value: 'email', name: 'Email' },
            { value: 'password', name: 'Password' },
          ],
        },
      ],
    },
  },
});

// Create component programmatically
editor.Components.addComponent({
  tagName: 'div',
  classes: ['my-component'],
  content: 'Custom content',
  style: { 'background-color': 'blue' },
});
```

### 5. Plugin Development
```javascript
// Custom plugin
grapesjs.plugins.add('my-plugin', (editor, options = {}) => {
  const defaultOptions = {
    blocks: ['block1', 'block2'],
    blockOptions: {},
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Add blocks
  opts.blocks.forEach(block => {
    editor.BlockManager.add(block, {
      label: block,
      content: `<div class="${block}">Content</div>`,
    });
  });
  
  // Add commands
  editor.Commands.add('my-command', {
    run: (editor, sender) => {
      alert('Command executed!');
    },
  });
  
  // Add buttons to panel
  editor.Panels.addButton('options', {
    id: 'my-button',
    className: 'fa fa-icon',
    command: 'my-command',
    attributes: { title: 'My Button' },
  });
});

// Use plugin
const editor = grapesjs.init({
  container: '#gjs',
  plugins: ['my-plugin'],
  pluginsOpts: {
    'my-plugin': {
      blocks: ['custom-block1', 'custom-block2'],
    },
  },
});
```

### 6. Event Handling
```javascript
// Listen to component events
editor.on('component:add', component => {
  console.log('Component added:', component);
});

editor.on('component:remove', component => {
  console.log('Component removed:', component);
});

editor.on('component:update', component => {
  console.log('Component updated:', component);
});

editor.on('component:selected', component => {
  console.log('Component selected:', component);
});

// Listen to canvas events
editor.on('canvas:drag:end', () => {
  console.log('Drag ended');
});

// Listen to style changes
editor.on('styleManager:change', property => {
  console.log('Style changed:', property);
});

// Listen to command execution
editor.on('run:my-command', () => {
  console.log('Command ran');
});

// Custom events
editor.on('custom:event', data => {
  console.log('Custom event:', data);
});

// Trigger custom event
editor.trigger('custom:event', { foo: 'bar' });
```

### 7. Commands and Panels
```javascript
// Define commands
editor.Commands.add('set-background', {
  run: (editor, sender, options = {}) => {
    const component = editor.getSelected();
    if (component) {
      component.setStyle({
        'background-color': options.color || 'red',
      });
    }
  },
});

editor.Commands.add('clear-canvas', {
  run: (editor) => {
    editor.DomComponents.clear();
    editor.Css.clear();
  },
});

// Create panel with buttons
editor.Panels.addPanel({
  id: 'my-panel',
  el: '#my-panel',
  buttons: [
    {
      id: 'preview',
      className: 'fa fa-eye',
      command: 'preview',
      active: false,
      attributes: { title: 'Preview' },
    },
    {
      id: 'export',
      className: 'fa fa-download',
      command: 'export-template',
      attributes: { title: 'Export' },
    },
    {
      id: 'clear',
      className: 'fa fa-trash',
      command: 'clear-canvas',
      attributes: { title: 'Clear' },
    },
  ],
});

// Toggle preview mode
editor.Commands.add('preview', {
  run: (editor) => {
    editor.runCommand('preview');
  },
  stop: (editor) => {
    editor.stopCommand('preview');
  },
});
```

### 8. Storage and Export
```javascript
// Local storage
const editor = grapesjs.init({
  storageManager: {
    type: 'local',
    key: 'gjs-project',
    autosave: true,
    autoload: true,
    stepsBeforeSave: 1,
    options: {
      local: {
        // Local storage options
      },
    },
  },
});

// Remote storage
const editor = grapesjs.init({
  storageManager: {
    type: 'remote',
    autosave: true,
    autoload: true,
    urlStore: '/api/save',
    urlLoad: '/api/load',
    params: {},
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token',
    },
  },
});

// Get and load project data
const projectData = editor.getProjectData();
editor.loadProjectData(projectData);

// Export HTML and CSS
const exportHTML = () => {
  const html = editor.getHtml();
  const css = editor.getCss();
  
  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${css}</style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
  
  return fullHTML;
};

// Export with inline CSS
const exportWithInlineStyles = () => {
  const html = editor.getHtml({ cleanId: true });
  const css = editor.getCss({ avoidProtected: true });
  
  return { html, css };
};
```

### 9. React Integration
```tsx
import React, { useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

const GrapeEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  
  useEffect(() => {
    if (!editorRef.current) return;
    
    const editor = grapesjs.init({
      container: editorRef.current,
      height: '100%',
      width: 'auto',
      storageManager: {
        type: 'local',
        autosave: true,
      },
    });
    
    editorInstanceRef.current = editor;
    
    // Handle save
    const handleSave = () => {
      const html = editor.getHtml();
      const css = editor.getCss();
      onSave({ html, css });
    };
    
    editor.on('storage:store', handleSave);
    
    return () => {
      editor.destroy();
    };
  }, []);
  
  return (
    <div className="grape-editor-wrapper">
      <div ref={editorRef} className="grape-editor" />
    </div>
  );
};

export default GrapeEditor;
```

### 10. Advanced Component with Data Binding
```javascript
// Component with dynamic data
editor.DomComponents.addType('dynamic-list', {
  isComponent: el => el.classList?.contains('dynamic-list'),
  model: {
    defaults: {
      tagName: 'ul',
      classes: ['dynamic-list'],
      attributes: { 'data-type': 'list' },
      traits: [
        {
          type: 'number',
          label: 'Items',
          name: 'items',
          default: 3,
          changeProp: 1,
        },
      ],
    },
    
    init() {
      this.on('change:items', this.updateItems);
      this.updateItems();
    },
    
    updateItems() {
      const count = this.get('items') || 3;
      const components = [];
      
      for (let i = 0; i < count; i++) {
        components.push({
          tagName: 'li',
          content: `Item ${i + 1}`,
        });
      }
      
      this.components(components);
    },
  },
});
```

## Best Practices

1. **Use components over raw HTML** - Define reusable component types
2. **Implement proper storage** - Choose right storage strategy (local/remote)
3. **Optimize performance** - Lazy load plugins and assets
4. **Mobile responsiveness** - Test on multiple device sizes
5. **Security** - Sanitize user input and exported HTML
6. **Accessibility** - Ensure exported content meets WCAG standards

## Common Patterns

```javascript
// Pattern 1: Email template builder
const emailEditor = grapesjs.init({
  container: '#gjs',
  plugins: ['grapesjs-preset-newsletter'],
  storageManager: {
    type: 'remote',
    urlStore: '/api/email-templates',
  },
});

// Pattern 2: Landing page builder
const landingEditor = grapesjs.init({
  container: '#gjs',
  plugins: ['grapesjs-preset-webpage'],
  blockManager: {
    blocks: [
      // Hero sections, CTAs, etc.
    ],
  },
});

// Pattern 3: Form builder
const formEditor = grapesjs.init({
  container: '#gjs',
  plugins: ['gjs-forms'],
  components: `
    <form>
      <input type="text" name="name" placeholder="Name" />
      <input type="email" name="email" placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  `,
});
```

## Official Plugins

- **grapesjs-preset-webpage** - Webpage building presets
- **grapesjs-preset-newsletter** - Email template presets
- **grapesjs-component-code-editor** - Code editing component
- **grapesjs-blocks-basic** - Basic blocks collection
- **grapesjs-plugin-forms** - Form components
- **grapesjs-tailwind** - Tailwind CSS integration
- **grapesjs-style-bg** - Background style properties

## When to Choose Grape.js

✅ **Good fit:**
- CMS applications
- Email template builders
- Page/landing page builders
- Form builders
- Projects needing full editor customization
- Applications requiring framework-agnostic solution

❌ **Not ideal:**
- Simple text editing (use Quill, TipTap, or TinyMCE)
- Code editors (use Monaco, CodeMirror)
- Projects with minimal customization needs
- Applications requiring minimal bundle size

## Alternatives

- **TinyMCE** - Feature-rich WYSIWYG editor
- **Quill** - Modern rich text editor
- **TipTap** - Headless editor for React/Vue
- **Slate.js** - Highly customizable React editor
- **Draft.js** - React-based editor framework
- **ProseMirror** - Component-based editor
