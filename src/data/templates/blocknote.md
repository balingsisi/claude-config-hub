# BlockNote Block Editor Template

## Tech Stack
- @blocknote/core v0.20.x
- @blocknote/react v0.20.x
- React 18+
- TypeScript 5+

## Core Patterns

### Basic Editor Setup
```typescript
import { BlockNoteView } from "@blocknote/react";
import "@blocknote/style.css";
import { useCreateBlockNote } from "@blocknote/react";

export const Editor: React.FC = () => {
  const editor = useCreateBlockNote();

  return <BlockNoteView editor={editor} />;
};
```

### Editor with Initial Content
```typescript
import { Block } from "@blocknote/core";

const initialContent: Block[] = [
  {
    type: "heading",
    props: {
      level: 1,
    },
    content: [
      {
        type: "text",
        text: "Welcome to BlockNote",
        styles: { bold: true },
      },
    ],
  },
  {
    type: "paragraph",
    content: "Start typing here...",
  },
];

export const EditorWithContent: React.FC = () => {
  const editor = useCreateBlockNote({
    initialContent,
  });

  return <BlockNoteView editor={editor} />;
};
```

### Custom Block
```typescript
import { createReactBlockSpec } from "@blocknote/react";

export const AlertBlock = createReactBlockSpec(
  {
    type: "alert",
    propSchema: {
      text: { default: "" },
      type: { default: "warning" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const type = props.block.props.type;
      return (
        <div className={`alert alert-${type}`}>
          <span>{props.block.props.text}</span>
        </div>
      );
    },
  }
);
```

### Editor with Custom Blocks
```typescript
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/react";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    alert: AlertBlock,
  },
});

export const CustomEditor: React.FC = () => {
  const editor = useCreateBlockNote({
    schema,
  });

  return <BlockNoteView editor={editor} />;
};
```

### Save and Load Content
```typescript
import { useState, useEffect } from "react";
import { Block } from "@blocknote/core";

export const PersistedEditor: React.FC = () => {
  const [savedBlocks, setSavedBlocks] = useState<Block[]>([]);
  const editor = useCreateBlockNote({
    initialContent: savedBlocks.length > 0 ? savedBlocks : undefined,
  });

  const saveContent = async () => {
    const blocks = editor.document;
    await fetch("/api/save", {
      method: "POST",
      body: JSON.stringify(blocks),
    });
  };

  return (
    <div>
      <button onClick={saveContent}>Save</button>
      <BlockNoteView editor={editor} />
    </div>
  );
};
```

### Toolbar Customization
```typescript
import { FormattingToolbar, FormattingToolbarController } from "@blocknote/react";

export const EditorWithToolbar: React.FC = () => {
  const editor = useCreateBlockNote();

  return (
    <BlockNoteView editor={editor} formattingToolbar={false}>
      <FormattingToolbarController
        formattingToolbar={() => (
          <FormattingToolbar>
            {/* Custom toolbar content */}
          </FormattingToolbar>
        )}
      />
    </BlockNoteView>
  );
};
```

### Image Upload Handler
```typescript
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return data.url;
}

export const EditorWithUpload: React.FC = () => {
  const editor = useCreateBlockNote({
    uploadFile,
  });

  return <BlockNoteView editor={editor} />;
};
```

### Collaboration Mode
```typescript
import { BlockNoteView } from "@blocknote/react";
import { YDocProvider } from "@y-sweet/react";

interface CollaborativeEditorProps {
  docId: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ docId }) => {
  return (
    <YDocProvider docId={docId} host="/api/collaboration">
      <EditorContent />
    </YDocProvider>
  );
};

const EditorContent: React.FC = () => {
  const editor = useCreateBlockNote({
    collaboration: {
      thread: true,
    },
  });

  return <BlockNoteView editor={editor} />;
};
```

## Common Commands

```bash
npm install @blocknote/core @blocknote/react

# Development
npm run dev

# Build
npm run build
```

## Styling Options

```typescript
// Dark mode
<BlockNoteView editor={editor} theme="dark" />

// Custom theme
<BlockNoteView 
  editor={editor} 
  theme={{
    colors: {
      editor: {
        text: "#ffffff",
        background: "#1a1a1a",
      },
    },
  }}
/>
```

## Related Resources
- [BlockNote Documentation](https://www.blocknotejs.org/docs)
- [Block Specs](https://www.blocknotejs.org/docs/editor-basics/block-types)
- [React Integration](https://www.blocknotejs.org/docs/react)
