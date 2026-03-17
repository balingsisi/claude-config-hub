# Konva.js Canvas 图形库模板

## 技术栈

- **Konva.js**: HTML5 Canvas JavaScript 库
- **React Konva**: React 绑定
- **TypeScript**: 类型支持
- **Vite**: 构建工具
- **Tailwind CSS**: 样式方案
- **Fabric.js**: Canvas 库替代方案

## 项目结构

```
konva-graphics/
├── src/
│   ├── components/
│   │   ├── shapes/
│   │   │   ├── Rectangle.tsx
│   │   │   ├── Circle.tsx
│   │   │   ├── Line.tsx
│   │   │   ├── Text.tsx
│   │   │   ├── Image.tsx
│   │   │   ├── Polygon.tsx
│   │   │   └── Star.tsx
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── Layer.tsx
│   │   │   ├── Stage.tsx
│   │   │   └── Transformer.tsx
│   │   ├── tools/
│   │   │   ├── SelectionTool.tsx
│   │   │   ├── DrawingTool.tsx
│   │   │   ├── ShapeTool.tsx
│   │   │   └── TextTool.tsx
│   │   ├── panels/
│   │   │   ├── PropertiesPanel.tsx
│   │   │   ├── LayersPanel.tsx
│   │   │   └── Toolbar.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useSelection.ts
│   │   ├── useDrawing.ts
│   │   ├── useHistory.ts
│   │   ├── useExport.ts
│   │   └── useImage.ts
│   ├── utils/
│   │   ├── shapes.ts
│   │   ├── colors.ts
│   │   ├── filters.ts
│   │   └── export.ts
│   ├── types/
│   │   └── index.ts
│   ├── store/
│   │   └── canvasStore.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 代码模式

### 基础画布组件

```typescript
// src/components/canvas/Stage.tsx
import React, { useRef, useEffect } from 'react';
import { Stage as KonvaStage } from 'react-konva';
import { useCanvasStore } from '@/store/canvasStore';

interface StageProps {
  width: number;
  height: number;
  children: React.ReactNode;
}

export const Stage: React.FC<StageProps> = ({ width, height, children }) => {
  const stageRef = useRef<KonvaStage>(null);
  const { zoom, position, setStageRef } = useCanvasStore();

  useEffect(() => {
    if (stageRef.current) {
      setStageRef(stageRef.current);
    }
  }, [setStageRef]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    stage.position(newPos);
    stage.batchDraw();
  };

  return (
    <KonvaStage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={zoom}
      scaleY={zoom}
      x={position.x}
      y={position.y}
      onWheel={handleWheel}
      draggable
    >
      {children}
    </KonvaStage>
  );
};
```

```typescript
// src/components/canvas/Layer.tsx
import React from 'react';
import { Layer as KonvaLayer } from 'react-konva';

interface LayerProps {
  children: React.ReactNode;
  id: string;
  visible?: boolean;
  opacity?: number;
}

export const Layer: React.FC<LayerProps> = ({
  children,
  id,
  visible = true,
  opacity = 1,
}) => {
  return (
    <KonvaLayer
      id={id}
      visible={visible}
      opacity={opacity}
    >
      {children}
    </KonvaLayer>
  );
};
```

```typescript
// src/components/canvas/Canvas.tsx
import React, { useState } from 'react';
import { Stage } from './Stage';
import { Layer } from './Layer';
import { Rectangle } from '../shapes/Rectangle';
import { Circle } from '../shapes/Circle';
import { Text } from '../shapes/Text';
import { Transformer } from './Transformer';
import { useCanvasStore } from '@/store/canvasStore';

export const Canvas: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { shapes, selectedIds, addShape, selectShape } = useCanvasStore();

  const handleCanvasClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      selectShape([]);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
      >
        <Layer id="background">
          {/* 背景层 */}
        </Layer>
        
        <Layer id="shapes">
          {shapes.map((shape) => {
            switch (shape.type) {
              case 'rectangle':
                return (
                  <Rectangle
                    key={shape.id}
                    shape={shape}
                    isSelected={selectedIds.includes(shape.id)}
                  />
                );
              case 'circle':
                return (
                  <Circle
                    key={shape.id}
                    shape={shape}
                    isSelected={selectedIds.includes(shape.id)}
                  />
                );
              case 'text':
                return (
                  <Text
                    key={shape.id}
                    shape={shape}
                    isSelected={selectedIds.includes(shape.id)}
                  />
                );
              default:
                return null;
            }
          })}
          
          <Transformer selectedIds={selectedIds} />
        </Layer>
      </Stage>
    </div>
  );
};
```

### 图形组件

```typescript
// src/components/shapes/Rectangle.tsx
import React, { useRef, useEffect } from 'react';
import { Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '@/store/canvasStore';
import { Shape } from '@/types';

interface RectangleProps {
  shape: Shape;
  isSelected: boolean;
}

export const Rectangle: React.FC<RectangleProps> = ({ shape, isSelected }) => {
  const rectRef = useRef<any>(null);
  const { updateShape, selectShape } = useCanvasStore();

  useEffect(() => {
    if (rectRef.current && isSelected) {
      rectRef.current.moveToTop();
    }
  }, [isSelected]);

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    updateShape(shape.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = (e: KonvaEventObject<Event>) => {
    const node = rectRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateShape(shape.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    selectShape([shape.id]);
  };

  return (
    <Rect
      ref={rectRef}
      id={shape.id}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.fill}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      rotation={shape.rotation}
      opacity={shape.opacity}
      cornerRadius={shape.cornerRadius || 0}
      draggable
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      onClick={handleClick}
      onTap={handleClick}
      shadowColor={shape.shadowColor}
      shadowBlur={shape.shadowBlur}
      shadowOffset={shape.shadowOffset}
      shadowOpacity={shape.shadowOpacity}
    />
  );
};
```

```typescript
// src/components/shapes/Circle.tsx
import React, { useRef, useEffect } from 'react';
import { Circle as KonvaCircle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '@/store/canvasStore';
import { Shape } from '@/types';

interface CircleProps {
  shape: Shape;
  isSelected: boolean;
}

export const Circle: React.FC<CircleProps> = ({ shape, isSelected }) => {
  const circleRef = useRef<any>(null);
  const { updateShape, selectShape } = useCanvasStore();

  useEffect(() => {
    if (circleRef.current && isSelected) {
      circleRef.current.moveToTop();
    }
  }, [isSelected]);

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    updateShape(shape.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = (e: KonvaEventObject<Event>) => {
    const node = circleRef.current;
    if (!node) return;

    const scaleX = node.scaleX();

    node.scaleX(1);
    node.scaleY(1);

    updateShape(shape.id, {
      x: node.x(),
      y: node.y(),
      radius: Math.max(5, shape.radius * scaleX),
      rotation: node.rotation(),
    });
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    selectShape([shape.id]);
  };

  return (
    <KonvaCircle
      ref={circleRef}
      id={shape.id}
      x={shape.x}
      y={shape.y}
      radius={shape.radius}
      fill={shape.fill}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      rotation={shape.rotation}
      opacity={shape.opacity}
      draggable
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      onClick={handleClick}
      onTap={handleClick}
      shadowColor={shape.shadowColor}
      shadowBlur={shape.shadowBlur}
      shadowOffset={shape.shadowOffset}
      shadowOpacity={shape.shadowOpacity}
    />
  );
};
```

```typescript
// src/components/shapes/Text.tsx
import React, { useRef, useEffect } from 'react';
import { Text as KonvaText } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '@/store/canvasStore';
import { Shape } from '@/types';

interface TextProps {
  shape: Shape;
  isSelected: boolean;
}

export const Text: React.FC<TextProps> = ({ shape, isSelected }) => {
  const textRef = useRef<any>(null);
  const { updateShape, selectShape } = useCanvasStore();

  useEffect(() => {
    if (textRef.current && isSelected) {
      textRef.current.moveToTop();
    }
  }, [isSelected]);

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    updateShape(shape.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = (e: KonvaEventObject<Event>) => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();

    node.scaleX(1);
    node.scaleY(1);

    updateShape(shape.id, {
      x: node.x(),
      y: node.y(),
      fontSize: Math.max(8, (shape.fontSize || 16) * scaleX),
      rotation: node.rotation(),
    });
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    selectShape([shape.id]);
  };

  return (
    <KonvaText
      ref={textRef}
      id={shape.id}
      x={shape.x}
      y={shape.y}
      text={shape.text}
      fontSize={shape.fontSize || 16}
      fontFamily={shape.fontFamily || 'Arial'}
      fontStyle={shape.fontStyle}
      fill={shape.fill}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      rotation={shape.rotation}
      opacity={shape.opacity}
      align={shape.align}
      verticalAlign={shape.verticalAlign}
      draggable
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      onClick={handleClick}
      onTap={handleClick}
      shadowColor={shape.shadowColor}
      shadowBlur={shape.shadowBlur}
      shadowOffset={shape.shadowOffset}
      shadowOpacity={shape.shadowOpacity}
    />
  );
};
```

```typescript
// src/components/canvas/Transformer.tsx
import React, { useEffect, useRef } from 'react';
import { Transformer as KonvaTransformer } from 'react-konva';
import { useCanvasStore } from '@/store/canvasStore';

interface TransformerProps {
  selectedIds: string[];
}

export const Transformer: React.FC<TransformerProps> = ({ selectedIds }) => {
  const transformerRef = useRef<any>(null);
  const { getStage } = useCanvasStore();

  useEffect(() => {
    if (!transformerRef.current || selectedIds.length === 0) return;

    const stage = getStage();
    if (!stage) return;

    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((node) => node !== undefined);

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer().batchDraw();
  }, [selectedIds, getStage]);

  return (
    <KonvaTransformer
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        // 限制最小尺寸
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }}
      enabledAnchors={[
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
        'top-center',
        'bottom-center',
      ]}
      rotateEnabled={true}
      rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
      rotationSnapTolerance={5}
    />
  );
};
```

### 自定义 Hooks

```typescript
// src/hooks/useSelection.ts
import { useState, useCallback } from 'react';

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectShape = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const addToSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const removeFromSelection = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      }
      return [...prev, id];
    });
  }, []);

  return {
    selectedIds,
    selectShape,
    addToSelection,
    removeFromSelection,
    clearSelection,
    toggleSelection,
  };
}
```

```typescript
// src/hooks/useDrawing.ts
import { useState, useCallback } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { Shape } from '@/types';

interface Point {
  x: number;
  y: number;
}

export function useDrawing(tool: string) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [shape, setShape] = useState<Shape | null>(null);

  const startDrawing = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);
    setPoints([pos]);
  }, []);

  const draw = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setPoints((prev) => [...prev, pos]);
  }, [isDrawing]);

  const endDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    
    // 根据工具创建对应的形状
    if (points.length > 1) {
      const newShape: Shape = {
        id: `shape-${Date.now()}`,
        type: tool,
        points: points.flatMap((p) => [p.x, p.y]),
        stroke: '#000000',
        strokeWidth: 2,
        x: 0,
        y: 0,
      };
      
      setShape(newShape);
    }
    
    setPoints([]);
  }, [isDrawing, points, tool]);

  return {
    isDrawing,
    points,
    shape,
    startDrawing,
    draw,
    endDrawing,
  };
}
```

```typescript
// src/hooks/useHistory.ts
import { useState, useCallback } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialPresent: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const set = useCallback((newPresent: T) => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present],
      present: newPresent,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newPresent: T) => {
    setHistory({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}
```

```typescript
// src/hooks/useExport.ts
import { useCallback } from 'react';

export function useExport() {
  const exportToImage = useCallback(
    async (stage: any, format: 'png' | 'jpeg' = 'png') => {
      if (!stage) return null;

      const dataURL = stage.toDataURL({
        mimeType: `image/${format}`,
        quality: format === 'jpeg' ? 0.8 : 1,
        pixelRatio: 2,
      });

      return dataURL;
    },
    []
  );

  const exportToJSON = useCallback((shapes: any[]) => {
    return JSON.stringify(shapes, null, 2);
  }, []);

  const downloadImage = useCallback(
    async (stage: any, filename: string = 'canvas') => {
      const dataURL = await exportToImage(stage);
      if (!dataURL) return;

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [exportToImage]
  );

  const downloadJSON = useCallback((shapes: any[], filename: string = 'canvas') => {
    const json = exportToJSON(shapes);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${filename}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportToJSON]);

  return {
    exportToImage,
    exportToJSON,
    downloadImage,
    downloadJSON,
  };
}
```

### 状态管理

```typescript
// src/store/canvasStore.ts
import { create } from 'zustand';
import { Shape } from '@/types';

interface CanvasState {
  shapes: Shape[];
  selectedIds: string[];
  zoom: number;
  position: { x: number; y: number };
  stageRef: any;
  
  // Actions
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  selectShape: (ids: string[]) => void;
  setZoom: (zoom: number) => void;
  setPosition: (position: { x: number; y: number }) => void;
  setStageRef: (ref: any) => void;
  getStage: () => any;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  shapes: [],
  selectedIds: [],
  zoom: 1,
  position: { x: 0, y: 0 },
  stageRef: null,

  addShape: (shape) =>
    set((state) => ({
      shapes: [...state.shapes, shape],
    })),

  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((shape) =>
        shape.id === id ? { ...shape, ...updates } : shape
      ),
    })),

  deleteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((shape) => shape.id !== id),
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    })),

  selectShape: (ids) => set({ selectedIds: ids }),

  setZoom: (zoom) => set({ zoom }),

  setPosition: (position) => set({ position }),

  setStageRef: (ref) => set({ stageRef: ref }),

  getStage: () => get().stageRef,
}));
```

### 工具面板

```typescript
// src/components/panels/Toolbar.tsx
import React from 'react';
import { useCanvasStore } from '@/store/canvasStore';

type Tool = 'select' | 'rectangle' | 'circle' | 'text' | 'line' | 'pen';

export const Toolbar: React.FC = () => {
  const [currentTool, setCurrentTool] = React.useState<Tool>('select');
  const { addShape } = useCanvasStore();

  const tools: Array<{ id: Tool; icon: string; label: string }> = [
    { id: 'select', icon: '↖', label: '选择' },
    { id: 'rectangle', icon: '▢', label: '矩形' },
    { id: 'circle', icon: '○', label: '圆形' },
    { id: 'text', icon: 'T', label: '文本' },
    { id: 'line', icon: '/', label: '线条' },
    { id: 'pen', icon: '✏️', label: '画笔' },
  ];

  const handleToolClick = (tool: Tool) => {
    setCurrentTool(tool);

    // 如果是形状工具，添加默认形状
    if (tool === 'rectangle') {
      addShape({
        id: `rect-${Date.now()}`,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: '#3498db',
        stroke: '#2c3e50',
        strokeWidth: 2,
        opacity: 1,
        rotation: 0,
      });
    } else if (tool === 'circle') {
      addShape({
        id: `circle-${Date.now()}`,
        type: 'circle',
        x: 200,
        y: 200,
        radius: 50,
        fill: '#e74c3c',
        stroke: '#c0392b',
        strokeWidth: 2,
        opacity: 1,
        rotation: 0,
      });
    } else if (tool === 'text') {
      addShape({
        id: `text-${Date.now()}`,
        type: 'text',
        x: 300,
        y: 300,
        text: '示例文本',
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#2c3e50',
        opacity: 1,
        rotation: 0,
      });
    }
  };

  return (
    <div className="flex flex-col bg-white border-r border-gray-200 p-2 space-y-2">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool.id)}
          className={`
            w-12 h-12 flex items-center justify-center rounded-lg
            transition-colors duration-200
            ${
              currentTool === tool.id
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100'
            }
          `}
          title={tool.label}
        >
          <span className="text-xl">{tool.icon}</span>
        </button>
      ))}
    </div>
  );
};
```

```typescript
// src/components/panels/PropertiesPanel.tsx
import React from 'react';
import { useCanvasStore } from '@/store/canvasStore';

export const PropertiesPanel: React.FC = () => {
  const { shapes, selectedIds, updateShape } = useCanvasStore();
  
  const selectedShape = shapes.find((s) => s.id === selectedIds[0]);

  if (!selectedShape) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-sm">选择一个图形以查看属性</p>
      </div>
    );
  }

  const handleChange = (property: string, value: any) => {
    updateShape(selectedShape.id, { [property]: value });
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">属性</h3>

      {/* 位置 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">位置</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">X</label>
            <input
              type="number"
              value={selectedShape.x}
              onChange={(e) => handleChange('x', Number(e.target.value))}
              className="w-full px-2 py-1 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Y</label>
            <input
              type="number"
              value={selectedShape.y}
              onChange={(e) => handleChange('y', Number(e.target.value))}
              className="w-full px-2 py-1 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* 填充颜色 */}
      <div>
        <label className="text-sm font-medium text-gray-700">填充颜色</label>
        <input
          type="color"
          value={selectedShape.fill}
          onChange={(e) => handleChange('fill', e.target.value)}
          className="w-full h-10 rounded border border-gray-300"
        />
      </div>

      {/* 描边颜色 */}
      <div>
        <label className="text-sm font-medium text-gray-700">描边颜色</label>
        <input
          type="color"
          value={selectedShape.stroke}
          onChange={(e) => handleChange('stroke', e.target.value)}
          className="w-full h-10 rounded border border-gray-300"
        />
      </div>

      {/* 描边宽度 */}
      <div>
        <label className="text-sm font-medium text-gray-700">描边宽度</label>
        <input
          type="range"
          min="0"
          max="20"
          value={selectedShape.strokeWidth}
          onChange={(e) => handleChange('strokeWidth', Number(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{selectedShape.strokeWidth}px</span>
      </div>

      {/* 透明度 */}
      <div>
        <label className="text-sm font-medium text-gray-700">透明度</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={selectedShape.opacity}
          onChange={(e) => handleChange('opacity', Number(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-gray-500">
          {Math.round(selectedShape.opacity * 100)}%
        </span>
      </div>

      {/* 旋转 */}
      <div>
        <label className="text-sm font-medium text-gray-700">旋转</label>
        <input
          type="range"
          min="0"
          max="360"
          value={selectedShape.rotation}
          onChange={(e) => handleChange('rotation', Number(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{selectedShape.rotation}°</span>
      </div>
    </div>
  );
};
```

### 类型定义

```typescript
// src/types/index.ts
export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line' | 'polygon' | 'star';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation?: number;
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
  draggable?: boolean;
  visible?: boolean;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  cornerRadius?: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: number[];
  tension?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'round' | 'bevel' | 'miter';
}

export interface PolygonShape extends BaseShape {
  type: 'polygon';
  sides: number;
  radius: number;
}

export interface StarShape extends BaseShape {
  type: 'star';
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}

export type Shape = RectangleShape | CircleShape | TextShape | LineShape | PolygonShape | StarShape;

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  shapes: Shape[];
}

export interface CanvasState {
  shapes: Shape[];
  selectedIds: string[];
  layers: Layer[];
  activeLayer: string;
  zoom: number;
  position: { x: number; y: number };
}
```

### 工具函数

```typescript
// src/utils/shapes.ts
import { Shape } from '@/types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createRectangle(options: Partial<Shape> = {}): Shape {
  return {
    id: generateId(),
    type: 'rectangle',
    x: options.x || 100,
    y: options.y || 100,
    width: options.width || 100,
    height: options.height || 100,
    fill: options.fill || '#3498db',
    stroke: options.stroke || '#2c3e50',
    strokeWidth: options.strokeWidth || 2,
    opacity: options.opacity || 1,
    rotation: options.rotation || 0,
    cornerRadius: options.cornerRadius || 0,
  } as Shape;
}

export function createCircle(options: Partial<Shape> = {}): Shape {
  return {
    id: generateId(),
    type: 'circle',
    x: options.x || 100,
    y: options.y || 100,
    radius: options.radius || 50,
    fill: options.fill || '#e74c3c',
    stroke: options.stroke || '#c0392b',
    strokeWidth: options.strokeWidth || 2,
    opacity: options.opacity || 1,
    rotation: options.rotation || 0,
  } as Shape;
}

export function createText(options: Partial<Shape> = {}): Shape {
  return {
    id: generateId(),
    type: 'text',
    x: options.x || 100,
    y: options.y || 100,
    text: options.text || '示例文本',
    fontSize: options.fontSize || 24,
    fontFamily: options.fontFamily || 'Arial',
    fill: options.fill || '#2c3e50',
    opacity: options.opacity || 1,
    rotation: options.rotation || 0,
  } as Shape;
}

export function duplicateShape(shape: Shape): Shape {
  return {
    ...shape,
    id: generateId(),
    x: shape.x + 20,
    y: shape.y + 20,
  };
}

export function alignShapes(shapes: Shape[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): Shape[] {
  if (shapes.length < 2) return shapes;

  const bounds = shapes.map((s) => ({
    minX: s.x,
    maxX: s.x + (s.type === 'circle' ? s.radius * 2 : (s as any).width || 0),
    minY: s.y,
    maxY: s.y + (s.type === 'circle' ? s.radius * 2 : (s as any).height || 0),
  }));

  switch (alignment) {
    case 'left':
      const minLeft = Math.min(...bounds.map((b) => b.minX));
      return shapes.map((s) => ({ ...s, x: minLeft }));
    
    case 'center':
      const centerX = bounds.reduce((sum, b) => sum + (b.minX + b.maxX) / 2, 0) / bounds.length;
      return shapes.map((s) => {
        const width = s.type === 'circle' ? s.radius * 2 : (s as any).width || 0;
        return { ...s, x: centerX - width / 2 };
      });
    
    case 'right':
      const maxRight = Math.max(...bounds.map((b) => b.maxX));
      return shapes.map((s) => {
        const width = s.type === 'circle' ? s.radius * 2 : (s as any).width || 0;
        return { ...s, x: maxRight - width };
      });
    
    default:
      return shapes;
  }
}
```

```typescript
// src/utils/export.ts
import Konva from 'konva';

export async function exportStageToImage(
  stage: Konva.Stage,
  options: {
    format?: 'png' | 'jpeg';
    quality?: number;
    pixelRatio?: number;
  } = {}
): Promise<string> {
  const { format = 'png', quality = 1, pixelRatio = 2 } = options;

  return stage.toDataURL({
    mimeType: `image/${format}`,
    quality,
    pixelRatio,
  });
}

export function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToSVG(stage: Konva.Stage): string {
  // Konva 不直接支持 SVG 导出，需要使用额外的库
  // 这里提供一个简化的实现
  return '';
}
```

## 最佳实践

### 1. 性能优化

```typescript
// 使用 batchDraw 而不是 draw
layer.batchDraw();

// 缓存复杂图形
shape.cache();

// 使用 perfectDrawEnabled
shape.perfectDrawEnabled(false);

// 使用 listening: false 禁用事件监听
<Rect listening={false} />
```

### 2. 响应式画布

```typescript
// 监听窗口大小变化
useEffect(() => {
  const handleResize = () => {
    if (stageRef.current) {
      stageRef.current.width(window.innerWidth);
      stageRef.current.height(window.innerHeight);
      stageRef.current.batchDraw();
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### 3. 事件处理

```typescript
// 使用事件委托优化性能
<Stage onClick={handleStageClick}>
  <Layer>
    {shapes.map((shape) => (
      <Shape
        key={shape.id}
        onClick={(e) => handleShapeClick(e, shape)}
      />
    ))}
  </Layer>
</Stage>
```

## 常用命令

```bash
# 安装依赖
npm install konva react-konva zustand

# 开发模式
npm run dev

# 构建
npm run build
```

## 部署配置

### package.json

```json
{
  "dependencies": {
    "konva": "^9.3.0",
    "react-konva": "^18.2.0",
    "zustand": "^4.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

## 参考资源

- [Konva.js 官方文档](https://konvajs.org/)
- [React Konva 文档](https://konvajs.org/docs/react/)
- [Konva GitHub](https://github.com/konvajs/konva)
- [Canvas API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
