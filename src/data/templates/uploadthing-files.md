# Uploadthing 文件上传模板

## 技术栈

### 核心技术
- **Uploadthing**: 现代文件上传服务
- **Next.js 14+**: App Router 支持
- **TypeScript**: 类型安全
- **Zod**: 文件验证

### 上传功能
- **拖拽上传**: 直观的拖放界面
- **批量上传**: 多文件同时上传
- **进度追踪**: 实时上传进度
- **图片优化**: 自动压缩和格式转换
- **预览功能**: 上传前预览
- **断点续传**: 网络中断恢复

### 文件处理
- **类型验证**: MIME 类型检查
- **大小限制**: 灵活的文件大小控制
- **图片裁剪**: 客户端图片处理
- **水印添加**: 图片保护

## 项目结构

```
uploadthing-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── uploadthing/
│   │   │       └── route.ts       # Uploadthing API
│   │   ├── upload/
│   │   │   └── page.tsx           # 上传页面
│   │   └── files/
│   │       └── page.tsx           # 文件列表页面
│   ├── components/
│   │   ├── upload/
│   │   │   ├── file-uploader.tsx  # 主上传组件
│   │   │   ├── drop-zone.tsx      # 拖拽区域
│   │   │   ├── file-preview.tsx   # 文件预览
│   │   │   ├── upload-progress.tsx # 进度条
│   │   │   ├── file-list.tsx      # 文件列表
│   │   │   └── image-cropper.tsx  # 图片裁剪
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── dialog.tsx
│   ├── lib/
│   │   ├── uploadthing.ts         # Uploadthing 配置
│   │   ├── file-utils.ts          # 文件工具
│   │   └── validators.ts          # 验证规则
│   ├── hooks/
│   │   ├── use-upload.ts          # 上传 Hook
│   │   └── use-file-preview.ts    # 预览 Hook
│   └── types/
│       └── upload.ts
├── .env.local
├── next.config.js
└── package.json
```

## 代码模式

### 1. Uploadthing 配置

```typescript
// src/lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const f = createUploadthing();

// 验证用户身份
const handleAuth = async () => {
  const session = await auth();
  if (!session?.user) throw new UploadThingError("Unauthorized");
  return { userId: session.user.id };
};

// 文件路由配置
export const ourFileRouter = {
  // 头像上传
  avatarUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await handleAuth();
      return { ...user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar upload complete for userId:", metadata.userId);
      console.log("File URL:", file.ufsUrl);

      // 更新用户头像
      // await prisma.user.update({
      //   where: { id: metadata.userId },
      //   data: { avatar: file.ufsUrl },
      // });

      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // 图片上传（通用）
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  })
    .input(
      z.object({
        folder: z.string().optional(),
        category: z.enum(["product", "article", "gallery"]).optional(),
      })
    )
    .middleware(async ({ req, input }) => {
      const user = await handleAuth();
      return { userId: user.userId, ...input };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete:", file.ufsUrl);

      // 保存文件信息到数据库
      // await prisma.file.create({
      //   data: {
      //     name: file.name,
      //     url: file.ufsUrl,
      //     size: file.size,
      //     type: file.type,
      //     folder: metadata.folder,
      //     category: metadata.category,
      //     userId: metadata.userId,
      //   },
      // });

      return { url: file.ufsUrl, name: file.name };
    }),

  // 文档上传
  documentUploader: f({
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },
  })
    .middleware(async () => {
      return await handleAuth();
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  // 视频上传
  videoUploader: f({
    video: {
      maxFileSize: "128MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      return await handleAuth();
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Video upload complete:", file.ufsUrl);
      
      // 触发视频处理队列
      // await videoQueue.add("process-video", {
      //   url: file.ufsUrl,
      //   userId: metadata.userId,
      // });
      
      return { url: file.ufsUrl };
    }),

  // 任意文件上传
  attachmentUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 2 },
    audio: { maxFileSize: "32MB", maxFileCount: 5 },
    blob: { maxFileSize: "16MB", maxFileCount: 10 },
  })
    .middleware(async () => {
      return await handleAuth();
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Attachment upload complete:", file.ufsUrl);
      return { url: file.ufsUrl, type: file.type };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

### 2. API 路由

```typescript
// src/app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

### 3. 文件上传组件

```typescript
// src/components/upload/file-uploader.tsx
"use client";

import { useUploadThing } from "@/lib/uploadthing";
import { UploadDropzone } from "@/lib/uploadthing";
import { useCallback, useState } from "react";
import { FilePreview } from "./file-preview";
import { UploadProgress } from "./upload-progress";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploaderProps {
  endpoint: keyof typeof ourFileRouter;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  className?: string;
}

export function FileUploader({
  endpoint,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload, isUploading: uploadthingUploading } = useUploadThing(
    endpoint,
    {
      onClientUploadComplete: (res) => {
        setIsUploading(false);
        if (res) {
          const uploadedFiles = res.map((file) => ({
            url: file.ufsUrl,
            name: file.name,
            size: file.size,
            type: file.type,
          }));
          setFiles((prev) => [...prev, ...uploadedFiles]);
          onUploadComplete?.(uploadedFiles);
        }
      },
      onUploadError: (error) => {
        setIsUploading(false);
        onUploadError?.(error);
      },
      onUploadBegin: () => {
        setIsUploading(true);
      },
    }
  );

  const handleRemoveFile = useCallback((url: string) => {
    setFiles((prev) => prev.filter((file) => file.url !== url));
  }, []);

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      await startUpload(acceptedFiles);
    },
    [startUpload]
  );

  return (
    <div className={className}>
      {/* 拖拽上传区域 */}
      <UploadDropzone
        endpoint={endpoint}
        onDrop={(acceptedFiles) => handleDrop(acceptedFiles)}
        appearance={{
          container: {
            border: "2px dashed #d1d5db",
            borderRadius: "12px",
            padding: "40px",
            backgroundColor: "#f9fafb",
            cursor: "pointer",
          },
          uploadIcon: {
            color: "#9ca3af",
          },
          label: {
            color: "#374151",
            fontSize: "14px",
          },
          allowedContent: {
            color: "#6b7280",
            fontSize: "12px",
          },
        }}
        content={{
          label: "Drag & drop files here, or click to select",
          allowedContent: "Images, videos, and documents up to 16MB",
        }}
      />

      {/* 上传进度 */}
      {isUploading && <UploadProgress />}

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length})
          </h3>
          <div className="grid gap-2">
            {files.map((file) => (
              <FilePreview
                key={file.url}
                file={file}
                onRemove={() => handleRemoveFile(file.url)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. 拖拽上传区域

```typescript
// src/components/upload/drop-zone.tsx
"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, File, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function DropZone({
  onDrop,
  accept,
  maxFiles = 10,
  maxSize = 16 * 1024 * 1024, // 16MB
  disabled = false,
  className,
  children,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach((file) => {
        // 检查文件大小
        if (file.size > maxSize) {
          errors.push(`${file.name} exceeds maximum size of ${maxSize / 1024 / 1024}MB`);
          return;
        }

        // 检查文件类型
        if (accept) {
          const acceptedTypes = Object.values(accept).flat();
          const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
          const isAccepted = acceptedTypes.some(
            (type) =>
              type === file.type ||
              type === fileExtension ||
              file.type.startsWith(type.replace("/*", ""))
          );

          if (!isAccepted) {
            errors.push(`${file.name} is not an accepted file type`);
            return;
          }
        }

        validFiles.push(file);
      });

      // 检查文件数量
      if (validFiles.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return validFiles.slice(0, maxFiles);
      }

      if (errors.length > 0) {
        setError(errors.join(", "));
      } else {
        setError(null);
      }

      return validFiles;
    },
    [accept, maxFiles, maxSize]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(droppedFiles);

      if (validFiles.length > 0) {
        onDrop(validFiles);
      }
    },
    [disabled, validateFiles, onDrop]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const validFiles = validateFiles(selectedFiles);

      if (validFiles.length > 0) {
        onDrop(validFiles);
      }

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [validateFiles, onDrop]
  );

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed transition-colors",
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={
          accept
            ? Object.entries(accept)
                .map(([mimeType, exts]) => `${mimeType},${exts.join(",")}`)
                .join(",")
            : undefined
        }
        multiple={maxFiles > 1}
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {children || (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="mb-4 rounded-full bg-gray-100 p-4">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Drag & drop files here
          </p>
          <p className="text-xs text-gray-500">
            or click to browse
          </p>
        </div>
      )}

      {error && (
        <div className="absolute bottom-2 left-2 right-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
```

### 5. 文件预览

```typescript
// src/components/upload/file-preview.tsx
"use client";

import { useState } from "react";
import { File, Image as ImageIcon, X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  file: {
    url: string;
    name: string;
    size: number;
    type: string;
  };
  onRemove?: () => void;
  showActions?: boolean;
  className?: string;
}

export function FilePreview({
  file,
  onRemove,
  showActions = true,
  className,
}: FilePreviewProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");
  const isPDF = file.type === "application/pdf";

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-8 w-8" />;
    if (isVideo) return <File className="h-8 w-8 text-purple-500" />;
    if (isAudio) return <File className="h-8 w-8 text-green-500" />;
    if (isPDF) return <File className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-white p-3",
        className
      )}
    >
      {/* 缩略图/图标 */}
      <div className="flex-shrink-0">
        {isImage && !imageError ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
            <img
              src={file.url}
              alt={file.name}
              className={cn(
                "h-full w-full object-cover transition-opacity",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        ) : isVideo ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-purple-100">
            <video
              src={file.url}
              className="h-full w-full object-cover"
              muted
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
            {getFileIcon()}
          </div>
        )}
      </div>

      {/* 文件信息 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {file.name}
        </p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
      </div>

      {/* 操作按钮 */}
      {showActions && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => window.open(file.url, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              const a = document.createElement("a");
              a.href = file.url;
              a.download = file.name;
              a.click();
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

### 6. 上传进度

```typescript
// src/components/upload/upload-progress.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface UploadProgressProps {
  progress?: number;
  fileName?: string;
}

export function UploadProgress({ progress, fileName }: UploadProgressProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 rounded-lg border bg-blue-50 p-4">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            {fileName ? `Uploading ${fileName}` : "Uploading"}{dots}
          </p>
          {progress !== undefined && (
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-blue-700">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 7. 图片裁剪

```typescript
// src/components/upload/image-cropper.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RotateCw, FlipHorizontal, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperProps {
  file: File | null;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  open: boolean;
}

export function ImageCropper({
  file,
  onCrop,
  onCancel,
  aspectRatio = 1,
  open,
}: ImageCropperProps) {
  const cropperRef = useRef<Cropper>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // 加载图片
  useState(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [file]);

  const handleCrop = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    cropper.getCroppedCanvas().toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, "image/jpeg", 0.9);
  }, [onCrop]);

  const handleRotate = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    cropper?.rotate(90);
  }, []);

  const handleFlip = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    const data = cropper?.getData();
    if (data) {
      cropper?.scaleX(data.scaleX === -1 ? 1 : -1);
    }
  }, []);

  const handleZoom = useCallback((direction: "in" | "out") => {
    const cropper = cropperRef.current?.cropper;
    if (direction === "in") {
      cropper?.zoom(0.1);
    } else {
      cropper?.zoom(-0.1);
    }
  }, []);

  const handleReset = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    cropper?.reset();
  }, []);

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 裁剪器 */}
          <div className="max-h-[500px] overflow-hidden rounded-lg bg-gray-100">
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              style={{ height: 400, width: "100%" }}
              aspectRatio={aspectRatio}
              guides={true}
              viewMode={1}
              dragMode="move"
              responsive={true}
              restore={false}
              checkCrossOrigin={false}
            />
          </div>

          {/* 工具栏 */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFlip}>
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleZoom("in")}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleZoom("out")}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleCrop}>Crop & Upload</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 8. 上传 Hook

```typescript
// src/hooks/use-upload.ts
"use client";

import { useState, useCallback } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import type { OurFileRouter } from "@/lib/uploadthing";

interface UseUploadOptions {
  endpoint: keyof OurFileRouter;
  onUploadComplete?: (files: Array<{ url: string; name: string }>) => void;
  onUploadError?: (error: Error) => void;
}

export function useUpload({ endpoint, onUploadComplete, onUploadError }: UseUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);

  const { startUpload, isUploading: uploadthingUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      setProgress(100);
      if (res) {
        const files = res.map((file) => ({
          url: file.ufsUrl,
          name: file.name,
        }));
        setUploadedFiles((prev) => [...prev, ...files]);
        onUploadComplete?.(files);
      }
    },
    onUploadError: (error) => {
      setIsUploading(false);
      setProgress(0);
      onUploadError?.(error);
    },
    onUploadProgress: (progress) => {
      setProgress(progress);
    },
  });

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setIsUploading(true);
      setProgress(0);

      try {
        await startUpload(files);
      } catch (error) {
        setIsUploading(false);
        setProgress(0);
        throw error;
      }
    },
    [startUpload]
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setUploadedFiles([]);
  }, []);

  return {
    upload,
    isUploading,
    progress,
    uploadedFiles,
    reset,
  };
}
```

### 9. 文件工具

```typescript
// src/lib/file-utils.ts

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * 检查是否为图片
 */
export function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * 检查是否为视频
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith("video/");
}

/**
 * 检查是否为音频
 */
export function isAudio(file: File): boolean {
  return file.type.startsWith("audio/");
}

/**
 * 获取图片尺寸
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!isImage(file)) {
      reject(new Error("File is not an image"));
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 压缩图片
 */
export function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!isImage(file)) {
      reject(new Error("File is not an image"));
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // 计算缩放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/jpeg",
        quality
      );

      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFilename(originalName: string): string {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${extension}`;
}
```

## 最佳实践

### 1. 文件验证

```typescript
// ✅ 服务端验证
.middleware(async ({ req }) => {
  const user = await handleAuth();
  return { userId: user.userId };
})

// ✅ 客户端预验证
const validateFile = (file: File) => {
  const maxSize = 16 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    throw new Error(`File ${file.name} exceeds maximum size`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  return true;
};
```

### 2. 错误处理

```typescript
// ✅ 优雅的错误处理
const handleUploadError = (error: Error) => {
  if (error.message.includes("Invalid file type")) {
    toast.error("Invalid file type. Please upload a valid image.");
  } else if (error.message.includes("File too large")) {
    toast.error("File is too large. Maximum size is 16MB.");
  } else if (error.message.includes("Unauthorized")) {
    toast.error("Please sign in to upload files.");
    router.push("/login");
  } else {
    toast.error("Upload failed. Please try again.");
  }
  console.error("Upload error:", error);
};
```

### 3. 性能优化

```typescript
// ✅ 压缩图片后上传
const handleImageUpload = async (file: File) => {
  if (isImage(file)) {
    const compressed = await compressImage(file, 1920, 1080, 0.8);
    await startUpload([new File([compressed], file.name)]);
  } else {
    await startUpload([file]);
  }
};

// ✅ 批量上传时分批处理
const batchUpload = async (files: File[], batchSize = 5) => {
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map((file) => uploadFile(file)));
  }
};
```

## 常用命令

```bash
# 安装依赖
npm install uploadthing @uploadthing/react
npm install zod

# 启动开发服务器
npm run dev

# 生成 TypeScript 类型
npm run build
```

## 部署配置

### 环境变量

```bash
# .env.local
UPLOADTHING_SECRET=sk_live_xxx
UPLOADTHING_APP_ID=xxx
NEXT_PUBLIC_UPLOADTHING_URL=https://uploadthing.com
```

### Vercel 部署

```bash
vercel env add UPLOADTHING_SECRET
vercel env add UPLOADTHING_APP_ID
vercel --prod
```

## 参考资源

- [Uploadthing 官方文档](https://docs.uploadthing.com/)
- [React 集成](https://docs.uploadthing.com/getting-started/react)
- [文件验证](https://docs.uploadthing.com/file-validation)
- [API 参考](https://docs.uploadthing.com/api-reference)
