# Cesium Template

## Project Overview

CesiumJS - An open-source JavaScript library for creating world-class 3D globes and maps with the best possible performance, precision, visual quality, and ease of use.

## Tech Stack

- **Library**: CesiumJS 1.110+
- **Language**: TypeScript
- **Build**: Vite / Webpack
- **Integration**: React / Vue
- **Data Formats**: GeoJSON, KML, CZML, 3D Tiles, Terrain
- **Services**: Cesium Ion (optional)

## Project Structure

```
cesium-project/
├── src/
│   ├── components/
│   │   ├── CesiumViewer.tsx     # Main viewer component
│   │   ├── EntityEditor.tsx     # Entity editing
│   │   ├── LayerControl.tsx     # Layer management
│   │   └── MeasureTools.tsx     # Measurement tools
│   ├── layers/
│   │   ├── terrain.ts           # Terrain providers
│   │   ├── imagery.ts           # Imagery layers
│   │   ├── vector.ts            # Vector data
│   │   └── tileset.ts           # 3D Tiles
│   ├── entities/
│   │   ├── markers.ts           # Point markers
│   │   ├── polylines.ts         # Lines
│   │   ├── polygons.ts          # Polygons
│   │   └── models.ts            # 3D models
│   ├── utils/
│   │   ├── camera.ts            # Camera controls
│   │   ├── coordinates.ts       # Coordinate conversion
│   │   ├── geojson.ts           # GeoJSON helpers
│   │   └── measurements.ts      # Measurement utilities
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── data/                    # GeoJSON, KML files
│   └── models/                  # 3D models
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Key Patterns

### 1. Basic Viewer Setup

```typescript
// src/components/CesiumViewer.tsx
import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

export function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize viewer
    const viewer = new Cesium.Viewer(containerRef.current, {
      terrainProvider: Cesium.createWorldTerrain(),
      baseLayerPicker: true,
      geocoder: true,
      homeButton: true,
      sceneModePicker: true,
      navigationHelpButton: true,
      animation: false,
      timeline: false,
      fullscreenButton: true,
      vrButton: false,
      infoBox: true,
      selectionIndicator: true,
      shadows: true,
      shouldAnimate: true,
    });

    viewerRef.current = viewer;

    // Set initial view
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 10000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0,
      },
    });

    // Enable lighting based on sun position
    viewer.scene.globe.enableLighting = true;

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
```

### 2. Entity Management

```typescript
// src/entities/markers.ts
import * as Cesium from 'cesium';

export interface MarkerOptions {
  id: string;
  position: { lon: number; lat: number; height?: number };
  label?: string;
  description?: string;
  color?: Cesium.Color;
  scale?: number;
  image?: string;
}

export function addMarker(
  viewer: Cesium.Viewer,
  options: MarkerOptions
): Cesium.Entity {
  const { id, position, label, description, color, scale, image } = options;

  const entity = viewer.entities.add({
    id,
    position: Cesium.Cartesian3.fromDegrees(
      position.lon,
      position.lat,
      position.height || 0
    ),
    point: {
      pixelSize: scale || 10,
      color: color || Cesium.Color.RED,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
    label: label
      ? {
          text: label,
          font: '14pt sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -15),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        }
      : undefined,
    description: description,
    billboard: image
      ? {
          image,
          width: 32,
          height: 32,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        }
      : undefined,
  });

  return entity;
}

// src/entities/polylines.ts
export interface PolylineOptions {
  id: string;
  positions: Array<{ lon: number; lat: number; height?: number }>;
  color?: Cesium.Color;
  width?: number;
  clampToGround?: boolean;
}

export function addPolyline(
  viewer: Cesium.Viewer,
  options: PolylineOptions
): Cesium.Entity {
  const { id, positions, color, width, clampToGround } = options;

  const cartesianPositions = positions.map((pos) =>
    Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.height || 0)
  );

  return viewer.entities.add({
    id,
    polyline: {
      positions: cartesianPositions,
      material: color || Cesium.Color.BLUE,
      width: width || 3,
      clampToGround: clampToGround ?? true,
    },
  });
}

// src/entities/polygons.ts
export interface PolygonOptions {
  id: string;
  positions: Array<{ lon: number; lat: number }>;
  fillColor?: Cesium.Color;
  outlineColor?: Cesium.Color;
  outlineWidth?: number;
  height?: number;
  extrudedHeight?: number;
}

export function addPolygon(
  viewer: Cesium.Viewer,
  options: PolygonOptions
): Cesium.Entity {
  const {
    id,
    positions,
    fillColor,
    outlineColor,
    outlineWidth,
    height,
    extrudedHeight,
  } = options;

  const hierarchy = positions.map((pos) =>
    Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat)
  );

  return viewer.entities.add({
    id,
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(hierarchy),
      material: fillColor || Cesium.Color.BLUE.withAlpha(0.5),
      outline: true,
      outlineColor: outlineColor || Cesium.Color.BLACK,
      outlineWidth: outlineWidth || 2,
      height: height || 0,
      extrudedHeight: extrudedHeight,
    },
  });
}

// src/entities/models.ts
export interface ModelOptions {
  id: string;
  position: { lon: number; lat: number; height: number };
  uri: string;
  scale?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
}

export async function addModel(
  viewer: Cesium.Viewer,
  options: ModelOptions
): Promise<Cesium.Entity> {
  const { id, position, uri, scale, heading, pitch, roll } = options;

  const position_cartesian = Cesium.Cartesian3.fromDegrees(
    position.lon,
    position.lat,
    position.height
  );

  const hpr = new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(heading || 0),
    Cesium.Math.toRadians(pitch || 0),
    Cesium.Math.toRadians(roll || 0)
  );

  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position_cartesian,
    hpr
  );

  return viewer.entities.add({
    id,
    position: position_cartesian,
    orientation,
    model: {
      uri,
      scale: scale || 1,
      minimumPixelSize: 64,
      maximumScale: 20000,
    },
  });
}
```

### 3. GeoJSON Loading

```typescript
// src/utils/geojson.ts
import * as Cesium from 'cesium';

export interface GeoJSONOptions {
  url?: string;
  data?: any;
  clampToGround?: boolean;
  fill?: Cesium.Color;
  stroke?: Cesium.Color;
  strokeWidth?: number;
  markerColor?: Cesium.Color;
  markerSymbol?: string;
}

export async function loadGeoJSON(
  viewer: Cesium.Viewer,
  options: GeoJSONOptions
): Promise<Cesium.DataSource> {
  const {
    url,
    data,
    clampToGround,
    fill,
    stroke,
    strokeWidth,
    markerColor,
    markerSymbol,
  } = options;

  let dataSource: Cesium.DataSource;

  if (url) {
    dataSource = await Cesium.GeoJsonDataSource.load(url, {
      clampToGround: clampToGround ?? true,
      fill: fill || Cesium.Color.BLUE.withAlpha(0.5),
      stroke: stroke || Cesium.Color.BLACK,
      strokeWidth: strokeWidth || 2,
      markerColor: markerColor || Cesium.Color.RED,
      markerSymbol: markerSymbol || '?',
    });
  } else if (data) {
    dataSource = await Cesium.GeoJsonDataSource.load(data, {
      clampToGround: clampToGround ?? true,
    });
  } else {
    throw new Error('Either url or data must be provided');
  }

  viewer.dataSources.add(dataSource);

  // Zoom to data
  await viewer.zoomTo(dataSource);

  return dataSource;
}

// Style GeoJSON entities
export function styleGeoJSONEntities(
  dataSource: Cesium.GeoJsonDataSource,
  styleFunction: (entity: Cesium.Entity, properties: any) => void
) {
  const entities = dataSource.entities.values;

  entities.forEach((entity) => {
    const properties = entity.properties?.getValue(Cesium.JulianDate.now());
    styleFunction(entity, properties);
  });
}

// Example usage
// const dataSource = await loadGeoJSON(viewer, {
//   url: '/data/geojson/cities.json',
// });
// 
// styleGeoJSONEntities(dataSource, (entity, properties) => {
//   if (entity.point) {
//     entity.point.color = properties.population > 1000000 
//       ? Cesium.Color.RED 
//       : Cesium.Color.BLUE;
//   }
// });
```

### 4. 3D Tiles

```typescript
// src/layers/tileset.ts
import * as Cesium from 'cesium';

export interface TilesetOptions {
  url: string;
  maximumScreenSpaceError?: number;
  maximumMemoryUsage?: number;
  dynamicScreenSpaceError?: boolean;
  style?: Cesium.Cesium3DTileStyle;
}

export async function add3DTileset(
  viewer: Cesium.Viewer,
  options: TilesetOptions
): Promise<Cesium.Cesium3DTileset> {
  const {
    url,
    maximumScreenSpaceError,
    maximumMemoryUsage,
    dynamicScreenSpaceError,
    style,
  } = options;

  const tileset = await Cesium.Cesium3DTileset.fromUrl(url, {
    maximumScreenSpaceError: maximumScreenSpaceError || 16,
    maximumMemoryUsage: maximumMemoryUsage || 512,
    dynamicScreenSpaceError: dynamicScreenSpaceError ?? true,
  });

  viewer.scene.primitives.add(tileset);

  // Apply style if provided
  if (style) {
    tileset.style = style;
  }

  // Zoom to tileset
  await viewer.zoomTo(tileset);

  return tileset;
}

// Style 3D Tiles
export function createTilesetStyle(
  conditions: Array<[string, Cesium.Color | string]>
): Cesium.Cesium3DTileStyle {
  return new Cesium.Cesium3DTileStyle({
    color: {
      conditions,
    },
  });
}

// Example: Color buildings by height
// const style = createTilesetStyle([
//   ["${Height} >= 100", "color('red')"],
//   ["${Height} >= 50", "color('orange')"],
//   ["${Height} >= 20", "color('yellow')"],
//   ["true", "color('white')"],
// ]);
```

### 5. Camera Controls

```typescript
// src/utils/camera.ts
import * as Cesium from 'cesium';

export function flyTo(
  viewer: Cesium.Viewer,
  options: {
    lon: number;
    lat: number;
    height: number;
    heading?: number;
    pitch?: number;
    roll?: number;
    duration?: number;
  }
) {
  const { lon, lat, height, heading, pitch, roll, duration } = options;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
    orientation: {
      heading: Cesium.Math.toRadians(heading || 0),
      pitch: Cesium.Math.toRadians(pitch || -45),
      roll: Cesium.Math.toRadians(roll || 0),
    },
    duration: duration || 3,
  });
}

export function zoomToEntity(
  viewer: Cesium.Viewer,
  entity: Cesium.Entity,
  offset?: { heading?: number; pitch?: number; range?: number }
) {
  viewer.zoomTo(entity, new Cesium.HeadingPitchRange(
    Cesium.Math.toRadians(offset?.heading || 0),
    Cesium.Math.toRadians(offset?.pitch || -45),
    offset?.range || 1000
  ));
}

export function zoomToExtent(
  viewer: Cesium.Viewer,
  west: number,
  south: number,
  east: number,
  north: number
) {
  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(west, south, east, north),
    duration: 2,
  });
}

// Get camera position
export function getCameraPosition(
  viewer: Cesium.Viewer
): { lon: number; lat: number; height: number } {
  const cartographic = viewer.camera.positionCartographic;
  
  return {
    lon: Cesium.Math.toDegrees(cartographic.longitude),
    lat: Cesium.Math.toDegrees(cartographic.latitude),
    height: cartographic.height,
  };
}

// Follow entity
export function followEntity(
  viewer: Cesium.Viewer,
  entity: Cesium.Entity
) {
  viewer.trackedEntity = entity;
}

export function unfollowEntity(viewer: Cesium.Viewer) {
  viewer.trackedEntity = undefined;
}
```

### 6. Measurements

```typescript
// src/utils/measurements.ts
import * as Cesium from 'cesium';

export function measureDistance(
  point1: { lon: number; lat: number },
  point2: { lon: number; lat: number }
): number {
  const geodesic = new Cesium.EllipsoidGeodesic(
    Cesium.Cartographic.fromDegrees(point1.lon, point1.lat),
    Cesium.Cartographic.fromDegrees(point2.lon, point2.lat)
  );

  return geodesic.surfaceDistance;
}

export function measureArea(
  positions: Array<{ lon: number; lat: number }>
): number {
  const polygon = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(
      positions.map((pos) =>
        Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat)
      )
    ),
  });

  const geometry = Cesium.PolygonGeometry.createGeometry(polygon);
  return geometry ? Math.abs(geometry.attributes.area) : 0;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(2)} m`;
  } else {
    return `${(meters / 1000).toFixed(2)} km`;
  }
}

export function formatArea(squareMeters: number): string {
  if (squareMeters < 1000000) {
    return `${squareMeters.toFixed(2)} m²`;
  } else {
    return `${(squareMeters / 1000000).toFixed(2)} km²`;
  }
}

// Interactive measurement
export class MeasurementTool {
  private viewer: Cesium.Viewer;
  private positions: Cesium.Cartesian3[] = [];
  private polyline: Cesium.Entity | null = null;
  private labels: Cesium.Entity[] = [];

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  start() {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    handler.setInputAction((event: any) => {
      const cartesian = this.viewer.camera.pickEllipsoid(
        event.position,
        this.viewer.scene.globe.ellipsoid
      );

      if (cartesian) {
        this.positions.push(cartesian);
        this.updatePolyline();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(() => {
      this.finish();
      handler.destroy();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  private updatePolyline() {
    if (this.positions.length < 2) return;

    // Remove old polyline
    if (this.polyline) {
      this.viewer.entities.remove(this.polyline);
    }

    // Add new polyline
    this.polyline = this.viewer.entities.add({
      polyline: {
        positions: this.positions,
        width: 3,
        material: Cesium.Color.YELLOW,
        clampToGround: true,
      },
    });

    // Add distance labels
    this.updateLabels();
  }

  private updateLabels() {
    // Remove old labels
    this.labels.forEach((label) => this.viewer.entities.remove(label));
    this.labels = [];

    let totalDistance = 0;

    for (let i = 1; i < this.positions.length; i++) {
      const prev = this.positions[i - 1];
      const curr = this.positions[i];

      const distance = Cesium.Cartesian3.distance(prev, curr);
      totalDistance += distance;

      const midpoint = Cesium.Cartesian3.midpoint(prev, curr, new Cesium.Cartesian3());

      const label = this.viewer.entities.add({
        position: midpoint,
        label: {
          text: formatDistance(distance),
          font: '14pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });

      this.labels.push(label);
    }

    // Add total distance label
    if (this.positions.length > 1) {
      const last = this.positions[this.positions.length - 1];
      const totalLabel = this.viewer.entities.add({
        position: last,
        label: {
          text: `Total: ${formatDistance(totalDistance)}`,
          font: '16pt sans-serif',
          fillColor: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 20),
        },
      });

      this.labels.push(totalLabel);
    }
  }

  private finish() {
    console.log('Measurement complete');
  }

  clear() {
    if (this.polyline) {
      this.viewer.entities.remove(this.polyline);
      this.polyline = null;
    }

    this.labels.forEach((label) => this.viewer.entities.remove(label));
    this.labels = [];

    this.positions = [];
  }
}
```

### 7. Terrain and Imagery

```typescript
// src/layers/terrain.ts
import * as Cesium from 'cesium';

export function createWorldTerrain(): Cesium.TerrainProvider {
  return Cesium.createWorldTerrain({
    requestWaterMask: true,
    requestVertexNormals: true,
  });
}

export function createTerrainProvider(url: string): Cesium.CesiumTerrainProvider {
  return Cesium.CesiumTerrainProvider.fromUrl(url);
}

// src/layers/imagery.ts
export function addBingMapsImagery(
  viewer: Cesium.Viewer,
  key: string,
  style: Cesium.BingMapsStyle = Cesium.BingMapsStyle.AERIAL
): Cesium.ImageryLayer {
  return viewer.imageryLayers.addImageryProvider(
    new Cesium.BingMapsImageryProvider({
      url: 'https://dev.virtualearth.net',
      key,
      mapStyle: style,
    })
  );
}

export function addOpenStreetMapImagery(
  viewer: Cesium.Viewer
): Cesium.ImageryLayer {
  return viewer.imageryLayers.addImageryProvider(
    new Cesium.OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/',
    })
  );
}

export function addTileMapServiceImagery(
  viewer: Cesium.Viewer,
  url: string
): Cesium.ImageryLayer {
  return viewer.imageryLayers.addImageryProvider(
    new Cesium.TileMapServiceImageryProvider({
      url,
    })
  );
}

export function addWMSImagery(
  viewer: Cesium.Viewer,
  url: string,
  layers: string
): Cesium.ImageryLayer {
  return viewer.imageryLayers.addImageryProvider(
    new Cesium.WebMapServiceImageryProvider({
      url,
      layers,
      parameters: {
        transparent: true,
        format: 'image/png',
      },
    })
  );
}
```

### 8. Event Handling

```typescript
// src/utils/events.ts
import * as Cesium from 'cesium';

export function setupClickHandler(
  viewer: Cesium.Viewer,
  onClick: (entity: Cesium.Entity | undefined, position: Cesium.Cartesian3) => void
) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  handler.setInputAction((event: any) => {
    const pickedObject = viewer.scene.pick(event.position);

    if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
      onClick(pickedObject.id, pickedObject.id.position?.getValue(Cesium.JulianDate.now())!);
    } else {
      const cartesian = viewer.camera.pickEllipsoid(
        event.position,
        viewer.scene.globe.ellipsoid
      );
      
      if (cartesian) {
        onClick(undefined, cartesian);
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return () => handler.destroy();
}

export function setupHoverHandler(
  viewer: Cesium.Viewer,
  onHover: (entity: Cesium.Entity | undefined) => void
) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  handler.setInputAction((movement: any) => {
    const pickedObject = viewer.scene.pick(movement.endPosition);

    if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
      onHover(pickedObject.id);
    } else {
      onHover(undefined);
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  return () => handler.destroy();
}
```

## Configuration

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [react(), cesium()],
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
  },
});
```

### package.json

```json
{
  "name": "cesium-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "cesium": "^1.110.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/cesium": "^1.110.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-cesium": "^1.2.0"
  }
}
```

### Cesium Ion Token

```typescript
// src/main.ts
import * as Cesium from 'cesium';

// Set your Cesium Ion access token
Cesium.Ion.defaultAccessToken = 'YOUR_CESIUM_ION_TOKEN';
```

## Best Practices

### 1. Memory Management

```typescript
// Always dispose resources
useEffect(() => {
  const viewer = new Cesium.Viewer(containerRef.current!);
  
  return () => {
    if (viewer && !viewer.isDestroyed()) {
      viewer.destroy();
    }
  };
}, []);
```

### 2. Performance Optimization

```typescript
// Use requestRender mode for better performance
viewer.requestRenderMode = true;
viewer.maximumRenderTimeChange = Infinity;

// Manually trigger render when needed
viewer.scene.requestRender();
```

### 3. Level of Detail

```typescript
// Adjust tile cache size
tileset.maximumMemoryUsage = 512; // MB

// Use dynamic screen space error
tileset.dynamicScreenSpaceError = true;
tileset.dynamicScreenSpaceErrorDensity = 0.00278;
```

### 4. Efficient Entity Updates

```typescript
// Use CallbackProperty for dynamic updates
const positionProperty = new Cesium.CallbackProperty(() => {
  return Cesium.Cartesian3.fromDegrees(lon, lat, height);
}, false);

viewer.entities.add({
  position: positionProperty,
  point: { pixelSize: 10 },
});
```

## Resources

- [CesiumJS Documentation](https://cesium.com/learn/cesiumjs/ref-doc/)
- [CesiumJS Tutorials](https://cesium.com/learn/cesiumjs-learn/)
- [Cesium Ion](https://cesium.com/ion/)
- [Sandcastle Examples](https://sandcastle.cesium.com/)
- [CesiumGS GitHub](https://github.com/CesiumGS/cesium)
