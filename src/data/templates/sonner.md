# Sonner Toast 通知模板

## 技术栈

### 核心技术
- **sonner**: Toast 通知库
- **React**: UI 框架
- **TypeScript**: 类型安全

### 特性
- 轻量级（< 5KB）
- 零配置
- Promise 支持
- 自定义样式
- 位置控制
- 关闭控制

## 项目结构

```
sonner-toast-project/
├── src/
│   ├── components/
│   │   ├── toast/
│   │   │   ├── ToastProvider.tsx
│   │   │   ├── ToastDemo.tsx
│   │   │   └── ToastExamples.tsx
│   │   └── ui/
│   │       └── Button.tsx
│   ├── hooks/
│   │   └── useToast.ts
│   ├── lib/
│   │   └── notifications.ts
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
import { Toaster } from "sonner";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
        expand={false}
        theme="light"
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
// src/components/toast/ToastDemo.tsx
import { toast } from "sonner";

export function ToastDemo() {
  return (
    <div className="space-y-4 p-4">
      {/* 基础消息 */}
      <button
        onClick={() => toast("我的第一条消息")}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        显示消息
      </button>

      {/* 成功消息 */}
      <button
        onClick={() => toast.success("操作成功!")}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        成功
      </button>

      {/* 错误消息 */}
      <button
        onClick={() => toast.error("操作失败!")}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        错误
      </button>

      {/* 警告消息 */}
      <button
        onClick={() => toast.warning("请注意!")}
        className="px-4 py-2 bg-yellow-500 text-white rounded"
      >
        警告
      </button>

      {/* 信息消息 */}
      <button
        onClick={() => toast.info("这是一条信息")}
        className="px-4 py-2 bg-gray-500 text-white rounded"
      >
        信息
      </button>
    </div>
  );
}
```

### 3. 带描述的消息

```tsx
export function ToastWithDescription() {
  return (
    <button
      onClick={() =>
        toast.success("账户已创建", {
          description: "我们已向您的邮箱发送确认链接",
        })
      }
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      带描述的消息
    </button>
  );
}
```

### 4. Promise 支持

```tsx
export function ToastWithPromise() {
  const handleSubmit = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.3;
        if (success) {
          resolve({ name: "张三" });
        } else {
          reject(new Error("网络错误"));
        }
      }, 2000);
    });

    toast.promise(promise, {
      loading: "正在处理...",
      success: (data: any) => `欢迎, ${data.name}!`,
      error: (error) => `错误: ${error.message}`,
    });
  };

  return (
    <button
      onClick={handleSubmit}
      className="px-4 py-2 bg-purple-500 text-white rounded"
    >
      Promise 消息
    </button>
  );
}
```

### 5. 自定义操作

```tsx
export function ToastWithActions() {
  return (
    <button
      onClick={() =>
        toast("文件已删除", {
          action: {
            label: "撤销",
            onClick: () => toast.success("文件已恢复"),
          },
        })
      }
      className="px-4 py-2 bg-orange-500 text-white rounded"
    >
      带撤销的消息
    </button>
  );
}

// 多个操作
export function ToastWithMultipleActions() {
  return (
    <button
      onClick={() =>
        toast.error("保存失败", {
          description: "您想如何处理?",
          action: [
            {
              label: "重试",
              onClick: () => toast.info("正在重试..."),
            },
            {
              label: "放弃",
              onClick: () => toast.info("已放弃更改"),
            },
          ],
        })
      }
      className="px-4 py-2 bg-red-500 text-white rounded"
    >
      多操作消息
    </button>
  );
}
```

### 6. 自定义样式

```tsx
export function ToastWithCustomStyle() {
  return (
    <div className="space-y-4">
      {/* 自定义类名 */}
      <button
        onClick={() =>
          toast.success("自定义样式", {
            className: "bg-gradient-to-r from-purple-500 to-pink-500",
            descriptionClassName: "text-gray-100",
          })
        }
        className="px-4 py-2 bg-pink-500 text-white rounded"
      >
        自定义样式
      </button>

      {/* 自定义图标 */}
      <button
        onClick={() =>
          toast("自定义图标", {
            icon: <span className="text-2xl">🚀</span>,
          })
        }
        className="px-4 py-2 bg-indigo-500 text-white rounded"
      >
        自定义图标
      </button>

      {/* 自定义 JSX */}
      <button
        onClick={() =>
          toast(
            <div className="flex items-center gap-2">
              <img
                src="/avatar.png"
                alt="avatar"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-bold">新消息</p>
                <p className="text-sm text-gray-500">来自李四</p>
              </div>
            </div>
          )
        }
        className="px-4 py-2 bg-teal-500 text-white rounded"
      >
        自定义内容
      </button>
    </div>
  );
}
```

### 7. 位置控制

```tsx
// src/App.tsx
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <Toaster position="bottom-center" />
      {/* 可选位置:
          - top-left
          - top-center
          - top-right
          - bottom-left
          - bottom-center
          - bottom-right
      */}
    </>
  );
}

// 动态改变位置
export function ToastWithPosition() {
  return (
    <button
      onClick={() =>
        toast.success("消息", {
          position: "bottom-center",
        })
      }
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      底部居中消息
    </button>
  );
}
```

### 8. 持续时间和关闭控制

```tsx
export function ToastWithDuration() {
  return (
    <div className="space-y-4">
      {/* 永久显示（直到手动关闭） */}
      <button
        onClick={() =>
          toast("需要确认的消息", {
            duration: Infinity,
            action: {
              label: "确定",
              onClick: () => {},
            },
          })
        }
        className="px-4 py-2 bg-gray-500 text-white rounded"
      >
        永久消息
      </button>

      {/* 自定义持续时间 */}
      <button
        onClick={() =>
          toast("10秒后关闭", {
            duration: 10000,
          })
        }
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        10秒消息
      </button>

      {/* 取消按钮 */}
      <button
        onClick={() =>
          toast("带关闭按钮", {
            cancelButton: {
              label: "关闭",
              onClick: () => {},
            },
          })
        }
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        带取消按钮
      </button>
    </div>
  );
}
```

### 9. 自定义 Hook

```tsx
// src/hooks/useToast.ts
import { toast } from "sonner";

export function useToast() {
  const showSuccess = (message: string, description?: string) => {
    toast.success(message, { description });
  };

  const showError = (message: string, description?: string) => {
    toast.error(message, { description });
  };

  const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  };

  const showConfirmation = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    toast(message, {
      action: [
        {
          label: "确认",
          onClick: onConfirm,
        },
        {
          label: "取消",
          onClick: onCancel || (() => {}),
        },
      ],
    });
  };

  return {
    success: showSuccess,
    error: showError,
    promise: showPromise,
    confirm: showConfirmation,
    raw: toast,
  };
}

// 使用示例
function MyComponent() {
  const { success, error, promise, confirm } = useToast();

  const handleSave = async () => {
    promise(saveData(), {
      loading: "正在保存...",
      success: "保存成功!",
      error: "保存失败",
    });
  };

  const handleDelete = () => {
    confirm("确定要删除吗?", () => {
      // 执行删除
      success("已删除");
    });
  };

  return (
    <div className="space-x-4">
      <button onClick={handleSave}>保存</button>
      <button onClick={handleDelete}>删除</button>
    </div>
  );
}
```

### 10. 通知系统

```tsx
// src/lib/notifications.ts
import { toast } from "sonner";

export const notifications = {
  // 认证相关
  loginSuccess: (name: string) =>
    toast.success(`欢迎回来, ${name}!`),
  
  loginError: () =>
    toast.error("登录失败", {
      description: "请检查您的邮箱和密码",
    }),

  logoutSuccess: () =>
    toast.info("已安全退出"),

  // 文件操作
  uploadSuccess: (filename: string) =>
    toast.success(`${filename} 上传成功`),
  
  uploadError: () =>
    toast.error("上传失败", {
      description: "文件大小不能超过 10MB",
    }),

  // 保存操作
  saveSuccess: () =>
    toast.success("已自动保存"),
  
  saveError: () =>
    toast.error("保存失败", {
      action: {
        label: "重试",
        onClick: () => toast.info("正在重试..."),
      },
    }),

  // 复制操作
  copySuccess: () =>
    toast.success("已复制到剪贴板", {
      duration: 2000,
    }),

  // 网络状态
  offline: () =>
    toast.warning("网络已断开", {
      description: "您的更改将在恢复连接后同步",
      duration: Infinity,
    }),

  online: () =>
    toast.success("网络已恢复"),

  // API 错误
  apiError: (message: string) =>
    toast.error("请求失败", {
      description: message,
    }),
};

// 使用示例
import { notifications } from "@/lib/notifications";

function LoginForm() {
  const handleSubmit = async (credentials) => {
    try {
      const user = await login(credentials);
      notifications.loginSuccess(user.name);
    } catch {
      notifications.loginError();
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 11. 批量消息

```tsx
export function BatchToasts() {
  const showMultiple = () => {
    const messages = [
      { type: "success", message: "第一步完成" },
      { type: "success", message: "第二步完成" },
      { type: "success", message: "全部完成!" },
    ];

    messages.forEach(({ type, message }, index) => {
      setTimeout(() => {
        toast[type](message);
      }, index * 500);
    });
  };

  return (
    <button
      onClick={showMultiple}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      批量消息
    </button>
  );
}
```

### 12. 主题支持

```tsx
// 暗色主题
<Toaster theme="dark" />

// 跟随系统
<Toaster theme="system" />

// 动态切换
import { useTheme } from "next-themes";

export function ThemedToaster() {
  const { theme } = useTheme();
  
  return (
    <Toaster
      theme={theme as "light" | "dark" | "system"}
      richColors
    />
  );
}
```

## 最佳实践

### 1. 统一消息风格

```tsx
// ✅ 使用统一的消息库
import { notifications } from "@/lib/notifications";
notifications.saveSuccess();

// ❌ 分散在各处
toast.success("Saved!");
toast.success("保存成功!");
toast.success("已保存");
```

### 2. 有意义的描述

```tsx
// ✅ 清晰的描述
toast.error("上传失败", {
  description: "文件大小不能超过 10MB，当前文件为 15MB",
});

// ❌ 无描述
toast.error("上传失败");
```

### 3. 适当的持续时间

```tsx
// ✅ 根据重要性调整持续时间
toast.success("已保存", { duration: 2000 }); // 简单通知
toast.error("严重错误", { duration: Infinity }); // 需要用户确认
```

### 4. 提供操作

```tsx
// ✅ 提供恢复操作
toast("已删除文件", {
  action: {
    label: "撤销",
    onClick: () => restoreFile(),
  },
});

// ❌ 无恢复操作
toast("已删除文件");
```

## 常用命令

### 安装

```bash
npm install sonner
```

### 基本使用

```tsx
import { Toaster, toast } from "sonner";

// 添加 Toaster 组件
<Toaster />

// 调用 toast
toast.success("Hello!");
```

## 配置选项

```tsx
<Toaster
  position="top-right"        // 位置
  expand={false}              // 展开模式
  richColors                  // 丰富颜色
  closeButton                 // 关闭按钮
  duration={4000}             // 持续时间
  theme="light"               // 主题
  visibleToasts={3}           // 可见数量
  offset="32px"               // 偏移量
  dir="ltr"                   // 方向
  // 样式
  toastOptions={{
    className: "my-toast",
    style: { background: "red" },
  }}
  // 图标
  icons={{
    success: <CheckIcon />,
    error: <XIcon />,
    warning: <WarningIcon />,
    info: <InfoIcon />,
  }}
/>
```

## TypeScript 类型

```typescript
import { ExternalToast } from "sonner";

// 自定义 toast 类型
interface ToastOptions extends ExternalToast {
  duration?: number;
  position?: ToastPosition;
  icon?: React.ReactNode;
}

type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
```

## 相关资源

- [Sonner 官方文档](https://sonner.emilkowal.ski/)
- [Sonner GitHub](https://github.com/emilkowalski/sonner)
- [Shadcn UI Toast](https://ui.shadcn.com/docs/components/sonner)
