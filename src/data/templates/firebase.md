# Firebase 项目模板

## 技术栈

- **Backend-as-a-Service**: Firebase (Google Cloud)
- **数据库**: Cloud Firestore / Realtime Database
- **认证**: Firebase Authentication
- **存储**: Cloud Storage
- **托管**: Firebase Hosting
- **函数**: Cloud Functions for Firebase
- **分析**: Google Analytics for Firebase
- **消息**: Cloud Messaging (FCM)
- **SDK**: Firebase SDK v9+ (Modular)

## 项目结构

```
firebase-project/
├── public/                  # 静态资源 (Hosting)
│   ├── index.html
│   └── assets/
├── src/
│   ├── firebase/           # Firebase 配置
│   │   ├── config.ts       # 初始化配置
│   │   ├── auth.ts         # 认证服务
│   │   ├── firestore.ts    # 数据库操作
│   │   ├── storage.ts      # 存储操作
│   │   └── messaging.ts    # 推送消息
│   ├── components/         # UI 组件
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useFirestore.ts
│   │   └── useStorage.ts
│   ├── services/           # 业务逻辑
│   ├── types/              # TypeScript 类型
│   └── utils/              # 工具函数
├── functions/              # Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── auth/
│   │   ├── firestore/
│   │   └── triggers/
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules         # 安全规则
├── firestore.indexes.json  # 索引配置
├── storage.rules           # 存储安全规则
├── firebase.json           # Firebase 配置
├── .firebaserc             # 项目配置
└── package.json
```

## 代码模式

### Firebase 初始化

```typescript
// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// 初始化 Firebase App
const app = initializeApp(firebaseConfig);

// 初始化各服务
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 可选服务（需要浏览器支持）
export const messaging = await isSupported() ? getMessaging(app) : null;
export const analytics = await isAnalyticsSupported() ? getAnalytics(app) : null;

export default app;
```

### 认证服务

```typescript
// src/firebase/auth.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth } from './config';

// 邮箱密码登录
export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

// 邮箱密码注册
export async function registerWithEmail(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

// Google 登录
export async function loginWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  return signInWithPopup(auth, provider);
}

// GitHub 登录
export async function loginWithGithub(): Promise<UserCredential> {
  const provider = new GithubAuthProvider();
  provider.addScope('repo');
  return signInWithPopup(auth, provider);
}

// 登出
export async function logout(): Promise<void> {
  return signOut(auth);
}

// 重置密码
export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

// 更新用户信息
export async function updateUserProfile(user: User, displayName: string, photoURL?: string): Promise<void> {
  return updateProfile(user, { displayName, photoURL });
}

// 监听认证状态
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
```

### Firestore 数据操作

```typescript
// src/firebase/firestore.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// 创建文档
export async function createDocument<T extends Record<string, any>>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DocumentReference> {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// 获取单个文档
export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

// 获取文档列表
export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

// 更新文档
export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  return updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// 删除文档
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id);
  return deleteDoc(docRef);
}

// 实时监听文档
export function subscribeToDocument<T>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void
): () => void {
  const docRef = doc(db, collectionName, id);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as T);
    } else {
      callback(null);
    }
  });
}

// 分页查询
export async function getDocumentsPaginated<T>(
  collectionName: string,
  pageSize: number,
  lastDoc?: DocumentSnapshot
): Promise<{ data: T[]; lastDoc: DocumentSnapshot | null }> {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  ];
  
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  
  const data = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
  
  const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
  
  return { data, lastDoc: newLastDoc };
}

// 事务操作
export async function runTransaction<T>(
  updateFunction: (transaction: Transaction) => Promise<T>
): Promise<T> {
  return runTransaction(db, updateFunction);
}
```

### Storage 文件操作

```typescript
// src/firebase/storage.ts
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  downloadURL,
  deleteObject,
  listAll,
  getMetadata,
  UploadTask,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from './config';

// 上传文件（简单）
export async function uploadFile(
  path: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return downloadURL(storageRef);
}

// 上传文件（带进度）
export function uploadFileWithProgress(
  path: string,
  file: File,
  onProgress?: (progress: number) => void,
  onComplete?: (url: string) => void,
  onError?: (error: Error) => void
): UploadTask {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  uploadTask.on(
    'state_changed',
    (snapshot: UploadTaskSnapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress?.(progress);
    },
    (error: Error) => {
      onError?.(error);
    },
    async () => {
      const url = await downloadURL(uploadTask.snapshot.ref);
      onComplete?.(url);
    }
  );
  
  return uploadTask;
}

// 删除文件
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
}

// 列出目录下所有文件
export async function listFiles(path: string) {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);
  
  return {
    items: result.items.map(item => item.fullPath),
    prefixes: result.prefixes.map(prefix => prefix.fullPath),
  };
}

// 获取文件元数据
export async function getFileMetadata(path: string) {
  const storageRef = ref(storage, path);
  return getMetadata(storageRef);
}
```

### React Hooks 封装

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '../firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
```

```typescript
// src/hooks/useFirestore.ts
import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useFirestore<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
}
```

### Cloud Functions

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// HTTP 触发器
export const api = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  try {
    const { path } = req;
    
    // 路由处理
    if (path === '/users') {
      const users = await admin.firestore().collection('users').get();
      res.json(users.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Firestore 触发器 - 新用户创建
export const onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    
    // 发送欢迎邮件
    console.log(`New user created: ${context.params.userId}`);
    
    // 初始化用户数据
    await admin.firestore().collection('userSettings').doc(context.params.userId).set({
      theme: 'light',
      notifications: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

// 认证触发器 - 用户首次登录
export const onFirstSignIn = functions.auth.user().onCreate(async (user) => {
  // 创建用户文档
  await admin.firestore().collection('users').doc(user.uid).set({
    email: user.email,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
  });
});

// 定时任务
export const scheduledCleanup = functions.pubsub
  .schedule('0 2 * * *')  // 每天凌晨2点
  .timeZone('Asia/Shanghai')
  .onRun(async (context) => {
    const cutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)  // 30天前
    );
    
    const oldDocs = await admin.firestore()
      .collection('tempData')
      .where('createdAt', '<', cutoff)
      .get();
    
    const batch = admin.firestore().batch();
    oldDocs.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    console.log(`Cleaned up ${oldDocs.size} old documents`);
  });
```

## 最佳实践

### 安全规则

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能访问自己的数据
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 公开数据只读
    match /public/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // 私有数据需要认证和权限检查
    match /private/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // 内容所有权验证
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.authorId == request.auth.uid;
    }
    
    // 数据验证
    match /comments/{commentId} {
      allow create: if request.auth != null && 
        request.resource.data.text is string &&
        request.resource.data.text.size() > 0 &&
        request.resource.data.text.size() <= 1000;
    }
  }
}
```

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 用户头像
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 5 * 1024 * 1024 &&  // 5MB
        request.resource.contentType.matches('image/.*');
    }
    
    // 公共资源
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 私有文件
    match /private/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### 性能优化

```typescript
// 1. 批量写入
async function batchWrite() {
  const batch = writeBatch(db);
  
  items.forEach(item => {
    const docRef = doc(collection(db, 'items'));
    batch.set(docRef, item);
  });
  
  await batch.commit();  // 最多500次操作
}

// 2. 离线持久化
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab');
  } else if (err.code === 'unimplemented') {
    console.log('The current browser does not support persistence');
  }
});

// 3. 数据缓存策略
const cacheSettings = {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
};
```

### 环境配置

```bash
# .env.local
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 常用命令

### Firebase CLI

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 登录 Firebase
firebase login

# 初始化项目
firebase init

# 初始化特定功能
firebase init hosting
firebase init firestore
firebase init functions
firebase init storage

# 本地开发
firebase serve                    # 启动本地服务器
firebase emulators:start          # 启动模拟器套件

# 部署
firebase deploy                   # 部署所有
firebase deploy --only hosting    # 只部署托管
firebase deploy --only functions  # 只部署函数
firebase deploy --only firestore  # 只部署规则

# 查看项目信息
firebase projects:list
firebase use --add                # 添加项目别名

# 函数管理
firebase functions:log            # 查看函数日志
firebase functions:delete funcName

# 数据操作
firebase firestore:delete -r collection_name  # 删除集合

# 测试
firebase emulators:exec "npm test"
```

### Cloud Functions 开发

```bash
# 进入函数目录
cd functions

# 安装依赖
npm install

# 添加依赖
npm install express cors

# 构建函数
npm run build

# 本地测试
npm run serve

# 部署单个函数
firebase deploy --only functions:funcName
```

### Firestore 操作

```bash
# 导出数据
firebase firestore:export gs://bucket/path

# 导入数据
firebase firestore:import gs://bucket/path

# 创建索引
firebase deploy --only firestore:indexes
```

## 部署配置

### firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "redirects": [
      {
        "source": "/old-path",
        "destination": "/new-path",
        "type": 301
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### firestore.indexes.json

```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "comments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "postId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/firebase-deploy.yml
name: Firebase Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
      
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## 常见问题

### 1. 认证状态持久化

```typescript
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const auth = getAuth();
await setPersistence(auth, browserLocalPersistence);
```

### 2. 处理并发更新

```typescript
import { writeBatch, increment } from 'firebase/firestore';

const batch = writeBatch(db);
batch.update(postRef, { likeCount: increment(1) });
batch.update(userRef, { likedPosts: arrayUnion(postId) });
await batch.commit();
```

### 3. 处理大文件上传

```typescript
// 分块上传
const chunkSize = 5 * 1024 * 1024; // 5MB
async function uploadLargeFile(file: File) {
  if (file.size <= chunkSize) {
    return uploadFile(`uploads/${file.name}`, file);
  }
  
  // 使用 Resumable Upload
  return new Promise((resolve, reject) => {
    uploadFileWithProgress(
      `uploads/${file.name}`,
      file,
      (progress) => console.log(`Upload: ${progress}%`),
      (url) => resolve(url),
      (error) => reject(error)
    );
  });
}
```

## 相关资源

- [Firebase 官方文档](https://firebase.google.com/docs)
- [Firestore 数据模型](https://firebase.google.com/docs/firestore/data-model)
- [Firebase 安全规则](https://firebase.google.com/docs/rules)
- [Cloud Functions 文档](https://firebase.google.com/docs/functions)
- [Firebase CLI 参考](https://firebase.google.com/docs/cli)
