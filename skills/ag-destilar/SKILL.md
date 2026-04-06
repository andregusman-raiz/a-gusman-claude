---
name: ag-destilar
description: "Comprime documentos grandes para formato LLM-optimal. Mantem toda informacao em menos tokens. Para TOTVS KB, Design Library, SPECs grandes, docs de referencia. Inspirado no BMAD distillator."
model: haiku
context: fork
argument-hint: "[path do documento] [--ratio 0.3]"
allowed-tools: Read, Glob, Grep, Write, Bash
---

# ag-destilar — Destilacao de Documentos

## O que faz

Comprime documentos grandes para formato otimizado para LLMs, mantendo
100% da informacao em menos tokens. O documento destilado e salvo ao lado
do original com sufixo `.distilled.md`.

## Invocacao

```
/ag-destilar docs/specs/big-spec.md                    # Ratio default 0.4 (60% reducao)
/ag-destilar ~/Claude/assets/knowledge-base/totvs/docs/DOC-1.md --ratio 0.3
/ag-destilar docs/architecture.md --ratio 0.5          # Menos agressivo
/ag-destilar --batch docs/specs/                       # Todos os .md do diretorio
```

## Tecnicas de Destilacao

### 1. Remover Redundancia
- Frases que repetem informacao ja dita ("como mencionado acima", "conforme descrito anteriormente")
- Introducoes e conclusoes genericas
- Exemplos redundantes (manter 1 de cada pattern, remover os demais)

### 2. Compactar Estrutura
- Paragrafos → bullet points
- Listas verbosas → tabelas
- Explicacoes longas → [conceito]: [definicao em 1 linha]
- Code blocks longos → apenas assinatura + comentario do comportamento

### 3. Preservar Informacao Critica
- NUNCA remover: nomes de funcoes, tipos, paths, configuracoes
- NUNCA remover: decisoes e rationale (por que X e nao Y)
- NUNCA remover: edge cases e restricoes
- NUNCA remover: numeros, datas, thresholds, limites
- NUNCA simplificar: schemas, interfaces, tipos TypeScript

### 4. Otimizar para LLM
- Headers claros e hierarquicos (scannable)
- Termos tecnicos sem explicacao (LLM ja conhece)
- Referencias absolutas (path completo, nao relativo)
- Metadata no topo: original path, data, ratio aplicado

## Formato do Output

```markdown
<!-- distilled from: [path original] | date: [data] | ratio: [0.X] | original: [N] tokens | distilled: [M] tokens -->

# [Titulo]

[Conteudo destilado]
```

## Ratio Guidelines

| Tipo de documento | Ratio recomendado | Porque |
|-------------------|-------------------|--------|
| SPEC tecnica | 0.5 | Muita info critica |
| PRD | 0.3 | Muito texto narrativo |
| Knowledge Base | 0.4 | Equilibrio info/narrativa |
| API reference | 0.6 | Ja e compacto |
| Meeting notes | 0.2 | Muito filler |
| README | 0.5 | Estruturado mas verboso |

## Documentos Prioritarios para Destilar

Documentos carregados frequentemente por agents (alto ROI de destilacao):

1. `~/Claude/assets/knowledge-base/totvs/docs/DOC-*` (18 docs, carregados por ag-12, ag-1)
2. `~/Claude/assets/knowledge-base/totvs/generated/quick-reference.md` (carregado por ag-1)
3. Design Library catalog (carregado por ag-1, ag-11)
4. SPECs grandes (> 200 linhas)
5. ADRs extensos

## Validacao

Apos destilar, verificar:
1. Documento destilado contem TODOS os termos tecnicos do original
2. Nenhum path/URL/nome de funcao foi perdido
3. Ratio real esta dentro de ±10% do target
4. Documento e legivel sem o original (auto-contido)

## Output

- `[nome].distilled.md` ao lado do original
- Log: "Destilado: [path] | [N] → [M] tokens ([X]% reducao)"
