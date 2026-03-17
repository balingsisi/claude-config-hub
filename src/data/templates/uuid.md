# UUID 生成模板

## 技术栈

- **核心库**: uuid v9.0+
- **类型支持**: TypeScript (内置 @types/uuid)
- **生成算法**: UUID v1, v3, v4, v5
- **验证**: UUID 验证
- **框架集成**: Node.js, React, Vue, 浏览器

## 项目结构

```
src/
├── utils/
│   ├── uuid/
│   │   ├── index.ts           # 导出 UUID 工具
│   │   ├── generate.ts        # 生成函数
│   │   ├── validate.ts        # 验证函数
│   │   ├── parse.ts           # 解析函数
│   │   └── convert.ts         # 转换函数
│   └── constants.ts           # 常量
├── hooks/
│   ├── useUUID.ts             # UUID Hook
│   └── useBatchUUID.ts        # 批量 UUID Hook
├── components/
│   ├── UUIDGenerator.tsx      # UUID 生成器
│   └── UUIDList.tsx           # UUID 列表
└── types/
    └── uuid.d.ts              # 类型定义
```

## 代码模式

### 1. 基础配置

```typescript
// src/utils/uuid/index.ts
import {
  v1 as uuidv1,
  v3 as uuidv3,
  v4 as uuidv4,
  v5 as uuidv5,
  NIL,
  MAX,
  validate,
  version,
  parse,
  stringify,
} from 'uuid';

// 导出所有函数
export {
  uuidv1,   // 基于时间戳
  uuidv3,   // 基于命名空间和 MD5
  uuidv4,   // 随机生成
  uuidv5,   // 基于命名空间和 SHA-1
  NIL,      // 空 UUID
  MAX,      // 最大 UUID
  validate, // 验证 UUID
  version,  // 获取版本
  parse,    // 解析为字节数组
  stringify, // 转换为字符串
};

// 常用命名空间
export const NAMESPACE = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',    // DNS 命名空间
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',    // URL 命名空间
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',    // OID 命名空间
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',   // X500 命名空间
};
```

### 2. 生成函数

```typescript
// src/utils/uuid/generate.ts
import { v1, v3, v4, v5, NIL } from 'uuid';

// 生成 UUID v1 (基于时间戳)
export function generateV1(): string {
  return v1();
}

// 生成 UUID v1 with options
export function generateV1WithOptions(options?: {
  node?: Array<number>;       // 6字节数组
  clockseq?: number;          // 0-16383
  msecs?: number;             // 时间戳
  nsecs?: number;             // 0-9999
}): string {
  return v1(options);
}

// 生成 UUID v3 (基于命名空间 + MD5)
export function generateV3(name: string | Array<number>, namespace: string | Array<number>): string {
  return v3(name, namespace);
}

// 生成 UUID v4 (随机)
export function generateV4(): string {
  return v4();
}

// 生成 UUID v4 with options
export function generateV4WithOptions(options?: {
  random?: Array<number>;     // 自定义随机数
  rng?: () => Array<number>;  // 自定义随机数生成器
}): string {
  return v4(options);
}

// 生成 UUID v5 (基于命名空间 + SHA-1)
export function generateV5(name: string | Array<number>, namespace: string | Array<number>): string {
  return v5(name, namespace);
}

// 快捷方法
export const uuid = {
  v1: generateV1,
  v3: generateV3,
  v4: generateV4,
  v5: generateV5,
};

// 使用示例
const id1 = uuid.v1(); // '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'
const id4 = uuid.v4(); // '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
const id5 = uuid.v5('hello', NAMESPACE.DNS); // '5c51b8dd-ee7a-5f98-9ae2-86130a9cb31c'
```

### 3. 验证函数

```typescript
// src/utils/uuid/validate.ts
import { validate, version } from 'uuid';

// 验证 UUID
export function isValidUUID(uuid: string): boolean {
  return validate(uuid);
}

// 验证特定版本
export function isUUIDVersion(uuid: string, expectedVersion: 1 | 3 | 4 | 5): boolean {
  return validate(uuid) && version(uuid) === expectedVersion;
}

// 验证 UUID v1
export function isUUIDv1(uuid: string): boolean {
  return isUUIDVersion(uuid, 1);
}

// 验证 UUID v3
export function isUUIDv3(uuid: string): boolean {
  return isUUIDVersion(uuid, 3);
}

// 验证 UUID v4
export function isUUIDv4(uuid: string): boolean {
  return isUUIDVersion(uuid, 4);
}

// 验证 UUID v5
export function isUUIDv5(uuid: string): boolean {
  return isUUIDVersion(uuid, 5);
}

// 验证并返回详细信息
export function validateUUID(uuid: string): {
  valid: boolean;
  version: number | null;
} {
  if (!validate(uuid)) {
    return { valid: false, version: null };
  }
  
  return {
    valid: true,
    version: version(uuid),
  };
}

// 使用示例
const result = validateUUID('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b');
// { valid: true, version: 1 }
```

### 4. 解析和转换

```typescript
// src/utils/uuid/parse.ts
import { parse, stringify, NIL, MAX } from 'uuid';

// 解析 UUID 为字节数组
export function parseUUID(uuid: string): Uint8Array {
  return parse(uuid);
}

// 字节数组转 UUID 字符串
export function bytesToUUID(bytes: Array<number> | Uint8Array): string {
  return stringify(bytes);
}

// 获取空 UUID
export function getNilUUID(): string {
  return NIL; // '00000000-0000-0000-0000-000000000000'
}

// 获取最大 UUID
export function getMaxUUID(): string {
  return MAX; // 'ffffffff-ffff-ffff-ffff-ffffffffffff'
}

// 检查是否为空 UUID
export function isNilUUID(uuid: string): boolean {
  return uuid === NIL;
}

// 检查是否为最大 UUID
export function isMaxUUID(uuid: string): boolean {
  return uuid === MAX;
}

// 使用示例
const bytes = parseUUID('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b');
// Uint8Array [110, 192, 189, 127, 17, 192, 67, 218, 151, 94, 42, 138, 217, 235, 174, 11]

const uuidString = bytesToUUID(bytes);
// '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'
```

### 5. 格式转换

```typescript
// src/utils/uuid/convert.ts
import { parse, stringify } from 'uuid';

// UUID 转 Buffer (Node.js)
export function uuidToBuffer(uuid: string): Buffer {
  return Buffer.from(parse(uuid));
}

// Buffer 转 UUID (Node.js)
export function bufferToUUID(buffer: Buffer): string {
  return stringify(buffer);
}

// UUID 转 Base64
export function uuidToBase64(uuid: string): string {
  const bytes = parse(uuid);
  return Buffer.from(bytes).toString('base64');
}

// Base64 转 UUID
export function base64ToUUID(base64: string): string {
  const buffer = Buffer.from(base64, 'base64');
  return stringify(new Uint8Array(buffer));
}

// UUID 转 Hex
export function uuidToHex(uuid: string): string {
  const bytes = parse(uuid);
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Hex 转 UUID
export function hexToUUID(hex: string): string {
  const bytes = hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
  return stringify(new Uint8Array(bytes));
}

// 移除连字符
export function uuidToNoHyphen(uuid: string): string {
  return uuid.replace(/-/g, '');
}

// 添加连字符
export function noHyphenToUUID(noHyphen: string): string {
  return [
    noHyphen.substring(0, 8),
    noHyphen.substring(8, 12),
    noHyphen.substring(12, 16),
    noHyphen.substring(16, 20),
    noHyphen.substring(20, 32),
  ].join('-');
}

// 使用示例
const uuid = '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b';
const base64 = uuidToBase64(uuid); // 'bsC9fxHAQ9qXXiqK2euuCw=='
const hex = uuidToHex(uuid); // '6ec0bd7f11c043da975e2a8ad9ebae0b'
const noHyphen = uuidToNoHyphen(uuid); // '6ec0bd7f11c043da975e2a8ad9ebae0b'
```

### 6. React Hooks

```typescript
// src/hooks/useUUID.ts
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useUUID() {
  const [uuid, setUUID] = useState<string>(() => uuidv4());

  const regenerate = useCallback(() => {
    setUUID(uuidv4());
  }, []);

  return { uuid, regenerate };
}

// src/hooks/useBatchUUID.ts
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useBatchUUID(count = 10) {
  const [uuids, setUUIDs] = useState<string[]>(() => 
    Array.from({ length: count }, () => uuidv4())
  );

  const regenerate = useCallback((newCount?: number) => {
    const uuidCount = newCount || count;
    setUUIDs(Array.from({ length: uuidCount }, () => uuidv4()));
  }, [count]);

  const addMore = useCallback((additionalCount = 1) => {
    setUUIDs(prev => [
      ...prev,
      ...Array.from({ length: additionalCount }, () => uuidv4())
    ]);
  }, []);

  const clear = useCallback(() => {
    setUUIDs([]);
  }, []);

  return { uuids, regenerate, addMore, clear };
}

// 使用示例
function UUIDGenerator() {
  const { uuid, regenerate } = useUUID();
  
  return (
    <div>
      <p>UUID: {uuid}</p>
      <button onClick={regenerate}>Generate New</button>
    </div>
  );
}

function BatchUUIDGenerator() {
  const { uuids, regenerate, addMore } = useBatchUUID(5);
  
  return (
    <div>
      <button onClick={() => regenerate(10)}>Generate 10 UUIDs</button>
      <button onClick={() => addMore(5)}>Add 5 More</button>
      <ul>
        {uuids.map((uuid, index) => (
          <li key={index}>{uuid}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 7. React 组件

```typescript
// src/components/UUIDGenerator.tsx
import React, { useState } from 'react';
import { v4 as uuidv4, validate } from 'uuid';

interface UUIDGeneratorProps {
  onGenerate?: (uuid: string) => void;
  showCopyButton?: boolean;
  className?: string;
}

export function UUIDGenerator({
  onGenerate,
  showCopyButton = true,
  className,
}: UUIDGeneratorProps) {
  const [uuid, setUUID] = useState(() => uuidv4());
  const [copied, setCopied] = useState(false);

  const generateNew = () => {
    const newUUID = uuidv4();
    setUUID(newUUID);
    onGenerate?.(newUUID);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={className}>
      <div className="uuid-display">
        <input
          type="text"
          value={uuid}
          readOnly
          className="uuid-input"
        />
      </div>
      
      <div className="uuid-actions">
        <button onClick={generateNew}>Generate New</button>
        {showCopyButton && (
          <button onClick={copyToClipboard}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

// src/components/UUIDList.tsx
import React, { useState } from 'react';
import { v4 as uuidv4, validate, version } from 'uuid';

interface UUIDListProps {
  count?: number;
  className?: string;
}

export function UUIDList({ count = 10, className }: UUIDListProps) {
  const [uuids, setUUIDs] = useState<string[]>(() =>
    Array.from({ length: count }, () => uuidv4())
  );

  const regenerateAll = () => {
    setUUIDs(Array.from({ length: count }, () => uuidv4()));
  };

  const regenerateOne = (index: number) => {
    setUUIDs(prev => {
      const newUUIDs = [...prev];
      newUUIDs[index] = uuidv4();
      return newUUIDs;
    });
  };

  const removeOne = (index: number) => {
    setUUIDs(prev => prev.filter((_, i) => i !== index));
  };

  const copyOne = async (uuid: string) => {
    try {
      await navigator.clipboard.writeText(uuid);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={className}>
      <button onClick={regenerateAll}>Regenerate All</button>
      <ul className="uuid-list">
        {uuids.map((uuid, index) => (
          <li key={uuid} className="uuid-item">
            <span className="uuid-text">{uuid}</span>
            <small>v{version(uuid)}</small>
            <button onClick={() => regenerateOne(index)}>Regenerate</button>
            <button onClick={() => copyOne(uuid)}>Copy</button>
            <button onClick={() => removeOne(index)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 8. 高级用法

```typescript
// src/utils/uuid/advanced.ts
import { v4 as uuidv4, v5 as uuidv5, validate, version } from 'uuid';

// 批量生成 UUID
export function generateBatch(count: number): string[] {
  return Array.from({ length: count }, () => uuidv4());
}

// 确定性的 UUID 生成（相同输入总是产生相同 UUID）
export function generateDeterministic(input: string, namespace: string): string {
  return uuidv5(input, namespace);
}

// 基于对象属性生成 UUID
export function generateFromObject(obj: object, namespace: string): string {
  const serialized = JSON.stringify(obj, Object.keys(obj).sort());
  return uuidv5(serialized, namespace);
}

// UUID 排序
export function sortUUIDs(uuids: string[], order: 'asc' | 'desc' = 'asc'): string[] {
  const sorted = [...uuids].sort();
  return order === 'desc' ? sorted.reverse() : sorted;
}

// UUID 去重
export function deduplicateUUIDs(uuids: string[]): string[] {
  return [...new Set(uuids)];
}

// 过滤有效的 UUID
export function filterValidUUIDs(uuids: string[]): string[] {
  return uuids.filter(validate);
}

// 按版本分组
export function groupByVersion(uuids: string[]): Record<number, string[]> {
  return uuids.reduce<Record<number, string[]>>((acc, uuid) => {
    if (validate(uuid)) {
      const v = version(uuid);
      if (!acc[v]) acc[v] = [];
      acc[v].push(uuid);
    }
    return acc;
  }, {});
}

// 使用示例
const batch = generateBatch(100);
const deterministic = generateDeterministic('user@example.com', NAMESPACE.DNS);
const sorted = sortUUIDs(batch, 'asc');
const grouped = groupByVersion(batch);
```

## 最佳实践

### 1. 选择合适的版本

```typescript
// ✅ v4 - 通用场景，随机生成
const id = uuidv4();

// ✅ v1 - 需要时间排序
const timestampBased = uuidv1();

// ✅ v5 - 需要确定性（相同输入产生相同 UUID）
const deterministic = uuidv5('user@example.com', NAMESPACE.DNS);

// ❌ v3 - 不推荐，使用 v5 代替（更安全）
```

### 2. 安全性

```typescript
// ✅ 在安全敏感场景使用加密随机数
import { randomBytes } from 'crypto';

const secureUUID = uuidv4({
  random: randomBytes(16),
});

// ✅ 在浏览器中使用 Web Crypto API
const secureUUID = uuidv4({
  random: new Uint8Array(crypto.getRandomValues(new Uint8Array(16))),
});
```

### 3. 性能优化

```typescript
// ✅ 批量生成时重用数组
function generateBatch(count: number): string[] {
  const uuids = new Array<string>(count);
  for (let i = 0; i < count; i++) {
    uuids[i] = uuidv4();
  }
  return uuids;
}

// ✅ 缓存确定性 UUID
const uuidCache = new Map<string, string>();

function getCachedDeterministicUUID(input: string): string {
  if (uuidCache.has(input)) {
    return uuidCache.get(input)!;
  }
  
  const uuid = uuidv5(input, NAMESPACE.DNS);
  uuidCache.set(input, uuid);
  return uuid;
}
```

### 4. 类型安全

```typescript
// ✅ 使用品牌类型确保 UUID 类型安全
type UUID = string & { readonly _brand: unique symbol };

function isUUID(value: string): value is UUID {
  return validate(value);
}

function toUUID(value: string): UUID | null {
  return isUUID(value) ? value : null;
}

// 使用
const uuid: UUID = uuidv4() as UUID;
const maybeUUID: UUID | null = toUUID('some-string');
```

## 常用命令

```bash
# 安装
npm install uuid

# TypeScript 支持
npm install -D @types/uuid

# 测试
npm test

# 构建
npm run build
```

## 版本对比

### UUID v1 (时间戳)

- ✅ 基于时间戳，可排序
- ✅ 全球唯一性高
- ⚠️ 暴露机器信息
- ⚠️ 时钟回拨问题

### UUID v3 (MD5)

- ✅ 确定性
- ✅ 基于命名空间
- ⚠️ MD5 不够安全
- ❌ 已被 v5 取代

### UUID v4 (随机)

- ✅ 简单易用
- ✅ 不暴露信息
- ✅ 最常用
- ⚠️ 不能排序

### UUID v5 (SHA-1)

- ✅ 确定性
- ✅ 基于命名空间
- ✅ 比 v3 更安全
- ✅ 推荐使用

## 扩展资源

- [UUID 官方文档](https://github.com/uuidjs/uuid)
- [RFC 4122](https://tools.ietf.org/html/rfc4122)
- [UUID 版本对比](https://en.wikipedia.org/wiki/Universally_unique_identifier)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
