---
description: "Limites numericos de funcao/arquivo/complexidade e SOLID quick reference"
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "**/*.py"
---

# Clean Code Limits

## Limites Numericos Obrigatorios

| Metrica | Limite | Acao se exceder |
|---------|--------|-----------------|
| Linhas por funcao | max 40 | Extract Function |
| Linhas por arquivo | max 300 | Extract Class/Module |
| Parametros por funcao | max 3 | Usar objeto de opcoes |
| Niveis de aninhamento | max 3 | Early return, Extract Function |
| Complexidade ciclomatica | max 10 | Decompor em funcoes menores |

## NUNCA
- Numeros magicos — usar constantes nomeadas (`const MAX_RETRIES = 3`)
- Ternarios aninhados — usar if/else ou early return
- `any` em TypeScript — usar tipo explicito ou generic
- Funcoes com side effects E retorno — separar comando de query (CQS)
- Comentarios obvios (`// incrementa i` em `i++`) — codigo deve ser auto-documentado

## Ao Revisar Codigo Gerado por IA
- IA tende a gerar funcoes longas (>40 linhas) — pedir decomposicao
- IA repete blocos similares — pedir Extract Method
- IA usa primitivos onde Value Object seria melhor (ex: `string` para email)
- IA gera classes "god object" — verificar SRP (1 motivo para mudar)

## SOLID Quick Reference
- **S**RP: classe/funcao tem 1 motivo para mudar
- **O**CP: extender comportamento sem modificar codigo existente (Strategy, Plugin)
- **L**SP: subtipo substituivel sem quebrar contrato
- **I**SP: interfaces pequenas e coesas (nao forcar dependencia de metodos nao usados)
- **D**IP: depender de abstracoes (interfaces), nao de implementacoes concretas
