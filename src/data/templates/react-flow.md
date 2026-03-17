# React Flow 模板

## 技术栈

### 核心技术
- **@xyflow/react**: React Flow 核心库（v12+）
- **TypeScript**: 类型安全
- **Vite**: 构建工具

### 常用扩展
- **@xyflow/background**: 背景网格
- **@xyflow/controls**: 缩放控制
- **@xyflow/minimap**: 小地图
- **@xyflow/node-toolbar**: 节点工具栏
- **@xyflow/node-resizer**: 节点调整大小

### 功能特性
- 拖拽节点
- 自定义节点
- 自定义边
- 子流程
- 事件处理
- 状态管理

## 项目结构

```
react-flow-project/
├── src/
│   ├── components/
│   │   ├── nodes/
│   │   │   ├── CustomNode.tsx
│   │   │   ├── InputNode.tsx
│   │   │   ├── OutputNode.tsx
│   │   │   └── GroupNode.tsx
│   │   ├── edges/
│   │   │   ├── CustomEdge.tsx
│   │   │   └── ButtonEdge.tsx
│   │   ├── panels/
│   │   │   ├── NodePanel.tsx
│   │   │   └── PropertiesPanel.tsx
│   │   └── FlowCanvas.tsx
│   ├── hooks/
│   │   ├── useFlow.ts
│   │   ├── useAutoLayout.ts
│   │   └── useUndoRedo.ts
│   ├── store/
│   │   └── flowStore.ts
│   ├── utils/
│   │   ├── layout.ts
│   │   └── validation.ts
│   ├── types/
│   │   └── flow.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 核心代码模式

### 1. 基础流程图组件

```tsx
// src/components/FlowCanvas.tsx
import { useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  OnConnect,
  NodeTypes,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomNode } from './nodes/CustomNode';
import { InputNode } from './nodes/InputNode';
import { OutputNode } from './nodes/OutputNode';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  input: InputNode,
  output: OutputNode,
};

const initialNodes = [
  { id: '1', type: 'input', data: { label: '输入节点' }, position: { x: 0, y: 0 } },
  { id: '2', type: 'custom', data: { label: '处理节点' }, position: { x: 200, y: 100 } },
  { id: '3', type: 'output', data: { label: '输出节点' }, position: { x: 400, y: 200 } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
];

export function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-screen w-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">
            保存
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
```

### 2. 自定义节点

```tsx
// src/components/nodes/CustomNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useStore } from '../../store/flowStore';

interface CustomNodeData {
  label: string;
  description?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
}

export const CustomNode = memo(({ id, data }: NodeProps<CustomNodeData>) => {
  const status = data.status || 'idle';
  
  const statusColors = {
    idle: 'bg-gray-200',
    running: 'bg-blue-200',
    success: 'bg-green-200',
    error: 'bg-red-200',
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400 min-w-[150px] ${statusColors[status]}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-teal-500"
      />
      
      <div className="flex flex-col gap-1">
        <div className="text-sm font-bold">{data.label}</div>
        {data.description && (
          <div className="text-xs text-gray-500">{data.description}</div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-teal-500"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
```

### 3. 带多端口的节点

```tsx
// src/components/nodes/NodeWithPorts.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface PortNodeData {
  label: string;
  inputs: { id: string; label: string }[];
  outputs: { id: string; label: string }[];
}

export const NodeWithPorts = memo(({ data }: NodeProps<PortNodeData>) => {
  return (
    <div className="bg-white border rounded shadow-sm p-3 min-w-[200px]">
      <div className="font-bold text-sm mb-2 border-b pb-1">
        {data.label}
      </div>
      
      {/* 输入端口 */}
      <div className="space-y-1">
        {data.inputs.map((input, index) => (
          <div key={input.id} className="flex items-center text-xs relative">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              style={{ top: 32 + index * 20 }}
              className="w-2 h-2 !bg-blue-500"
            />
            <span className="pl-3">{input.label}</span>
          </div>
        ))}
      </div>

      {/* 输出端口 */}
      <div className="space-y-1 mt-2">
        {data.outputs.map((output, index) => (
          <div key={output.id} className="flex items-center justify-end text-xs relative">
            <span className="pr-3">{output.label}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              style={{ top: 32 + (data.inputs.length + index) * 20 }}
              className="w-2 h-2 !bg-green-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
});

NodeWithPorts.displayName = 'NodeWithPorts';
```

### 4. 自定义边

```tsx
// src/components/edges/CustomEdge.tsx
import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { setEdges } = useReactFlow();

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className="w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
            onClick={onEdgeClick}
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';
```

### 5. 拖拽添加节点

```tsx
// src/components/panels/NodePanel.tsx
import { DragEvent } from 'react';

const nodeTypes = [
  { type: 'input', label: '输入节点' },
  { type: 'output', label: '输出节点' },
  { type: 'custom', label: '自定义节点' },
  { type: 'group', label: '分组节点' },
];

export function NodePanel() {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-white border-r p-4">
      <h3 className="text-sm font-bold mb-3">节点类型</h3>
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            className="p-2 border rounded cursor-grab hover:bg-gray-50"
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
          >
            {node.label}
          </div>
        ))}
      </div>
    </aside>
  );
}

// 在 FlowCanvas 中处理 drop
import { useReactFlow, ReactFlowProvider } from '@xyflow/react';

function FlowCanvasInner() {
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <ReactFlow
      onDragOver={onDragOver}
      onDrop={onDrop}
      // ...其他属性
    />
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
```

### 6. 状态管理（Zustand）

```typescript
// src/store/flowStore.ts
import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNode: (node: Node | null) => void;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: object) => void;
  deleteNode: (nodeId: string) => void;
}

export const useStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    });
  },
}));
```

### 7. 自动布局（Dagre）

```typescript
// src/hooks/useAutoLayout.ts
import { useCallback } from 'react';
import dagre from 'dagre';
import { useReactFlow } from '@xyflow/react';
import { Node, Edge } from '@xyflow/react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

export function useAutoLayout() {
  const { fitView } = useReactFlow();

  const onLayout = useCallback(
    (nodes: Node[], edges: Edge[], direction = 'TB') => {
      const isHorizontal = direction === 'LR';
      dagreGraph.setGraph({ rankdir: direction });

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    },
    []
  );

  return { onLayout };
}
```

### 8. 撤销/重做

```typescript
// src/hooks/useUndoRedo.ts
import { useCallback, useState } from 'react';
import { Node, Edge } from '@xyflow/react';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export function useUndoRedo(
  maxHistorySize: number = 100
) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const push = useCallback(
    (state: HistoryState) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(state);
        
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
          return newHistory;
        }
        
        return newHistory;
      });
      setCurrentIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
    },
    [currentIndex, maxHistorySize]
  );

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { push, undo, redo, canUndo, canRedo };
}
```

## 最佳实践

### 1. 性能优化

```tsx
// ✅ 使用 memo 避免不必要的渲染
export const CustomNode = memo(({ data }: NodeProps) => {
  return <div>{data.label}</div>;
});

// ✅ 使用 useTransition 处理大量节点
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

const handleAddManyNodes = () => {
  startTransition(() => {
    // 添加大量节点
  });
};

// ✅ 虚拟化处理超大规模流程图
// 对于 1000+ 节点，考虑只渲染视口内的节点
```

### 2. 类型安全

```typescript
// src/types/flow.ts
import { Node, Edge } from '@xyflow/react';

export interface CustomNodeData {
  label: string;
  description?: string;
  config?: Record<string, any>;
}

export type CustomNode = Node<CustomNodeData, 'custom'>;
export type CustomEdge = Edge<{}>;

declare module '@xyflow/react' {
  interface NodeTypes {
    custom: CustomNode;
    input: Node<InputNodeData>;
    output: Node<OutputNodeData>;
  }
}
```

### 3. 验证连接

```tsx
// 只允许特定类型的连接
const onConnect: OnConnect = useCallback(
  (connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    // 验证连接规则
    if (sourceNode?.type === 'output' && targetNode?.type === 'input') {
      setEdges((eds) => addEdge(connection, eds));
    } else {
      console.warn('Invalid connection');
    }
  },
  [nodes, setEdges]
);
```

## 常用命令

### 安装

```bash
# 安装核心包
npm install @xyflow/react

# 安装扩展
npm install @xyflow/background @xyflow/controls @xyflow/minimap

# 布局算法
npm install dagre @types/dagre

# 状态管理
npm install zustand
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check
```

## 部署配置

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-flow': ['@xyflow/react'],
        },
      },
    },
  },
});
```

## 相关资源

- [React Flow 官方文档](https://reactflow.dev/)
- [React Flow GitHub](https://github.com/xyflow/xyflow)
- [React Flow 示例](https://reactflow.dev/examples)
- [React Flow 主题编辑器](https://reactflow.dev/examples/styling/theme)
