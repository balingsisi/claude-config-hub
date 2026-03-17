# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Loki Log Aggregation
**Type**: Observability & Monitoring
**Tech Stack**: Loki + Promtail + Grafana
**Goal**: Centralized log aggregation and visualization for distributed systems

---

## Tech Stack

### Core
- **Log Aggregator**: Loki 2.9+
- **Log Shipper**: Promtail 2.9+
- **Visualization**: Grafana 10+
- **Query Language**: LogQL

### Storage
- **Storage Backend**: Local filesystem, S3, GCS, Azure Blob
- **Indexing**: Label-based indexing
- **Compression**: Snappy, Gzip

### Infrastructure
- **Container Runtime**: Docker, Kubernetes
- **Orchestration**: Kubernetes, Docker Compose
- **Service Discovery**: Kubernetes API, DNS

### Development
- **CLI**: LogCLI
- **API**: Loki HTTP API
- **Testing**: Grafana Loki integration tests
- **Monitoring**: Prometheus metrics

---

## Code Standards

### Log Format
- Use structured logging (JSON)
- Include required labels
- Use consistent timestamp format
- Include trace IDs for correlation

```json
// ✅ Good
{
  "timestamp": "2024-03-17T10:30:45.123Z",
  "level": "info",
  "service": "api-gateway",
  "trace_id": "abc123",
  "user_id": "user456",
  "message": "Request processed",
  "duration_ms": 45,
  "status": "success"
}

// ❌ Bad
[INFO] Request processed - took 45ms
```

### Label Naming
- Use consistent naming conventions
- Keep label cardinality low
- Use meaningful labels
- Avoid dynamic labels

```yaml
# ✅ Good - Low cardinality labels
labels:
  job: api-gateway
  env: production
  service: user-service
  level: info

# ❌ Bad - High cardinality labels
labels:
  job: api-gateway
  user_id: "12345"  # High cardinality
  request_id: "abc-def-ghi"  # High cardinality
```

### Configuration Organization
```
loki/
├── loki-config.yaml        # Main Loki config
├── promtail-config.yaml    # Promtail config
├── rules/                  # Alert rules
│   ├── alerts.yaml
│   └── recording-rules.yaml
├── dashboards/            # Grafana dashboards
│   ├── logs-overview.json
│   └── application-logs.json
├── docker-compose.yml     # Local deployment
└── kubernetes/            # K8s manifests
    ├── loki-deployment.yaml
    ├── promtail-daemonset.yaml
    └── grafana-deployment.yaml
```

---

## Architecture Patterns

### Loki Configuration
- Multi-tenant support
- Proper retention policies
- Efficient storage configuration
- Resource limits

```yaml
# loki-config.yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096
  log_level: info

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb-shipper
      object_store: filesystem
      schema: v12
      index:
        prefix: index_
        period: 24h

limits_config:
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  retention_period: 744h  # 31 days
  max_entries_limit_per_query: 5000
  max_streams_per_user: 10000

compactor:
  working_directory: /loki/compactor
  shared_store: filesystem
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 744h
```

### Promtail Configuration
- Service discovery
- Label extraction
- Pipeline stages
- Multiple clients

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push
    tenant_id: tenant1

scrape_configs:
  # Docker containers
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
        filters:
          - name: label
            values: ["logging=promtail"]
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
      - source_labels: ['__meta_docker_container_log_stream']
        target_label: 'stream'
      - source_labels: ['__meta_docker_container_label_com_docker_compose_service']
        target_label: 'service'

  # Kubernetes pods
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    pipeline_stages:
      - docker: {}
      - match:
          selector: '{app="nginx"}'
          stages:
            - regex:
                expression: '^(?P<remote_addr>[\d\.]+) - (?P<remote_user>\S+) \[(?P<time_local>[^\]]+)\] "(?P<request>[^"]+)" (?P<status>\d+) (?P<body_bytes_sent>\d+)'
            - labels:
                remote_addr:
                status:
            - metrics:
                http_requests_total:
                  type: Counter
                  description: "Total HTTP requests"
                  source: status
                  config:
                    action: inc

  # System logs
  - job_name: syslog
    static_configs:
      - targets:
          - localhost
        labels:
          job: syslog
          __path__: /var/log/syslog
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>\w+\s+\d+\s+\d+:\d+:\d+) (?P<hostname>\S+) (?P<program>\S+): (?P<message>.*)$'
      - labels:
          hostname:
          program:
      - timestamp:
          source: timestamp
          format: "Jan 02 15:04:05"
```

### LogQL Queries
- Efficient query patterns
- Label matchers
- Log aggregations
- Metric queries

```logql
# Basic log query
{job="api-gateway", level="error"}

# Filter with regex
{job="api-gateway"} |= "error" |~ "failed.*request"

# Extract fields
{job="api-gateway"}
  | json
  | level="error"
  | line_format "{{.timestamp}} {{.message}}"

# Aggregation - count errors per service
sum by (service) (
  count_over_time({job="api-gateway", level="error"}[5m])
)

# Rate query - requests per second
sum(rate({job="api-gateway"}[5m])) by (service)

# Latency percentiles
quantile_over_time(0.95, {job="api-gateway"}
  | json
  | unwrap duration_ms
  [5m]
)

# Top 10 slowest endpoints
topk(10, avg by (endpoint) (
  rate({job="api-gateway"}
    | json
    | unwrap duration_ms
    [5m]
  )
))
```

### Alert Rules
- Define meaningful alerts
- Use proper thresholds
- Include runbooks
- Test alert conditions

```yaml
# rules/alerts.yaml
groups:
  - name: loki_alerts
    interval: 1m
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate({job="api-gateway", level="error"}[5m]))
          /
          sum(rate({job="api-gateway"}[5m]))
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
          runbook_url: "https://runbooks.example.com/high-error-rate"

      - alert: LogVolumeSpike
        expr: |
          sum(rate({job=~".+"}[5m])) > 10000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Log volume spike detected"
          description: "Log rate is {{ $value | humanize }} logs/sec"

      - alert: ServiceDown
        expr: |
          count(count_over_time({job="api-gateway"}[5m])) == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.service }} is down"
          description: "No logs received from {{ $labels.service }} for 5 minutes"

  - name: application_rules
    interval: 30s
    rules:
      - alert: HighLatency
        expr: |
          quantile_over_time(0.95, {job="api-gateway"}
            | json
            | unwrap duration_ms
            [5m]
          ) > 1000
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }}ms"

      - alert: DatabaseConnectionErrors
        expr: |
          sum(rate({job="api-gateway"} |= "database connection failed"[5m])) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failures"
          description: "{{ $value }} database connection errors per second"
```

---

## Key Constraints

### Label Management
- ✅ Use consistent labels across services
- ✅ Keep label cardinality low
- ✅ Use meaningful label names
- ❌ Don't use dynamic labels (user_id, request_id)
- ❌ Don't exceed 10 labels per stream
- ❌ Don't use labels with high cardinality values

### Performance
- ✅ Use appropriate retention periods
- ✅ Implement proper chunking
- ✅ Use compression
- ✅ Monitor resource usage
- ❌ Don't query without time bounds
- ❌ Don't use overly broad queries

### Storage
- ✅ Configure retention policies
- ✅ Use appropriate storage backend
- ✅ Monitor storage usage
- ❌ Don't keep logs longer than needed
- ❌ Don't ignore storage limits

---

## Common Commands

### LogCLI
```bash
# Query logs
logcli query '{job="api-gateway"}'

# Query with time range
logcli query '{job="api-gateway"}' --from=2024-03-17T00:00:00Z --to=2024-03-17T23:59:59Z

# Query with labels
logcli labels '{job="api-gateway"}' level

# Tail logs
logcli tail '{job="api-gateway"}'

# Instant query
logcli instant '{job="api-gateway"} | json | level="error"'
```

### Loki API
```bash
# Push logs
curl -X POST http://localhost:3100/loki/api/v1/push \
  -H "Content-Type: application/json" \
  -d '{
    "streams": [
      {
        "stream": {
          "job": "test",
          "level": "info"
        },
        "values": [
          ["1640995200000000000", "test log message"]
        ]
      }
    ]
  }'

# Query logs
curl "http://localhost:3100/loki/api/v1/query_range?query={job=\"api-gateway\"}&start=1640995200&end=1641081600"

# Get labels
curl "http://localhost:3100/loki/api/v1/labels"

# Get label values
curl "http://localhost:3100/loki/api/v1/label/job/values"
```

### Docker Compose
```bash
# Start stack
docker-compose up -d

# View logs
docker-compose logs -f loki

# Restart services
docker-compose restart

# Stop stack
docker-compose down
```

---

## Important Prohibitions

### ❌ Never Do
- Don't use high cardinality labels
- Don't query without time bounds
- Don't ignore retention limits
- Don't disable compression
- Don't store logs longer than compliance requires
- Don't skip alert configuration
- Don't use unstructured logs

### ⚠️ Use with Caution
- Large queries - may timeout
- High cardinality labels - can crash Loki
- Aggressive retention - may delete needed logs
- Multi-tenant mode - requires proper auth setup

---

## Best Practices

### Application Logging
- Use structured JSON logging
- Include correlation IDs
- Add relevant context
- Use appropriate log levels

```typescript
// ✅ Good - Structured logging
logger.info({
  message: 'Request processed',
  service: 'api-gateway',
  trace_id: ctx.request.headers['x-trace-id'],
  user_id: ctx.state.user.id,
  method: ctx.request.method,
  path: ctx.request.path,
  status: ctx.response.status,
  duration_ms: Date.now() - startTime,
  level: ctx.response.status >= 400 ? 'error' : 'info',
});

// ❌ Bad - Unstructured logging
console.log(`[${new Date().toISOString()}] Request processed: ${ctx.request.path}`);
```

### Grafana Dashboards
- Create meaningful visualizations
- Use variables for filtering
- Add documentation
- Test dashboard queries

```json
{
  "title": "Application Logs Overview",
  "uid": "app-logs",
  "templating": {
    "list": [
      {
        "name": "service",
        "type": "query",
        "datasource": "Loki",
        "query": "label_values({job=~\".+\"}, service)"
      },
      {
        "name": "level",
        "type": "query",
        "datasource": "Loki",
        "query": "label_values({job=~\".+\"}, level)"
      }
    ]
  },
  "panels": [
    {
      "title": "Log Volume",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(rate({job=\"api-gateway\", service=\"$service\"}[$__interval])) by (level)",
          "legendFormat": "{{level}}"
        }
      ]
    },
    {
      "title": "Error Logs",
      "type": "logs",
      "targets": [
        {
          "expr": "{job=\"api-gateway\", service=\"$service\", level=\"error\"}"
        }
      ]
    }
  ]
}
```

---

## Compact Instructions

When using `/compact`, preserve:
- Configuration changes
- Alert rule modifications
- Label schema updates
- Retention policy changes
- Query optimization notes

Discard:
- Verbose log output
- Exploratory search dead ends
- Redundant confirmation messages

---

## Quick Reference

### File Locations
- Loki Config: `loki/loki-config.yaml`
- Promtail Config: `loki/promtail-config.yaml`
- Alert Rules: `loki/rules/*.yaml`
- Dashboards: `loki/dashboards/*.json`
- K8s Manifests: `loki/kubernetes/*.yaml`

### Environment Variables
```env
LOKI_URL=http://localhost:3100
LOKI_TENANT_ID=tenant1
RETENTION_PERIOD=744h
STORAGE_TYPE=filesystem
```

### LogQL Quick Reference
```logql
# Basic query
{job="service"}

# Filter
{job="service"} |= "error"

# Regex
{job="service"} |~ "error|failed"

# JSON parsing
{job="service"} | json

# Label filtering
{job="service", level="error"}

# Aggregation
sum(rate({job="service"}[5m]))

# Percentile
quantile_over_time(0.95, {job="service"} | unwrap duration_ms [5m])
```

---

**Last Updated**: 2026-03-17
