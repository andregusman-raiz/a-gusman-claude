// ─── Reusable Functional Modules — Cross-app blueprints ─────────────────────

export type ModuleCategory =
  | "Auth & Acesso"
  | "AI / LLM"
  | "Data Sync"
  | "API Management"
  | "Workflow"
  | "Infraestrutura"
  | "Comunicação"
  | "Compliance"
  | "Observabilidade"
  | "Automação"
  | "Gamification & UX"
  | "Lifecycle Management"
  | "Security"
  | "Integração";

export interface Module {
  id: string;
  name: string;
  desc: string;
  category: ModuleCategory;
  source: string;
  sourceRepo: string;
  keyFiles: string[];
  deps: string[];
  extractable: "sim" | "parcial";
  tags: string[];
}

export const MODULE_CATEGORIES: ModuleCategory[] = [
  "Auth & Acesso", "AI / LLM", "Data Sync", "API Management", "Workflow",
  "Infraestrutura", "Comunicação", "Compliance", "Observabilidade", "Automação",
  "Gamification & UX", "Lifecycle Management", "Security", "Integração",
];

export const MODULE_CAT_COLORS: Record<ModuleCategory, { bg: string; text: string; dot: string }> = {
  "Auth & Acesso": { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  "AI / LLM": { bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400" },
  "Data Sync": { bg: "bg-teal-500/10", text: "text-teal-400", dot: "bg-teal-400" },
  "API Management": { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" },
  "Workflow": { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  "Infraestrutura": { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  "Comunicação": { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  "Compliance": { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
  "Observabilidade": { bg: "bg-sky-500/10", text: "text-sky-400", dot: "bg-sky-400" },
  "Automação": { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  "Gamification & UX": { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  "Lifecycle Management": { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  "Security": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  "Integração": { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
};

export const modules: Module[] = [
  // Auth & Acesso
  { id: "auth-rbac-sso", name: "Auth + RBAC + SSO", desc: "Session management, role-based route protection, multi-tenant module access, SAML/OIDC SSO, step-up auth", category: "Auth & Acesso", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/auth/index.ts", "src/lib/auth/sso.service.ts", "src/middleware.ts"], deps: ["Supabase", "Upstash Redis"], extractable: "sim", tags: ["auth", "rbac", "sso", "saml", "multi-tenant"] },
  { id: "feature-flags", name: "Feature Flags Engine", desc: "DB-backed flags com user targeting, role targeting, % rollout determinístico (djb2 hash)", category: "Auth & Acesso", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/feature-flags/index.ts", "src/lib/feature-flags/types.ts"], deps: ["Supabase", "feature_flags table"], extractable: "sim", tags: ["feature-flags", "rollout", "targeting", "a-b-test"] },
  { id: "policy-engine", name: "Policy Engine", desc: "Regras declarativas: role + tool + risk → allow/deny/require_approval. Stateless, zero deps", category: "Auth & Acesso", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/security/policy-engine.ts"], deps: [], extractable: "sim", tags: ["policy", "regras", "acesso", "declarativo"] },

  // AI / LLM
  { id: "llm-router", name: "LLM Router", desc: "Seleção inteligente de modelo por task/custo/capability/tier. Lightning RL policy, workspace restrictions", category: "AI / LLM", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/ai/llm-router.ts", "src/lib/ai/tier-resolver.service.ts"], deps: ["Anthropic", "OpenAI", "Google AI", "Supabase"], extractable: "sim", tags: ["llm", "router", "model-selection", "multi-provider"] },
  { id: "cost-tracker", name: "LLM Cost Tracker", desc: "Custo por request, budget diário por usuário, cache 30s, limit enforcement", category: "AI / LLM", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/ai/cost-tracker.ts"], deps: ["Supabase", "llm_usage_logs table"], extractable: "sim", tags: ["custo", "budget", "tracking", "llm"] },
  { id: "circuit-breaker", name: "Provider Circuit Breaker", desc: "Closed/open/half-open per provider. Fallback automático quando provider falha", category: "AI / LLM", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/ai/provider-circuit-breaker.ts"], deps: [], extractable: "sim", tags: ["circuit-breaker", "fallback", "resiliência", "provider"] },
  { id: "prompt-injection", name: "Prompt Injection Detector", desc: "Scanner regex multi-categoria (jailbreak, instruction override, system prompt extraction) com severity", category: "AI / LLM", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/security/prompt-injection-detector.ts"], deps: ["Redis (rate limiting)"], extractable: "sim", tags: ["segurança", "prompt", "injection", "scanner"] },

  // Data Sync
  { id: "totvs-client", name: "TOTVS RM Client", desc: "REST + SOAP, JWT auto-renew (TTL-30s), retry exponencial, multi-tenant CompanyCode routing", category: "Data Sync", source: "fgts-platform", sourceRepo: "Raiz-Educacao-SA/fgts-platform", keyFiles: ["src/lib/totvs/client.ts", "src/lib/totvs/types.ts"], deps: ["TOTVS_RM_URL", "TOTVS_RM_USERNAME"], extractable: "sim", tags: ["totvs", "erp", "rest", "soap", "jwt"] },
  { id: "delta-sync", name: "Delta Sync Engine", desc: "MD5 hash por registro, batch upsert 100, PII masking, sync diário via cron", category: "Data Sync", source: "salarios-platform", sourceRepo: "Raiz-Educacao-SA/fgts-platform", keyFiles: ["src/lib/totvs/sync.ts", "src/lib/totvs/pii-mask.ts"], deps: ["Drizzle ORM", "TOTVS Client"], extractable: "sim", tags: ["sync", "delta", "md5", "batch", "cron"] },

  // API Management
  { id: "api-gateway", name: "API Gateway Middleware", desc: "Pipeline 4 estágios: authenticate key → validate IP → check RPM → check quota", category: "API Management", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/auth/api-middleware.ts", "src/lib/auth/api-key-auth.ts"], deps: ["Upstash Redis"], extractable: "sim", tags: ["api", "gateway", "middleware", "pipeline"] },
  { id: "rate-limiter", name: "Rate Limiter", desc: "Sliding window per-user+tool, Redis primary + in-memory fallback, HTTP headers", category: "API Management", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/security/rate-limiter.ts"], deps: ["Upstash Redis"], extractable: "sim", tags: ["rate-limit", "sliding-window", "redis", "throttle"] },

  // Workflow
  { id: "bpmn-engine", name: "BPMN Process Engine", desc: "Execução BPMN 2.0 com Supabase persistence, SLA, AI tasks, script tasks, confirmação", category: "Workflow", source: "ticket-raiz", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/bpms/engine/process-engine.service.ts"], deps: ["bpmn-engine npm", "Supabase"], extractable: "parcial", tags: ["bpmn", "processo", "engine", "execução"] },
  { id: "form-engine", name: "Dynamic Form Engine", desc: "JSON Schema → Zod runtime, 19 field types (CPF, CNPJ, CEP, user-picker, table), conditional visibility", category: "Workflow", source: "ticket-raiz", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/bpms/forms/form-engine.ts"], deps: ["React Hook Form", "Zod"], extractable: "sim", tags: ["form", "json-schema", "dynamic", "zod", "campos"] },
  { id: "sla-engine", name: "SLA Engine", desc: "Business hours (08-18h), holiday calendar, deadline calculation, business vs calendar days", category: "Workflow", source: "ticket-raiz", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/bpms/sla/sla.service.ts"], deps: [], extractable: "sim", tags: ["sla", "prazo", "business-hours", "feriados"] },
  { id: "approval-workflow", name: "Approval Workflow", desc: "Multi-approver state machine, risk-based required approvers, self-approval prevention, expiry", category: "Workflow", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/security/approval-workflow.ts"], deps: [], extractable: "sim", tags: ["aprovação", "workflow", "state-machine", "multi-approver"] },

  // Infraestrutura
  { id: "cache-layer", name: "Unified Cache Layer", desc: "Redis + LRU tiered, stale-while-revalidate, domain helpers (user role, module access), HMR-safe", category: "Infraestrutura", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/cache/redis.ts", "src/lib/cache/middleware-cache.ts"], deps: ["Upstash Redis", "lru-cache"], extractable: "sim", tags: ["cache", "redis", "lru", "performance"] },
  { id: "file-upload", name: "File Upload Service", desc: "Multi-provider (Supabase Storage / Vercel Blob), MIME validation, signed URLs, metadata persistence", category: "Infraestrutura", source: "raiz-platform + auditoria", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/services/file.service.ts", "src/lib/blob.ts (auditoria)"], deps: ["Supabase Storage ou Vercel Blob"], extractable: "sim", tags: ["upload", "arquivo", "storage", "blob", "mime"] },
  { id: "export-engine", name: "Multi-Format Export Engine", desc: "PDF (PDFKit), Word (docx), Excel (ExcelJS) com branding, lazy-load, Vercel-compatible", category: "Infraestrutura", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/export/pdf-generator.ts", "src/lib/export/xlsx-generator.ts", "src/lib/export/docx-generator.ts"], deps: ["pdfkit", "exceljs", "docx"], extractable: "sim", tags: ["export", "pdf", "excel", "word", "documento"] },

  // Comunicação
  { id: "notification-engine", name: "Multi-Channel Notification", desc: "Novu SDK — email, in-app, WhatsApp, webhook. Graceful degradation quando provider ausente", category: "Comunicação", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/novu/novu-client.ts", "src/lib/services/notification.service.ts"], deps: ["Novu SDK", "NOVU_API_KEY"], extractable: "sim", tags: ["notificação", "email", "webhook", "novu", "multi-channel"] },
  { id: "alert-scheduler", name: "Alert Scheduler", desc: "Severidade por prazo (T-5 info, T-3 warning, T-1 critical), threshold divergence alerts", category: "Comunicação", source: "fgts-platform", sourceRepo: "Raiz-Educacao-SA/fgts-platform", keyFiles: ["src/lib/notifications/scheduler.ts"], deps: [], extractable: "sim", tags: ["alerta", "prazo", "severidade", "scheduler"] },

  // Compliance
  { id: "audit-trail", name: "Audit Trail Service", desc: "Log imutável cross-module, PII masking, batch logging, query API flexível. Non-fatal (never throws)", category: "Compliance", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/audit/audit.service.ts", "src/lib/observability/log-sanitizer.ts"], deps: ["Supabase", "platform_audit_logs table"], extractable: "sim", tags: ["auditoria", "log", "imutável", "lgpd", "compliance"] },
  { id: "secret-vault", name: "Secret Vault", desc: "AES-256-GCM encryption at rest, scrypt key derivation, TTL, access audit log, env fallback", category: "Compliance", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/security/vault.ts"], deps: ["Node.js crypto"], extractable: "sim", tags: ["vault", "segredo", "criptografia", "aes-256"] },

  // Observabilidade
  { id: "observability-stack", name: "Observability Stack", desc: "Logger contextual + Prometheus metrics + OTel spans + withObservability() API wrapper", category: "Observabilidade", source: "raiz-platform", sourceRepo: "Raiz-Educacao-SA/rAIz_Cowork", keyFiles: ["src/lib/observability/logger.ts", "src/lib/observability/metrics.ts", "src/lib/observability/otel.ts", "src/lib/observability/api-wrapper.ts"], deps: ["@opentelemetry/sdk-node", "Sentry"], extractable: "sim", tags: ["log", "métricas", "otel", "tracing", "sentry"] },

  // Automação
  { id: "ai-recipe-executor", name: "AI Recipe Executor", desc: "DAG de steps browser (14 tipos), selector cascade, self-healing via LLM + a11y tree, evidence collection", category: "Automação", source: "automata", sourceRepo: "Raiz-Educacao-SA/automata-raiz", keyFiles: ["lib/recipe/types.ts", "lib/executor/step-executor.ts", "lib/healer/index.ts", "lib/memory/index.ts"], deps: ["Playwright", "LLM adapter", "Drizzle"], extractable: "parcial", tags: ["automação", "browser", "self-healing", "playwright", "receita"] },

  // Gamification & UX
  { id: "gamification-engine", name: "Gamification Engine", desc: "Badges, XP points, leaderboard, celebrations (confetti), learning path progress, achievement unlock", category: "Gamification & UX", source: "Raiz-do-conhecimento", sourceRepo: "Raiz-Educacao-SA/Raiz-do-conhecimento", keyFiles: ["components/BadgeCard.tsx", "components/CelebrationModal.tsx", "components/LeaderboardTable.tsx", "components/PathProgressCard.tsx"], deps: ["framer-motion", "react-confetti"], extractable: "sim", tags: ["gamificação", "badges", "xp", "leaderboard", "celebração"] },
  { id: "permission-gate", name: "PermissionGate RBAC Component", desc: "Componente wrapper declarativo que mostra/esconde conteúdo baseado em role/permission do usuário", category: "Gamification & UX", source: "Raiz-do-conhecimento", sourceRepo: "Raiz-Educacao-SA/Raiz-do-conhecimento", keyFiles: ["components/PermissionGate.tsx", "COMO_USAR_RBAC.md"], deps: ["Auth context"], extractable: "sim", tags: ["rbac", "permissão", "componente", "declarativo", "gate"] },

  // Lifecycle Management
  { id: "certificate-lifecycle", name: "Certificate Lifecycle Manager", desc: "Expiry tracking, tiered access grants (view/use/download/manage), renewal queue, immutable audit log", category: "Lifecycle Management", source: "certificados-raiz", sourceRepo: "Raiz-Educacao-SA/certificados-raiz", keyFiles: ["src/app/dashboard/certificados/", "src/app/dashboard/acessos/", "src/app/dashboard/auditoria/"], deps: ["Supabase Auth + Storage"], extractable: "sim", tags: ["certificado", "lifecycle", "acesso", "renovação", "auditoria"] },
  { id: "contract-lifecycle", name: "Contract Lifecycle Manager", desc: "Contratos active/expiring/expired, renewal alerts, multi-unit linkage, invoice payment workflow", category: "Lifecycle Management", source: "netmanager-raiz", sourceRepo: "Raiz-Educacao-SA/netmanager-raiz", keyFiles: ["src/app/(app)/contratos/", "src/app/(app)/faturas/"], deps: ["Supabase"], extractable: "sim", tags: ["contrato", "lifecycle", "fatura", "renovação", "multi-unit"] },

  // Security
  { id: "credential-vault", name: "Credential Vault + Access Grants", desc: "Vault CRUD com access grants per user, admin panel de permissões, Supabase SSO", category: "Security", source: "raiz-hub", sourceRepo: "Raiz-Educacao-SA/raiz-hub", keyFiles: ["src/app/vault/", "src/app/admin/vault-access/", "src/components/vault-list.tsx"], deps: ["Supabase Auth"], extractable: "sim", tags: ["vault", "credenciais", "acesso", "admin", "sso"] },
  { id: "mtls-proxy", name: "mTLS Certificate Proxy", desc: "FastAPI como gateway de certificados A1 para APIs governamentais. Certs no servidor, operador sem acesso", category: "Security", source: "nfse-downloader", sourceRepo: "Raiz-Educacao-SA/nfse-downloader", keyFiles: ["servidor/servidor.py", "servidor/certificados/mapa.json"], deps: ["FastAPI", "Python requests", "certificados .pfx"], extractable: "sim", tags: ["mtls", "certificado", "governo", "proxy", "a1"] },

  // Integração
  { id: "totvs-batch-import", name: "TOTVS RM Batch Import Generator", desc: "Gera CSV no formato M;/*P; para importação de lançamentos contábeis no TOTVS RM", category: "Integração", source: "financeiro_cpc06", sourceRepo: "Raiz-Educacao-SA/financeiro_cpc06", keyFiles: ["gerar_lote_cpc06.py"], deps: ["pandas", "openpyxl"], extractable: "sim", tags: ["totvs", "csv", "contabilidade", "importação", "batch"] },
  { id: "prism-engine", name: "PRISM Process Analysis Engine", desc: "7 fases config-driven, Knowledge Base search (2.4K docs), ingestors TOTVS/Zeev/HubSpot, zero-code per org", category: "Integração", source: "process-machine", sourceRepo: "Raiz-Educacao-SA/process-machine", keyFiles: ["scripts/engine/", "scripts/ingestors/", "knowledge/"], deps: ["Streamlit", "Click", "Rich"], extractable: "parcial", tags: ["prism", "análise", "processos", "ingestor", "knowledge-base"] },
];
