# Infraestrutura - Super Cantina

## Visão Geral

A infraestrutura do Super Cantina é baseada em containers Docker, orquestrados com Kubernetes, e hospedada em cloud (AWS/GCP).

---

## Arquitetura Cloud

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS / GCP                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          VPC / Network                                  │ │
│  │                                                                         │ │
│  │  ┌───────────────────┐     ┌───────────────────┐                       │ │
│  │  │   Public Subnet   │     │   Public Subnet   │                       │ │
│  │  │      (AZ-a)       │     │      (AZ-b)       │                       │ │
│  │  │                   │     │                   │                       │ │
│  │  │  ┌─────────────┐  │     │  ┌─────────────┐  │                       │ │
│  │  │  │     ALB     │  │     │  │     ALB     │  │                       │ │
│  │  │  └──────┬──────┘  │     │  └──────┬──────┘  │                       │ │
│  │  └─────────┼─────────┘     └─────────┼─────────┘                       │ │
│  │            │                         │                                  │ │
│  │  ┌─────────┴─────────────────────────┴─────────────────────────────┐   │ │
│  │  │                    Private Subnets                               │   │ │
│  │  │                                                                  │   │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐│   │ │
│  │  │  │                   Kubernetes Cluster                        ││   │ │
│  │  │  │                                                             ││   │ │
│  │  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐              ││   │ │
│  │  │  │  │   API     │  │   API     │  │   API     │              ││   │ │
│  │  │  │  │  Pod (3x) │  │  Pod (3x) │  │  Pod (3x) │              ││   │ │
│  │  │  │  └───────────┘  └───────────┘  └───────────┘              ││   │ │
│  │  │  │                                                             ││   │ │
│  │  │  │  ┌───────────┐  ┌───────────┐                              ││   │ │
│  │  │  │  │  Worker   │  │  Worker   │                              ││   │ │
│  │  │  │  │  Pod (2x) │  │  Pod (2x) │                              ││   │ │
│  │  │  │  └───────────┘  └───────────┘                              ││   │ │
│  │  │  │                                                             ││   │ │
│  │  │  └─────────────────────────────────────────────────────────────┘│   │ │
│  │  │                                                                  │   │ │
│  │  │  ┌───────────────────┐  ┌───────────────────┐                   │   │ │
│  │  │  │    RDS (Primary)  │  │   RDS (Replica)   │                   │   │ │
│  │  │  │    PostgreSQL     │  │    PostgreSQL     │                   │   │ │
│  │  │  └───────────────────┘  └───────────────────┘                   │   │ │
│  │  │                                                                  │   │ │
│  │  │  ┌───────────────────┐  ┌───────────────────┐                   │   │ │
│  │  │  │   ElastiCache     │  │   ElastiCache     │                   │   │ │
│  │  │  │   Redis Primary   │  │   Redis Replica   │                   │   │ │
│  │  │  └───────────────────┘  └───────────────────┘                   │   │ │
│  │  │                                                                  │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes

| Componente | Serviço | Especificação |
|------------|---------|---------------|
| Load Balancer | ALB | Application Load Balancer |
| Container Orchestration | EKS/GKE | Kubernetes 1.28+ |
| Database | RDS PostgreSQL | db.r6g.large (Multi-AZ) |
| Cache | ElastiCache Redis | cache.r6g.large (Cluster) |
| Storage | S3/GCS | Standard class |
| CDN | CloudFront/Cloud CDN | Para assets estáticos |
| Secrets | Secrets Manager | Para credenciais |
| Monitoring | CloudWatch + Prometheus | Métricas e logs |

---

## Docker

### Dockerfile - API

```dockerfile
# Dockerfile.api

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Dependências
COPY package*.json ./
RUN npm ci --only=production

# Código fonte
COPY tsconfig.json ./
COPY src/ ./src/

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar artefatos
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Configuração
ENV NODE_ENV=production
ENV PORT=3000

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

### Dockerfile - Frontend

```dockerfile
# Dockerfile.frontend

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml (Desenvolvimento)

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/supercantina
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "8080:80"
    depends_on:
      - api

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: supercantina
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  redis_data:
  grafana_data:
```

---

## Kubernetes

### Namespace

```yaml
# k8s/namespace.yaml

apiVersion: v1
kind: Namespace
metadata:
  name: supercantina
  labels:
    app: supercantina
    environment: production
```

### Deployment - API

```yaml
# k8s/api-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: supercantina-api
  namespace: supercantina
  labels:
    app: supercantina
    component: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: supercantina
      component: api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: supercantina
        component: api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: supercantina-api
      containers:
        - name: api
          image: supercantina/api:latest
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: supercantina-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: supercantina-secrets
                  key: redis-url
            - name: LAYERS_API_KEY
              valueFrom:
                secretKeyRef:
                  name: supercantina-secrets
                  key: layers-api-key
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: supercantina
                    component: api
                topologyKey: kubernetes.io/hostname
```

### Service

```yaml
# k8s/api-service.yaml

apiVersion: v1
kind: Service
metadata:
  name: supercantina-api
  namespace: supercantina
  labels:
    app: supercantina
    component: api
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
      name: http
  selector:
    app: supercantina
    component: api
```

### Ingress

```yaml
# k8s/ingress.yaml

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: supercantina-ingress
  namespace: supercantina
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
    - hosts:
        - api.supercantina.com.br
      secretName: supercantina-tls
  rules:
    - host: api.supercantina.com.br
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: supercantina-api
                port:
                  number: 80
```

### HPA (Horizontal Pod Autoscaler)

```yaml
# k8s/hpa.yaml

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: supercantina-api-hpa
  namespace: supercantina
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: supercantina-api
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
```

---

## Secrets

### External Secrets (AWS Secrets Manager)

```yaml
# k8s/external-secrets.yaml

apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: supercantina-secrets
  namespace: supercantina
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: supercantina-secrets
    creationPolicy: Owner
  data:
    - secretKey: database-url
      remoteRef:
        key: supercantina/production/database
        property: url
    - secretKey: redis-url
      remoteRef:
        key: supercantina/production/redis
        property: url
    - secretKey: layers-api-key
      remoteRef:
        key: supercantina/production/layers
        property: api-key
    - secretKey: encryption-secret
      remoteRef:
        key: supercantina/production/encryption
        property: secret
```

---

## Terraform

### main.tf

```hcl
# terraform/main.tf

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "supercantina-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "SuperCantina"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "supercantina-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = var.environment != "production"

  enable_dns_hostnames = true
  enable_dns_support   = true
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"

  cluster_name    = "supercantina-${var.environment}"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }
}

# RDS PostgreSQL
module "rds" {
  source = "terraform-aws-modules/rds/aws"

  identifier = "supercantina-${var.environment}"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500

  db_name  = "supercantina"
  username = "supercantina"
  port     = 5432

  multi_az               = var.environment == "production"
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [module.security_group_rds.security_group_id]

  backup_retention_period = 7
  skip_final_snapshot     = var.environment != "production"
  deletion_protection     = var.environment == "production"

  performance_insights_enabled = true
  monitoring_interval          = 60
}

# ElastiCache Redis
module "elasticache" {
  source = "terraform-aws-modules/elasticache/aws"

  cluster_id = "supercantina-${var.environment}"

  engine         = "redis"
  engine_version = "7.0"
  node_type      = "cache.r6g.large"

  num_cache_nodes = var.environment == "production" ? 2 : 1

  subnet_group_name  = module.vpc.elasticache_subnet_group
  security_group_ids = [module.security_group_redis.security_group_id]

  apply_immediately = true
}
```

---

## Requisitos de Hardware PDV

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| Processador | Intel i3 / AMD Ryzen 3 | Intel i5 / AMD Ryzen 5 |
| RAM | 4 GB | 8 GB |
| Armazenamento | 50 GB SSD | 100 GB SSD |
| Tela | 15" Touch | 21" Touch |
| Leitor QR | USB Camera 720p | Leitor 2D dedicado |
| Leitor NFC | ACR122U | ACS ACR1252U |
| Conectividade | WiFi 5 | Ethernet + WiFi 6 |

---

## Referências

- [Deploy CI/CD](./deploy.md)
- [Monitoramento](./monitoramento.md)
- [Alertas SLA](./alertas-sla.md)
