# Lexical 富文本编辑器模板

## 技术栈

### 核心技术
- **lexical**: Lexical 核心库
- **@lexical/react**: React 绑定
- **TypeScript**: 类型安全

### 常用插件
- **@lexical/rich-text**: 富文本功能
- **@lexical/list**: 列表支持
- **@lexical/link**: 链接支持
- **@lexical/code**: 代码块
- **@lexical/table**: 表格
- **@lexical/html**: HTML 导入/导出

### 功能特性
- 无障碍支持
- 自定义节点
- 协作编辑
- 历史记录
- 自动格式化

## 项目结构

```
lexical-editor-project/
├── src/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── Editor.tsx
│   │   │   ├── EditorTheme.ts
│   │   │   ├── ToolbarPlugin.tsx
│   │   │   ├── TreeViewPlugin.tsx
│   │   │   └── plugins/
│   │   │       ├── AutoLinkPlugin.tsx
│   │   │       ├── ListMaxIndentLevelPlugin.tsx
│   │   │       ├── CodeHighlightPlugin.tsx
│   │   │       └── FloatingTextFormatToolbarPlugin.tsx
│   │   ├── nodes/
│   │   │   ├── ImageNode.tsx
│   │   │   ├── MentionNode.tsx
│   │   │   └── StickerNode.tsx
│   │   └── themes/
│   │       └── EditorTheme.ts
│   ├── hooks/
│   │   └── useEditor.ts
│   ├── utils/
│   │   └── editorUtils.ts
│   ├── types/
│   │   └── editor.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 核心代码模式

### 1. 基础编辑器配置

```tsx
// src/components/editor/Editor.tsx
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";

import { ToolbarPlugin } from "./ToolbarPlugin";
import { editorTheme } from "./EditorTheme";

function onError(error: Error) {
  console.error(error);
}

const initialConfig = {
  namespace: "MyEditor",
  theme: editorTheme,
  onError,
  nodes: [],
};

export function Editor() {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative border rounded-lg overflow-hidden">
        <ToolbarPlugin />
        <div className="bg-white min-h-[400px]">
          <RichTextPlugin
            contentEditable={<ContentEditable className="outline-none p-4 min-h-[400px]" />}
            placeholder={<div className="absolute top-4 left-4 text-gray-400 pointer-events-none">开始输入...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <AutoFocusPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <TabIndentationPlugin />
      </div>
    </LexicalComposer>
  );
}
```

### 2. 编辑器主题

```typescript
// src/components/editor/EditorTheme.ts
export const editorTheme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "editor-placeholder",
  paragraph: "editor-paragraph",
  quote: "editor-quote",
  heading: {
    h1: "editor-heading-h1",
    h2: "editor-heading-h2",
    h3: "editor-heading-h3",
    h4: "editor-heading-h4",
    h5: "editor-heading-h5",
  },
  list: {
    nested: {
      listitem: "editor-nested-listitem",
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
    listitem: "editor-listitem",
    listitemChecked: "editor-listitem-checked",
    listitemUnchecked: "editor-listitem-unchecked",
  },
  hashtag: "editor-hashtag",
  image: "editor-image",
  link: "editor-link",
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    underline: "editor-text-underline",
    strikethrough: "editor-text-strikethrough",
    underlineStrikethrough: "editor-text-underline-strikethrough",
    code: "editor-text-code",
    highlight: "editor-text-highlight",
  },
  code: "editor-code",
  codeHighlight: {
    atrule: "editor-tokenAttr",
    attr: "editor-tokenAttr",
    boolean: "editor-tokenProperty",
    builtin: "editor-tokenSelector",
    cdata: "editor-tokenComment",
    char: "editor-tokenSelector",
    class: "editor-tokenFunction",
    "class-name": "editor-tokenFunction",
    comment: "editor-tokenComment",
    constant: "editor-tokenProperty",
    deleted: "editor-tokenProperty",
    doctype: "editor-tokenComment",
    entity: "editor-tokenOperator",
    function: "editor-tokenFunction",
    important: "editor-tokenVariable",
    inserted: "editor-tokenSelector",
    keyword: "editor-tokenAttr",
    namespace: "editor-tokenVariable",
    number: "editor-tokenProperty",
    operator: "editor-tokenOperator",
    prolog: "editor-tokenComment",
    property: "editor-tokenProperty",
    punctuation: "editor-tokenPunctuation",
    regex: "editor-tokenVariable",
    selector: "editor-tokenSelector",
    string: "editor-tokenSelector",
    symbol: "editor-tokenProperty",
    tag: "editor-tokenProperty",
    url: "editor-tokenOperator",
    variable: "editor-tokenVariable",
  },
};

// 对应的 CSS
export const editorStyles = `
.editor-paragraph {
  margin-bottom: 0.5rem;
}

.editor-quote {
  margin: 0;
  margin-left: 20px;
  font-size: 15px;
  color: rgb(101, 103, 107);
  border-left-color: rgb(206, 208, 212);
  border-left-width: 4px;
  border-left-style: solid;
  padding-left: 16px;
}

.editor-heading-h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.editor-heading-h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.editor-list-ol {
  list-style-type: decimal;
  padding-left: 20px;
}

.editor-list-ul {
  list-style-type: disc;
  padding-left: 20px;
}

.editor-text-bold {
  font-weight: bold;
}

.editor-text-italic {
  font-style: italic;
}

.editor-text-underline {
  text-decoration: underline;
}

.editor-text-code {
  background-color: rgb(240, 242, 245);
  padding: 1px 0.25rem;
  font-family: Menlo, Consolas, Monaco, monospace;
  font-size: 94%;
}

.editor-link {
  color: rgb(33, 111, 219);
  text-decoration: none;
}

.editor-link:hover {
  text-decoration: underline;
}
`;
```

### 3. 工具栏插件

```tsx
// src/components/editor/ToolbarPlugin.tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $createLinkNode } from "@lexical/link";
import { useCallback, useEffect, useState } from "react";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";

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
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: "bold" | "italic" | "underline" | "strikethrough" | "code") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingType: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingType));
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const formatList = (type: "bullet" | "number") => {
    if (type === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const insertLink = () => {
    const url = window.prompt("输入链接 URL:");
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const linkNode = $createLinkNode(url);
          selection.insertNodes([linkNode]);
        }
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
      {/* 文本格式 */}
      <ToolbarButton
        onClick={() => formatText("bold")}
        active={isBold}
        icon={<Bold className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => formatText("italic")}
        active={isItalic}
        icon={<Italic className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => formatText("underline")}
        active={isUnderline}
        icon={<Underline className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => formatText("strikethrough")}
        active={isStrikethrough}
        icon={<Strikethrough className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => formatText("code")}
        active={isCode}
        icon={<Code className="w-4 h-4" />}
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 标题 */}
      <ToolbarButton
        onClick={() => formatHeading("h1")}
        icon={<Heading1 className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => formatHeading("h2")}
        icon={<Heading2 className="w-4 h-4" />}
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 块级元素 */}
      <ToolbarButton
        onClick={formatQuote}
        icon={<Quote className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => formatList("bullet")}
        icon={<List className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => formatList("number")}
        icon={<ListOrdered className="w-4 h-4" />}
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 链接 */}
      <ToolbarButton onClick={insertLink} icon={<Link className="w-4 h-4" />} />
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
}

function ToolbarButton({ onClick, icon, active }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-200 ${
        active ? "bg-gray-200" : ""
      }`}
    >
      {icon}
    </button>
  );
}
```

### 4. 自定义图片节点

```tsx
// src/components/nodes/ImageNode.tsx
import {
  $applyNodeReplacement,
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";

export interface ImagePayload {
  altText: string;
  caption?: LexicalNode;
  height?: number;
  key?: NodeKey;
  src: string;
  width?: number;
  showCaption?: boolean;
}

function ImageComponent({
  src,
  altText,
  width,
  height,
}: {
  src: string;
  altText: string;
  width: number | "inherit";
  height: number | "inherit";
}) {
  const imageRef = useRef<HTMLImageElement>(null);

  return (
    <Suspense fallback={null}>
      <>
        <div className="image-container">
          <img
            className="max-w-full h-auto rounded-lg"
            src={src}
            alt={altText}
            ref={imageRef}
            style={{
              width: width === "inherit" ? "100%" : width,
              height: height === "inherit" ? "auto" : height,
            }}
          />
        </div>
      </>
    </Suspense>
  );
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    caption: SerializedLexicalNode;
    height?: number;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: "inherit" | number;
  __height: "inherit" | number;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key
    );
  }

  constructor(
    src: string,
    altText: string,
    width: "inherit" | number = "inherit",
    height: "inherit" | number = "inherit",
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    return span;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, src, width } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      src,
      width,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    if (this.__width !== "inherit") {
      element.setAttribute("width", String(this.__width));
    }
    if (this.__height !== "inherit") {
      element.setAttribute("height", String(this.__height));
    }
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: HTMLImageElement) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.__altText,
      height: this.__height === "inherit" ? undefined : this.__height,
      src: this.__src,
      type: "image",
      version: 1,
      width: this.__width === "inherit" ? undefined : this.__width,
    };
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
      />
    );
  }
}

function convertImageElement(domNode: HTMLImageElement): DOMConversionOutput {
  const altText = domNode.alt;
  const src = domNode.src;
  const node = $createImageNode({
    altText,
    src,
  });
  return { node };
}

export function $createImageNode({
  altText,
  height,
  src,
  width,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, width, height, key)
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
```

### 5. 自动链接插件

```tsx
// src/components/editor/plugins/AutoLinkPlugin.tsx
import { createCommand, LexicalCommand, TextNode } from "lexical";
import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createLinkNode,
  $isLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { $getSelection, $isRangeSelection, RangeSelection } from "lexical";

export const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export const EMAIL_MATCHER =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    if (match === null) {
      return null;
    }
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith("http")
        ? fullMatch
        : `https://${fullMatch}`,
    };
  },
  (text: string) => {
    const match = EMAIL_MATCHER.exec(text);
    if (match === null) {
      return null;
    }
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: `mailto:${fullMatch}`,
    };
  },
];

export function AutoLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (textNode: TextNode) => {
      const text = textNode.getTextContent();

      for (const matcher of MATCHERS) {
        const match = matcher(text);
        if (match) {
          const { index, length, url } = match;
          
          // 检查是否已经在链接中
          const parent = textNode.getParent();
          if ($isLinkNode(parent)) {
            return;
          }

          // 创建链接节点
          const linkNode = $createLinkNode(url);
          const textNodeWithLink = textNode.splitText(index, index + length);
          
          if (textNodeWithLink[1]) {
            textNodeWithLink[1].replace(linkNode);
            linkNode.append(textNodeWithLink[1]);
          }
          
          return;
        }
      }
    });
  }, [editor]);

  return null;
}
```

### 6. 浮动工具栏插件

```tsx
// src/components/editor/plugins/FloatingTextFormatToolbarPlugin.tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Bold, Italic, Underline, Link } from "lucide-react";

export function FloatingTextFormatToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isShown, setIsShown] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    
    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      setIsShown(false);
      return;
    }

    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      setIsShown(false);
      return;
    }

    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();

    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setIsShown(true);
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  if (!isShown) {
    return null;
  }

  return createPortal(
    <div
      ref={toolbarRef}
      className="absolute flex gap-1 p-2 bg-white rounded-lg shadow-lg border z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        icon={<Bold className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        icon={<Italic className="w-4 h-4" />}
      />
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        icon={<Underline className="w-4 h-4" />}
      />
      <div className="w-px h-6 bg-gray-300" />
      <ToolbarButton onClick={() => {}} icon={<Link className="w-4 h-4" />} />
    </div>,
    document.body
  );
}

function ToolbarButton({
  onClick,
  icon,
}: {
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded hover:bg-gray-100"
    >
      {icon}
    </button>
  );
}
```

### 7. 内容导入导出

```tsx
// src/utils/editorUtils.ts
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function useEditorExport() {
  const [editor] = useLexicalComposerContext();

  const exportHTML = (): string => {
    let html = "";
    editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });
    return html;
  };

  const importHTML = (html: string) => {
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      
      // 清空现有内容
      const root = editor.getRootElement();
      if (root) {
        root.innerHTML = "";
      }
      
      // 插入新节点
      const selection = $getSelection();
      if (selection) {
        selection.insertNodes(nodes);
      }
    });
  };

  return { exportHTML, importHTML };
}

// 使用示例
function EditorWithExport() {
  const { exportHTML, importHTML } = useEditorExport();

  const handleSave = async () => {
    const html = exportHTML();
    await fetch("/api/save", {
      method: "POST",
      body: JSON.stringify({ content: html }),
    });
  };

  return (
    <div>
      <Editor />
      <button onClick={handleSave}>保存</button>
    </div>
  );
}
```

### 8. 字数统计

```tsx
// src/components/editor/plugins/WordCountPlugin.tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState } from "react";

export function WordCountPlugin() {
  const [editor] = useLexicalComposerContext();
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const textContent = editor.getRootElement()?.textContent || "";
        
        // 字数统计（中英文混合）
        const chineseChars = textContent.match(/[\u4e00-\u9fa5]/g) || [];
        const englishWords = textContent
          .replace(/[\u4e00-\u9fa5]/g, "")
          .split(/\s+/)
          .filter((word) => word.length > 0);
        
        setWordCount(chineseChars.length + englishWords.length);
        setCharCount(textContent.length);
      });
    });
  }, [editor]);

  return (
    <div className="text-sm text-gray-500 p-2 border-t">
      字数: {wordCount} | 字符数: {charCount}
    </div>
  );
}
```

## 最佳实践

### 1. 性能优化

```tsx
// ✅ 使用 Suspense 懒加载装饰器节点
<Suspense fallback={<div>Loading...</div>}>
  <ImageComponent />
</Suspense>

// ✅ 避免频繁更新
useEffect(() => {
  return editor.registerUpdateListener(
    debounce(({ editorState }) => {
      // 处理更新
    }, 100)
  );
}, [editor]);
```

### 2. 类型安全

```typescript
// 扩展 Lexical 类型
declare module "lexical" {
  interface LexicalNode {
    // 自定义属性
  }
}

// 创建类型安全的节点
export function $isCustomNode(node: LexicalNode): node is CustomNode {
  return node instanceof CustomNode;
}
```

### 3. 协作编辑

```tsx
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { createWebsocketProvider } from "./collaboration";

<CollaborationPlugin
  id="document-id"
  providerFactory={createWebsocketProvider}
  shouldBootstrap={true}
/>
```

## 常用命令

### 安装

```bash
# 核心包
npm install lexical @lexical/react

# 常用插件
npm install @lexical/rich-text @lexical/list @lexical/link @lexical/code
npm install @lexical/table @lexical/html @lexical/selection

# TypeScript 类型
npm install -D @types/lexical
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 部署配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          lexical: ["lexical", "@lexical/react"],
        },
      },
    },
  },
});
```

## 相关资源

- [Lexical 官方文档](https://lexical.dev/)
- [Lexical GitHub](https://github.com/facebook/lexical)
- [Lexical Playground](https://playground.lexical.dev/)
- [Lexical Examples](https://github.com/facebook/lexical/tree/main/packages/lexical-playground)
