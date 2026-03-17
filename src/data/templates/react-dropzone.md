# React Dropzone 文件上传模板

## 技术栈

### 核心技术
- **react-dropzone**: 拖拽上传组件库
- **React**: UI 框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架

### 特性
- 拖拽上传
- 点击上传
- 文件类型验证
- 文件大小限制
- 多文件上传
- 上传进度显示

## 项目结构

```
react-dropzone-project/
├── src/
│   ├── components/
│   │   ├── upload/
│   │   │   ├── DropzoneUploader.tsx
│   │   │   ├── FilePreview.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── FileList.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Card.tsx
│   ├── hooks/
│   │   ├── useFileUpload.ts
│   │   └── useFileValidation.ts
│   ├── lib/
│   │   ├── fileUtils.ts
│   │   └── uploadService.ts
│   ├── types/
│   │   └── upload.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 核心代码模式

### 1. 基础 Dropzone

```tsx
// src/components/upload/DropzoneUploader.tsx
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FilePreview } from "./FilePreview";

interface FileWithPreview extends File {
  preview?: string;
}

export function DropzoneUploader() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );

    setFiles((prevFiles) => [...prevFiles, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "application/pdf": [".pdf"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const removeFile = (file: FileWithPreview) => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFiles(files.filter((f) => f !== file));
  };

  // 清理预览 URL
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-600">放开文件以上传...</p>
        ) : (
          <div>
            <p className="text-gray-600">
              拖拽文件到此处，或点击选择文件
            </p>
            <p className="text-sm text-gray-400 mt-2">
              支持 PNG, JPG, PDF 格式，最大 5MB
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <FilePreview
              key={index}
              file={file}
              onRemove={() => removeFile(file)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. 文件预览组件

```tsx
// src/components/upload/FilePreview.tsx
import { useState } from "react";

interface FilePreviewProps {
  file: File & { preview?: string };
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [isImage, setIsImage] = useState(file.type.startsWith("image/"));

  return (
    <div className="relative group">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        {isImage && file.preview ? (
          <img
            src={file.preview}
            alt={file.name}
            className="w-full h-full object-cover"
            onLoad={() => {
              URL.revokeObjectURL(file.preview!);
            }}
          />
        ) : (
          <div className="text-center p-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm text-gray-600 mt-2 truncate">
              {file.name}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onRemove}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mt-2">
        <p className="text-sm text-gray-600 truncate">{file.name}</p>
        <p className="text-xs text-gray-400">
          {(file.size / 1024).toFixed(2)} KB
        </p>
      </div>
    </div>
  );
}
```

### 3. 上传进度组件

```tsx
// src/components/upload/UploadProgress.tsx
interface UploadProgressProps {
  progress: number;
  fileName: string;
  status: "uploading" | "success" | "error";
}

export function UploadProgress({ progress, fileName, status }: UploadProgressProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 truncate flex-1">
          {fileName}
        </span>
        <span className="ml-2 text-sm text-gray-500">
          {status === "uploading" ? `${progress}%` : status === "success" ? "✓" : "✗"}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            status === "success"
              ? "bg-green-500"
              : status === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

### 4. 文件上传 Hook

```tsx
// src/hooks/useFileUpload.ts
import { useState, useCallback } from "react";

interface UploadFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function useFileUpload(uploadUrl: string) {
  const [uploads, setUploads] = useState<UploadFile[]>([]);

  const uploadFile = useCallback(
    async (file: File) => {
      const uploadId = Date.now().toString();
      
      // 添加到上传列表
      setUploads((prev) => [
        ...prev,
        { file, progress: 0, status: "pending" },
      ]);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploads((prev) =>
              prev.map((upload) =>
                upload.file === file
                  ? { ...upload, progress, status: "uploading" }
                  : upload
              )
            );
          }
        });

        const response = await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error("上传失败"));
            }
          };
          xhr.onerror = () => reject(new Error("网络错误"));

          xhr.open("POST", uploadUrl);
          xhr.send(formData);
        });

        setUploads((prev) =>
          prev.map((upload) =>
            upload.file === file
              ? { ...upload, progress: 100, status: "success" }
              : upload
          )
        );

        return response;
      } catch (error) {
        setUploads((prev) =>
          prev.map((upload) =>
            upload.file === file
              ? {
                  ...upload,
                  status: "error",
                  error: error instanceof Error ? error.message : "上传失败",
                }
              : upload
          )
        );
        throw error;
      }
    },
    [uploadUrl]
  );

  const uploadMultiple = useCallback(
    async (files: File[]) => {
      return Promise.all(files.map(uploadFile));
    },
    [uploadFile]
  );

  const removeUpload = useCallback((file: File) => {
    setUploads((prev) => prev.filter((upload) => upload.file !== file));
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  return {
    uploads,
    uploadFile,
    uploadMultiple,
    removeUpload,
    clearUploads,
  };
}
```

### 5. 文件验证 Hook

```tsx
// src/hooks/useFileValidation.ts
import { useCallback } from "react";

interface ValidationRules {
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
  maxFiles?: number;
}

export function useFileValidation(rules: ValidationRules) {
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // 检查文件大小
      if (rules.maxSize && file.size > rules.maxSize) {
        return {
          valid: false,
          error: `文件大小不能超过 ${(rules.maxSize / 1024 / 1024).toFixed(2)}MB`,
        };
      }

      // 检查文件格式
      if (rules.acceptedFormats && rules.acceptedFormats.length > 0) {
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const isValidFormat = rules.acceptedFormats.some(
          (format) => format.toLowerCase() === fileExtension
        );

        if (!isValidFormat) {
          return {
            valid: false,
            error: `不支持的文件格式。支持的格式: ${rules.acceptedFormats.join(", ")}`,
          };
        }
      }

      return { valid: true };
    },
    [rules]
  );

  const validateFiles = useCallback(
    (files: File[]): { valid: boolean; errors: Map<File, string> } => {
      const errors = new Map<File, string>();

      // 检查文件数量
      if (rules.maxFiles && files.length > rules.maxFiles) {
        files.slice(rules.maxFiles).forEach((file) => {
          errors.set(file, `最多只能上传 ${rules.maxFiles} 个文件`);
        });
      }

      // 验证每个文件
      files.forEach((file) => {
        const result = validateFile(file);
        if (!result.valid && result.error) {
          errors.set(file, result.error);
        }
      });

      return {
        valid: errors.size === 0,
        errors,
      };
    },
    [rules, validateFile]
  );

  return { validateFile, validateFiles };
}
```

### 6. 文件工具函数

```typescript
// src/lib/fileUtils.ts
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf";
}

export async function compressImage(
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("图片压缩失败"));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 7. 高级上传组件

```tsx
// src/components/upload/AdvancedUploader.tsx
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFileValidation } from "@/hooks/useFileValidation";
import { FilePreview } from "./FilePreview";
import { UploadProgress } from "./UploadProgress";
import { compressImage } from "@/lib/fileUtils";

export function AdvancedUploader() {
  const [files, setFiles] = useState<(File & { preview?: string })[]>([]);
  const { uploads, uploadMultiple, clearUploads } = useFileUpload("/api/upload");
  const { validateFile } = useFileValidation({
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: [".jpg", ".jpeg", ".png", ".pdf"],
    maxFiles: 5,
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // 验证文件
      const validFiles: File[] = [];
      const errors: string[] = [];

      acceptedFiles.forEach((file) => {
        const result = validateFile(file);
        if (result.valid) {
          validFiles.push(file);
        } else if (result.error) {
          errors.push(`${file.name}: ${result.error}`);
        }
      });

      if (errors.length > 0) {
        alert(errors.join("\n"));
      }

      // 压缩图片
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          if (file.type.startsWith("image/")) {
            try {
              return await compressImage(file, 1920, 1080, 0.8);
            } catch {
              return file;
            }
          }
          return file;
        })
      );

      // 添加预览
      const filesWithPreview = processedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        })
      );

      setFiles((prev) => [...prev, ...filesWithPreview]);
    },
    [validateFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
  });

  const handleUpload = async () => {
    await uploadMultiple(files);
    setFiles([]);
  };

  const removeFile = (file: File) => {
    if ("preview" in file && file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFiles(files.filter((f) => f !== file));
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-blue-400"
          }`}
      >
        <input {...getInputProps()} />
        <svg
          className="mx-auto h-16 w-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-lg text-gray-700 mb-2">
          拖拽文件到此处上传
        </p>
        <p className="text-sm text-gray-500">
          或点击选择文件
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">待上传文件</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <FilePreview
                key={index}
                file={file}
                onRemove={() => removeFile(file)}
              />
            ))}
          </div>
          <button
            onClick={handleUpload}
            className="btn btn-primary"
          >
            上传 {files.length} 个文件
          </button>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">上传进度</h3>
            <button
              onClick={clearUploads}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              清空
            </button>
          </div>
          <div className="space-y-2">
            {uploads.map((upload, index) => (
              <UploadProgress
                key={index}
                progress={upload.progress}
                fileName={upload.file.name}
                status={upload.status}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 8. 完整应用示例

```tsx
// src/App.tsx
import { AdvancedUploader } from "./components/upload/AdvancedUploader";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            文件上传示例
          </h1>
          <p className="mt-2 text-gray-600">
            拖拽或点击上传文件
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <AdvancedUploader />
        </div>
      </div>
    </div>
  );
}
```

## package.json

```json
{
  "name": "react-dropzone-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.2.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
```

## 最佳实践

1. **文件验证**
   - 前端和后端都要验证
   - 检查文件类型和大小
   - 提供清晰的错误提示

2. **用户体验**
   - 显示上传进度
   - 支持拖拽上传
   - 提供文件预览
   - 允许取消上传

3. **性能优化**
   - 压缩图片
   - 分片上传大文件
   - 限制并发上传数量

4. **错误处理**
   - 网络错误重试
   - 文件类型错误提示
   - 上传失败恢复

5. **安全性**
   - 验证文件内容而非仅扩展名
   - 限制文件大小
   - 使用 HTTPS

## 常见问题

**Q: 如何限制文件类型？**
A: 在 useDropzone 的 accept 属性中指定 MIME 类型和扩展名

**Q: 如何处理大文件上传？**
A: 使用分片上传，将大文件分割成小块逐个上传

**Q: 如何显示上传进度？**
A: 使用 XMLHttpRequest 或 Axios 的 onUploadProgress 回调

**Q: 如何预览非图片文件？**
A: 根据文件类型显示相应图标或使用第三方库渲染预览

## 相关资源

- [React Dropzone 官方文档](https://react-dropzone.js.org/)
- [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
