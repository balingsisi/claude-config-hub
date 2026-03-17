# React Hot Toast 通知模板

## 技术栈

### 核心技术
- **react-hot-toast**: 轻量级 Toast 通知库
- **React**: UI 框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架

### 特性
- 轻量级（~ 5KB）
- 支持 Promise
- 自定义样式
- 位置控制
- 动画效果
- 可关闭通知

## 项目结构

```
react-hot-toast-project/
├── src/
│   ├── components/
│   │   ├── toast/
│   │   │   ├── ToastProvider.tsx
│   │   │   ├── ToastExamples.tsx
│   │   │   └── CustomToast.tsx
│   │   └── ui/
│   │       └── Button.tsx
│   ├── hooks/
│   │   └── useNotification.ts
│   ├── lib/
│   │   └── notifications.ts
│   ├── types/
│   │   └── toast.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 核心代码模式

### 1. 基础配置

```tsx
// src/components/toast/ToastProvider.tsx
import { Toaster } from "react-hot-toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#22c55e",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#ef4444",
            },
          },
        }}
      />
    </>
  );
}

// src/App.tsx
import { ToastProvider } from "./components/toast/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  );
}
```

### 2. 基础用法

```tsx
// src/components/toast/ToastExamples.tsx
import toast from "react-hot-toast";

export function ToastExamples() {
  const showSuccess = () => {
    toast.success("操作成功!");
  };

  const showError = () => {
    toast.error("操作失败!");
  };

  const showInfo = () => {
    toast("这是一条普通消息");
  };

  const showPromise = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.3;
        if (success) {
          resolve("数据加载成功");
        } else {
          reject("加载失败");
        }
      }, 2000);
    });

    toast.promise(promise, {
      loading: "加载中...",
      success: "加载成功!",
      error: "加载失败",
    });
  };

  return (
    <div className="space-y-4 p-4">
      <button onClick={showSuccess} className="btn btn-success">
        成功消息
      </button>
      <button onClick={showError} className="btn btn-error">
        错误消息
      </button>
      <button onClick={showInfo} className="btn btn-info">
        普通消息
      </button>
      <button onClick={showPromise} className="btn btn-primary">
        Promise 消息
      </button>
    </div>
  );
}
```

### 3. 自定义 Toast

```tsx
// src/components/toast/CustomToast.tsx
import toast, { Toast } from "react-hot-toast";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

export function showCustomToast(
  message: string,
  type: "success" | "error" = "success"
) {
  return toast.custom(
    (t: Toast) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {type === "success" ? (
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{message}</p>
              <p className="mt-1 text-sm text-gray-500">
                点击关闭此通知
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
          >
            关闭
          </button>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
}

// 使用示例
showCustomToast("自定义通知消息", "success");
```

### 4. 通知 Hook

```tsx
// src/hooks/useNotification.ts
import { useCallback } from "react";
import toast from "react-hot-toast";

export function useNotification() {
  const notify = useCallback((message: string) => {
    return toast(message);
  }, []);

  const success = useCallback((message: string) => {
    return toast.success(message);
  }, []);

  const error = useCallback((message: string) => {
    return toast.error(message);
  }, []);

  const loading = useCallback((message: string) => {
    return toast.loading(message);
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  const promise = useCallback(
    <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string;
        error: string;
      }
    ) => {
      return toast.promise(promise, messages);
    },
    []
  );

  return {
    notify,
    success,
    error,
    loading,
    dismiss,
    promise,
  };
}

// 使用示例
function MyComponent() {
  const { success, error, promise } = useNotification();

  const handleSubmit = async () => {
    promise(saveData(), {
      loading: "保存中...",
      success: "保存成功!",
      error: "保存失败",
    });
  };

  return <button onClick={handleSubmit}>保存</button>;
}
```

### 5. API 集成

```tsx
// src/lib/notifications.ts
import toast from "react-hot-toast";

export async function withToast<T>(
  promise: Promise<T>,
  messages: {
    loading?: string;
    success: string;
    error?: string;
  }
): Promise<T> {
  const toastId = toast.loading(messages.loading || "处理中...");

  try {
    const result = await promise;
    toast.success(messages.success, { id: toastId });
    return result;
  } catch (error) {
    const errorMessage = messages.error || error instanceof Error ? error.message : "操作失败";
    toast.error(errorMessage, { id: toastId });
    throw error;
  }
}

// 使用示例
import { withToast } from "@/lib/notifications";

async function handleDelete(id: string) {
  await withToast(deleteItem(id), {
    loading: "删除中...",
    success: "删除成功!",
    error: "删除失败",
  });
}
```

### 6. 表单验证通知

```tsx
// src/components/forms/FormWithToast.tsx
import { useState } from "react";
import toast from "react-hot-toast";

interface FormData {
  email: string;
  password: string;
}

export function FormWithToast() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const validateForm = (): boolean => {
    if (!formData.email) {
      toast.error("请输入邮箱地址");
      return false;
    }

    if (!formData.email.includes("@")) {
      toast.error("请输入有效的邮箱地址");
      return false;
    }

    if (!formData.password) {
      toast.error("请输入密码");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("密码至少需要 6 个字符");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const toastId = toast.loading("提交中...");

    try {
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("提交成功!", { id: toastId });
      setFormData({ email: "", password: "" });
    } catch (error) {
      toast.error("提交失败，请重试", { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="邮箱"
        className="input"
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="密码"
        className="input"
      />
      <button type="submit" className="btn btn-primary">
        提交
      </button>
    </form>
  );
}
```

### 7. 持久化通知

```tsx
// src/components/toast/PersistentToast.tsx
import toast from "react-hot-toast";

export function showPersistentNotification(message: string) {
  return toast(message, {
    duration: Infinity,
    position: "bottom-center",
    style: {
      background: "#1e40af",
      color: "#fff",
      maxWidth: "500px",
    },
  });
}

export function showDismissibleNotification(
  message: string,
  onDismiss?: () => void
) {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300 bg-white border-l-4 border-blue-500 p-4 shadow-md`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onDismiss?.();
            }}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>
    ),
    { duration: Infinity }
  );
}

// 使用示例
const toastId = showPersistentNotification("新版本可用！点击更新");
// 稍后关闭
toast.dismiss(toastId);
```

### 8. 通知队列管理

```tsx
// src/lib/toastQueue.ts
import toast from "react-hot-toast";

class ToastQueue {
  private queue: string[] = [];
  private maxVisible = 3;

  show(message: string, type: "success" | "error" | "info" = "info") {
    if (this.queue.length >= this.maxVisible) {
      const oldestToast = this.queue.shift();
      if (oldestToast) {
        toast.dismiss(oldestToast);
      }
    }

    let toastId: string;
    switch (type) {
      case "success":
        toastId = toast.success(message);
        break;
      case "error":
        toastId = toast.error(message);
        break;
      default:
        toastId = toast(message);
    }

    this.queue.push(toastId);
    return toastId;
  }

  dismissAll() {
    this.queue.forEach((id) => toast.dismiss(id));
    this.queue = [];
  }
}

export const toastQueue = new ToastQueue();

// 使用示例
import { toastQueue } from "@/lib/toastQueue";

toastQueue.show("第一条消息", "success");
toastQueue.show("第二条消息", "error");
toastQueue.show("第三条消息", "info");
// 第四条会自动关闭第一条
toastQueue.show("第四条消息", "success");
```

## 完整示例

```tsx
// src/App.tsx
import { ToastProvider } from "./components/toast/ToastProvider";
import { ToastExamples } from "./components/toast/ToastExamples";
import { FormWithToast } from "./components/forms/FormWithToast";

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold mb-8">React Hot Toast 示例</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">基础示例</h2>
            <ToastExamples />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">表单示例</h2>
            <FormWithToast />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
```

## package.json

```json
{
  "name": "react-hot-toast-project",
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
    "react-hot-toast": "^2.4.1",
    "@heroicons/react": "^2.1.1"
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

1. **统一通知管理**
   - 创建统一的 Hook 管理通知
   - 定义标准的通知类型和样式
   - 避免重复代码

2. **Promise 集成**
   - 使用 toast.promise 处理异步操作
   - 提供清晰的状态反馈
   - 自动管理加载状态

3. **错误处理**
   - 统一错误消息格式
   - 提供可操作的错误提示
   - 记录错误日志

4. **可访问性**
   - 使用 ARIA 属性
   - 提供键盘导航
   - 确保颜色对比度

5. **性能优化**
   - 限制同时显示的通知数量
   - 自动关闭不重要的通知
   - 避免频繁更新

6. **用户体验**
   - 合理设置持续时间
   - 允许用户手动关闭
   - 提供撤销操作选项

## 常见问题

**Q: 如何更改通知位置？**
A: 在 Toaster 组件中设置 position 属性：top-left, top-center, top-right, bottom-left, bottom-center, bottom-right

**Q: 如何创建自定义样式？**
A: 使用 toast.custom() 方法完全自定义通知内容和样式

**Q: 如何处理多个通知？**
A: 使用 toast.dismiss() 关闭特定通知，或创建通知队列管理系统

**Q: 如何在通知中添加操作按钮？**
A: 使用 toast.custom() 创建包含按钮的自定义组件

## 相关资源

- [React Hot Toast 官方文档](https://react-hot-toast.com/)
- [React Hot Toast GitHub](https://github.com/timolins/react-hot-toast)
- [示例和演示](https://react-hot-toast.com/docs)
