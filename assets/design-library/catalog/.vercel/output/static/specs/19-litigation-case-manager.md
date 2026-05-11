---
id: litigation-case-manager
name: Litigation Case Manager
category: Workflow
source: raiz-platform
complexity: Alta
tags: [legal, litigation, cases, strategy, provisions, playbooks]
---

# Litigation Case Manager

## What it solves
Legal case lifecycle: case records, strategy planning, financial exposure tracking, settlement workflows, playbook library, and AI copilot for legal strategy.

## Best implementations
- `~/Claude/GitHub/raiz-platform/src/components/contencioso/settings/`
- `~/Claude/GitHub/raiz-platform/src/app/(auth)/contencioso/casos/[caseRecordId]/estrategia/page.tsx`
- `~/Claude/GitHub/raiz-platform/src/app/(auth)/contencioso/provisoes/page.tsx`
- `~/Claude/GitHub/raiz-platform/src/app/(auth)/contencioso/copilot/page.tsx`

## Key features
- **Case record detail**: parties, timeline, documents, strategy
- **Financial provisioning**: exposure tracking, provision history
- **Playbook library**: legal theses, precedents, strategies
- **AI copilot route**: AI strategy advisor alongside case data
- **Settlement workflows**: propose → review → accept/reject

## Dependencies
- AI copilot service
- Domain-specific legal data model
