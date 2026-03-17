# Cloudflare R2 对象存储开发模板

## 技术栈

- **核心**: Cloudflare R2 (S3-compatible object storage)
- **SDK**: @aws-sdk/client-s3 (S3 兼容)
- **运行时**: Node.js / Edge Runtime / Workers
- **签名**: @aws-sdk/s3-request-presigner
- **上传**: Multipart / Presigned URLs

## 项目结构

```
cloudflare-r2-project/
├── src/
│   ├── lib/
│   │   ├── r2.ts              # R2 客户端配置
│   │   └── signed-url.ts      # 签名 URL 生成
│   ├── services/
│   │   ├── bucket.ts          # 存储桶操作
│   │   ├── object.ts          # 对象操作
│   │   └── upload.ts          # 上传服务
│   ├── routes/
│   │   ├── upload.ts
│   │   └── download.ts
│   └── index.ts
├── wrangler.toml              # Cloudflare Workers 配置
├── package.json
└── tsconfig.json
```

## 代码模式

### 客户端配置

```typescript
// src/lib/r2.ts
import { S3Client } from '@aws-sdk/client-s3';

// Node.js 环境
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Cloudflare Workers 环境
export function createR2Client(env: Env) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// 使用 R2 原生绑定（Workers 专用）
export function getR2Binding(env: Env): R2Bucket {
  return env.MY_BUCKET; // wrangler.toml 中定义的绑定
}
```

### 存储桶操作

```typescript
// src/services/bucket.ts
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { r2 } from '../lib/r2';

export class BucketService {
  // 创建存储桶
  async create(bucketName: string) {
    await r2.send(
      new CreateBucketCommand({
        Bucket: bucketName,
      })
    );
  }

  // 删除存储桶
  async delete(bucketName: string) {
    await r2.send(
      new DeleteBucketCommand({
        Bucket: bucketName,
      })
    );
  }

  // 列出所有存储桶
  async list() {
    const result = await r2.send(new ListBucketsCommand({}));
    return result.Buckets || [];
  }

  // 检查存储桶是否存在
  async exists(bucketName: string): Promise<boolean> {
    try {
      await r2.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch {
      return false;
    }
  }

  // 配置 CORS
  async setCors(bucketName: string) {
    await r2.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedOrigins: ['*'], // 生产环境应限制
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
  }
}
```

### 对象操作

```typescript
// src/services/object.ts
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { r2 } from '../lib/r2';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class ObjectService {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  // 上传对象
  async upload(
    key: string,
    body: Buffer | Uint8Array | string,
    options: {
      contentType?: string;
      metadata?: Record<string, string>;
      cacheControl?: string;
    } = {}
  ) {
    const result = await r2.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        Metadata: options.metadata,
        CacheControl: options.cacheControl,
      })
    );

    return {
      key,
      etag: result.ETag,
      versionId: result.VersionId,
    };
  }

  // 下载对象
  async download(key: string) {
    const result = await r2.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    return {
      body: await result.Body?.transformToByteArray(),
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      etag: result.ETag,
      metadata: result.Metadata,
    };
  }

  // 获取对象流
  async getStream(key: string) {
    const result = await r2.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    return result.Body;
  }

  // 删除对象
  async delete(key: string) {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  // 批量删除
  async deleteBatch(keys: string[]) {
    const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      })
    );
  }

  // 列出对象
  async list(options: { prefix?: string; limit?: number; cursor?: string } = {}) {
    const result = await r2.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: options.prefix,
        MaxKeys: options.limit || 1000,
        ContinuationToken: options.cursor,
      })
    );

    return {
      objects: result.Contents?.map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag,
      })) || [],
      nextCursor: result.NextContinuationToken,
      isTruncated: result.IsTruncated,
    };
  }

  // 获取对象元数据
  async head(key: string) {
    const result = await r2.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    return {
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      lastModified: result.LastModified,
      etag: result.ETag,
      metadata: result.Metadata,
    };
  }

  // 复制对象
  async copy(sourceKey: string, destKey: string) {
    await r2.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destKey,
      })
    );
  }

  // 生成公开访问 URL（需要开启公开访问）
  getPublicUrl(key: string): string {
    return `https://pub-${this.bucket}.r2.dev/${key}`;
    // 或自定义域名
    // return `https://cdn.example.com/${key}`;
  }
}
```

### 预签名 URL

```typescript
// src/lib/signed-url.ts
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { r2 } from './r2';

export class SignedUrlService {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  // 生成上传 URL（客户端直传）
  async getUploadUrl(
    key: string,
    options: {
      expiresIn?: number;
      contentType?: string;
      contentLengthRange?: { min: number; max: number };
    } = {}
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options.contentType,
      // R2 支持的条件限制
      ...(options.contentLengthRange && {
        ContentLengthRange: options.contentLengthRange,
      }),
    });

    return getSignedUrl(r2, command, {
      expiresIn: options.expiresIn || 3600, // 默认 1 小时
    });
  }

  // 生成下载 URL
  async getDownloadUrl(
    key: string,
    options: {
      expiresIn?: number;
      responseContentType?: string;
      responseContentDisposition?: string;
    } = {}
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentType: options.responseContentType,
      ResponseContentDisposition: options.responseContentDisposition,
    });

    return getSignedUrl(r2, command, {
      expiresIn: options.expiresIn || 3600,
    });
  }

  // 完整的上传流程
  async createUploadSession(
    filename: string,
    options: {
      folder?: string;
      maxSize?: number;
      allowedTypes?: string[];
    } = {}
  ) {
    // 生成唯一文件名
    const ext = filename.split('.').pop();
    const key = options.folder
      ? `${options.folder}/${crypto.randomUUID()}.${ext}`
      : `${crypto.randomUUID()}.${ext}`;

    const uploadUrl = await this.getUploadUrl(key, {
      expiresIn: 3600,
      contentType: options.allowedTypes?.[0],
      contentLengthRange: {
        min: 0,
        max: options.maxSize || 10 * 1024 * 1024, // 默认 10MB
      },
    });

    return {
      uploadUrl,
      key,
      expiresIn: 3600,
    };
  }
}
```

### 分片上传

```typescript
// src/services/upload.ts
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from '@aws-sdk/client-s3';
import { r2 } from '../lib/r2';

export class MultipartUploadService {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  // 初始化分片上传
  async init(key: string, contentType?: string) {
    const result = await r2.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      })
    );

    return {
      uploadId: result.UploadId!,
      key,
    };
  }

  // 上传分片
  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer | Uint8Array
  ) {
    const result = await r2.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
      })
    );

    return {
      partNumber,
      etag: result.ETag!,
    };
  }

  // 完成分片上传
  async complete(
    key: string,
    uploadId: string,
    parts: { partNumber: number; etag: string }[]
  ) {
    const result = await r2.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((p) => ({
            PartNumber: p.partNumber,
            ETag: p.etag,
          })),
        },
      })
    );

    return {
      location: result.Location,
      etag: result.ETag,
    };
  }

  // 取消分片上传
  async abort(key: string, uploadId: string) {
    await r2.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      })
    );
  }

  // 列出已上传的分片
  async listParts(key: string, uploadId: string) {
    const result = await r2.send(
      new ListPartsCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      })
    );

    return result.Parts?.map((part) => ({
      partNumber: part.PartNumber,
      etag: part.ETag,
      size: part.Size,
    }));
  }

  // 完整的大文件上传流程
  async uploadLargeFile(
    key: string,
    file: File | Blob,
    options: {
      chunkSize?: number;
      onProgress?: (uploaded: number, total: number) => void;
    } = {}
  ) {
    const { chunkSize = 5 * 1024 * 1024 } = options; // 默认 5MB
    const totalSize = file.size;
    const totalChunks = Math.ceil(totalSize / chunkSize);

    // 初始化
    const { uploadId } = await this.init(key);
    const parts: { partNumber: number; etag: string }[] = [];
    let uploaded = 0;

    try {
      // 上传每个分片
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunk = file.slice(start, end);
        const buffer = await chunk.arrayBuffer();

        const result = await this.uploadPart(
          key,
          uploadId,
          i + 1,
          new Uint8Array(buffer)
        );

        parts.push(result);
        uploaded += end - start;
        options.onProgress?.(uploaded, totalSize);
      }

      // 完成
      return await this.complete(key, uploadId, parts);
    } catch (error) {
      // 失败时取消
      await this.abort(key, uploadId);
      throw error;
    }
  }
}
```

### Workers 集成

```typescript
// src/index.ts (Cloudflare Workers)
import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  MY_BUCKET: R2Bucket;
  ALLOWED_ORIGINS: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());

// 上传文件
app.put('/upload/:key', async (c) => {
  const key = c.req.param('key');
  const bucket = c.env.MY_BUCKET;
  
  const body = await c.req.arrayBuffer();
  const contentType = c.req.header('Content-Type') || 'application/octet-stream';

  await bucket.put(key, body, {
    httpMetadata: {
      contentType,
    },
  });

  return c.json({ success: true, key });
});

// 下载文件
app.get('/download/:key', async (c) => {
  const key = c.req.param('key');
  const bucket = c.env.MY_BUCKET;
  
  const object = await bucket.get(key);
  
  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  return new Response(object.body, { headers });
});

// 预签名上传 URL
app.post('/presign-upload', async (c) => {
  const { filename, contentType } = await c.req.json();
  const bucket = c.env.MY_BUCKET;
  
  // 生成唯一 key
  const key = `uploads/${crypto.randomUUID()}/${filename}`;
  
  // 创建上传 URL
  const url = await bucket.createSignedUploadUrl(key, {
    expiresIn: 3600,
    httpMetadata: {
      contentType,
    },
  });

  return c.json({ uploadUrl: url, key });
});

// 预签名下载 URL
app.post('/presign-download', async (c) => {
  const { key } = await c.req.json();
  const bucket = c.env.MY_BUCKET;
  
  const url = await bucket.createSignedUrl(key, {
    expiresIn: 3600,
  });

  return c.json({ downloadUrl: url });
});

// 列出文件
app.get('/list', async (c) => {
  const bucket = c.env.MY_BUCKET;
  const prefix = c.req.query('prefix') || '';
  
  const listed = await bucket.list({ prefix });
  
  return c.json({
    objects: listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    })),
    truncated: listed.truncated,
    cursor: listed.truncated ? listed.cursor : undefined,
  });
});

// 删除文件
app.delete('/delete/:key', async (c) => {
  const key = c.req.param('key');
  const bucket = c.env.MY_BUCKET;
  
  await bucket.delete(key);
  
  return c.json({ success: true });
});

export default app;
```

## 最佳实践

### 1. 文件上传验证

```typescript
// 上传验证中间件
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

async function validateUpload(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large' };
  }

  // 可选：验证文件签名
  const buffer = await file.slice(0, 8).arrayBuffer();
  const signature = new Uint8Array(buffer);
  
  if (!isValidSignature(signature, file.type)) {
    return { valid: false, error: 'Invalid file signature' };
  }

  return { valid: true };
}

function isValidSignature(signature: Uint8Array, type: string): boolean {
  // JPEG: FF D8 FF
  if (type === 'image/jpeg') {
    return signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  }
  // PNG: 89 50 4E 47
  if (type === 'image/png') {
    return signature[0] === 0x89 && signature[1] === 0x50;
  }
  // ... 其他类型
  return true;
}
```

### 2. 缓存策略

```typescript
// 上传时设置缓存
async function uploadWithCache(key: string, body: Buffer, contentType: string) {
  const objectService = new ObjectService('my-bucket');
  
  await objectService.upload(key, body, {
    contentType,
    cacheControl: 'public, max-age=31536000, immutable', // 1 年
  });
}

// Workers 响应头
app.get('/download/:key', async (c) => {
  const object = await c.env.MY_BUCKET.get(c.req.param('key'));
  
  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  
  // 设置缓存
  headers.set('Cache-Control', 'public, max-age=31536000');
  headers.set('CDN-Cache-Control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
});
```

### 3. 图片处理

```typescript
// 使用 Cloudflare Images 处理 R2 图片
async function getImageUrl(key: string, options: {
  width?: number;
  height?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop';
  format?: 'auto' | 'webp' | 'avif' | 'json';
} = {}): Promise<string> {
  const params = new URLSearchParams();
  
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.fit) params.set('fit', options.fit);
  if (options.format) params.set('format', options.format);

  // 使用 Cloudflare Images 变换
  return `https://cdn.example.com/cdn-cgi/image/${params.toString()}/${key}`;
}
```

## 常用命令

```bash
# 安装
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Wrangler CLI
wrangler r2 bucket create my-bucket
wrangler r2 bucket list
wrangler r2 bucket delete my-bucket

# 上传文件
wrangler r2 object put my-bucket/file.txt --file ./local-file.txt

# 下载文件
wrangler r2 object get my-bucket/file.txt --file ./downloaded.txt

# 删除文件
wrangler r2 object delete my-bucket/file.txt

# 本地开发
wrangler dev

# 部署
wrangler deploy
```

## 部署配置

### Wrangler 配置

```toml
# wrangler.toml
name = "my-r2-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"

[vars]
ALLOWED_ORIGINS = "https://example.com"

# 开发环境
[env.development]
[[env.development.r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket-dev"

# 生产环境
[env.production]
[[env.production.r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"
```

### 自定义域名

```toml
# wrangler.toml
[[routes]]
pattern = "cdn.example.com/*"
custom_domain = true
zone_name = "example.com"
```

### 环境变量

```bash
# .env
CLOUDFLARE_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=my-bucket
```

## 扩展资源

- [R2 官方文档](https://developers.cloudflare.com/r2/)
- [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/)
- [S3 兼容性](https://developers.cloudflare.com/r2/api/s3/)
- [定价](https://developers.cloudflare.com/r2/pricing/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
