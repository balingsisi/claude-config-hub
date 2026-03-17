# React Window Virtualization Template

## Tech Stack
- react-window v1.x
- React 18+
- TypeScript 5+

## Core Patterns

### Fixed Size List
```typescript
import { FixedSizeList } from 'react-window';

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

const Row = ({ index, style }: RowProps) => (
  <div style={style}>Row {index}</div>
);

export const VirtualList: React.FC = () => {
  return (
    <FixedSizeList
      height={400}
      itemCount={10000}
      itemSize={35}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Variable Size List
```typescript
import { VariableSizeList } from 'react-window';

export const VariableList: React.FC = () => {
  const getItemSize = (index: number) => 35 + (index % 10) * 5;

  return (
    <VariableSizeList
      height={400}
      itemCount={10000}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
};
```

### Fixed Size Grid
```typescript
import { FixedSizeGrid } from 'react-window';

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
}

const Cell = ({ columnIndex, rowIndex, style }: CellProps) => (
  <div style={style}>
    {rowIndex},{columnIndex}
  </div>
);

export const VirtualGrid: React.FC = () => {
  return (
    <FixedSizeGrid
      columnCount={10}
      columnWidth={100}
      height={400}
      rowCount={1000}
      rowHeight={35}
      width={1000}
    >
      {Cell}
    </FixedSizeGrid>
  );
};
```

## Common Commands

```bash
npm install react-window
npm install -D @types/react-window
npm run dev
```

## Related Resources
- [React Window Documentation](https://react-window.vercel.app/)
- [GitHub Repository](https://github.com/bvaughn/react-window)
