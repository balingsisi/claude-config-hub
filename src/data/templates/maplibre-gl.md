# MapLibre GL JS Template

## 技术栈

- **核心**: maplibre-gl ^4.x
- **框架集成**: react-map-gl / vue-maplibre
- **地图样式**: MapLibre Style Spec
- **数据格式**: GeoJSON
- **3D 支持**: Three.js / deck.gl 集成

## 项目结构

```
maplibre-project/
├── src/
│   ├── map/
│   │   ├── MapContainer.tsx
│   │   ├── MapControls.tsx
│   │   ├── MapMarkers.tsx
│   │   └── MapPopup.tsx
│   ├── layers/
│   │   ├── GeoJsonLayer.tsx
│   │   ├── HeatmapLayer.tsx
│   │   ├── ClusterLayer.tsx
│   │   ├── RouteLayer.tsx
│   │   └── CustomLayer.tsx
│   ├── styles/
│   │   ├── basic.ts          # 基础样式
│   │   ├── dark.ts           # 深色主题
│   │   └── custom.ts         # 自定义样式
│   ├── utils/
│   │   ├── geoUtils.ts       # 地理工具
│   │   ├── formatCoords.ts   # 坐标转换
│   │   └── geocoding.ts      # 地理编码
│   ├── hooks/
│   │   ├── useMap.ts
│   │   ├── useGeolocation.ts
│   │   └── useMapEvents.ts
│   └── App.tsx
├── public/
│   ├── map-style.json        # 自定义样式
│   └── sprites/              # 图标精灵图
├── package.json
└── tsconfig.json
```

## 代码模式

### 基础地图

```typescript
// map/MapContainer.tsx
import { useRef, useEffect } from 'react';
import maplibregl, { Map, LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapContainerProps {
  center?: LngLatLike;
  zoom?: number;
  style?: string;
  onMapLoad?: (map: Map) => void;
}

export function MapContainer({
  center = [116.397428, 39.90923], // 北京
  zoom = 12,
  style = 'https://demotiles.maplibre.org/style.json',
  onMapLoad,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    map.current.on('load', () => {
      if (onMapLoad && map.current) {
        onMapLoad(map.current);
      }
    });

    // 添加导航控件
    map.current.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // 添加比例尺
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    return () => {
      map.current?.remove();
    };
  }, [center, zoom, style, onMapLoad]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}

// 使用示例
function App() {
  const handleMapLoad = (map: Map) => {
    console.log('地图加载完成', map);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MapContainer onMapLoad={handleMapLoad} />
    </div>
  );
}
```

### React Hook 封装

```typescript
// hooks/useMap.ts
import { useRef, useEffect, useState } from 'react';
import maplibregl, { Map, LngLatLike } from 'maplibre-gl';

interface UseMapOptions {
  container: React.RefObject<HTMLDivElement>;
  style?: string;
  center?: LngLatLike;
  zoom?: number;
}

export function useMap({ container, style, center, zoom }: UseMapOptions) {
  const mapInstance = useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!container.current) return;

    mapInstance.current = new maplibregl.Map({
      container: container.current,
      style: style || 'https://demotiles.maplibre.org/style.json',
      center: center || [0, 0],
      zoom: zoom || 1,
    });

    mapInstance.current.on('load', () => {
      setIsLoaded(true);
    });

    return () => {
      mapInstance.current?.remove();
    };
  }, []);

  const flyTo = (lngLat: LngLatLike, zoom?: number) => {
    mapInstance.current?.flyTo({
      center: lngLat,
      zoom: zoom || mapInstance.current.getZoom(),
      duration: 2000,
    });
  };

  const setPitch = (pitch: number) => {
    mapInstance.current?.setPitch(pitch);
  };

  return {
    map: mapInstance.current,
    isLoaded,
    flyTo,
    setPitch,
  };
}
```

### 标记点

```typescript
// map/MapMarkers.tsx
import maplibregl, { Marker, Popup, LngLatLike } from 'maplibre-gl';

interface MarkerData {
  id: string;
  lngLat: LngLatLike;
  title: string;
  description?: string;
  color?: string;
}

export function addMarkers(map: maplibregl.Map, markers: MarkerData[]) {
  const markerInstances: Marker[] = [];

  markers.forEach((data) => {
    // 创建弹窗
    const popup = new Popup({ offset: 25 }).setHTML(
      `<h3>${data.title}</h3><p>${data.description || ''}</p>`
    );

    // 创建标记
    const marker = new Marker({ color: data.color || '#3b82f6' })
      .setLngLat(data.lngLat)
      .setPopup(popup)
      .addTo(map);

    markerInstances.push(marker);
  });

  return markerInstances;
}

// 自定义标记
export function addCustomMarker(
  map: maplibregl.Map,
  lngLat: LngLatLike,
  element: HTMLElement
) {
  return new maplibregl.Marker({ element })
    .setLngLat(lngLat)
    .addTo(map);
}

// 使用示例
function CustomMarkerMap() {
  const mapRef = useRef<maplibregl.Map>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const markers = [
      { id: '1', lngLat: [116.397428, 39.90923], title: '北京', color: '#ef4444' },
      { id: '2', lngLat: [121.473701, 31.230416], title: '上海', color: '#10b981' },
    ];

    addMarkers(mapRef.current, markers);
  }, []);

  return <MapContainer mapRef={mapRef} />;
}
```

### GeoJSON 图层

```typescript
// layers/GeoJsonLayer.tsx
import maplibregl, { GeoJSONSourceRaw } from 'maplibre-gl';

interface GeoJsonLayerOptions {
  id: string;
  data: GeoJSON.GeoJSON;
  type: 'fill' | 'line' | 'circle' | 'symbol';
  paint?: any;
  layout?: any;
}

export function addGeoJsonLayer(
  map: maplibregl.Map,
  options: GeoJsonLayerOptions
) {
  const { id, data, type, paint = {}, layout = {} } = options;

  // 添加数据源
  const source: GeoJSONSourceRaw = {
    type: 'geojson',
    data,
  };
  map.addSource(id, source);

  // 添加图层
  map.addLayer({
    id: `${id}-layer`,
    type,
    source: id,
    paint,
    layout,
  });

  return () => {
    map.removeLayer(`${id}-layer`);
    map.removeSource(id);
  };
}

// 使用示例
function PolygonMap() {
  const handleMapLoad = (map: maplibregl.Map) => {
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [116.39, 39.91],
                [116.40, 39.91],
                [116.40, 39.90],
                [116.39, 39.90],
                [116.39, 39.91],
              ],
            ],
          },
          properties: { name: '示例区域' },
        },
      ],
    };

    addGeoJsonLayer(map, {
      id: 'polygon',
      data: geojson,
      type: 'fill',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.5,
      },
    });
  };

  return <MapContainer onMapLoad={handleMapLoad} />;
}
```

### 聚类图层

```typescript
// layers/ClusterLayer.tsx
export function addClusterLayer(
  map: maplibregl.Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection
) {
  // 添加聚类数据源
  map.addSource(sourceId, {
    type: 'geojson',
    data,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });

  // 聚类圆圈
  map.addLayer({
    id: `${sourceId}-clusters`,
    type: 'circle',
    source: sourceId,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        100,
        '#f1f075',
        750,
        '#f28cb1',
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        100,
        30,
        750,
        40,
      ],
    },
  });

  // 聚类计数
  map.addLayer({
    id: `${sourceId}-cluster-count`,
    type: 'symbol',
    source: sourceId,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
  });

  // 单个点
  map.addLayer({
    id: `${sourceId}-unclustered-point`,
    type: 'circle',
    source: sourceId,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 4,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
    },
  });

  // 点击聚类放大
  map.on('click', `${sourceId}-clusters`, (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: [`${sourceId}-clusters`],
    });
    const clusterId = features[0].properties.cluster_id;

    map.getSource(sourceId).getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      map.easeTo({
        center: (features[0].geometry as any).coordinates,
        zoom,
      });
    });
  });

  // 鼠标样式
  map.on('mouseenter', `${sourceId}-clusters`, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', `${sourceId}-clusters`, () => {
    map.getCanvas().style.cursor = '';
  });
}
```

### 热力图

```typescript
// layers/HeatmapLayer.tsx
export function addHeatmapLayer(
  map: maplibregl.Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection
) {
  map.addSource(sourceId, {
    type: 'geojson',
    data,
  });

  map.addLayer({
    id: `${sourceId}-heat`,
    type: 'heatmap',
    source: sourceId,
    maxzoom: 15,
    paint: {
      // 热力图权重
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
      // 热力图强度
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
      // 热力图颜色
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(33,102,172,0)',
        0.2,
        'rgb(103,169,207)',
        0.4,
        'rgb(209,229,240)',
        0.6,
        'rgb(253,219,199)',
        0.8,
        'rgb(239,138,98)',
        1,
        'rgb(178,24,43)',
      ],
      // 热力图半径
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
      // 热力图透明度
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 0],
    },
  });
}
```

### 路线绘制

```typescript
// layers/RouteLayer.tsx
export function addRouteLayer(
  map: maplibregl.Map,
  route: { coordinates: [number, number][] }
) {
  const routeGeoJson: GeoJSON.Feature = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: route.coordinates,
    },
    properties: {},
  };

  map.addSource('route', {
    type: 'geojson',
    data: routeGeoJson,
  });

  // 路线背景
  map.addLayer({
    id: 'route-background',
    type: 'line',
    source: 'route',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#000',
      'line-width': 8,
      'line-blur': 0.5,
    },
  });

  // 路线主体
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#3b82f6',
      'line-width': 6,
      'line-blur': 0,
    },
  });

  // 动画效果
  let step = 0;
  const animateRoute = () => {
    step = (step + 1) % 360;
    map.setPaintProperty('route', 'line-dasharray', [
      step / 360,
      1 - step / 360,
    ]);
    requestAnimationFrame(animateRoute);
  };

  animateRoute();
}
```

### 自定义控件

```typescript
// map/MapControls.tsx
class CustomControl implements maplibregl.IControl {
  private container: HTMLDivElement;
  private map: maplibregl.Map | null = null;

  constructor(private onClick: () => void) {
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    this.container.innerHTML = `
      <button class="custom-control" title="自定义控件">
        <svg>...</svg>
      </button>
    `;
    this.container.addEventListener('click', this.onClick);
  }

  onAdd(map: maplibregl.Map) {
    this.map = map;
    return this.container;
  }

  onRemove() {
    this.container.parentNode?.removeChild(this.container);
    this.map = null;
  }
}

// 全屏控件
class FullscreenControl implements maplibregl.IControl {
  private container: HTMLDivElement;
  private isFullscreen = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    this.container.innerHTML = `<button>全屏</button>`;
    this.container.addEventListener('click', () => this.toggleFullscreen());
  }

  private toggleFullscreen() {
    const mapContainer = this.map?.getContainer();
    if (!mapContainer) return;

    if (!this.isFullscreen) {
      mapContainer.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    this.isFullscreen = !this.isFullscreen;
  }

  onAdd(map: maplibregl.Map) {
    this.map = map;
    return this.container;
  }

  onRemove() {
    this.container.parentNode?.removeChild(this.container);
  }

  private map: maplibregl.Map | null = null;
}

// 使用
map.addControl(new CustomControl(() => console.log('clicked')), 'top-left');
map.addControl(new FullscreenControl(), 'top-right');
```

## 最佳实践

### 1. 性能优化

```typescript
// utils/performance.ts

// 数据切片
export function loadDataInChunks(
  map: maplibregl.Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection,
  chunkSize = 1000
) {
  const chunks = [];
  for (let i = 0; i < data.features.length; i += chunkSize) {
    chunks.push(data.features.slice(i, i + chunkSize));
  }

  let index = 0;
  const loadChunk = () => {
    if (index >= chunks.length) return;

    const chunk = chunks[index];
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;

    if (index === 0) {
      source.setData({
        type: 'FeatureCollection',
        features: chunk,
      });
    } else {
      // 追加数据
      const currentData = (source as any)._data as GeoJSON.FeatureCollection;
      source.setData({
        type: 'FeatureCollection',
        features: [...currentData.features, ...chunk],
      });
    }

    index++;
    requestIdleCallback(loadChunk);
  };

  loadChunk();
}

// 简化几何图形
export function simplifyGeometry(
  coords: [number, number][],
  tolerance = 0.0001
) {
  const simplified: [number, number][] = [coords[0]];
  
  for (let i = 1; i < coords.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = coords[i];
    
    const dist = Math.sqrt(
      Math.pow(curr[0] - prev[0], 2) + Math.pow(curr[1] - prev[1], 2)
    );
    
    if (dist > tolerance) {
      simplified.push(curr);
    }
  }
  
  simplified.push(coords[coords.length - 1]);
  return simplified;
}
```

### 2. 地理编码

```typescript
// utils/geocoding.ts
export async function geocode(address: string): Promise<LngLatLike | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`
  );
  const data = await response.json();

  if (data.length > 0) {
    return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
  }

  return null;
}

export async function reverseGeocode(
  lngLat: LngLatLike
): Promise<string | null> {
  const [lng, lat] = lngLat as [number, number];
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lon=${lng}&lat=${lat}`
  );
  const data = await response.json();

  return data.display_name || null;
}
```

### 3. 坐标转换

```typescript
// utils/formatCoords.ts

// 经纬度转瓦片坐标
export function lngLatToTile(
  lng: number,
  lat: number,
  zoom: number
): { x: number; y: number } {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );

  return { x, y };
}

// 计算两点距离
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (coord1[1] * Math.PI) / 180;
  const φ2 = (coord2[1] * Math.PI) / 180;
  const Δφ = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const Δλ = ((coord2[0] - coord1[0]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
```

### 4. 响应式设计

```typescript
// hooks/useResponsiveMap.ts
export function useResponsiveMap(mapRef: React.RefObject<maplibregl.Map>) {
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapRef]);
}

// 移动端适配
export function adaptForMobile(map: maplibregl.Map) {
  if ('ontouchstart' in window) {
    // 禁用拖拽惯性
    map.dragPan.disable();
    map.dragPan.enable({
      linearity: 0.1,
      easing: (t) => t,
      maxSpeed: 1400,
      deceleration: 2500,
    });

    // 简化手势
    map.scrollZoom.disable();
    map.doubleClickZoom.enable();
  }
}
```

## 常用命令

```bash
# 安装
npm install maplibre-gl
bun add react-map-gl

# 类型定义
npm install -D @types/mapbox-gl @types/geojson

# 开发
npm run dev

# 构建
npm run build

# 地图样式工具
npm install -D maplibre-gl-style-spec

# 瓦片服务器
npm install -g tileserver-gl
```

## 部署配置

### 自定义样式服务

```typescript
// server/style.ts
import express from 'express';

const app = express();

app.get('/style.json', (req, res) => {
  res.json({
    version: 8,
    name: 'Custom Style',
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#f0f0f0' },
      },
      {
        id: 'osm',
        type: 'raster',
        source: 'osm-tiles',
      },
    ],
  });
});

app.listen(3000);
```

### Next.js 集成

```typescript
// components/Map.tsx
'use client';

import { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [0, 0],
      zoom: 1,
    });

    return () => map.remove();
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />;
}

// 动态导入避免 SSR 问题
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), { ssr: false });
```

### 瓦片缓存

```typescript
// server/tileCache.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1小时缓存

export async function getTileWithCache(
  z: number,
  x: number,
  y: number
): Promise<Buffer> {
  const key = `${z}/${x}/${y}`;
  const cached = cache.get<Buffer>(key);

  if (cached) {
    return cached;
  }

  const tile = await fetchTile(z, x, y);
  cache.set(key, tile);
  return tile;
}
```
