# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Kubernetes Production Deployment
**Type**: Container Orchestration & Infrastructure
**Tech Stack**: Kubernetes 1.28+ + Docker + Helm
**Goal**: Production-ready Kubernetes deployment with best practices, monitoring, and security

---

## Tech Stack

### Core Infrastructure
- **Container Runtime**: Docker 24+
- **Orchestration**: Kubernetes 1.28+
- **Package Manager**: Helm 3.13+
- **Configuration**: Kustomize 5.2+
- **Ingress**: NGINX Ingress Controller

### Observability
- **Monitoring**: Prometheus + Grafana
- **Logging**: Loki + Grafana
- **Tracing**: Jaeger / OpenTelemetry
- **Service Mesh**: Istio (optional)

### Security
- **Secrets Management**: External Secrets Operator / Vault
- **Policy Enforcement**: OPA Gatekeeper / Kyverno
- **Image Scanning**: Trivy / Clair
- **RBAC**: Kubernetes RBAC + OIDC

### CI/CD
- **GitOps**: ArgoCD / Flux2
- **Image Registry**: Harbor / Docker Hub / ECR
- **Build**: Docker Buildx / Kaniko
- **Testing**: kubeval / conftest

---

## Code Standards

### Kubernetes Manifests Rules
- Always use `apiVersion` appropriate for the resource
- Include resource limits and requests for all containers
- Use `livenessProbe` and `readinessProbe` for all deployments
- Implement proper security contexts
- Use ConfigMaps for configuration, Secrets for sensitive data

```yaml
# ✅ Good - Production-ready deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  labels:
    app: api-server
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
        version: v1.0.0
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: api-server
        image: api-server:v1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
              - ALL

# ❌ Bad - Missing critical configurations
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api-server
  template:
    spec:
      containers:
      - name: api-server
        image: api-server:latest  # ❌ Never use :latest in production
        # ❌ No resource limits
        # ❌ No probes
        # ❌ No security context
```

### Naming Conventions
- **Resources**: kebab-case (`api-server`, `user-service`)
- **Labels**: kebab-case (`app`, `version`, `environment`)
- **ConfigMaps**: `{app-name}-config`
- **Secrets**: `{app-name}-secret`
- **Namespaces**: kebab-case (`production`, `staging`)

### File Organization
```
k8s/
├── base/                    # Base manifests (Kustomize)
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── kustomization.yaml
├── overlays/                # Environment-specific configs
│   ├── production/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── development/
│       └── kustomization.yaml
├── helm/                    # Helm charts
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── values-production.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── configmap.yaml
│       └── ingress.yaml
└── scripts/                 # Utility scripts
    ├── deploy.sh
    └── rollback.sh
```

---

## Architecture Patterns

### Multi-Environment Strategy

**When to use**: Managing deployments across dev/staging/prod

```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

bases:
  - ../../base

patchesStrategicMerge:
  - patches/replica-count.yaml

# Deploy with: kubectl apply -k overlays/production/
```

### GitOps with ArgoCD

**When to use**: Automated, declarative deployments

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: api-server
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/repo.git
    targetRevision: HEAD
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### Helm Chart Pattern

**When to use**: Complex applications with many configurations

```yaml
# helm/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "app.fullname" . }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "app.selectorLabels" . | nindent 6 }}
  template:
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        {{- if .Values.env }}
        env:
        {{- toYaml .Values.env | nindent 8 }}
        {{- end }}
```

---

## Key Constraints

### Security
- ✅ Always use resource quotas and limits
- ✅ Run containers as non-root user
- ✅ Use read-only root filesystem
- ✅ Implement network policies
- ✅ Scan images for vulnerabilities
- ✅ Use secrets from external secret managers
- ❌ No privileged containers
- ❌ No hostPath volumes
- ❌ No running as root
- ❌ No hardcoded secrets in manifests

### High Availability
- ✅ Run multiple replicas (min 2 for production)
- ✅ Use PodDisruptionBudgets
- ✅ Implement proper health checks
- ✅ Use anti-affinity rules
- ✅ Configure horizontal pod autoscaling
- ❌ No single points of failure
- ❌ No rolling updates with maxUnavailable: 100%

### Resource Management
- ✅ Always set resource requests and limits
- ✅ Use LimitRanges for namespaces
- ✅ Implement ResourceQuotas
- ✅ Monitor resource usage
- ❌ No unbounded resources
- ❌ No overcommitting critical workloads

---

## Common Commands

### Development
```bash
# Apply manifests
kubectl apply -f k8s/base/

# Apply with Kustomize
kubectl apply -k k8s/overlays/production/

# Helm deployment
helm upgrade --install myapp ./helm/ -f helm/values-production.yaml

# Validate manifests
kubeval k8s/base/*.yaml
kustomize build k8s/overlays/production/ | kubeval -

# Dry run
kubectl apply -f k8s/base/ --dry-run=client
```

### Debugging
```bash
# Get pod logs
kubectl logs -f deployment/api-server -n production

# Describe resources
kubectl describe pod <pod-name> -n production

# Execute into container
kubectl exec -it <pod-name> -n production -- /bin/sh

# Port forward
kubectl port-forward svc/api-server 8080:80 -n production

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'
```

### Monitoring
```bash
# Get resource usage
kubectl top pods -n production
kubectl top nodes

# Check rollout status
kubectl rollout status deployment/api-server -n production

# View deployment history
kubectl rollout history deployment/api-server -n production

# Rollback
kubectl rollout undo deployment/api-server -n production
```

### Maintenance
```bash
# Scale deployment
kubectl scale deployment api-server --replicas=5 -n production

# Update image
kubectl set image deployment/api-server api-server=api-server:v2.0.0 -n production

# Delete resources
kubectl delete -f k8s/base/
kubectl delete all -l app=api-server -n production
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use `:latest` image tag in production
- Don't commit secrets to Git
- Don't run containers as root
- Don't skip resource limits
- Don't use hostPath volumes
- Don't disable security contexts
- Don't expose services without ingress/authorization
- Don't skip health checks

### ⚠️ Use with Caution
- `kubectl delete` - always specify namespace and resources
- Horizontal Pod Autoscaler - monitor metrics server availability
- Node affinity - consider multi-zone deployments
- Init containers - ensure they complete successfully
- StatefulSets - for stateful workloads only

---

## Best Practices

### Container Images

```dockerfile
# ✅ Good - Multi-stage build, minimal attack surface
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs20-debian11
COPY --from=builder /app /app
WORKDIR /app
USER nonroot:nonroot
EXPOSE 8080
CMD ["server.js"]

# ❌ Bad - Large image, running as root
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8080
CMD ["npm", "start"]
```

### Network Policies

```yaml
# ✅ Good - Restrict traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-server-network-policy
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Quick Reference

### Resource Limits (Recommended)
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Common Labels
```yaml
labels:
  app: api-server
  version: v1.0.0
  environment: production
  team: backend
  tier: application
```

### Health Check Endpoints
- **Liveness**: `/health` - Basic health check
- **Readiness**: `/ready` - Ready to accept traffic
- **Startup**: `/startup` - Application started

### Git Branch Naming
- `deploy/production-v1.2.0` - Production deployments
- `hotfix/critical-security-patch` - Emergency fixes
- `infra/add-monitoring` - Infrastructure changes

---

**Last Updated**: 2026-03-13
