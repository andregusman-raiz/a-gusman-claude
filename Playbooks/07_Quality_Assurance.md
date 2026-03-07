# Playbook 07: Quality Assurance

> Qualidade e um processo continuo, nao uma fase final.

## Pipeline de Qualidade

```
Codigo → TypeCheck → Lint → Unit Tests → Integration Tests → E2E → Review → Deploy
```

## Niveis de Verificacao

### Nivel 1: Automatico (a cada commit)
```bash
npx lint-staged   # Lint apenas arquivos modificados
npx tsc --noEmit  # TypeCheck
```

### Nivel 2: Antes de PR
```bash
npm run typecheck  # 0 erros
npm run lint       # 0 erros
npm test           # 0 falhas
npm run build      # Build ok
```

### Nivel 3: Antes de Deploy
```bash
npm run test:e2e   # Fluxos criticos
npm audit          # Sem vulnerabilidades criticas
```

### Nivel 4: Pos-Deploy
- Smoke tests em staging
- Monitoramento de erros
- Health checks automaticos

## Metricas de Qualidade

| Metrica | Meta |
|---------|------|
| TypeCheck errors | 0 |
| Lint errors | 0 |
| Test failures | 0 |
| Coverage | >= 60% |
| Bundle size | Dentro do budget |
| npm audit critical | 0 |

## Code Review com IA

A skill `revisar` verifica automaticamente:
1. **Corretude**: Tipos, edge cases, error handling
2. **Seguranca**: Inputs, secrets, RLS
3. **Performance**: N+1 queries, re-renders, lazy loading
4. **Manutencao**: Naming, duplicacao, complexidade
5. **Testes**: Coverage, quality, edge cases

Formato de feedback:
```
🔴 [blocker] — deve ser corrigido
🟡 [sugestao] — melhoria recomendada
🟢 [nitpick] — preferencia, nao bloqueia
```

## Regras de Regressao

1. Nunca diminuir coverage existente
2. Nunca introduzir novos erros de TypeCheck
3. Nunca introduzir vulnerabilidades
4. Sempre testar error paths
5. Sempre manter build funcional na main
