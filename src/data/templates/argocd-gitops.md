# Argo CD - GitOps 持续交付工具

声明式 GitOps 持续交付工具，专为 Kubernetes 设计，实现自动化部署和生命周期管理。

## 技术栈

- **核心**: Argo CD 2.x
- **容器编排**: Kubernetes 1.23+
- **配置管理**: Kustomize / Helm / Jsonnet
- **Git 提供商**: GitHub / GitLab / Bitbucket
- **镜像仓库**: Docker Hub / Harbor / ECR / GCR
- **密钥管理**: Sealed Secrets / External Secrets / Vault

## 项目结构

```
argocd-project/
├── apps/                      # 应用配置
│   ├── frontend/
│   │   ├── base/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── configmap.yaml
│   │   │   └── kustomization.yaml
│   │   └── overlays/
│   │       ├── dev/
│   │       │   ├── kustomization.yaml
│   │       │   └── patches/
│   │       └── prod/
│   │           ├── kustomization.yaml
│   │           └── patches/
│   ├── backend/
│   │   └── ...
│   └── kustomization.yaml
├── infrastructure/            # 基础设施
│   ├── controllers/
│   │   ├── nginx-ingress/
│   │   ├── cert-manager/
│   │   └── external-secrets/
│   └── services/
│       ├── redis/
│       ├── postgres/
│       └── elasticsearch/
├── argocd/                    # Argo CD 配置
│   ├── projects/
│   │   ├── frontend.yaml
│   │   └── backend.yaml
│   ├── applications/
│   │   ├── frontend-app.yaml
│   │   ├── backend-app.yaml
│   │   └── infrastructure-app.yaml
│   ├── applicationsets/
│   │   └── cluster-addons.yaml
│   └── config/
│       ├── argocd-cm.yaml
│       ├── argocd-rbac-cm.yaml
│       └── argocd-repo-creds.yaml
├── secrets/                   # 密钥管理
│   ├── sealed-secrets/
│   │   ├── db-credentials.yaml
│   │   └── api-keys.yaml
│   └── external-secrets/
│       ├── vault-backend.yaml
│       └── external-secret.yaml
├── scripts/                   # 脚本
│   ├── sync-apps.sh
│   └── rollback.sh
├── .argocd-source.yaml        # Argo CD 源配置
├── Chart.yaml                 # Helm chart（可选）
├── values.yaml                # Helm values
└── README.md
```

## 核心代码模式

### 1. Argo CD 项目配置 (argocd/projects/frontend.yaml)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: frontend
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  description: 前端应用项目

  # 源仓库
  sourceRepos:
    - 'https://github.com/myorg/frontend.git'
    - 'https://github.com/myorg/shared-configs.git'
    - 'https://charts.helm.sh/stable'

  # 目标集群和命名空间
  destinations:
    - namespace: frontend-dev
      server: https://kubernetes.default.svc
    - namespace: frontend-staging
      server: https://kubernetes.default.svc
    - namespace: frontend-prod
      server: https://prod-cluster.example.com

  # 允许的资源
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
    - group: networking.k8s.io
      kind: Ingress
    - group: rbac.authorization.k8s.io
      kind: ClusterRole

  namespaceResourceWhitelist:
    - group: ''
      kind: Deployment
    - group: ''
      kind: Service
    - group: ''
      kind: ConfigMap
    - group: ''
      kind: Secret
    - group: apps
      kind: Deployment
    - group: networking.k8s.io
      kind: Ingress

  # 同步窗口（维护时间窗口）
  syncWindows:
    - kind: allow
      schedule: '10 1 * * *'
      duration: 1h
      applications:
        - '*-prod'
      namespaces:
        - frontend-prod
      manualSync: true

  # 角色配置
  roles:
    - name: developer
      description: 开发者权限
      policies:
        - p, proj:frontend:developer, applications, get, frontend/*, allow
        - p, proj:frontend:developer, applications, sync, frontend/*, deny
      groups:
        - myorg:developers

    - name: admin
      description: 管理员权限
      policies:
        - p, proj:frontend:admin, applications, *, frontend/*, allow
      groups:
        - myorg:admins
```

### 2. 应用配置 (argocd/applications/frontend-app.yaml)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: frontend
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
  annotations:
    notifications.argoproj.io/subscribe.on-sync-succeeded.slack: deployments
    notifications.argoproj.io/subscribe.on-health-degraded.slack: alerts
spec:
  project: frontend

  # Git 源配置
  source:
    repoURL: https://github.com/myorg/frontend.git
    targetRevision: main
    path: apps/frontend/overlays/prod

    # Kustomize 配置
    kustomize:
      namePrefix: prod-
      nameSuffix: -v1
      images:
        - ghcr.io/myorg/frontend:latest=ghcr.io/myorg/frontend:v2.0.0
      commonLabels:
        env: production
        team: frontend

    # 或使用 Helm
    # helm:
    #   valueFiles:
    #     - values-prod.yaml
    #   parameters:
    #     - name: image.tag
    #       value: v2.0.0

  # 目标集群
  destination:
    server: https://kubernetes.default.svc
    namespace: frontend-prod

  # 同步策略
  syncPolicy:
    automated:
      prune: true           # 自动清理不在 Git 中的资源
      selfHeal: true        # 自动修复漂移
      allowEmpty: false     # 不允许空应用
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
      - RespectIgnoreDifferences=true
      - ApplyOutOfSyncOnly=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

  # 忽略差异
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
    - group: ''
      kind: Secret
      jsonPointers:
        - /data/password

  # 健康检查
  health:
    healthCheck: |
      hs = {}
      if obj.status ~= nil then
        if obj.status.health ~= nil then
          hs.status = obj.status.health.status
          if obj.status.health.message ~= nil then
            hs.message = obj.status.health.message
          end
        end
      end
      return hs
```

### 3. ApplicationSet 多环境部署 (argocd/applicationsets/cluster-addons.yaml)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: cluster-addons
  namespace: argocd
spec:
  generators:
    # 列表生成器 - 多环境
    - list:
        elements:
          - name: nginx-ingress
            namespace: ingress-nginx
            chart: ingress-nginx
            repoURL: https://kubernetes.github.io/ingress-nginx
            targetRevision: 4.8.0
          - name: cert-manager
            namespace: cert-manager
            chart: cert-manager
            repoURL: https://charts.jetstack.io
            targetRevision: v1.13.0
          - name: external-secrets
            namespace: external-secrets
            chart: external-secrets
            repoURL: https://charts.external-secrets.io
            targetRevision: 0.9.0

  template:
    metadata:
      name: '{{name}}'
      labels:
        app.kubernetes.io/managed-by: argocd
        app.kubernetes.io/component: infrastructure
    spec:
      project: infrastructure
      source:
        repoURL: '{{repoURL}}'
        chart: '{{chart}}'
        targetRevision: '{{targetRevision}}'
        helm:
          releaseName: '{{name}}'
          valueFiles:
            - values.yaml
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{namespace}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true

---
# Git 目录生成器 - 多集群
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: workloads
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/myorg/workloads.git
        revision: HEAD
        directories:
          - path: apps/*
          - path: apps/experimental/*
            exclude: true

  template:
    metadata:
      name: '{{path.basename}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/workloads.git
        targetRevision: HEAD
        path: '{{path}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true

---
# 矩阵生成器 - 多环境 + 多集群
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: multi-env-workloads
  namespace: argocd
spec:
  generators:
    - matrix:
        generators:
          - list:
              elements:
                - env: dev
                  cluster: https://dev-cluster.example.com
                - env: staging
                  cluster: https://staging-cluster.example.com
                - env: prod
                  cluster: https://prod-cluster.example.com
          - git:
              repoURL: https://github.com/myorg/workloads.git
              revision: HEAD
              directories:
                - path: apps/*

  template:
    metadata:
      name: '{{path.basename}}-{{env}}'
    spec:
      project: '{{env}}'
      source:
        repoURL: https://github.com/myorg/workloads.git
        targetRevision: HEAD
        path: '{{path}}/overlays/{{env}}'
      destination:
        server: '{{cluster}}'
        namespace: '{{path.basename}}'
```

### 4. Kustomize 基础配置 (apps/frontend/base/deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  labels:
    app: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: ghcr.io/myorg/frontend:latest
          ports:
            - containerPort: 80
              name: http
          env:
            - name: NODE_ENV
              value: production
            - name: API_URL
              valueFrom:
                configMapKeyRef:
                  name: frontend-config
                  key: api-url
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: frontend
                topologyKey: kubernetes.io/hostname
```

### 5. Kustomization 配置 (apps/frontend/base/kustomization.yaml)

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml
  - ingress.yaml

commonLabels:
  app.kubernetes.io/name: frontend
  app.kubernetes.io/part-of: myapp
  app.kubernetes.io/managed-by: kustomize

images:
  - name: ghcr.io/myorg/frontend
    newTag: v1.0.0

configMapGenerator:
  - name: frontend-config
    literals:
      - API_URL=https://api.example.com
      - LOG_LEVEL=info

secretGenerator:
  - name: frontend-secrets
    literals:
      - API_KEY=placeholder
    type: Opaque
```

### 6. 生产环境 Overlay (apps/frontend/overlays/prod/kustomization.yaml)

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: frontend-prod

resources:
  - ../../base
  - hpa.yaml
  - network-policy.yaml

patchesStrategicMerge:
  - deployment-patch.yaml
  - service-patch.yaml

patchesJson6902:
  - target:
      group: apps
      version: v1
      kind: Deployment
      name: frontend
    path: replicas-patch.yaml

images:
  - name: ghcr.io/myorg/frontend
    newTag: v2.0.0

configMapGenerator:
  - name: frontend-config
    behavior: merge
    literals:
      - API_URL=https://api-prod.example.com
      - LOG_LEVEL=warn
      - FEATURE_FLAG_NEW_UI=true

commonAnnotations:
  environment: production
  version: v2.0.0

# 替换配置
replacements:
  - source:
      kind: ConfigMap
      name: frontend-config
      fieldPath: data.API_URL
    targets:
      - select:
          kind: Deployment
          name: frontend
        fieldPaths:
          - spec.template.spec.containers.[name:frontend].env.[name:API_URL].value
```

### 7. 密钥管理 - Sealed Secrets (secrets/sealed-secrets/db-credentials.yaml)

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
  namespace: backend-prod
  annotations:
    sealedsecrets.bitnami.com/cluster-wide: "true"
spec:
  encryptedData:
    username: AgBy3i4OJSWK+diTy1qp5jGhn1...
    password: AgBy3i4OJSWK+diTy1qp5jGhn2...
    host: AgBy3i4OJSWK+diTy1qp5jGhn3...
    database: AgBy3i4OJSWK+diTy1qp5jGhn4...
  template:
    metadata:
      name: db-credentials
      namespace: backend-prod
      labels:
        app: backend
        component: database
    type: Opaque
```

### 8. External Secrets Operator (secrets/external-secrets/external-secret.yaml)

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: backend-prod
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "backend-role"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: backend-secrets
  namespace: backend-prod
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: backend-secrets
    creationPolicy: Owner
    template:
      type: Opaque
      data:
        DB_PASSWORD: "{{ .db_password }}"
        API_KEY: "{{ .api_key }}"
        JWT_SECRET: "{{ .jwt_secret }}"
  data:
    - secretKey: db_password
      remoteRef:
        key: backend/database
        property: password
    - secretKey: api_key
      remoteRef:
        key: backend/api
        property: key
    - secretKey: jwt_secret
      remoteRef:
        key: backend/auth
        property: jwt_secret
```

### 9. Argo CD 配置 (argocd/config/argocd-cm.yaml)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
  labels:
    app.kubernetes.io/name: argocd-cm
    app.kubernetes.io/part-of: argocd
data:
  # 应用 URL
  url: https://argocd.example.com

  # 用户界面设置
  ui.bannercontent: "生产环境 - 请谨慎操作"
  ui.bannerurl: "https://docs.example.com/argocd"
  ui.bannercolor: "#FF6600"

  # 仓库凭据
  repositories: |
    - url: https://github.com/myorg
      type: git
      name: myorg

  # Helm 仓库
  helm.repositories: |
    - url: https://charts.bitnami.com/bitnami
      name: bitnami
    - url: https://charts.helm.sh/stable
      name: stable

  # 资源豁免
  resource.exclusions: |
    - apiGroups:
        - ""
      kinds:
        - Event
      clusters:
        - "*"

  # 资源自定义
  resource.customizations: |
    apps/Deployment:
      health.lua:
        hs = {}
        if obj.status ~= nil then
          if obj.status.unavailableReplicas ~= nil and obj.status.unavailableReplicas > 0 then
            hs.status = "Degraded"
            hs.message = "Deployment has unavailable replicas"
            return hs
          end
          if obj.status.availableReplicas ~= nil and obj.status.availableReplicas == obj.spec.replicas then
            hs.status = "Healthy"
            hs.message = "All replicas are available"
            return hs
          end
        end
        hs.status = "Progressing"
        hs.message = "Deployment is progressing"
        return hs

  # Kustomize 版本
  kustomize.buildOptions: --load-restrictor LoadRestrictionsNone

  # 管理账户
  admin.enabled: "false"
  accounts.backstage: apiKey, login
  accounts.backstage.enabled: "true"
```

### 10. 通知配置 (argocd/config/argocd-notifications-cm.yaml)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  # Slack 配置
  service.slack: |
    token: $slack-token

  # 邮件配置
  service.email: |
    host: smtp.example.com
    port: 587
    from: argocd@example.com
    username: $email-username
    password: $email-password

  # 触发器
  trigger.on-sync-failed: |
    - description: 同步失败
      send:
        - app-sync-failed
      when: app.status.operationState.phase in ['Failed', 'Error']

  trigger.on-sync-succeeded: |
    - description: 同步成功
      send:
        - app-sync-succeeded
      when: app.status.operationState.phase in ['Succeeded']

  trigger.on-health-degraded: |
    - description: 应用健康状态降级
      send:
        - app-health-degraded
      when: app.status.health.status == 'Degraded'

  # 模板
  template.app-sync-succeeded: |
    subject: Application {{.app.metadata.name}} sync succeeded
    slack:
      attachments: |
        [{
          "title": "{{.app.metadata.name}}",
          "title_link": "{{.context.argocdUrl}}/applications/{{.app.metadata.name}}",
          "color": "#18be52",
          "fields": [
            {
              "title": "Sync Status",
              "value": "{{.app.status.sync.status}}",
              "short": true
            },
            {
              "title": "Health Status",
              "value": "{{.app.status.health.status}}",
              "short": true
            }
          ]
        }]

  template.app-sync-failed: |
    subject: Application {{.app.metadata.name}} sync failed
    slack:
      attachments: |
        [{
          "title": "{{.app.metadata.name}}",
          "title_link": "{{.context.argocdUrl}}/applications/{{.app.metadata.name}}",
          "color": "#f44336",
          "fields": [
            {
              "title": "Sync Status",
              "value": "{{.app.status.sync.status}}",
              "short": true
            },
            {
              "title": "Error",
              "value": "{{.app.status.operationState.message}}",
              "short": false
            }
          ]
        }]

  # 订阅
  subscriptions: |
    - recipients:
        - slack:deployments
        - email:team@example.com
      triggers:
        - on-sync-succeeded
        - on-sync-failed
        - on-health-degraded
```

### 11. RBAC 配置 (argocd/config/argocd-rbac-cm.yaml)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  # 策略定义
  policy.default: role:readonly

  policy.csv: |
    # 管理员组 - 完全访问权限
    g, myorg:admins, role:admin

    # 开发者组 - 只读 + 同步权限
    g, myorg:developers, role:developer

    # 运维组 - 特定项目权限
    g, myorg:ops, role:ops

    # 自定义角色定义
    p, role:developer, applications, get, */*, allow
    p, role:developer, applications, sync, */*, allow
    p, role:developer, applications, */*, */*, deny
    p, role:developer, projects, get, *, allow
    p, role:developer, clusters, get, *, allow

    p, role:ops, applications, *, */*, allow
    p, role:ops, projects, *, *, allow
    p, role:ops, clusters, *, *, allow
    p, role:ops, repositories, *, *, allow

  # 范围配置（SSO）
  scopes: "[groups, email]"

  # OIDC 配置
  oidc.config: |
    name: Okta
    issuer: https://myorg.okta.com
    clientID: $oidc.okta.clientID
    clientSecret: $oidc.okta.clientSecret
    requestedScopes: ["openid", "profile", "email", "groups"]
    requestedIDTokenClaims: {"groups": {"essential": true}}
```

### 12. 部署脚本 (scripts/sync-apps.sh)

```bash
#!/bin/bash
set -euo pipefail

# 配置
ARGOCD_SERVER="argocd.example.com"
APP_NAME="${1:-}"
ENV="${2:-dev}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 登录 Argo CD
login_argocd() {
  log_info "登录 Argo CD..."
  argocd login "$ARGOCD_SERVER" --grpc-web --sso
}

# 同步应用
sync_app() {
  local app="$1"
  local env="$2"
  local full_app_name="${app}-${env}"

  log_info "同步应用: $full_app_name"

  # 检查应用状态
  if ! argocd app get "$full_app_name" > /dev/null 2>&1; then
    log_error "应用不存在: $full_app_name"
    return 1
  fi

  # 同步
  argocd app sync "$full_app_name" \
    --prune \
    --timeout 300

  # 等待健康检查
  log_info "等待应用健康检查..."
  argocd app wait "$full_app_name" \
    --health \
    --timeout 300

  log_info "应用 $full_app_name 同步完成"
}

# 回滚应用
rollback_app() {
  local app="$1"
  local env="$2"
  local full_app_name="${app}-${env}"

  log_info "回滚应用: $full_app_name"

  # 列出历史版本
  argocd app history "$full_app_name"

  # 选择版本
  read -p "选择要回滚的版本 ID: " revision

  # 执行回滚
  argocd app rollback "$full_app_name" "$revision"

  log_info "回滚完成"
}

# 主函数
main() {
  if [[ -z "$APP_NAME" ]]; then
    log_error "请指定应用名称"
    echo "用法: $0 <app-name> <env>"
    exit 1
  fi

  login_argocd
  sync_app "$APP_NAME" "$ENV"
}

main "$@"
```

### 13. 环境变量 (.env.example)

```env
# Argo CD 服务器
ARGOCD_SERVER=argocd.example.com
ARGOCD_USERNAME=admin
ARGOCD_PASSWORD=

# Git 仓库
GIT_REPO_URL=https://github.com/myorg/gitops-configs.git
GIT_USERNAME=
GIT_TOKEN=

# Slack 通知
SLACK_TOKEN=xoxb-xxx
SLACK_CHANNEL=#deployments

# Vault（密钥管理）
VAULT_ADDR=https://vault.example.com
VAULT_TOKEN=

# SSO/OIDC
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=

# 镜像仓库
REGISTRY_SERVER=ghcr.io
REGISTRY_USERNAME=
REGISTRY_PASSWORD=
```

## Argo CD 特色功能

### 1. GitOps 工作流
- Git 作为单一事实来源
- 自动化同步
- 漂移检测
- 版本控制

### 2. 多集群管理
- 集中式管理
- 集群注册
- 跨集群部署

### 3. 可视化界面
- 拓扑图
- 实时状态
- 资源树
- 差异对比

### 4. 回滚能力
- 历史记录
- 一键回滚
- 回滚预览

### 5. RBAC 权限
- 项目隔离
- 细粒度权限
- SSO 集成

## 最佳实践

1. **分支策略**
   - main: 生产环境
   - staging: 预发布环境
   - dev: 开发环境

2. **应用组织**
   - 按团队/服务划分
   - 使用 AppProject 隔离
   - 共享配置抽取

3. **密钥管理**
   - 不提交明文密钥
   - 使用 Sealed Secrets
   - 集成 Vault

4. **监控告警**
   - 配置通知
   - 健康检查
   - 审计日志

5. **灾难恢复**
   - 定期备份
   - 多集群备份
   - 灾难演练

## 常用命令

```bash
# 安装 Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 获取初始密码
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# CLI 登录
argocd login grpc.argocd.example.com --sso

# 创建应用
argocd app create frontend \
  --repo https://github.com/myorg/frontend.git \
  --path apps/frontend \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace frontend-prod

# 同步应用
argocd app sync frontend

# 查看应用状态
argocd app get frontend

# 回滚应用
argocd app rollback frontend

# 查看历史
argocd app history frontend
```

## 参考资源

- [Argo CD 官方文档](https://argo-cd.readthedocs.io)
- [Argo CD GitHub](https://github.com/argoproj/argo-cd)
- [GitOps 最佳实践](https://opengitops.dev)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io)
