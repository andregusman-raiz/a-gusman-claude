# Gotchas: TypeScript & Build

## Imports Nao Utilizados
- lint-staged REJEITA commits com imports nao utilizados
- SEMPRE remover imports nao utilizados antes de commitar
- `npx tsc --noEmit` nos arquivos modificados antes de considerar done

## Circular Imports
- Sintoma: erro de runtime "Cannot read property of undefined"
- Solucao: extrair types para arquivo separado (`*.types.ts`)
- Nunca importar service de dentro de outro service diretamente

## Exports Removidos
- Antes de deletar export: `grep -r "import.*NomeExport" src/` para verificar uso
- Export removido sem verificar = build quebrado em outro arquivo

## Strict vs Relaxed
- Projetos podem ter 2 tsconfigs: strict (IDE) e relaxed (CI gate)
- Debt tracking: contar erros com `npx tsc --noEmit 2>&1 | grep "error TS" | wc -l`
- Meta: convergir para strict unico

## Node v25
- `!` em expressoes `node -e` quebra no Node v25+
- Usar aspas simples: `node -e 'console.log("ok")'`
- Delta pager FIXED: usar gitconfig, nao env var

## Bundle Size
- Se build falha por tamanho: `npm run analyze` para investigar
- Lazy load bibliotecas pesadas (Plotly, mathjs, jsPDF, etc.)
- Code splitting por rota/modulo
