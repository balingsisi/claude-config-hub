# Three.js Template

## Tech Stack
- three v0.160+
- @react-three/fiber v8.x
- @react-three/drei v9.x
- React 18+
- TypeScript 5+

## Core Patterns

### Basic Scene
```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';

export const Scene3D = () => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Box args={[1, 1, 1]} rotation={[0.5, 0.5, 0]}>
        <meshStandardMaterial color="orange" />
      </Box>
      <OrbitControls />
    </Canvas>
  );
};
```

### Custom Geometry
```typescript
import { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';

export const CustomMesh = () => {
  const geometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(1, 1);
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#6f42c1" wireframe />
    </mesh>
  );
};
```

### Animation Loop
```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export const RotatingBox = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
};
```

### Load 3D Model
```typescript
import { useGLTF } from '@react-three/drei';

export const Model = () => {
  const { scene } = useGLTF('/models/robot.gltf');
  return <primitive object={scene} scale={0.5} />;
};

useGLTF.preload('/models/robot.gltf');
```

## Common Commands

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
npm run dev
```

## Related Resources
- [Three.js Documentation](https://threejs.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
