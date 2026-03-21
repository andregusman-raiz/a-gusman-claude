---
description: "Protocolo de seguranca para operacoes bulk (5+ arquivos com mesmo pattern)"
paths:
  - "**/*"
---

# Bulk Change Safety Protocol

## Definicao
Bulk change = operacao que modifica 5+ arquivos com mesmo pattern.

## Regras OBRIGATORIAS

### 1. Batch de 5
- Aplicar em NO MAXIMO 5 arquivos por batch
- Apos cada batch: typecheck + lint + testes do modulo
- SO prosseguir se tudo passa

### 2. Valores semanticos
- Se valor original PODE ser correto (0, null, false): NAO substituir — verificar caso a caso
- Regra: "na duvida, nao substitua"

### 3. Commit entre batches
- Commit incremental apos cada batch verde
- Mensagem: `refactor(batch-N): descricao — N/M arquivos`

### 4. Rollback imediato
- Se batch quebrou: `git checkout -- [arquivos]` e revisar individualmente
- NUNCA consertar o conserto — reverter e recomecar

### 5. < 10 ocorrencias = fix individual
- Nao faz batch — entender cada caso
