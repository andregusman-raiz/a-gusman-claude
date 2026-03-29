---
id: data-catalog-governance
name: Data Catalog + API Factory
category: Tools
source: raiz-platform
complexity: Muito Alta
tags: [data-catalog, api-factory, governance, lineage, sql, rest]
---

# Data Catalog + API Factory

## What it solves
SQL sentence catalog with versioning, data lineage, governance inbox, and an API factory that turns SQL into managed REST endpoints with client management.

## Best implementations
- `~/Claude/GitHub/raiz-platform/src/components/totvs-sql/api-factory/ApiFactoryDashboard.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/totvs-sql/api-factory/CodeSnippetGenerator.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/totvs-sql/documentation/DocumentationViewer.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/data-explorer/DataExplorer.tsx`

## Key features
- **API clients**: create, suspend, revoke with rate limits and quotas
- **Scoped grants**: per-client access to specific data products
- **Usage stats**: requests, last used, quota consumption
- **Code snippet generator**: auto-generates client code for consuming APIs
- **Data lineage**: visual lineage per SQL sentence
- **Governance queue**: quarantine/review for new or modified queries
- **Documentation viewer**: auto-generated docs per data product

## Types
```ts
interface ApiClient {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'revoked';
  rateLimitRpm: number;
  dailyQuota: number;
  maxRowsPerRequest: number;
  totalRequests: number;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
}

interface Grant {
  dataProductId: string;
  dataProductName: string;
  allowedModes: string[];
  isActive: boolean;
}
```

## Dependencies
- SQL execution engine (TOTVS RM)
- API gateway for managed endpoints
