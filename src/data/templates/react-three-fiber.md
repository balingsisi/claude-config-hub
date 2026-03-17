# React Three Fiber 3D 渲染模板

## 技术栈

- **React Three Fiber**: React Three.js 渲染器
- **Three.js**: 3D 图形库
- **Drei**: React Three Fiber 辅助库
- **TypeScript**: 类型支持
- **Vite**: 构建工具
- **Zustand**: 状态管理
- **React Spring**: 动画库（可选）
- **Framer Motion 3D**: 动画库（可选）

## 项目结构

```
react-three-fiber/
├── src/
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── Box.tsx
│   │   │   ├── Sphere.tsx
│   │   │   ├── Plane.tsx
│   │   │   ├── Model.tsx
│   │   │   ├── Text3D.tsx
│   │   │   ├── Skybox.tsx
│   │   │   └── Particles.tsx
│   │   ├── scene/
│   │   │   ├── Scene.tsx
│   │   │   ├── Camera.tsx
│   │   │   ├── Lights.tsx
│   │   │   ├── Controls.tsx
│   │   │   └── Environment.tsx
│   │   ├── materials/
│   │   │   ├── CustomMaterial.tsx
│   │   │   ├── ShaderMaterial.tsx
│   │   │   └── PBRMaterial.tsx
│   │   ├── effects/
│   │   │   ├── PostProcessing.tsx
│   │   │   ├── Bloom.tsx
│   │   │   └── DepthOfField.tsx
│   │   └── ui/
│   │       ├── Canvas.tsx
│   │       ├── Loading.tsx
│   │       └── Controls.tsx
│   ├── hooks/
│   │   ├── useThree.ts
│   │   ├── useAnimation.ts
│   │   ├── useModel.ts
│   │   ├── useTexture.ts
│   │   └── usePhysics.ts
│   ├── store/
│   │   └── sceneStore.ts
│   ├── utils/
│   │   ├── loaders.ts
│   │   ├── math.ts
│   │   └── shaders.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── models/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 代码模式

### 基础场景

```typescript
// src/components/scene/Scene.tsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Box } from '../3d/Box';
import { Sphere } from '../3d/Sphere';
import { Lights } from './Lights';

export const Scene: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      {/* 环境和背景 */}
      <color attach="background" args={['#1a1a1a']} />
      <fog attach="fog" args={['#1a1a1a', 10, 50]} />
      
      {/* 摄像机 */}
      <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
      
      {/* 控制器 */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={20}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />
      
      {/* 光照 */}
      <Lights />
      
      {/* 环境 */}
      <Environment preset="sunset" />
      
      {/* 3D 对象 */}
      <Suspense fallback={null}>
        <Box position={[-2, 1, 0]} />
        <Sphere position={[2, 1, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.2} />
        </mesh>
      </Suspense>
    </Canvas>
  );
};
```

```typescript
// src/components/scene/Lights.tsx
import React from 'react';

export const Lights: React.FC = () => {
  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.4} />
      
      {/* 主方向光 */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* 补光 */}
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ff7e5f" />
      <pointLight position={[10, 5, 10]} intensity={0.5} color="#feb47b" />
      
      {/* 半球光 */}
      <hemisphereLight
        skyColor="#87ceeb"
        groundColor="#f4a460"
        intensity={0.3}
        position={[0, 10, 0]}
      />
    </>
  );
};
```

```typescript
// src/components/scene/Camera.tsx
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraProps {
  target?: THREE.Vector3;
  position?: [number, number, number];
}

export const Camera: React.FC<CameraProps> = ({ 
  target = new THREE.Vector3(0, 0, 0),
  position = [5, 5, 5]
}) => {
  const { camera } = useThree();
  const targetRef = useRef(target);

  useFrame(() => {
    // 平滑跟随目标
    camera.lookAt(targetRef.current);
  });

  return null;
};
```

```typescript
// src/components/scene/Controls.tsx
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export const Controls: React.FC = () => {
  const controlsRef = useRef<any>();
  const { camera, gl } = useThree();

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      minDistance={2}
      maxDistance={20}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
    />
  );
};
```

### 3D 对象

```typescript
// src/components/3d/Box.tsx
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BoxProps {
  position?: [number, number, number];
  size?: [number, number, number];
  color?: string;
}

export const Box: React.FC<BoxProps> = ({
  position = [0, 0, 0],
  size = [1, 1, 1],
  color = '#4a90e2',
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
      scale={active ? 1.5 : 1}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={hovered ? '#ff6b6b' : color}
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  );
};
```

```typescript
// src/components/3d/Sphere.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SphereProps {
  position?: [number, number, number];
  radius?: number;
  color?: string;
}

export const Sphere: React.FC<SphereProps> = ({
  position = [0, 0, 0],
  radius = 1,
  color = '#e74c3c',
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.3;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
};
```

```typescript
// src/components/3d/Plane.tsx
import React from 'react';

interface PlaneProps {
  size?: [number, number];
  color?: string;
  receiveShadow?: boolean;
}

export const Plane: React.FC<PlaneProps> = ({
  size = [20, 20],
  color = '#2c3e50',
  receiveShadow = true,
}) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow={receiveShadow}
    >
      <planeGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={0.1}
        roughness={0.8}
      />
    </mesh>
  );
};
```

```typescript
// src/components/3d/Model.tsx
import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  path: string;
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
}

export const Model: React.FC<ModelProps> = ({
  path,
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
}) => {
  const { scene } = useGLTF(path);
  
  // 克隆场景以避免修改原始资源
  const clonedScene = scene.clone();
  
  // 启用阴影
  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
};

// 预加载模型
useGLTF.preload('/models/example.glb');
```

```typescript
// src/components/3d/Text3D.tsx
import React, { useMemo } from 'react';
import { Text, Center } from '@react-three/drei';
import * as THREE from 'three';

interface Text3DProps {
  text: string;
  position?: [number, number, number];
  size?: number;
  color?: string;
}

export const Text3D: React.FC<Text3DProps> = ({
  text,
  position = [0, 0, 0],
  size = 1,
  color = '#ffffff',
}) => {
  const fontProps = useMemo(() => ({
    fontSize: size,
    letterSpacing: -0.05,
    lineHeight: 1,
    'material-toneMapped': false,
  }), [size]);

  return (
    <Center position={position}>
      <Text
        {...fontProps}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {text}
        <meshStandardMaterial color={color} />
      </Text>
    </Center>
  );
};
```

```typescript
// src/components/3d/Particles.tsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticlesProps {
  count?: number;
  size?: number;
  color?: string;
}

export const Particles: React.FC<ParticlesProps> = ({
  count = 5000,
  size = 0.01,
  color = '#ffffff',
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
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
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};
```

### 材质

```typescript
// src/components/materials/CustomMaterial.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CustomMaterialProps {
  color?: string;
  speed?: number;
}

export const CustomMaterial: React.FC<CustomMaterialProps> = ({
  color = '#4a90e2',
  speed = 1.0,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const shader = {
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uTime;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(pos.x * 5.0 + uTime) * 0.1;
        pos.z += sin(pos.y * 5.0 + uTime) * 0.1;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec2 vUv;
      
      void main() {
        float strength = 1.0 - distance(vUv, vec2(0.5));
        vec3 finalColor = uColor * strength;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  };

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * speed;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        args={[shader]}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
```

```typescript
// src/components/materials/ShaderMaterial.tsx
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ShaderMaterialProps {
  vertexShader?: string;
  fragmentShader?: string;
  uniforms?: { [key: string]: THREE.IUniform };
}

export const ShaderMaterial: React.FC<ShaderMaterialProps> = ({
  vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    
    void main() {
      vec3 color = uColor;
      float alpha = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
      gl_FragColor = vec4(color, alpha);
    }
  `,
  uniforms = {},
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const defaultUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#4a90e2') },
    ...uniforms,
  }), [uniforms]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={defaultUniforms}
      transparent
    />
  );
};
```

### 后期处理

```typescript
// src/components/effects/PostProcessing.tsx
import React from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export const PostProcessing: React.FC = () => {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.9}
        height={300}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.001, 0.001]}
      />
      <Vignette
        offset={0.3}
        darkness={0.9}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};
```

```typescript
// src/components/effects/Bloom.tsx
import React from 'react';
import { Bloom as BloomEffect } from '@react-three/postprocessing';

interface BloomProps {
  intensity?: number;
  luminanceThreshold?: number;
  luminanceSmoothing?: number;
  height?: number;
}

export const Bloom: React.FC<BloomProps> = ({
  intensity = 1.5,
  luminanceThreshold = 0.9,
  luminanceSmoothing = 0.9,
  height = 300,
}) => {
  return (
    <BloomEffect
      intensity={intensity}
      luminanceThreshold={luminanceThreshold}
      luminanceSmoothing={luminanceSmoothing}
      height={height}
    />
  );
};
```

### 自定义 Hooks

```typescript
// src/hooks/useThree.ts
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function useThreeHelpers() {
  const { camera, scene, gl, size } = useThree();

  const getWorldPosition = (object: THREE.Object3D) => {
    const position = new THREE.Vector3();
    object.getWorldPosition(position);
    return position;
  };

  const lookAt = (target: THREE.Vector3) => {
    camera.lookAt(target);
  };

  const setCameraPosition = (x: number, y: number, z: number) => {
    camera.position.set(x, y, z);
  };

  const getSceneSize = () => size;

  return {
    camera,
    scene,
    gl,
    getWorldPosition,
    lookAt,
    setCameraPosition,
    getSceneSize,
  };
}
```

```typescript
// src/hooks/useAnimation.ts
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function useAnimation(
  callback: (elapsedTime: number, delta: number) => void,
  deps: any[] = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useFrame((state) => {
    callbackRef.current(state.clock.elapsedTime, state.clock.getDelta());
  }, deps);
}

export function useRotation(
  speed: { x?: number; y?: number; z?: number } = { y: 1 }
) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (speed.x) meshRef.current.rotation.x += delta * speed.x;
      if (speed.y) meshRef.current.rotation.y += delta * speed.y;
      if (speed.z) meshRef.current.rotation.z += delta * speed.z;
    }
  });

  return meshRef;
}

export function useFloat(intensity: number = 0.5, speed: number = 1) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = useRef(0);

  useFrame((state) => {
    if (meshRef.current) {
      if (initialY.current === 0) {
        initialY.current = meshRef.current.position.y;
      }
      meshRef.current.position.y =
        initialY.current + Math.sin(state.clock.elapsedTime * speed) * intensity;
    }
  });

  return meshRef;
}
```

```typescript
// src/hooks/useModel.ts
import { useGLTF } from '@react-three/drei';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

export function useModel(path: string) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const { scene } = useGLTF(path);
      const clonedScene = scene.clone();
      
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      setModel(clonedScene);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load model'));
    } finally {
      setLoading(false);
    }
  }, [path]);

  return { model, error, loading };
}

export function usePreloadModels(paths: string[]) {
  paths.forEach((path) => {
    useGLTF.preload(path);
  });
}
```

```typescript
// src/hooks/useTexture.ts
import { useTexture as useDreiTexture } from '@react-three/drei';
import * as THREE from 'three';

export function useTextures(paths: string[]) {
  const textures = useDreiTexture(paths) as THREE.Texture[];
  
  textures.forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });

  return textures;
}

export function useCubeTexture(paths: string[]) {
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load(paths);
  return texture;
}
```

### 状态管理

```typescript
// src/store/sceneStore.ts
import { create } from 'zustand';
import * as THREE from 'three';

interface SceneState {
  objects: THREE.Object3D[];
  selectedObject: THREE.Object3D | null;
  cameraPosition: [number, number, number];
  
  // Actions
  addObject: (object: THREE.Object3D) => void;
  removeObject: (id: string) => void;
  selectObject: (object: THREE.Object3D | null) => void;
  setCameraPosition: (position: [number, number, number]) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  objects: [],
  selectedObject: null,
  cameraPosition: [5, 5, 5],

  addObject: (object) =>
    set((state) => ({
      objects: [...state.objects, object],
    })),

  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.uuid !== id),
      selectedObject: state.selectedObject?.uuid === id ? null : state.selectedObject,
    })),

  selectObject: (object) => set({ selectedObject: object }),

  setCameraPosition: (position) => set({ cameraPosition: position }),
}));
```

### UI 组件

```typescript
// src/components/ui/Canvas.tsx
import React from 'react';
import { Canvas as R3Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';

interface CanvasProps {
  children: React.ReactNode;
}

export const Canvas: React.FC<CanvasProps> = ({ children }) => {
  return (
    <R3Canvas
      shadows
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
    >
      {children}
      <Preload all />
    </R3Canvas>
  );
};
```

```typescript
// src/components/ui/Loading.tsx
import React from 'react';
import { useProgress, Html } from '@react-three/drei';

export const Loading: React.FC = () => {
  const { progress } = useProgress();
  
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center">
        <div className="text-white text-xl mb-2">
          {progress.toFixed(0)}%
        </div>
        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  );
};
```

### 工具函数

```typescript
// src/utils/math.ts
import * as THREE from 'three';

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInSphere(radius: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}
```

```typescript
// src/utils/loaders.ts
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';

export async function loadGLTF(path: string): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(path);
  return gltf.scene;
}

export async function loadOBJ(path: string): Promise<THREE.Group> {
  const loader = new OBJLoader();
  return await loader.loadAsync(path);
}

export async function loadFBX(path: string): Promise<THREE.Group> {
  const loader = new FBXLoader();
  return await loader.loadAsync(path);
}

export async function loadTexture(path: string): Promise<THREE.Texture> {
  const loader = new THREE.TextureLoader();
  return await loader.loadAsync(path);
}
```

### 主应用

```typescript
// src/App.tsx
import React, { Suspense } from 'react';
import { Canvas } from './components/ui/Canvas';
import { Scene } from './components/scene/Scene';
import { Loading } from './components/ui/Loading';

function App() {
  return (
    <div className="w-full h-screen">
      <Canvas>
        <Suspense fallback={<Loading />}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
```

## 最佳实践

### 1. 性能优化

```typescript
// 使用 useMemo 和 useCallback
const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
const material = useMemo(() => new THREE.MeshStandardMaterial({ color: 'red' }), []);

// 使用 instancedMesh 渲染大量相同物体
<instancedMesh args={[geometry, material, 1000]} />

// 使用 LOD (Level of Detail)
<LOD>
  <mesh detail={0} />
  <mesh detail={1} />
  <mesh detail={2} />
</LOD>

// 禁用 frustumCulling
<mesh frustumCulled={false} />
```

### 2. 内存管理

```typescript
// 清理资源
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };
}, []);

// 使用 dispose 模式
<mesh dispose={null}>
  <boxGeometry />
  <meshStandardMaterial />
</mesh>
```

### 3. 类型安全

```typescript
// 使用 TypeScript 类型
import { ThreeEvent } from '@react-three/fiber';

const handleClick = (event: ThreeEvent<MouseEvent>) => {
  console.log(event.point);
  console.log(event.distance);
};

// 使用扩展类型
import { MeshProps } from '@react-three/fiber';

interface CustomMeshProps extends MeshProps {
  customProp: string;
}
```

## 常用命令

```bash
# 安装依赖
npm install three @react-three/fiber @react-three/drei zustand

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check
```

## 部署配置

### package.json

```json
{
  "dependencies": {
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "@react-three/postprocessing": "^2.15.0",
    "zustand": "^4.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/three": "^0.160.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.fbx', '**/*.obj'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
```

## 参考资源

- [React Three Fiber 官方文档](https://docs.pmnd.rs/react-three-fiber)
- [Three.js 官方文档](https://threejs.org/)
- [Drei 辅助库](https://github.com/pmndrs/drei)
- [React Three Postprocessing](https://github.com/pmndrs/react-postprocessing)
- [Three.js 示例](https://threejs.org/examples/)
