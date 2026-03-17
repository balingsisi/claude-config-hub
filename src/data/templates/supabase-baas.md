# Supabase BaaS 开发模板

## 技术栈

- **核心**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **客户端**: @supabase/supabase-js / @supabase/supabase-dart
- **认证**: Supabase Auth (Email/OAuth/Magic Link)
- **数据库**: PostgreSQL + Row Level Security
- **存储**: Supabase Storage
- **实时**: Realtime Subscriptions
- **边缘函数**: Deno Edge Functions
- **前端**: Next.js / React / React Native / Flutter

## 项目结构

```
supabase-project/
├── src/
│   ├── lib/
│   │   └── supabase.ts       # 客户端配置
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRealtime.ts
│   │   └── useStorage.ts
│   ├── components/
│   │   ├── Auth.tsx
│   │   ├── FileUpload.tsx
│   │   └── RealtimeList.tsx
│   └── types/
│       └── database.ts       # 生成的类型
├── supabase/
│   ├── migrations/
│   │   ├── 20240101000000_init.sql
│   │   └── 20240102000000_add_posts.sql
│   ├── functions/
│   │   ├── send-notification/
│   │   │   └── index.ts
│   │   └── process-webhook/
│   │       └── index.ts
│   ├── seed.sql
│   └── config.toml
├── .env.local
├── package.json
└── tsconfig.json
```

## 代码模式

### 客户端配置

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// 服务端客户端 (SSR)
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
```

### 数据库迁移与 RLS

```sql
-- supabase/migrations/20240101000000_init.sql

-- 用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 策略: 所有人可读公开资料
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- 策略: 用户只能更新自己的资料
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 策略: 用户只能插入自己的资料
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 文章表
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 策略
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are viewable by everyone"
ON posts FOR SELECT
USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Users can manage own posts"
ON posts FOR ALL
USING (auth.uid() = user_id);

-- 自动更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 全文搜索索引
CREATE INDEX posts_search_idx ON posts 
USING GIN (to_tsvector('english', title || ' ' || COALESCE(content, '')));
```

### 认证

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // 登录时创建/更新用户资料
        if (event === 'SIGNED_IN' && session?.user) {
          await supabase.from('profiles').upsert({
            id: session.user.id,
            username: session.user.email?.split('@')[0],
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const sendMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    sendMagicLink,
  };
}
```

### 数据查询

```typescript
// 查询示例
import { supabase } from '@/lib/supabase';

// 基础查询
const { data, error } = await supabase
  .from('posts')
  .select('id, title, content, profiles(username, avatar_url)')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .range(0, 9); // 分页: 前10条

// 全文搜索
const { data: results } = await supabase
  .from('posts')
  .select()
  .textSearch('title,content', searchTerm, {
    type: 'websearch',
    config: 'english',
  });

// 插入数据
const { data: post, error } = await supabase
  .from('posts')
  .insert({
    user_id: user.id,
    title: 'My Post',
    content: 'Content here...',
    status: 'published',
  })
  .select()
  .single();

// 更新数据
const { data, error } = await supabase
  .from('posts')
  .update({ status: 'draft' })
  .eq('id', postId)
  .select();

// 删除数据
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);

// RPC 调用
const { data, error } = await supabase.rpc('get_user_posts', {
  user_id: user.id,
  limit_count: 10,
});
```

### 实时订阅

```typescript
// src/hooks/useRealtime.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimePosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const channel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // 初始加载
    fetchPosts().then(setPosts);

    // 实时订阅
    channel.current = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          setPosts((current) => {
            switch (eventType) {
              case 'INSERT':
                return [newRecord as Post, ...current];
              case 'UPDATE':
                return current.map((p) =>
                  p.id === (newRecord as Post).id ? (newRecord as Post) : p
                );
              case 'DELETE':
                return current.filter((p) => p.id !== (oldRecord as Post).id);
              default:
                return current;
            }
          });
        }
      )
      .subscribe();

    return () => {
      channel.current?.unsubscribe();
    };
  }, [userId]);

  return posts;
}

// 在线状态
export function usePresence(roomName: string) {
  const [users, setUsers] = useState<Record<string, any>>({});
  const channel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channel.current = supabase.channel(roomName, {
      config: { presence: { key: 'user_id' } },
    });

    channel.current
      .on('presence', { event: 'sync' }, () => {
        const state = channel.current!.presenceState();
        setUsers(state);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('新用户加入:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('用户离开:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.current!.track({
            user_id: 'user-123',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.current?.unsubscribe();
    };
  }, [roomName]);

  return users;
}
```

### 文件存储

```typescript
// src/hooks/useStorage.ts
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';

export function useStorage() {
  const uploadFile = async (
    bucket: string,
    path: string,
    file: File
  ): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const uploadAvatar = async (userId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (!error) {
      // 更新用户资料
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);
      
      await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId);
    }

    return { data, error };
  };

  const downloadFile = async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    return { data, error };
  };

  const deleteFile = async (bucket: string, paths: string[]) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);
    
    return { data, error };
  };

  const listFiles = async (bucket: string, folder: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    
    return { data, error };
  };

  return {
    uploadFile,
    uploadAvatar,
    downloadFile,
    deleteFile,
    listFiles,
  };
}
```

### 边缘函数

```typescript
// supabase/functions/send-notification/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { record, type } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (type === 'INSERT' && record.status === 'published') {
    // 获取作者信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', record.user_id)
      .single();

    // 获取粉丝列表
    const { data: followers } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', record.user_id);

    // 发送通知
    const notifications = followers?.map((f) => ({
      user_id: f.follower_id,
      type: 'new_post',
      title: `${profile?.username} 发布了新文章`,
      data: { post_id: record.id },
    })) || [];

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## 最佳实践

### 1. 类型安全

```typescript
// src/types/database.ts (通过 CLI 生成)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
        };
      };
      posts: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          content: string | null;
          status: 'draft' | 'published';
          created_at: string;
          updated_at: string;
        };
        // ...
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// 使用
import { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
```

### 2. 错误处理

```typescript
// 统一错误处理
class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message);
  }
}

export async function handleSupabaseQuery<T>(
  query: Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await query;
  
  if (error) {
    console.error('Supabase error:', error);
    throw new SupabaseError(
      error.message,
      error.code,
      error.details
    );
  }
  
  return data as T;
}

// 使用
try {
  const posts = await handleSupabaseQuery(
    supabase.from('posts').select()
  );
} catch (error) {
  if (error instanceof SupabaseError) {
    toast.error(error.message);
  }
}
```

### 3. 批量操作

```typescript
// 批量插入
const { data, error } = await supabase
  .from('tags')
  .insert(tags.map((tag) => ({ name: tag })))
  .select();

// 批量更新 (使用 RPC)
// SQL: CREATE FUNCTION bulk_update_status(ids bigint[], new_status text)...
const { data, error } = await supabase.rpc('bulk_update_status', {
  ids: [1, 2, 3],
  new_status: 'published',
});

// 使用事务 (RPC)
const { error } = await supabase.rpc('create_post_with_tags', {
  post_data: { title: 'New Post' },
  tag_ids: [1, 2, 3],
});
```

### 4. 缓存策略

```typescript
// 使用 React Query 缓存
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => supabase.from('posts').select(),
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (post: PostInsert) =>
      supabase.from('posts').insert(post).select().single(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

### 5. 安全最佳实践

```sql
-- 永远不要在客户端使用 service_role key
-- 使用 RLS 保护所有表

-- 检查 RLS 是否启用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 限制列访问
CREATE POLICY "Users can only see own email"
ON profiles FOR SELECT
USING (auth.uid() = id)
WITH CHECK (false); -- 禁止通过此策略更新

-- 使用函数隐藏敏感数据
CREATE OR REPLACE FUNCTION get_public_profiles()
RETURNS TABLE (id uuid, username text, avatar_url text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, username, avatar_url FROM profiles;
$$;
```

## 常用命令

```bash
# 安装 CLI
npm install -g supabase

# 登录
supabase login

# 初始化项目
supabase init

# 链接到远程项目
supabase link --project-ref <project-id>

# 启动本地开发环境
supabase start

# 生成类型
supabase gen types typescript --local > src/types/database.ts

# 创建迁移
supabase migration new add_comments_table

# 应用迁移到本地
supabase db push

# 推送迁移到远程
supabase db push --linked

# 重置本地数据库
supabase db reset

# 部署边缘函数
supabase functions deploy send-notification

# 本地测试边缘函数
supabase functions serve send-notification --env-file .env.local

# 查看日志
supabase functions logs send-notification

# 生成种子数据
supabase seed

# 备份数据库
supabase db dump -f backup.sql
```

## 部署配置

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 仅服务端使用

# 边缘函数
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Vercel 部署

```json
// vercel.json
{
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

### 存储桶策略

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- 存储桶 RLS 策略
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 监控与告警

```typescript
// 监控查询性能
const { data, error } = await supabase
  .from('posts')
  .select()
  .explain({ format: 'json' });

// 使用 Supabase Dashboard 设置告警
// Database > Replication > 设置延迟告警
// Logs > 设置错误日志告警
```

## 常见问题

1. **RLS 策略过于复杂导致性能下降** → 使用 `SECURITY DEFINER` 函数
2. **实时订阅连接断开** → 实现自动重连逻辑
3. **文件上传大小限制** → 使用分片上传或直传到 S3
4. **冷启动延迟** → 边缘函数预热或使用 cron 定时触发
5. **跨域问题** → 在 Supabase Dashboard 配置允许的域名

## 扩展资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase 示例](https://github.com/supabase/supabase/tree/master/examples)
