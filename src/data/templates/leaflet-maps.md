# Leaflet Maps Template

## Tech Stack
- leaflet v1.x
- react-leaflet v4.x
- React 18+
- TypeScript 5+

## Project Structure
```
src/
├── components/
│   ├── maps/
│   │   ├── MapWidget.tsx
│   │   ├── MarkerLayer.tsx
│   │   └── GeoJsonLayer.tsx
│   └── App.tsx
```

## Core Patterns

### Basic Map
```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const MapWidget: React.FC = () => {
  const position: [number, number] = [51.505, -0.09];

  return (
    <MapContainer center={position} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </MapContainer>
  );
};
```

### GeoJSON Layer
```typescript
import { GeoJSON } from 'react-leaflet';

export const GeoJsonLayer: React.FC<{ data: GeoJsonObject }> = ({ data }) => {
  return (
    <GeoJSON
      data={data}
      style={() => ({
        color: '#4a83ec',
        weight: 0.5,
        fillColor: "#1a1d62",
        fillOpacity: 0.7,
      })}
      onEachFeature={(feature, layer) => {
        layer.bindPopup(feature.properties.name);
      }}
    />
  );
};
```

## Common Commands

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
npm run dev
```

## Related Resources
- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet](https://react-leaflet.js.org/)
