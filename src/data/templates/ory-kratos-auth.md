# Ory Kratos 身份认证模板

## 技术栈

- **身份系统**: Ory Kratos
- **前端**: Next.js 14 / React
- **样式**: Tailwind CSS
- **表单**: React Hook Form + Zod
- **会话管理**: Ory Kratos Session
- **邮件**: Ory Kratos Courier
- **数据库**: PostgreSQL / MySQL / SQLite

## 项目结构

```
ory-kratos-auth/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── recovery/
│   │   │   │   └── page.tsx
│   │   │   ├── verification/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── RecoveryForm.tsx
│   │   │   ├── VerificationForm.tsx
│   │   │   ├── SettingsForm.tsx
│   │   │   └── PasswordField.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── Card.tsx
│   │   └── SessionProvider.tsx
│   ├── lib/
│   │   ├── ory.ts               # Ory Kratos 客户端
│   │   ├── auth.ts              # 认证工具函数
│   │   ├── session.ts           # 会话管理
│   │   └── hooks/
│   │       ├── useSession.ts
│   │       └── useAuth.ts
│   ├── middleware.ts            # 路由保护
│   └── types/
│       └── kratos.ts
├── contrib/
│   └── quickstart/
│       ├── kratos/
│       │   ├── kratos.yml       # Kratos 配置
│       │   ├── identity-schema.json
│       │   └── email-templates/
│       │       ├── recovery.html
│       │       └── verification.html
│       └── docker-compose.yml
├── .env.local
├── next.config.js
├── tailwind.config.js
└── package.json
```

## 代码模式

### Ory Kratos 客户端配置

```typescript
// src/lib/ory.ts
import { Configuration, FrontendApi, IdentityApi } from '@ory/client';

const basePath = process.env.NEXT_PUBLIC_ORY_SDK_URL || 'http://localhost:4433';

export const ory = new FrontendApi(
  new Configuration({
    basePath,
    baseOptions: {
      withCredentials: true,  // 发送 cookies
    },
  })
);

export const oryAdmin = new IdentityApi(
  new Configuration({
    basePath: process.env.ORY_ADMIN_URL || 'http://localhost:4434',
  })
);

// 获取当前会话
export async function getSession(cookie?: string) {
  try {
    const { data: session } = await ory.toSession({
      cookie,
    });
    return session;
  } catch (error) {
    return null;
  }
}

// 检查是否认证
export async function isAuthenticated(cookie?: string): Promise<boolean> {
  const session = await getSession(cookie);
  return !!session?.active;
}

// 获取登录流程
export async function getLoginFlow(flowId?: string, cookie?: string) {
  try {
    const { data } = await ory.getLoginFlow({
      id: flowId || '',
      cookie,
    });
    return data;
  } catch (error) {
    return null;
  }
}

// 创建登录流程
export async function createLoginFlow() {
  const { data } = await ory.createBrowserLoginFlow({
    returnTo: '/dashboard',
  });
  return data;
}

// 获取注册流程
export async function getRegistrationFlow(flowId?: string, cookie?: string) {
  try {
    const { data } = await ory.getRegistrationFlow({
      id: flowId || '',
      cookie,
    });
    return data;
  } catch (error) {
    return null;
  }
}

// 创建注册流程
export async function createRegistrationFlow() {
  const { data } = await ory.createBrowserRegistrationFlow({
    returnTo: '/dashboard',
  });
  return data;
}

// 获取恢复流程
export async function getRecoveryFlow(flowId?: string, cookie?: string) {
  try {
    const { data } = await ory.getRecoveryFlow({
      id: flowId || '',
      cookie,
    });
    return data;
  } catch (error) {
    return null;
  }
}

// 创建恢复流程
export async function createRecoveryFlow() {
  const { data } = await ory.createBrowserRecoveryFlow();
  return data;
}

// 获取验证流程
export async function getVerificationFlow(flowId?: string, cookie?: string) {
  try {
    const { data } = await ory.getVerificationFlow({
      id: flowId || '',
      cookie,
    });
    return data;
  } catch (error) {
    return null;
  }
}

// 创建验证流程
export async function createVerificationFlow() {
  const { data } = await ory.createBrowserVerificationFlow();
  return data;
}

// 获取设置流程
export async function getSettingsFlow(flowId?: string, cookie?: string) {
  try {
    const { data } = await ory.getSettingsFlow({
      id: flowId || '',
      cookie,
    });
    return data;
  } catch (error) {
    return null;
  }
}

// 创建设置流程
export async function createSettingsFlow(cookie: string) {
  const { data } = await ory.createBrowserSettingsFlow({
    returnTo: '/settings',
    cookie,
  });
  return data;
}

// 登出
export async function logout(cookie?: string) {
  try {
    const { data } = await ory.createBrowserLogoutFlow({
      cookie,
    });
    await ory.updateLogoutFlow({
      token: data.logout_token,
    });
    return true;
  } catch (error) {
    return false;
  }
}
```

### 认证中间件

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/ory';

// 需要认证的路由
const protectedPaths = ['/dashboard', '/settings', '/profile'];

// 认证后不可访问的路由
const authPaths = ['/login', '/register', '/recovery'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.headers.get('cookie') || '';

  // 获取会话
  const session = await getSession(cookie);
  const isAuthenticated = !!session?.active;

  // 保护需要认证的路由
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('return_to', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 已认证用户不能访问登录/注册页面
  if (authPaths.some((path) => pathname.startsWith(path))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  const response = NextResponse.next();

  // 将会话信息传递给页面
  if (session) {
    response.headers.set('x-session', JSON.stringify({
      active: session.active,
      identity: session.identity,
    }));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
```

### 登录表单

```typescript
// src/components/auth/LoginForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ory, getLoginFlow, createLoginFlow } from '@/lib/ory';
import { LoginFlow, UiNode } from '@ory/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';

const loginSchema = z.object({
  identifier: z.string().min(1, '邮箱或用户名必填'),
  password: z.string().min(1, '密码必填'),
  method: z.literal('password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flow, setFlow] = useState<LoginFlow | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      method: 'password',
    },
  });

  // 获取或创建登录流程
  useEffect(() => {
    const flowId = searchParams.get('flow');
    
    const initFlow = async () => {
      try {
        if (flowId) {
          const flowData = await getLoginFlow(flowId);
          setFlow(flowData);
        } else {
          const flowData = await createLoginFlow();
          setFlow(flowData);
          // 更新 URL
          router.replace(`/login?flow=${flowData.id}`);
        }
      } catch (err) {
        console.error('Failed to init login flow:', err);
        setError('初始化登录失败，请刷新页面');
      }
    };

    initFlow();
  }, [searchParams, router]);

  // 提交登录
  const onSubmit = async (data: LoginFormData) => {
    if (!flow) return;

    setIsLoading(true);
    setError('');

    try {
      await ory.updateLoginFlow({
        flow: flow.id,
        updateLoginFlowBody: {
          ...data,
          csrf_token: getCsrfToken(flow.ui.nodes),
        },
      });

      // 登录成功，跳转
      const returnTo = searchParams.get('return_to') || '/dashboard';
      router.push(returnTo);
    } catch (err: any) {
      console.error('Login failed:', err);

      // 处理 Kratos 错误
      if (err.response?.data?.ui?.messages) {
        const messages = err.response.data.ui.messages;
        setError(messages.map((m: any) => m.text).join(', '));
      } else if (err.response?.data?.error) {
        setError(err.response.data.error.message);
      } else {
        setError('登录失败，请重试');
      }

      // 重新加载流程
      try {
        const newFlow = await getLoginFlow(flow.id);
        setFlow(newFlow);
      } catch {
        const newFlow = await createLoginFlow();
        setFlow(newFlow);
        router.replace(`/login?flow=${newFlow.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 获取 CSRF Token
  const getCsrfToken = (nodes: UiNode[]) => {
    const csrfNode = nodes.find(
      (node) => node.attributes.name === 'csrf_token'
    );
    return (csrfNode?.attributes as any)?.value || '';
  };

  // 显示流程错误
  const flowError = flow?.ui?.messages?.find((m) => m.type === 'error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录账户
          </h2>
        </div>

        {flowError && (
          <Alert type="error">{flowError.text}</Alert>
        )}

        {error && (
          <Alert type="error">{error}</Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* CSRF Token */}
          {flow && (
            <input
              type="hidden"
              {...register('method' as any)}
              value="password"
            />
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                邮箱或用户名
              </label>
              <Input
                id="identifier"
                type="text"
                {...register('identifier')}
                error={errors.identifier?.message}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/recovery" className="font-medium text-blue-600 hover:text-blue-500">
                忘记密码？
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
          >
            登录
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">还没有账户？</span>{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              立即注册
            </Link>
          </div>
        </form>

        {/* OAuth 登录 */}
        {flow?.ui?.nodes && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">或使用</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {flow.ui.nodes
                .filter((node) => node.group === 'oidc')
                .map((node, index) => {
                  const attrs = node.attributes as any;
                  return (
                    <a
                      key={index}
                      href={attrs.href}
                      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      {node.meta?.label?.text}
                    </a>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 注册表单

```typescript
// src/components/auth/RegisterForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ory, getRegistrationFlow, createRegistrationFlow } from '@/lib/ory';
import { RegistrationFlow } from '@ory/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';

const registerSchema = z.object({
  traits_email: z.string().email('邮箱格式不正确'),
  traits_name: z.string().min(2, '姓名至少2个字符'),
  password: z.string().min(8, '密码至少8位'),
  method: z.literal('password'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flow, setFlow] = useState<RegistrationFlow | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      method: 'password',
    },
  });

  // 获取或创建注册流程
  useEffect(() => {
    const flowId = searchParams.get('flow');
    
    const initFlow = async () => {
      try {
        if (flowId) {
          const flowData = await getRegistrationFlow(flowId);
          setFlow(flowData);
        } else {
          const flowData = await createRegistrationFlow();
          setFlow(flowData);
          router.replace(`/register?flow=${flowData.id}`);
        }
      } catch (err) {
        console.error('Failed to init registration flow:', err);
        setError('初始化注册失败，请刷新页面');
      }
    };

    initFlow();
  }, [searchParams, router]);

  // 提交注册
  const onSubmit = async (data: RegisterFormData) => {
    if (!flow) return;

    setIsLoading(true);
    setError('');

    try {
      await ory.updateRegistrationFlow({
        flow: flow.id,
        updateRegistrationFlowBody: {
          method: 'password',
          password: data.password,
          traits: {
            email: data.traits_email,
            name: data.traits_name,
          },
          csrf_token: getCsrfToken(flow.ui.nodes),
        },
      });

      // 注册成功，跳转到验证页面或仪表板
      router.push('/dashboard?registered=true');
    } catch (err: any) {
      console.error('Registration failed:', err);

      if (err.response?.data?.ui?.messages) {
        const messages = err.response.data.ui.messages;
        setError(messages.map((m: any) => m.text).join(', '));
      } else if (err.response?.data?.error) {
        setError(err.response.data.error.message);
      } else {
        setError('注册失败，请重试');
      }

      // 重新加载流程
      try {
        const newFlow = await getRegistrationFlow(flow.id);
        setFlow(newFlow);
      } catch {
        const newFlow = await createRegistrationFlow();
        setFlow(newFlow);
        router.replace(`/register?flow=${newFlow.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCsrfToken = (nodes: any[]) => {
    const csrfNode = nodes.find(
      (node) => node.attributes.name === 'csrf_token'
    );
    return csrfNode?.attributes?.value || '';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            创建账户
          </h2>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="traits_name" className="block text-sm font-medium text-gray-700">
                姓名
              </label>
              <Input
                id="traits_name"
                type="text"
                {...register('traits_name')}
                error={errors.traits_name?.message}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="traits_email" className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <Input
                id="traits_email"
                type="email"
                {...register('traits_email')}
                error={errors.traits_email?.message}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                autoComplete="new-password"
              />
              <p className="mt-1 text-sm text-gray-500">
                至少8位，包含字母和数字
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
          >
            注册
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">已有账户？</span>{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              立即登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 会话管理

```typescript
// src/lib/hooks/useSession.ts
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@ory/client';
import { getSession } from '@/lib/ory';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true,
  isAuthenticated: false,
  refreshSession: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const sessionData = await getSession();
      setSession(sessionData);
    } catch (error) {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    // 定期刷新会话（可选）
    const interval = setInterval(refreshSession, 5 * 60 * 1000); // 每5分钟

    return () => clearInterval(interval);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: !!session?.active,
        refreshSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
```

```typescript
// src/lib/hooks/useAuth.ts
'use client';

import { useRouter } from 'next/navigation';
import { useSession } from './useSession';
import { logout } from '@/lib/ory';

export function useAuth() {
  const router = useRouter();
  const { session, isLoading, isAuthenticated, refreshSession } = useSession();

  const signOut = async () => {
    try {
      await logout();
      await refreshSession();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user: session?.identity,
    session,
    isLoading,
    isAuthenticated,
    signOut,
    refreshSession,
  };
}
```

### 设置页面

```typescript
// src/app/(auth)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ory, getSettingsFlow, createSettingsFlow } from '@/lib/ory';
import { SettingsFlow } from '@ory/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

const profileSchema = z.object({
  traits_name: z.string().min(2, '姓名至少2个字符'),
  method: z.literal('profile'),
});

const passwordSchema = z.object({
  password: z.string().min(8, '密码至少8位'),
  method: z.literal('password'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [flow, setFlow] = useState<SettingsFlow | null>(null);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      method: 'profile',
      traits_name: user?.traits?.name || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      method: 'password',
    },
  });

  // 加载设置流程
  useEffect(() => {
    const initFlow = async () => {
      if (!isAuthenticated) return;

      try {
        const flowId = searchParams.get('flow');
        if (flowId) {
          const flowData = await getSettingsFlow(flowId);
          setFlow(flowData);
        } else {
          const flowData = await createSettingsFlow('');
          setFlow(flowData);
          router.replace(`/settings?flow=${flowData.id}`);
        }
      } catch (err) {
        console.error('Failed to load settings flow:', err);
      }
    };

    initFlow();
  }, [isAuthenticated, searchParams, router]);

  // 更新用户信息后同步表单
  useEffect(() => {
    if (user?.traits?.name) {
      profileForm.setValue('traits_name', user.traits.name);
    }
  }, [user, profileForm]);

  // 更新资料
  const onUpdateProfile = async (data: ProfileFormData) => {
    if (!flow) return;

    setProfileError('');
    setSuccessMessage('');

    try {
      await ory.updateSettingsFlow({
        flow: flow.id,
        updateSettingsFlowBody: {
          method: 'profile',
          traits: {
            ...user?.traits,
            name: data.traits_name,
          },
          csrf_token: getCsrfToken(flow.ui.nodes),
        },
      });

      setSuccessMessage('资料更新成功');
      router.refresh();
    } catch (err: any) {
      console.error('Update profile failed:', err);
      setProfileError(err.response?.data?.error?.message || '更新失败');
    }
  };

  // 修改密码
  const onChangePassword = async (data: PasswordFormData) => {
    if (!flow) return;

    setPasswordError('');
    setSuccessMessage('');

    try {
      await ory.updateSettingsFlow({
        flow: flow.id,
        updateSettingsFlowBody: {
          method: 'password',
          password: data.password,
          csrf_token: getCsrfToken(flow.ui.nodes),
        },
      });

      setSuccessMessage('密码修改成功');
      passwordForm.reset();
    } catch (err: any) {
      console.error('Change password failed:', err);
      setPasswordError(err.response?.data?.error?.message || '修改失败');
    }
  };

  const getCsrfToken = (nodes: any[]) => {
    const csrfNode = nodes.find((node) => node.attributes.name === 'csrf_token');
    return csrfNode?.attributes?.value || '';
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">账户设置</h1>

        {successMessage && <Alert type="success">{successMessage}</Alert>}

        {/* 个人资料 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">个人资料</h2>
          
          {profileError && <Alert type="error">{profileError}</Alert>}

          <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">邮箱</label>
              <input
                type="text"
                value={user?.traits?.email || ''}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="traits_name" className="block text-sm font-medium text-gray-700">
                姓名
              </label>
              <Input
                id="traits_name"
                {...profileForm.register('traits_name')}
                error={profileForm.formState.errors.traits_name?.message}
              />
            </div>

            <Button type="submit">更新资料</Button>
          </form>
        </div>

        {/* 修改密码 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">修改密码</h2>
          
          {passwordError && <Alert type="error">{passwordError}</Alert>}

          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                新密码
              </label>
              <Input
                id="password"
                type="password"
                {...passwordForm.register('password')}
                error={passwordForm.formState.errors.password?.message}
              />
              <p className="mt-1 text-sm text-gray-500">至少8位，包含字母和数字</p>
            </div>

            <Button type="submit">修改密码</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### Kratos 配置

```yaml
# contrib/quickstart/kratos/kratos.yml
version: v1.0.0

dsn: memory

serve:
  public:
    base_url: http://localhost:4433/
    cors:
      enabled: true
      allowed_origins:
        - http://localhost:3000
      allowed_methods:
        - POST
        - GET
        - PUT
        - PATCH
        - DELETE
      allowed_headers:
        - Authorization
        - Cookie
        - Content-Type
      exposed_headers:
        - Content-Type
        - Set-Cookie
      allow_credentials: true
      debug: true
  admin:
    base_url: http://kratos:4434/

selfservice:
  default_browser_return_url: http://localhost:3000/
  allowed_return_urls:
    - http://localhost:3000

  methods:
    password:
      enabled: true
    oidc:
      enabled: false
    link:
      enabled: true
    code:
      enabled: true

  flows:
    error:
      ui_url: http://localhost:3000/error

    settings:
      ui_url: http://localhost:3000/settings
      privileged_session_max_age: 15m
      required_aal: aal1

    recovery:
      enabled: true
      ui_url: http://localhost:3000/recovery
      use: code
      after:
        default_browser_return_url: http://localhost:3000/login

    verification:
      enabled: true
      ui_url: http://localhost:3000/verification
      use: code
      after:
        default_browser_return_url: http://localhost:3000/dashboard

    logout:
      after:
        default_browser_return_url: http://localhost:3000/login

    login:
      ui_url: http://localhost:3000/login
      lifespan: 10m
      after:
        default_browser_return_url: http://localhost:3000/dashboard
        password:
          default_browser_return_url: http://localhost:3000/dashboard

    registration:
      lifespan: 10m
      ui_url: http://localhost:3000/register
      after:
        password:
          hooks:
            - hook: session
          default_browser_return_url: http://localhost:3000/dashboard

session:
  lifespan: 24h
  cookie:
    same_site: Lax
    domain: localhost
    persistent: true

log:
  level: debug
  format: text
  leak_sensitive_values: true

secrets:
  cookie:
    - PLEASE-CHANGE-ME-I-AM-VERY-INSECURE

hashers:
  algorithm: bcrypt
  bcrypt:
    cost: 8

identity:
  default_schema_id: default
  schemas:
    - id: default
      url: file:///etc/config/kratos/identity-schema.json

courier:
  smtp:
    connection_uri: smtps://test:test@mailslurper:1025/?skip_ssl_verify=true
```

```json
// contrib/quickstart/kratos/identity-schema.json
{
  "$id": "https://schemas.ory.sh/presets/kratos/quickstart/email-password/identity.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Person",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "traits": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "title": "E-Mail",
          "minLength": 3,
          "ory.sh/kratos": {
            "credentials": {
              "password": {
                "identifier": true
              }
            },
            "verification": {
              "via": "email"
            },
            "recovery": {
              "via": "email"
            }
          }
        },
        "name": {
          "type": "string",
          "title": "Name",
          "minLength": 2
        }
      },
      "required": [
        "email",
        "name"
      ],
      "uniqueProperties": [
        "email"
      ]
    }
  }
}
```

## 最佳实践

### 1. 错误处理

```typescript
// 统一错误处理
export function handleKratosError(error: any): string {
  if (error.response?.data?.ui?.messages) {
    return error.response.data.ui.messages
      .map((m: any) => m.text)
      .join(', ');
  }

  if (error.response?.data?.error) {
    switch (error.response.data.error.id) {
      case 'session_inactive':
        return '会话已过期，请重新登录';
      case 'session_aal2_required':
        return '需要二次认证';
      default:
        return error.response.data.error.message;
    }
  }

  return '操作失败，请重试';
}
```

### 2. 安全头

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### 3. AAL (认证保证级别)

```typescript
// 检查 AAL
export async function checkAAL(session: Session): Promise<'aal1' | 'aal2'> {
  return session.authenticator_assurance_level || 'aal1';
}

// 要求 AAL2
export async function requireAAL2(session: Session) {
  const aal = await checkAAL(session);
  if (aal !== 'aal2') {
    // 重定向到二次认证
    redirect('/login/aal2');
  }
}
```

## 常用命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 生产运行
npm run start

# 启动 Kratos (Docker)
cd contrib/quickstart
docker-compose up -d

# 查看 Kratos 日志
docker-compose logs -f kratos

# 创建身份
docker-compose exec kratos kratos create identity --schema default

# 查看所有身份
docker-compose exec kratos kratos list identities
```

## 部署配置

### package.json

```json
{
  "name": "ory-kratos-auth",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@ory/client": "^1.0.0",
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.0"
  }
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  kratos-migrate:
    image: oryd/kratos:v1.0.0
    environment:
      - DSN=postgres://kratos:secret@postgres:5432/kratos?sslmode=disable
    volumes:
      - ./contrib/quickstart/kratos:/etc/config/kratos
    command: -c /etc/config/kratos/kratos.yml migrate sql -e --yes
    networks:
      - intranet

  kratos:
    image: oryd/kratos:v1.0.0
    environment:
      - DSN=postgres://kratos:secret@postgres:5432/kratos?sslmode=disable
      - LOG_LEVEL=debug
    volumes:
      - ./contrib/quickstart/kratos:/etc/config/kratos
    command: serve -c /etc/config/kratos/kratos.yml --dev --watch-courier
    ports:
      - "4433:4433"
      - "4434:4434"
    networks:
      - intranet

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=kratos
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=kratos
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - intranet

  mailslurper:
    image: oryd/mailslurper:latest-smtps
    ports:
      - "4436:4436"
      - "4437:4437"
    networks:
      - intranet

networks:
  intranet:

volumes:
  postgres_data:
```

## 参考资源

- [Ory Kratos 官方文档](https://www.ory.sh/docs/kratos)
- [Ory Kratos GitHub](https://github.com/ory/kratos)
- [Next.js 文档](https://nextjs.org/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Ory Network](https://www.ory.sh/)
