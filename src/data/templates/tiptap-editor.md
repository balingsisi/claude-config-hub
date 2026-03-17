# Tiptap Rich Text Editor

## 技术栈

- **核心库**: @tiptap/react, @tiptap/starter-kit
- **扩展**: @tiptap/pm (ProseMirror)
- **UI**: React, TypeScript
- **样式**: Tailwind CSS / CSS Modules
- **协作**: @tiptap/extension-collaboration, Y.js
- **框架**: Next.js / Vite / Remix

## 项目结构

```
tiptap-editor/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── TiptapEditor.tsx      # 主编辑器组件
│   │   │   ├── MenuBar.tsx           # 工具栏
│   │   │   ├── BubbleMenu.tsx        # 浮动菜单
│   │   │   ├── FloatingMenu.tsx      # 块级菜单
│   │   │   └── extensions/           # 自定义扩展
│   │   │       ├── CodeBlock.tsx
│   │   │       ├── ImageUpload.tsx
│   │   │       └── Mention.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Dropdown.tsx
│   │       └── Dialog.tsx
│   ├── hooks/
│   │   ├── useEditor.ts              # 编辑器配置 Hook
│   │   └── useImageUpload.ts
│   ├── lib/
│   │   ├── extensions.ts             # 扩展配置
│   │   └── utils.ts
│   ├── types/
│   │   └── editor.ts
│   └── styles/
│       └── editor.css
├── public/
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 代码模式

### 基础编辑器配置

```typescript
// src/components/Editor/TiptapEditor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { MenuBar } from "./MenuBar";
import { BubbleMenu } from "./BubbleMenu";

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "开始编写...",
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 使用 lowlight 版本
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      CodeBlockLowlight.configure({
        defaultLanguage: "typescript",
        lowlight,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-4",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <MenuBar editor={editor} />
      <BubbleMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

### 工具栏组件

```typescript
// src/components/Editor/MenuBar.tsx
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Highlight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MenuBarProps {
  editor: Editor;
}

export function MenuBar({ editor }: MenuBarProps) {
  const addImage = () => {
    const url = window.prompt("输入图片URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt("输入链接URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
      {/* 撤销/重做 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 文本格式 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "bg-gray-200" : ""}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "bg-gray-200" : ""}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive("underline") ? "bg-gray-200" : ""}
      >
        <Underline className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "bg-gray-200" : ""}
      >
        <Strikethrough className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={editor.isActive("highlight") ? "bg-gray-200" : ""}
      >
        <Highlight className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive("code") ? "bg-gray-200" : ""}
      >
        <Code className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 标题 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""}
      >
        <Heading1 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""}
      >
        <Heading2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 列表 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "bg-gray-200" : ""}
      >
        <Quote className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 对齐 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""}
      >
        <AlignLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""}
      >
        <AlignCenter className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""}
      >
        <AlignRight className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 链接和图片 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={setLink}
        className={editor.isActive("link") ? "bg-gray-200" : ""}
      >
        <Link className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={addImage}>
        <Image className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

### 浮动菜单

```typescript
// src/components/Editor/BubbleMenu.tsx
import { BubbleMenu as TiptapBubbleMenu, Editor } from "@tiptap/react";
import { Bold, Italic, Underline, Link, Trash } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BubbleMenuProps {
  editor: Editor;
}

export function BubbleMenu({ editor }: BubbleMenuProps) {
  return (
    <TiptapBubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <div className="flex gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-gray-200" : ""}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-gray-200" : ""}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "bg-gray-200" : ""}
        >
          <Underline className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt("输入链接URL");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
        >
          <Link className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().deleteSelection().run()}
        >
          <Trash className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </TiptapBubbleMenu>
  );
}
```

### 自定义扩展 - Mention

```typescript
// src/components/Editor/extensions/Mention.ts
import { Node, mergeAttributes } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { MentionList } from "./MentionList";

export interface MentionOptions {
  HTMLAttributes: Record<string, any>;
  suggestion: any;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mention: {
      setMention: (id: string) => ReturnType;
    };
  }
}

export const MentionExtension = Node.create<MentionOptions>({
  name: "mention",

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      suggestion: {
        char: "@",
        pluginKey: new PluginKey("mention"),
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: "mention",
                attrs: props,
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();
        },
        render: () => {
          let reactRenderer: ReactRenderer;
          let popup: any;

          return {
            onStart: (props) => {
              reactRenderer = new ReactRenderer(MentionList, {
                props,
                editor: props.editor,
              });

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: reactRenderer.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },
            onUpdate(props) {
              reactRenderer.updateProps(props);
              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },
            onKeyDown(props) {
              return reactRenderer.ref?.onKeyDown(props);
            },
            onExit() {
              popup[0].destroy();
              reactRenderer.destroy();
            },
          };
        },
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-mention]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-mention": "",
        class: "mention",
      }),
      `@${node.attrs.label}`,
    ];
  },

  addCommands() {
    return {
      setMention:
        (id) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "mention",
            attrs: { id },
          });
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
```

### 图片上传扩展

```typescript
// src/components/Editor/extensions/ImageUpload.ts
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageUploadComponent } from "./ImageUploadComponent";

export interface ImageUploadOptions {
  HTMLAttributes: Record<string, any>;
  upload: (file: File) => Promise<string>;
}

export const ImageUploadExtension = Node.create<ImageUploadOptions>({
  name: "imageUpload",

  group: "block",

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      upload: async (file: File) => {
        // 默认上传逻辑
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        return data.url;
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-image-upload]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-image-upload": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadComponent);
  },
});
```

```typescript
// src/components/Editor/extensions/ImageUploadComponent.tsx
import { NodeViewWrapper } from "@tiptap/react";
import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";

export function ImageUploadComponent({ node, updateAttributes, deleteNode }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        updateAttributes({ src: data.url });
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setUploading(false);
      }
    },
    [updateAttributes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  if (node.attrs.src) {
    return (
      <NodeViewWrapper className="relative">
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          className="max-w-full h-auto rounded-lg"
        />
        <button
          onClick={() => deleteNode()}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
      >
        {uploading ? (
          <div className="text-gray-500">上传中...</div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 mb-2">拖拽图片到这里或点击上传</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600"
            >
              选择图片
            </label>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
```

### 协作编辑（Y.js）

```typescript
// src/lib/collaboration.ts
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCursor } from "@tiptap/extension-collaboration-cursor";

export function createCollaboration(documentId: string, username: string) {
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider(
    "wss://your-collab-server.com",
    documentId,
    ydoc
  );

  const collaboration = Collaboration.configure({
    document: ydoc,
  });

  const collaborationCursor = CollaborationCursor.configure({
    provider,
    user: {
      name: username,
      color: getRandomColor(),
    },
  });

  return {
    ydoc,
    provider,
    extensions: [collaboration, collaborationCursor],
    disconnect: () => {
      provider.disconnect();
      ydoc.destroy();
    },
  };
}

function getRandomColor() {
  const colors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
```

## 最佳实践

### 1. 内容序列化

```typescript
// 导出为不同格式
const html = editor.getHTML();
const json = editor.getJSON();
const text = editor.getText();

// Markdown 支持
import { Markdown } from "tiptap-markdown";
const markdown = editor.storage.markdown.getMarkdown();
```

### 2. 字数统计

```typescript
import { CharacterCount } from "@tiptap/extension-character-count";

const editor = useEditor({
  extensions: [
    CharacterCount.configure({
      limit: 5000,
    }),
  ],
});

// 在组件中
const characterCount = editor.storage.characterCount.characters();
const wordCount = editor.storage.characterCount.words();
```

### 3. 历史记录控制

```typescript
import { History } from "@tiptap/extension-history";

const editor = useEditor({
  extensions: [
    History.configure({
      depth: 100,
      newGroupDelay: 500,
    }),
  ],
});

// 撤销/重做
editor.chain().focus().undo().run();
editor.chain().focus().redo().run();
```

### 4. Focus 和选择

```typescript
// 聚焦编辑器
editor.commands.focus();

// 聚焦到末尾
editor.commands.focus("end");

// 选中所有内容
editor.commands.selectAll();

// 清空内容
editor.commands.clearContent();
```

### 5. 内容验证

```typescript
// 检查是否为空
const isEmpty = editor.isEmpty;

// 检查是否可编辑
const isEditable = editor.isEditable;

// 获取活动状态
const isActive = editor.isActive("bold");
const isHeadingActive = editor.isActive("heading", { level: 1 });
```

## 样式配置

```css
/* src/styles/editor.css */
.ProseMirror {
  min-height: 500px;
  padding: 1rem;
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.ProseMirror .mention {
  background-color: #e0f2fe;
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  font-weight: 500;
}

.ProseMirror pre {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.ProseMirror pre code {
  background: none;
  padding: 0;
}

.ProseMirror blockquote {
  border-left: 3px solid #cbd5e1;
  padding-left: 1rem;
  margin-left: 0;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
}

.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.ProseMirror mark {
  background-color: #fef08a;
  padding: 0.125rem 0.25rem;
  border-radius: 0.125rem;
}

/* 暗色模式 */
.dark .ProseMirror pre {
  background-color: #0f172a;
}
```

## 常用命令

```bash
# 安装核心包
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit

# 安装扩展
npm install @tiptap/extension-placeholder @tiptap/extension-typography
npm install @tiptap/extension-text-align @tiptap/extension-highlight
npm install @tiptap/extension-underline @tiptap/extension-link
npm install @tiptap/extension-image @tiptap/extension-code-block-lowlight
npm install @tiptap/extension-character-count @tiptap/extension-focus

# 协作编辑
npm install yjs y-websocket @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor

# 语法高亮
npm install lowlight highlight.js

# UI 组件
npm install lucide-react tippy.js
```

## TypeScript 类型

```typescript
// src/types/editor.ts
import { JSONContent } from "@tiptap/react";

export interface EditorConfig {
  content: string | JSONContent;
  editable?: boolean;
  autofocus?: boolean | "start" | "end" | "all";
  placeholder?: string;
  onChange?: (content: string) => void;
  onUpdate?: ({ editor }) => void;
  onBlur?: ({ editor }) => void;
  onFocus?: ({ editor }) => void;
}

export interface MentionUser {
  id: string;
  label: string;
  avatar?: string;
}

export interface UploadResponse {
  url: string;
  alt?: string;
  title?: string;
}
```

## Next.js 集成

```typescript
// src/app/page.tsx
"use client";

import { useState } from "react";
import { TiptapEditor } from "@/components/Editor/TiptapEditor";

export default function EditorPage() {
  const [content, setContent] = useState("<p>开始编写...</p>");

  const handleSave = async () => {
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    // 处理响应
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">编辑器</h1>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          保存
        </button>
      </div>
      <TiptapEditor content={content} onChange={setContent} />
    </div>
  );
}
```

## API 路由示例

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(process.cwd(), "public/uploads", filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
```

## 性能优化

```typescript
// 1. 懒加载扩展
const CodeBlockLowlight = (await import("@tiptap/extension-code-block-lowlight")).default;

// 2. 防抖保存
import { debounce } from "lodash";
const debouncedSave = debounce((content) => {
  // 保存逻辑
}, 1000);

// 3. 虚拟滚动长文档
// 对于超长文档，考虑分页或虚拟滚动

// 4. 限制历史记录
History.configure({ depth: 50 });

// 5. 按需加载图片
const Image = (await import("@tiptap/extension-image")).default.configure({
  inline: true,
  allowBase64: false,
});
```

## 部署配置

```json
// package.json
{
  "dependencies": {
    "@tiptap/react": "^2.1.0",
    "@tiptap/pm": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",
    "@tiptap/extension-placeholder": "^2.1.0",
    "@tiptap/extension-typography": "^2.1.0",
    "@tiptap/extension-text-align": "^2.1.0",
    "@tiptap/extension-highlight": "^2.1.0",
    "@tiptap/extension-underline": "^2.1.0",
    "@tiptap/extension-link": "^2.1.0",
    "@tiptap/extension-image": "^2.1.0",
    "@tiptap/extension-code-block-lowlight": "^2.1.0",
    "lowlight": "^3.0.0",
    "lucide-react": "^0.300.0"
  }
}
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_UPLOAD_URL=/api/upload
    volumes:
      - ./uploads:/app/public/uploads
```
