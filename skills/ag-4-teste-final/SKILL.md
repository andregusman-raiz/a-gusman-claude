---
name: ag-4-teste-final
description: "Maquina autonoma de teste final. QAT textual, UX-QAT visual, benchmark comparativo, ciclo test-fix-retest, E2E batch — PDCA convergente com scores."
model: sonnet
context: fork
argument-hint: "[qat|ux-qat|benchmark|ciclo|e2e] [URL ou path] [--threshold N] [--resume]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "teste-final-state.json,tests/qat/**,tests/ux-qat/**,tests/qat-benchmark/**"
  bashPattern: "teste-final|qat|ux-qat|benchmark"
  priority: 95
---

# TESTE FINAL — Maquina Autonoma de Teste Final

## Invocacao

```
/teste-final qat ~/Claude/GitHub/raiz-platform
/teste-final ux-qat https://app.example.com
/teste-final benchmark https://app.example.com
/teste-final ciclo ~/Claude/GitHub/raiz-platform
/teste-final e2e ~/Claude/GitHub/raiz-platform
/teste-final --resume
```

## Modos

| Modo | Agent interno | O que faz |
|------|--------------|-----------|
| qat | ag-testar-qualidade-qat + ag-criar-cenario-qat | QAT textual PDCA (L1-L4, dual-score) |
| ux-qat | ag-testar-ux-qualidade + ag-criar-cenario-ux-qat + ag-capturar-tela (apps nativos) | UX-QAT visual PDCA (screenshots, AI judge) |
| benchmark | ag-benchmark-qualidade + ag-criar-cenario-benchmark | Benchmark comparativo (dual-run, parity index) |
| ciclo | ag-ciclo-testes | Test-fix-retest completo (max 3 ciclos) |
| e2e | ag-testar-e2e-batch | E2E em batches com auto-fix |

## Regra PDF → Markdown (obrigatoria — economia de tokens)

Qualquer PDF consumido por esta machine DEVE ser convertido ANTES via markitdown:
`bash ~/Claude/.claude/scripts/pdf2md.sh <arquivo.pdf>` → Read/Grep no `.md` gerado (cache automatico).
NUNCA Read direto de `.pdf` para extrair texto. Excecao visual (layout/slides): converter primeiro, Read multimodal depois. Enforcement: hook `pdf-read-guard.sh`. Detalhes: `.claude/rules/pdf-markitdown.md`.
