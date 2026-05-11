# Deploy & CI/CD - Super Cantina

## Visão Geral

O Super Cantina utiliza **GitOps** com GitHub Actions para CI e ArgoCD para CD, garantindo deployments automatizados, seguros e auditáveis.

---

## Pipeline CI/CD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CI/CD PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐  │
│  │    Push     │────►│    Build    │────►│    Test     │────►│  Security │  │
│  │  to branch  │     │   & Lint    │     │   & E2E     │     │   Scan    │  │
│  └─────────────┘     └─────────────┘     └─────────────┘     └─────┬─────┘  │
│                                                                     │        │
│                                         ┌───────────────────────────┘        │
│                                         │                                    │
│                                         ▼                                    │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐  │
│  │   Deploy    │◄────│   Approve   │◄────│    Stage    │◄────│   Build   │  │
│  │ Production  │     │   (Manual)  │     │  Deployed   │     │   Image   │  │
│  └─────────────┘     └─────────────┘     └─────────────┘     └───────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## GitHub Actions

### Workflow Principal

```yaml
# .github/workflows/ci-cd.yaml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ==========================================
  # BUILD & LINT
  # ==========================================
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  # ==========================================
  # TEST
  # ==========================================
  test:
    runs-on: ubuntu-latest
    needs: build
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: supercantina_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/supercantina_test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/supercantina_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # ==========================================
  # SECURITY SCAN
  # ==========================================
  security:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Dependency audit
        run: npm audit --audit-level=high

  # ==========================================
  # BUILD DOCKER IMAGE
  # ==========================================
  docker:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.api
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ==========================================
  # DEPLOY STAGING
  # ==========================================
  deploy-staging:
    runs-on: ubuntu-latest
    needs: docker
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.supercantina.com.br

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Update Kubernetes manifests
        run: |
          cd k8s/overlays/staging
          kustomize edit set image supercantina/api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Commit and push
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "Deploy ${{ github.sha }} to staging"
          git push

  # ==========================================
  # DEPLOY PRODUCTION
  # ==========================================
  deploy-production:
    runs-on: ubuntu-latest
    needs: docker
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://api.supercantina.com.br

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Update Kubernetes manifests
        run: |
          cd k8s/overlays/production
          kustomize edit set image supercantina/api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Commit and push
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "Deploy ${{ github.sha }} to production"
          git push

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Production deployment: ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## ArgoCD

### Application

```yaml
# argocd/application.yaml

apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: supercantina
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default

  source:
    repoURL: https://github.com/empresa/supercantina.git
    targetRevision: HEAD
    path: k8s/overlays/production

  destination:
    server: https://kubernetes.default.svc
    namespace: supercantina

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
```

---

## Kustomize

### Base

```yaml
# k8s/base/kustomization.yaml

apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - deployment.yaml
  - service.yaml
  - configmap.yaml
  - hpa.yaml

images:
  - name: supercantina/api
    newName: ghcr.io/empresa/supercantina
    newTag: latest
```

### Overlay Production

```yaml
# k8s/overlays/production/kustomization.yaml

apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: supercantina

resources:
  - ../../base
  - ingress.yaml
  - external-secrets.yaml

patches:
  - path: patches/deployment.yaml

configMapGenerator:
  - name: supercantina-config
    behavior: merge
    literals:
      - NODE_ENV=production
      - LOG_LEVEL=info

replicas:
  - name: supercantina-api
    count: 3
```

### Patch Production

```yaml
# k8s/overlays/production/patches/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: supercantina-api
spec:
  template:
    spec:
      containers:
        - name: api
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2000m"
              memory: "1Gi"
```

---

## Database Migrations

### Workflow de Migration

```yaml
# .github/workflows/migration.yaml

name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to migrate'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Verify migration
        run: npm run db:status
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Migration Script

```typescript
// scripts/migrate.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migrations...');

  // Verificar conexão
  await prisma.$connect();
  console.log('Connected to database');

  // Executar migrations pendentes
  const { execSync } = require('child_process');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  console.log('Migrations completed successfully');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Rollback

### Script de Rollback

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENVIRONMENT=$1
REVISION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$REVISION" ]; then
  echo "Usage: ./rollback.sh <environment> <revision>"
  exit 1
fi

echo "Rolling back $ENVIRONMENT to revision $REVISION"

# Usar ArgoCD para rollback
argocd app rollback supercantina-$ENVIRONMENT $REVISION

# Aguardar sync
argocd app wait supercantina-$ENVIRONMENT --timeout 300

# Verificar health
argocd app get supercantina-$ENVIRONMENT --health

echo "Rollback completed"
```

### Workflow de Rollback

```yaml
# .github/workflows/rollback.yaml

name: Rollback

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        type: choice
        options:
          - staging
          - production
      revision:
        description: 'Git SHA or tag to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - name: Setup ArgoCD CLI
        run: |
          curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x argocd
          sudo mv argocd /usr/local/bin/

      - name: Login to ArgoCD
        run: |
          argocd login ${{ secrets.ARGOCD_SERVER }} \
            --username admin \
            --password ${{ secrets.ARGOCD_PASSWORD }} \
            --grpc-web

      - name: Rollback
        run: |
          ./scripts/rollback.sh ${{ inputs.environment }} ${{ inputs.revision }}

      - name: Notify
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Rollback completed: ${{ inputs.environment }} -> ${{ inputs.revision }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Feature Flags

### Configuração

```typescript
// src/config/feature-flags.ts

import { LaunchDarkly } from 'launchdarkly-node-server-sdk';

const client = LaunchDarkly.init(process.env.LAUNCHDARKLY_SDK_KEY!);

export async function isFeatureEnabled(
  flagKey: string,
  userId: string,
  defaultValue: boolean = false
): Promise<boolean> {
  const user = {
    key: userId,
    custom: {
      environment: process.env.NODE_ENV,
    },
  };

  return client.variation(flagKey, user, defaultValue);
}

// Flags disponíveis
export const FLAGS = {
  NEW_DECISION_ENGINE: 'new-decision-engine',
  OFFLINE_MODE_V2: 'offline-mode-v2',
  ENHANCED_NOTIFICATIONS: 'enhanced-notifications',
} as const;
```

---

## Ambientes

| Ambiente | Branch | URL | Auto Deploy |
|----------|--------|-----|-------------|
| Development | feature/* | localhost:3000 | N/A |
| Staging | develop | staging.supercantina.com.br | Sim |
| Production | main | api.supercantina.com.br | Com aprovação |

---

## Checklist de Deploy

### Antes do Deploy

- [ ] Testes passando (unit, integration, e2e)
- [ ] Code review aprovado
- [ ] Security scan sem vulnerabilidades críticas
- [ ] Migrations testadas em staging
- [ ] Feature flags configurados
- [ ] Documentação atualizada

### Durante o Deploy

- [ ] Monitorar métricas de erro
- [ ] Verificar health checks
- [ ] Acompanhar logs em tempo real
- [ ] Validar endpoints críticos

### Após o Deploy

- [ ] Smoke tests automatizados
- [ ] Verificar alertas
- [ ] Comunicar stakeholders
- [ ] Atualizar changelog

---

## Referências

- [Infraestrutura](./infraestrutura.md)
- [Monitoramento](./monitoramento.md)
- [Alertas SLA](./alertas-sla.md)
