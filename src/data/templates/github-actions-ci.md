# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: GitHub Actions CI/CD Pipeline
**Type**: Continuous Integration & Deployment
**Tech Stack**: GitHub Actions + Docker + Testing Frameworks
**Goal**: Production-ready CI/CD pipeline with automated testing, security scanning, and deployments

---

## Tech Stack

### CI/CD Platform
- **Platform**: GitHub Actions
- **Runners**: GitHub-hosted (Ubuntu, macOS, Windows) + Self-hosted
- **Container Runtime**: Docker
- **Artifact Storage**: GitHub Actions Artifacts + Cache

### Testing
- **Unit Testing**: Jest / Vitest / pytest / cargo test
- **Integration Testing**: Docker Compose + TestContainers
- **E2E Testing**: Playwright / Cypress
- **Coverage**: Codecov / Coveralls

### Security
- **Code Scanning**: CodeQL / SonarCloud
- **Dependency Scanning**: Dependabot / Snyk
- **Container Scanning**: Trivy / Snyk Container
- **Secret Scanning**: GitLeaks / TruffleHog

### Deployment
- **Environments**: Development, Staging, Production
- **Infrastructure**: Terraform / Pulumi / CloudFormation
- **Container Registry**: GHCR / Docker Hub / ECR
- **Deployment Strategy**: Blue-Green / Canary / Rolling

---

## Code Standards

### Workflow File Rules
- Use descriptive job and step names
- Pin action versions with SHA hashes for security
- Use matrix strategy for multiple configurations
- Implement proper secret management
- Cache dependencies to speed up builds

```yaml
# ✅ Good - Secure, optimized workflow
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20, 22]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4.1.1
      with:
        fetch-depth: 0
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4.0.2
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test -- --coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v4.1.0
      with:
        files: ./coverage/lcov.info
        fail_ci_if_error: true

# ❌ Bad - No version pinning, no caching
name: CI
on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout  # ❌ No version
    - uses: actions/setup-node  # ❌ No version
    - run: npm install  # ❌ No cache
    - run: npm test  # ❌ No coverage upload
```

### Naming Conventions
- **Workflow Files**: kebab-case (`ci-pipeline.yml`, `deploy-production.yml`)
- **Jobs**: descriptive-action (`test`, `build`, `deploy-production`)
- **Steps**: action-description (`Checkout code`, `Setup Node.js`)
- **Environments**: lowercase (`production`, `staging`)

### File Organization
```
.github/
├── workflows/
│   ├── ci.yml                    # Continuous integration
│   ├── cd-production.yml         # Production deployments
│   ├── cd-staging.yml            # Staging deployments
│   ├── security-scan.yml         # Security scanning
│   ├── dependency-update.yml     # Dependabot automation
│   └── release.yml               # Release automation
├── actions/                      # Composite actions
│   ├── setup-node/
│   │   └── action.yml
│   ├── deploy/
│   │   └── action.yml
│   └── notify/
│       └── action.yml
├── CODEOWNERS                    # Code owners
└── dependabot.yml                # Dependabot config
```

---

## Architecture Patterns

### Multi-Stage Pipeline

**When to use**: Complex applications with multiple quality gates

```yaml
name: Multi-Stage Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run lint

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run build

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
```

### Matrix Testing

**When to use**: Testing across multiple versions/platforms

```yaml
name: Matrix Testing

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20, 22]
        exclude:
        - os: macos-latest
          node: 18
        - os: windows-latest
          node: 18
    
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node }}
        cache: 'npm'
    - run: npm ci
    - run: npm test
```

### Reusable Workflows

**When to use**: DRY principle across multiple repositories

```yaml
# .github/workflows/ci.yml (reusable)
name: Reusable CI

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
    - run: npm ci
    - run: npm test

# .github/workflows/main.yml (caller)
name: Main CI

on: push

jobs:
  call-ci:
    uses: ./.github/workflows/ci.yml
    with:
      node-version: '20'
```

---

## Key Constraints

### Security
- ✅ Pin action versions with SHA hashes
- ✅ Use GitHub Secrets for sensitive data
- ✅ Enable branch protection rules
- ✅ Use environment protection rules
- ✅ Scan dependencies for vulnerabilities
- ✅ Limit token permissions
- ❌ No hardcoded secrets
- ❌ No using `latest` tag for actions
- ❌ No skip authentication in deployments

### Performance
- ✅ Cache dependencies (npm, pip, cargo)
- ✅ Use matrix for parallel testing
- ✅ Cancel redundant builds
- ✅ Use incremental builds
- ✅ Minimize build context
- ❌ No redundant steps
- ❌ No unnecessary network calls
- ❌ No large artifacts without retention policy

### Reliability
- ✅ Implement retry logic for flaky tests
- ✅ Use timeouts for long-running jobs
- ✅ Set up proper failure notifications
- ✅ Use concurrency groups
- ❌ No infinite loops
- ❌ No unbounded retries
- ❌ No skipping critical tests

---

## Common Commands

### Workflow Management
```bash
# Trigger workflow manually
gh workflow run ci.yml

# View workflow runs
gh run list --workflow=ci.yml

# Download artifacts
gh run download <run-id>

# View workflow logs
gh run view <run-id>

# Re-run failed jobs
gh run rerun <run-id>
```

### Secret Management
```bash
# Add secret
gh secret set SECRET_NAME

# List secrets
gh secret list

# Delete secret
gh secret remove SECRET_NAME
```

### Local Testing
```bash
# Test workflow locally with act
act push

# Test specific job
act -j test

# List available actions
act -l

# Test with specific event
act pull_request
```

---

## Important Prohibitions

### ❌ Never Do
- Don't commit secrets to repository
- Don't use untrusted actions
- Don't skip security scans in production
- Don't use `secrets.GITHUB_TOKEN` for deployments
- Don't create workflows without proper permissions
- Don't ignore failed tests
- Don't deploy without environment protection

### ⚠️ Use with Caution
- `workflow_dispatch` - ensure proper authorization
- Self-hosted runners - maintain security updates
- Matrix strategy - balance coverage vs. cost
- Caching - invalidate when dependencies change
- Artifacts - set appropriate retention policies

---

## Best Practices

### Caching Strategy

```yaml
# ✅ Good - Proper cache keys
- name: Cache dependencies
  uses: actions/cache@v4.0.2
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Conditional Deployments

```yaml
# ✅ Good - Environment-specific deployments
deploy:
  runs-on: ubuntu-latest
  needs: build
  if: github.event_name == 'push'
  
  steps:
  - name: Deploy to staging
    if: github.ref == 'refs/heads/develop'
    run: deploy-staging.sh
    
  - name: Deploy to production
    if: github.ref == 'refs/heads/main'
    environment: production
    run: deploy-production.sh
```

### Security Scanning

```yaml
# ✅ Good - Comprehensive security scanning
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run CodeQL Analysis
      uses: github/codeql-action/analyze@v3
      with:
        languages: javascript, typescript
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        severity: 'CRITICAL,HIGH'
```

### Notification on Failure

```yaml
# ✅ Good - Proper failure notifications
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1.25.0
  with:
    channel-id: 'alerts'
    slack-message: |
      ❌ CI failed for ${{ github.repository }}
      Commit: ${{ github.sha }}
      Author: ${{ github.actor }}
      Run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

---

## Quick Reference

### Common Events
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:     # Manual trigger
  repository_dispatch:   # External trigger
```

### Environment Variables
```yaml
env:
  NODE_ENV: test
  CI: true

jobs:
  build:
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Default Permissions
```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write
```

### Common Patterns
- **Skip CI**: `[skip ci]` or `[ci skip]` in commit message
- **Matrix**: Test multiple versions/platforms
- **Concurrency**: Cancel redundant builds
- **Timeout**: Set job timeouts (default: 6 hours)

---

**Last Updated**: 2026-03-13
