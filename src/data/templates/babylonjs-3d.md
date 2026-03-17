# Babylon.js 3D 开发模板

## 项目概述

Babylon.js 是一个强大的、开源的 3D 游戏引擎和渲染框架，使用 JavaScript/TypeScript 构建。它提供了完整的 3D 渲染能力、物理引擎、音频系统、碰撞检测和 VR/AR 支持。Babylon.js 适用于开发 3D 游戏、产品展示、数据可视化、虚拟展厅等应用。

## 技术栈

- **引擎**: Babylon.js 6.x / 7.x
- **语言**: TypeScript 5.x
- **构建工具**: Vite / Webpack
- **物理引擎**: Cannon.js / Ammo.js / Havok
- **GUI**: Babylon GUI
- **音频**: Babylon Sound
- **动画**: Babylon Animations
- **测试**: Vitest / Playwright
- **包管理**: npm / pnpm

## 项目结构

```
babylonjs-project/
├── src/
│   ├── scenes/
│   │   ├── main/
│   │   │   ├── MainScene.ts
│   │   │   ├── Environment.ts
│   │   │   └── Lighting.ts
│   │   ├── game/
│   │   │   ├── GameScene.ts
│   │   │   ├── Player.ts
│   │   │   └── Enemy.ts
│   │   └── product-showcase/
│   │       ├── ProductScene.ts
│   │       └── CameraController.ts
│   ├── components/
│   │   ├── objects/
│   │   │   ├── MeshFactory.ts
│   │   │   ├── MaterialFactory.ts
│   │   │   └── AnimationFactory.ts
│   │   ├── physics/
│   │   │   └── PhysicsManager.ts
│   │   ├── audio/
│   │   │   └── AudioManager.ts
│   │   └── gui/
│   │       ├── HUD.ts
│   │       └── Menu.ts
│   ├── utils/
│   │   ├── AssetLoader.ts
│   │   ├── InputManager.ts
│   │   ├── DebugTools.ts
│   │   └── MathHelpers.ts
│   ├── core/
│   │   ├── Engine.ts
│   │   ├── SceneManager.ts
│   │   └── EventEmitter.ts
│   ├── types/
│   │   └── index.ts
│   ├── main.ts
│   └── style.css
├── public/
│   ├── assets/
│   │   ├── models/
│   │   ├── textures/
│   │   ├── sounds/
│   │   └── environments/
│   └── index.html
├── tests/
│   ├── scenes/
│   │   └── MainScene.test.ts
│   └── utils/
│       └── AssetLoader.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 核心代码模式

### 1. 引擎初始化与场景管理

```typescript
// src/core/Engine.ts
import { Engine as BabylonEngine, Scene } from '@babylonjs/core';
import { Inspector } from '@babylonjs/inspector';

export class GameEngine {
  private engine: BabylonEngine;
  private canvas: HTMLCanvasElement;
  private currentScene: Scene | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new BabylonEngine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    this.setupResizeHandler();
  }

  private setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  async loadScene(scene: Scene) {
    if (this.currentScene) {
      this.currentScene.dispose();
    }

    this.currentScene = scene;
    await this.currentScene.whenReadyAsync();

    this.engine.runRenderLoop(() => {
      this.currentScene?.render();
    });
  }

  enableDebugMode() {
    if (this.currentScene) {
      Inspector.Show(this.currentScene, {
        embedMode: true,
      });
    }
  }

  dispose() {
    this.engine.dispose();
  }

  getEngine() {
    return this.engine;
  }
}

// src/core/SceneManager.ts
import { Scene } from '@babylonjs/core';
import { GameEngine } from './Engine';

export interface IScene {
  create(): Promise<Scene>;
  dispose(): void;
}

export class SceneManager {
  private engine: GameEngine;
  private scenes: Map<string, IScene> = new Map();
  private activeScene: string | null = null;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  registerScene(name: string, scene: IScene) {
    this.scenes.set(name, scene);
  }

  async switchToScene(name: string) {
    const scene = this.scenes.get(name);
    if (!scene) {
      throw new Error(`Scene ${name} not found`);
    }

    if (this.activeScene) {
      const oldScene = this.scenes.get(this.activeScene);
      oldScene?.dispose();
    }

    const babylonScene = await scene.create();
    await this.engine.loadScene(babylonScene);
    this.activeScene = name;
  }
}
```

### 2. 场景创建与环境

```typescript
// src/scenes/main/MainScene.ts
import {
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Texture,
  CubeTexture,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { GameEngine } from '@/core/Engine';
import { IScene } from '@/core/SceneManager';
import { Environment } from './Environment';
import { Lighting } from './Lighting';

export class MainScene implements IScene {
  private engine: GameEngine;
  private scene!: Scene;
  private camera!: ArcRotateCamera;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  async create(): Promise<Scene> {
    this.scene = new Scene(this.engine.getEngine());
    this.scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);

    // 创建相机
    this.createCamera();

    // 创建灯光
    this.createLights();

    // 创建环境
    await this.createEnvironment();

    // 创建地面
    this.createGround();

    // 创建一些示例物体
    this.createObjects();

    // 启用物理
    // await this.enablePhysics();

    return this.scene;
  }

  private createCamera() {
    this.camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      10,
      Vector3.Zero(),
      this.scene
    );

    this.camera.attachControl(this.engine.getEngine().getRenderingCanvas(), true);
    this.camera.lowerRadiusLimit = 3;
    this.camera.upperRadiusLimit = 20;
    this.camera.wheelPrecision = 50;
  }

  private createLights() {
    // 环境光
    const hemisphericLight = new HemisphericLight(
      'hemisphericLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    hemisphericLight.intensity = 0.6;
    hemisphericLight.groundColor = new Color3(0.2, 0.2, 0.3);

    // 方向光（太阳光）
    const directionalLight = new DirectionalLight(
      'directionalLight',
      new Vector3(-1, -2, -1),
      this.scene
    );
    directionalLight.position = new Vector3(20, 40, 20);
    directionalLight.intensity = 0.8;

    // 启用阴影
    const shadowGenerator = new ShadowGenerator(1024, directionalLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
  }

  private async createEnvironment() {
    // 天空盒
    const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000 }, this.scene);
    const skyboxMaterial = new StandardMaterial('skyBoxMaterial', this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new CubeTexture(
      '/assets/textures/skybox',
      this.scene
    );
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // 雾效
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.01;
    this.scene.fogColor = new Color3(0.1, 0.1, 0.15);
  }

  private createGround() {
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 20, height: 20, subdivisions: 32 },
      this.scene
    );

    const groundMaterial = new StandardMaterial('groundMaterial', this.scene);
    groundMaterial.diffuseTexture = new Texture('/assets/textures/ground.jpg', this.scene);
    groundMaterial.diffuseTexture.uScale = 5;
    groundMaterial.diffuseTexture.vScale = 5;
    groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    ground.material = groundMaterial;

    ground.receiveShadows = true;
  }

  private createObjects() {
    // 创建一个立方体
    const box = MeshBuilder.CreateBox('box', { size: 2 }, this.scene);
    box.position.y = 1;

    const boxMaterial = new StandardMaterial('boxMaterial', this.scene);
    boxMaterial.diffuseColor = new Color3(0.4, 0.5, 0.8);
    boxMaterial.specularColor = new Color3(0.8, 0.8, 0.8);
    box.material = boxMaterial;

    // 旋转动画
    this.scene.registerBeforeRender(() => {
      box.rotation.y += 0.01;
    });

    // 创建一个球体
    const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 2 }, this.scene);
    sphere.position = new Vector3(3, 1, 0);

    const sphereMaterial = new StandardMaterial('sphereMaterial', this.scene);
    sphereMaterial.diffuseColor = new Color3(0.8, 0.4, 0.5);
    sphereMaterial.specularColor = new Color3(1, 1, 1);
    sphere.material = sphereMaterial;

    // 创建一个圆柱体
    const cylinder = MeshBuilder.CreateCylinder(
      'cylinder',
      { height: 3, diameter: 1 },
      this.scene
    );
    cylinder.position = new Vector3(-3, 1.5, 0);

    const cylinderMaterial = new StandardMaterial('cylinderMaterial', this.scene);
    cylinderMaterial.diffuseColor = new Color3(0.5, 0.8, 0.4);
    cylinder.material = cylinderMaterial;
  }

  dispose() {
    this.scene.dispose();
  }
}
```

### 3. 物理与碰撞

```typescript
// src/components/physics/PhysicsManager.ts
import { Scene, Mesh, Vector3 } from '@babylonjs/core';
import { PhysicsImpostor } from '@babylonjs/core/Physics/v1/physicsImpostor';

export class PhysicsManager {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async initialize() {
    // 使用 Cannon.js
    await this.scene.enablePhysics(
      new Vector3(0, -9.81, 0),
      new CannonJSPlugin(undefined, undefined, await import('cannon'))
    );
  }

  addBoxPhysics(mesh: Mesh, mass: number = 1) {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.BoxImpostor,
      { mass, restitution: 0.5, friction: 0.5 },
      this.scene
    );
  }

  addSpherePhysics(mesh: Mesh, mass: number = 1) {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.SphereImpostor,
      { mass, restitution: 0.7, friction: 0.3 },
      this.scene
    );
  }

  addGroundPhysics(mesh: Mesh) {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.3, friction: 0.8 },
      this.scene
    );
  }

  applyForce(mesh: Mesh, force: Vector3, point?: Vector3) {
    mesh.physicsImpostor?.applyForce(force, point || mesh.getAbsolutePosition());
  }

  applyImpulse(mesh: Mesh, impulse: Vector3, point?: Vector3) {
    mesh.physicsImpostor?.applyImpulse(impulse, point || mesh.getAbsolutePosition());
  }

  setLinearVelocity(mesh: Mesh, velocity: Vector3) {
    mesh.physicsImpostor?.setLinearVelocity(velocity);
  }

  setAngularVelocity(mesh: Mesh, angularVelocity: Vector3) {
    mesh.physicsImpostor?.setAngularVelocity(angularVelocity);
  }
}

// 使用示例
const physicsManager = new PhysicsManager(scene);
await physicsManager.initialize();

// 添加物理到物体
physicsManager.addBoxPhysics(box, 1); // 质量 1
physicsManager.addSpherePhysics(sphere, 2); // 质量 2
physicsManager.addGroundPhysics(ground); // 静态地面

// 施加力
physicsManager.applyForce(box, new Vector3(10, 0, 0));
```

### 4. 动画系统

```typescript
// src/components/objects/AnimationFactory.ts
import {
  Scene,
  Mesh,
  Animation,
  Vector3,
  Color3,
  EasingFunction,
  CircleEase,
} from '@babylonjs/core';

export class AnimationFactory {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  // 位置动画
  createPositionAnimation(
    mesh: Mesh,
    targetPosition: Vector3,
    duration: number = 1000,
    loop: boolean = false
  ) {
    const animation = new Animation(
      'positionAnimation',
      'position',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      loop ? Animation.ANIMATIONLOOPMODE_CYCLE : Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: mesh.position.clone() },
      { frame: duration / 16.67, value: targetPosition },
    ];

    animation.setKeys(keys);

    // 添加缓动函数
    const easingFunction = new CircleEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    animation.setEasingFunction(easingFunction);

    mesh.animations = [animation];
    this.scene.beginAnimation(mesh, 0, duration / 16.67, loop);
  }

  // 旋转动画
  createRotationAnimation(
    mesh: Mesh,
    axis: 'x' | 'y' | 'z',
    speed: number = 1,
    loop: boolean = true
  ) {
    const animation = new Animation(
      'rotationAnimation',
      `rotation.${axis}`,
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      loop ? Animation.ANIMATIONLOOPMODE_CYCLE : Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: 0 },
      { frame: 100, value: 2 * Math.PI * speed },
    ];

    animation.setKeys(keys);
    mesh.animations = [animation];
    this.scene.beginAnimation(mesh, 0, 100, loop);
  }

  // 缩放动画
  createScaleAnimation(
    mesh: Mesh,
    targetScale: Vector3,
    duration: number = 1000,
    loop: boolean = false
  ) {
    const animation = new Animation(
      'scaleAnimation',
      'scaling',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      loop ? Animation.ANIMATIONLOOPMODE_CYCLE : Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: mesh.scaling.clone() },
      { frame: duration / 16.67, value: targetScale },
    ];

    animation.setKeys(keys);
    mesh.animations = [animation];
    this.scene.beginAnimation(mesh, 0, duration / 16.67, loop);
  }

  // 颜色动画
  createColorAnimation(
    material: StandardMaterial,
    targetColor: Color3,
    duration: number = 1000
  ) {
    const animation = new Animation(
      'colorAnimation',
      'diffuseColor',
      60,
      Animation.ANIMATIONTYPE_COLOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: material.diffuseColor.clone() },
      { frame: duration / 16.67, value: targetColor },
    ];

    animation.setKeys(keys);
    material.animations = [animation];
    this.scene.beginAnimation(material, 0, duration / 16.67, false);
  }

  // 组合动画
  createCombinedAnimation(
    mesh: Mesh,
    config: {
      position?: { target: Vector3; duration: number };
      rotation?: { axis: 'x' | 'y' | 'z'; speed: number };
      scaling?: { target: Vector3; duration: number };
    }
  ) {
    const animations: Animation[] = [];

    if (config.position) {
      const anim = new Animation(
        'position',
        'position',
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      anim.setKeys([
        { frame: 0, value: mesh.position.clone() },
        { frame: config.position.duration / 16.67, value: config.position.target },
      ]);
      animations.push(anim);
    }

    if (config.rotation) {
      const anim = new Animation(
        'rotation',
        `rotation.${config.rotation.axis}`,
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
      );
      anim.setKeys([
        { frame: 0, value: 0 },
        { frame: 100, value: 2 * Math.PI * config.rotation.speed },
      ]);
      animations.push(anim);
    }

    if (config.scaling) {
      const anim = new Animation(
        'scaling',
        'scaling',
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      anim.setKeys([
        { frame: 0, value: mesh.scaling.clone() },
        { frame: config.scaling.duration / 16.67, value: config.scaling.target },
      ]);
      animations.push(anim);
    }

    mesh.animations = animations;
    this.scene.beginAnimation(mesh, 0, 100, true);
  }
}

// 使用示例
const animFactory = new AnimationFactory(scene);

// 位置动画
animFactory.createPositionAnimation(box, new Vector3(5, 2, 3), 2000);

// 旋转动画
animFactory.createRotationAnimation(box, 'y', 1, true);

// 缩放动画
animFactory.createScaleAnimation(box, new Vector3(2, 2, 2), 1000);

// 组合动画
animFactory.createCombinedAnimation(box, {
  position: { target: new Vector3(0, 5, 0), duration: 2000 },
  rotation: { axis: 'y', speed: 2 },
  scaling: { target: new Vector3(1.5, 1.5, 1.5), duration: 1000 },
});
```

### 5. 资产加载器

```typescript
// src/utils/AssetLoader.ts
import {
  Scene,
  Mesh,
  AbstractMesh,
  Texture,
  Sound,
  CubeTexture,
  SceneLoader,
} from '@babylonjs/core';
import '@babylonjs/loaders';

export interface LoadedAssets {
  meshes: Map<string, AbstractMesh>;
  textures: Map<string, Texture>;
  sounds: Map<string, Sound>;
  environmentTextures: Map<string, CubeTexture>;
}

export class AssetLoader {
  private scene: Scene;
  private assets: LoadedAssets;

  constructor(scene: Scene) {
    this.scene = scene;
    this.assets = {
      meshes: new Map(),
      textures: new Map(),
      sounds: new Map(),
      environmentTextures: new Map(),
    };
  }

  // 加载单个模型
  async loadMesh(name: string, path: string): Promise<AbstractMesh> {
    const result = await SceneLoader.ImportMeshAsync(null, path, '', this.scene);
    const mesh = result.meshes[0];
    mesh.name = name;
    this.assets.meshes.set(name, mesh);
    return mesh;
  }

  // 批量加载模型
  async loadMeshes(models: Array<{ name: string; path: string }>): Promise<void> {
    const promises = models.map(({ name, path }) => this.loadMesh(name, path));
    await Promise.all(promises);
  }

  // 加载纹理
  async loadTexture(name: string, path: string): Promise<Texture> {
    const texture = new Texture(path, this.scene);
    this.assets.textures.set(name, texture);
    return texture;
  }

  // 加载环境纹理（天空盒）
  async loadEnvironmentTexture(name: string, path: string): Promise<CubeTexture> {
    const texture = new CubeTexture(path, this.scene);
    this.assets.environmentTextures.set(name, texture);
    return texture;
  }

  // 加载音频
  async loadSound(
    name: string,
    path: string,
    options?: { loop?: boolean; volume?: number; autoplay?: boolean }
  ): Promise<Sound> {
    const sound = new Sound(
      name,
      path,
      this.scene,
      () => {
        console.log(`Sound ${name} loaded`);
      },
      {
        loop: options?.loop ?? false,
        volume: options?.volume ?? 1,
        autoplay: options?.autoplay ?? false,
      }
    );

    this.assets.sounds.set(name, sound);
    return sound;
  }

  // 获取已加载的资产
  getMesh(name: string): AbstractMesh | undefined {
    return this.assets.meshes.get(name);
  }

  getTexture(name: string): Texture | undefined {
    return this.assets.textures.get(name);
  }

  getSound(name: string): Sound | undefined {
    return this.assets.sounds.get(name);
  }

  // 显示加载进度
  async loadWithProgress(
    assets: Array<{ type: 'mesh' | 'texture' | 'sound'; name: string; path: string }>,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    let loaded = 0;
    const total = assets.length;

    for (const asset of assets) {
      switch (asset.type) {
        case 'mesh':
          await this.loadMesh(asset.name, asset.path);
          break;
        case 'texture':
          await this.loadTexture(asset.name, asset.path);
          break;
        case 'sound':
          await this.loadSound(asset.name, asset.path);
          break;
      }

      loaded++;
      onProgress?.(loaded / total);
    }
  }

  // 释放资产
  dispose() {
    this.assets.meshes.forEach((mesh) => mesh.dispose());
    this.assets.textures.forEach((texture) => texture.dispose());
    this.assets.sounds.forEach((sound) => sound.dispose());
    this.assets.environmentTextures.forEach((texture) => texture.dispose());

    this.assets.meshes.clear();
    this.assets.textures.clear();
    this.assets.sounds.clear();
    this.assets.environmentTextures.clear();
  }
}

// 使用示例
const assetLoader = new AssetLoader(scene);

// 加载单个模型
const car = await assetLoader.loadMesh('car', '/assets/models/car.glb');

// 批量加载
await assetLoader.loadMeshes([
  { name: 'player', path: '/assets/models/player.glb' },
  { name: 'enemy', path: '/assets/models/enemy.glb' },
]);

// 带进度加载
await assetLoader.loadWithProgress(
  [
    { type: 'mesh', name: 'tree', path: '/assets/models/tree.glb' },
    { type: 'texture', name: 'grass', path: '/assets/textures/grass.jpg' },
    { type: 'sound', name: 'bgm', path: '/assets/sounds/bgm.mp3' },
  ],
  (progress) => {
    console.log(`Loading: ${(progress * 100).toFixed(0)}%`);
  }
);
```

### 6. GUI 系统

```typescript
// src/components/gui/HUD.ts
import {
  AdvancedDynamicTexture,
  Button,
  Control,
  TextBlock,
  StackPanel,
  Rectangle,
} from '@babylonjs/gui';
import { Scene } from '@babylonjs/core';

export class HUD {
  private scene: Scene;
  private guiTexture: AdvancedDynamicTexture;
  private healthBar!: Rectangle;
  private scoreText!: TextBlock;

  constructor(scene: Scene) {
    this.scene = scene;
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('HUD', true, scene);
    this.createHUD();
  }

  private createHUD() {
    // 创建顶部栏
    const topBar = new StackPanel('topBar');
    topBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    topBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    topBar.left = '20px';
    topBar.top = '20px';
    topBar.width = '300px';
    this.guiTexture.addControl(topBar);

    // 生命值条
    const healthContainer = new Rectangle('healthContainer');
    healthContainer.width = '200px';
    healthContainer.height = '30px';
    healthContainer.background = '#333';
    healthContainer.thickness = 2;
    healthContainer.cornerRadius = 5;
    topBar.addControl(healthContainer);

    this.healthBar = new Rectangle('healthBar');
    this.healthBar.width = '100%';
    this.healthBar.height = '100%';
    this.healthBar.background = '#ff4444';
    this.healthBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    healthContainer.addControl(this.healthBar);

    // 生命值文本
    const healthText = new TextBlock('healthText', '100 / 100');
    healthText.color = 'white';
    healthText.fontSize = 16;
    healthText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    healthContainer.addControl(healthText);

    // 分数
    this.scoreText = new TextBlock('scoreText', 'Score: 0');
    this.scoreText.color = 'white';
    this.scoreText.fontSize = 20;
    this.scoreText.top = '10px';
    topBar.addControl(this.scoreText);

    // 创建按钮
    const button = Button.CreateSimpleButton('pause', 'Pause');
    button.width = '100px';
    button.height = '40px';
    button.color = 'white';
    button.background = '#4444ff';
    button.cornerRadius = 5;
    button.top = '10px';
    button.onPointerClickObservable.add(() => {
      console.log('Pause clicked');
    });
    topBar.addControl(button);
  }

  updateHealth(current: number, max: number) {
    const percentage = (current / max) * 100;
    this.healthBar.width = `${percentage}%`;
  }

  updateScore(score: number) {
    this.scoreText.text = `Score: ${score}`;
  }

  dispose() {
    this.guiTexture.dispose();
  }
}

// 使用示例
const hud = new HUD(scene);

// 更新生命值
hud.updateHealth(75, 100);

// 更新分数
hud.updateScore(1500);
```

## 最佳实践

### 1. 性能优化

```typescript
// 使用 LOD (Level of Detail)
const meshLOD = mesh.clone('meshLOD');
meshLOD.simplify(
  [
    { quality: 0.5, distance: 50 },
    { quality: 0.25, distance: 100 },
  ],
  false,
  SimplificationType.QUADRATIC
);

// 使用实例化代替克隆
for (let i = 0; i < 100; i++) {
  const instance = mesh.createInstance(`instance_${i}`);
  instance.position = new Vector3(
    Math.random() * 20 - 10,
    0,
    Math.random() * 20 - 10
  );
}

// 使用八叉树优化场景
scene.createOrUpdateSelectionOctree();

// 禁用不可见物体的渲染
mesh.isVisible = false;
mesh.setEnabled(false);

// 使用硬件实例化
mesh.enableHardwareInstancing();

// 优化阴影
shadowGenerator.useBlurExponentialShadowMap = true;
shadowGenerator.blurKernel = 32;

// 使用延迟渲染（适用于复杂场景）
const pipeline = new DefaultRenderingPipeline(
  'default',
  true,
  scene,
  [camera]
);
pipeline.samples = 4;
pipeline.fxaaEnabled = true;
```

### 2. 内存管理

```typescript
// 正确释放资源
class GameManager {
  private meshes: Mesh[] = [];
  private textures: Texture[] = [];
  private sounds: Sound[] = [];

  cleanup() {
    this.meshes.forEach((mesh) => {
      mesh.dispose();
    });

    this.textures.forEach((texture) => {
      texture.dispose();
    });

    this.sounds.forEach((sound) => {
      sound.dispose();
    });

    this.meshes = [];
    this.textures = [];
    this.sounds = [];
  }
}

// 使用对象池
class MeshPool {
  private pool: Mesh[] = [];
  private active: Mesh[] = [];

  get(): Mesh {
    if (this.pool.length > 0) {
      const mesh = this.pool.pop()!;
      mesh.isVisible = true;
      mesh.setEnabled(true);
      this.active.push(mesh);
      return mesh;
    }

    throw new Error('Pool exhausted');
  }

  release(mesh: Mesh) {
    mesh.isVisible = false;
    mesh.setEnabled(false);
    const index = this.active.indexOf(mesh);
    if (index > -1) {
      this.active.splice(index, 1);
      this.pool.push(mesh);
    }
  }
}
```

### 3. 测试

```typescript
// tests/scenes/MainScene.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Engine, Scene } from '@babylonjs/core';
import { MainScene } from '@/scenes/main/MainScene';

describe('MainScene', () => {
  let canvas: HTMLCanvasElement;
  let engine: Engine;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    engine = new Engine(canvas, true);
  });

  it('should create scene successfully', async () => {
    const mainScene = new MainScene(engine);
    const scene = await mainScene.create();

    expect(scene).toBeInstanceOf(Scene);
    expect(scene.meshes.length).toBeGreaterThan(0);
  });

  it('should have camera attached', async () => {
    const mainScene = new MainScene(engine);
    const scene = await mainScene.create();

    expect(scene.activeCamera).toBeDefined();
  });

  it('should have lights in the scene', async () => {
    const mainScene = new MainScene(engine);
    const scene = await mainScene.create();

    expect(scene.lights.length).toBeGreaterThan(0);
  });

  afterEach(() => {
    engine.dispose();
  });
});
```

## 常用命令

```bash
# 安装依赖
npm install @babylonjs/core @babylonjs/gui @babylonjs/loaders
npm install cannon  # 物理引擎

# 开发
npm run dev

# 构建
npm run build
npm run build:prod

# 测试
npm run test
npm run test:watch

# 类型检查
npm run type-check

# 代码格式化
npm run lint
npm run format
```

## 部署配置

### package.json

```json
{
  "name": "babylonjs-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@babylonjs/core": "^7.0.0",
    "@babylonjs/gui": "^7.0.0",
    "@babylonjs/loaders": "^7.0.0",
    "cannon": "^0.6.2"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core', '@babylonjs/gui', '@babylonjs/loaders'],
        },
      },
    },
  },
});
```

### Docker

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## 扩展资源

- [Babylon.js 官方文档](https://doc.babylonjs.com/)
- [Babylon.js Playground](https://playground.babylonjs.com/)
- [Babylon.js GitHub](https://github.com/BabylonJS/Babylon.js)
- [Babylon.js 示例](https://www.babylonjs.com/community/)
- [Babylon.js 教程](https://doc.babylonjs.com/guidedLearning/)
- [Awesome Babylon.js](https://github.com/Symbitic/awesome-babylonjs)
