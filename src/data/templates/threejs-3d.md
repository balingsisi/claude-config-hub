# Three.js 3D Web 开发模板

## 技术栈

- **Three.js**: 3D 渲染库
- **@react-three/fiber**: React 集成（可选）
- **@react-three/drei**: React Three.js 工具集
- **TypeScript**: 类型支持
- **Vite**: 开发构建工具

## 项目结构

```
threejs-app/
├── public/
│   ├── models/           # 3D 模型文件
│   │   └── scene.glb
│   └── textures/         # 纹理贴图
├── src/
│   ├── components/
│   │   ├── Scene.tsx     # 场景组件
│   │   ├── Camera.tsx    # 相机控制
│   │   ├── Lights.tsx    # 光源
│   │   └── Objects/      # 3D 对象
│   │       ├── Box.tsx
│   │       ├── Sphere.tsx
│   │       └── Model.tsx
│   ├── hooks/
│   │   ├── useAnimation.ts
│   │   ├── useGLTF.ts
│   │   └── useControls.ts
│   ├── utils/
│   │   ├── loaders.ts
│   │   └── math.ts
│   ├── types/
│   │   └── three.d.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
└── package.json
```

## 代码模式

### 基础场景设置

```tsx
// src/components/Scene.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        
        {/* 光源 */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
        />
        
        {/* 3D 对象 */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        
        {/* 地面 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="gray" />
        </mesh>
      </Suspense>
    </Canvas>
  );
}
```

### 可交互 3D 对象

```tsx
// src/components/Objects/InteractiveBox.tsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

interface InteractiveBoxProps {
  position: [number, number, number];
  color?: string;
}

export function InteractiveBox({ position, color = 'orange' }: InteractiveBoxProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // 动画循环
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={clicked ? 1.5 : 1}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : color} />
    </mesh>
  );
}
```

### 加载 GLTF 模型

```tsx
// src/components/Objects/Model.tsx
import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

interface ModelProps {
  path: string;
  scale?: number;
}

export function Model({ path, scale = 1 }: ModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(path);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={scale} />
    </group>
  );
}

// 预加载模型
useGLTF.preload('/models/scene.glb');
```

### 动画 Hook

```tsx
// src/hooks/useAnimation.ts
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';

interface AnimationOptions {
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  floatAmplitude?: number;
  floatSpeed?: number;
}

export function useAnimation(options: AnimationOptions = {}) {
  const meshRef = useRef<Mesh>(null);
  const initialY = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;

    const { clock } = state;
    const time = clock.elapsedTime;

    // 旋转
    if (options.rotateX) meshRef.current.rotation.x += options.rotateX;
    if (options.rotateY) meshRef.current.rotation.y += options.rotateY;
    if (options.rotateZ) meshRef.current.rotation.z += options.rotateZ;

    // 浮动
    if (options.floatAmplitude && options.floatSpeed) {
      if (initialY.current === 0) {
        initialY.current = meshRef.current.position.y;
      }
      meshRef.current.position.y = 
        initialY.current + Math.sin(time * options.floatSpeed) * options.floatAmplitude;
    }
  });

  return meshRef;
}
```

### 粒子系统

```tsx
// src/components/Objects/Particles.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function Particles({ count = 5000 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.05;
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#ffa500"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}
```

### 环境贴图

```tsx
// src/components/Environment.tsx
import { Environment, ContactShadows } from '@react-three/drei';

export function SceneEnvironment() {
  return (
    <>
      {/* HDR 环境贴图 */}
      <Environment
        preset="city"
        background={false}
      />
      
      {/* 接触阴影 */}
      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.5}
        scale={10}
        blur={2}
        far={4}
      />
    </>
  );
}
```

### 相机控制

```tsx
// src/hooks/useControls.ts
import { useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useEffect } from 'react';

export function useCameraControls() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2;

    return () => controls.dispose();
  }, [camera, gl]);
}
```

## 最佳实践

### 1. 性能优化

```tsx
// 使用 useMemo 缓存几何体
const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

// 使用 InstancedMesh 渲染大量相同对象
<instancedMesh args={[geometry, material, 1000]}>
  <boxGeometry />
  <meshStandardMaterial />
</instancedMesh>

// 使用 LOD (Level of Detail)
import { Detailed } from '@react-three/drei';

<Detailed distances={[0, 10, 20]}>
  <mesh> {/* 高精度模型 */} </mesh>
  <mesh> {/* 中精度模型 */} </mesh>
  <mesh> {/* 低精度模型 */} </mesh>
</Detailed>
```

### 2. 资源管理

```tsx
// 使用 Suspense 懒加载
<Suspense fallback={<LoadingSpinner />}>
  <Model path="/heavy-model.glb" />
</Suspense>

// 预加载资源
useGLTF.preload('/models/scene.glb');
useTexture.preload('/textures/wood.jpg');
```

### 3. 响应式设计

```tsx
// 根据设备性能调整
import { useDetectGPU } from '@react-three/drei';

function App() {
  const GPUTier = useDetectGPU();
  const particleCount = GPUTier.tier < 2 ? 1000 : 5000;
  
  return <Particles count={particleCount} />;
}
```

### 4. 状态管理

```tsx
// 使用 Zustand 管理全局状态
import { create } from 'zustand';

interface SceneState {
  selectedObject: string | null;
  setSelectedObject: (id: string | null) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  selectedObject: null,
  setSelectedObject: (id) => set({ selectedObject: id }),
}));
```

## 常用命令

### 开发

```bash
# 安装依赖
npm install three @react-three/fiber @react-three/drei

# 安装类型定义
npm install -D @types/three

# 开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 模型处理

```bash
# 安装 gltf-pipeline（优化 GLTF）
npm install -g gltf-pipeline

# 压缩 GLTF
gltf-pipeline -i model.gltf -o model.glb --draco.compressGeometry

# 安装 gltf-transform
npm install -g @gltf-transform/cli

# 优化模型
gltf-transform optimize input.glb output.glb
```

## 部署配置

### Vite 配置

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.glb') || assetInfo.name?.endsWith('.gltf')) {
            return 'models/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["vite/client"],
    "lib": ["DOM", "ES2020"]
  }
}

// 添加类型声明
// src/types/three.d.ts
declare module '*.glb' {
  const content: string;
  export default content;
}

declare module '*.hdr' {
  const content: string;
  export default content;
}
```

### 性能监控

```tsx
// 添加性能统计
import { Stats } from '@react-three/drei';

<Canvas>
  <Stats />
  {/* 场景内容 */}
</Canvas>
```

### 环境变量

```env
# .env
VITE_APP_TITLE=Three.js 3D App
VITE_USE_DRACO=true
```

```ts
// 使用 Draco 压缩
import { DracoDecoder } from '@react-three/drei';

<Compressed>
  <Model path="/compressed-model.glb" />
</Compressed>
```
