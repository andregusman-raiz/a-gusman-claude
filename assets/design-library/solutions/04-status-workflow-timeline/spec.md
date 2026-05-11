---
id: status-workflow-timeline
name: Status Workflow + Audit Trail Timeline
category: workflow
source: auditoria-raiz
complexity: medium
---

# Status Workflow + Audit Trail

## What it solves
Role-based status transitions with explicit permission gates, plus a visual timeline showing all state changes with context.

## Best implementations
- **Workflow Actions**: `~/Claude/GitHub/auditoria-raiz/src/components/solicitacoes/WorkflowActions.tsx` (242 lines)
- **Status Badge**: `~/Claude/GitHub/auditoria-raiz/src/components/solicitacoes/StatusBadge.tsx` (61 lines)
- **Audit Trail**: `~/Claude/GitHub/auditoria-raiz/src/app/(dashboard)/config/audit-trail/page.tsx` (131 lines)
- **Prazos Timeline**: `~/Claude/GitHub/auditoria-raiz/src/components/dashboard/PrazosTimeline.tsx` (70 lines)

## Key features
- **TRANSITIONS config**: maps each status to allowed targets with role gates
- **7 statuses**: pendente → em_andamento → em_revisao → entregue/rejeitada/devolvida/cancelada
- **Role gates**: admin, gestor, operador, auditor per transition
- **Motivo fields**: required for rejections and returns
- **Dialog confirm**: status change requires confirmation with optional notes
- **Vertical timeline**: absolute positioning with line + dots + cards
- **Inline transitions**: "pendente → em_andamento" shown in each entry
- **Status badge**: centralized config, 7 types with semantic dark-mode colors

## Layout structure
```
Workflow Actions:
┌─────────────────────────────────────┐
│ Status: ● Em Andamento              │
│                                     │
│ [Enviar p/ Revisão] [Devolver]      │
└─────────────────────────────────────┘

Timeline:
  ● 15/03 14:30 — João Silva
  │ pendente → em_andamento
  │ "Iniciando coleta de documentos"
  │
  ● 16/03 09:15 — Maria Santos
  │ em_andamento → em_revisao
  │ "Documentação completa, enviando"
```

## Dependencies
- shadcn/ui (Dialog, Button, Textarea)
- lucide-react
- sonner (toast notifications)
