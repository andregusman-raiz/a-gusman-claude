# Activation Modes — Padrao para Todas as Machines

## 3 Modos Base

Toda machine (ag-1 a ag-12) aceita estes 3 modos:

| Flag | Modo | Comportamento |
|------|------|--------------|
| (default) | **Interativo** | Para em checkpoints, pede confirmacao, mostra progresso |
| `--autonomo` | **Autonomo** | Executa tudo sem parar, reporta resultado final |
| `--draft` | **Draft** | Rascunho rapido para review, sem quality gates completos |

## Semantica por Machine

### --interativo (default)
- ag-1 CONSTRUIR: para apos PRD e SPEC para aprovacao
- ag-2 CORRIGIR: mostra diagnostico antes de aplicar fix
- ag-3 ENTREGAR: pede confirmacao antes de deploy
- ag-4 TESTE-FINAL: mostra resultados parciais entre batches
- ag-5 DOCUMENTOS: mostra rascunho para aprovacao
- ag-6 INICIAR: confirma stack/template antes de scaffold
- ag-7 QUALIDADE: mostra scores parciais entre dimensoes
- ag-8 SEGURANCA: mostra findings criticos imediatamente
- ag-9 AUDITAR: mostra progresso de cada machine
- ag-10 BENCHMARK: confirma URLs antes de crawl
- ag-11 DESENHAR: mostra opcoes de design para escolha
- ag-12 SQL-TOTVS: mostra query plan antes de executar

### --autonomo
- Executa pipeline completo sem interrupcoes
- Quality gates continuam ativos (nao sao bypassados)
- Se encontrar blocker critico → para e reporta (unica interrupcao)
- Ideal para: tarefas noturnas, batch, CI/CD

### --draft
- Pula: PRD, ADR, review, quality gates extensivos
- Mantem: SPEC minimal, build, testes basicos
- Output marcado como "DRAFT — requer revisao"
- Ideal para: prototipos, exploracoes, MVPs rapidos

## Flags Especificas (coexistem com modos)

Flags existentes continuam funcionando ALEM do modo:

```
/ag-1-construir --autonomo --skip-review feature X   # autonomo + sem review
/ag-2-corrigir --draft tipos                          # draft do fix de tipos
/ag-4-teste-final --autonomo e2e                      # E2E sem interrupcao
```

## Deteccao Automatica

Se usuario nao especificar modo:
- Terminal interativo (TTY) → modo interativo
- CI/CD (no TTY) → modo autonomo
- Palavra "rapido", "rascunho", "prototipo" no prompt → sugerir modo draft

## Implementacao

Cada machine detecta o modo nos $ARGUMENTS:
```
if args contain "--autonomo" → MODO = autonomo
elif args contain "--draft" → MODO = draft
else → MODO = interativo
```

Checkpoints condicionais:
```
if MODO == "interativo":
  mostrar output + pedir confirmacao
elif MODO == "autonomo":
  log output + continuar
elif MODO == "draft":
  skip checkpoint + continuar
```
