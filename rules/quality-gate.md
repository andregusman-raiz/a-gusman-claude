---
description: "Self-check antes de declarar qualquer trabalho como completo"
paths:
  - "**/*"
---

# Protocolo Quality Gate

## ANTES de declarar trabalho completo:

### 1. Re-ler Objetivo Original
Abra o task_plan.md, SPEC.md, ou a mensagem original.

### 2. Checklist Item por Item
Para CADA item:
- [ ] Implementado? (existe no codigo)
- [ ] Completo? (nao e stub/placeholder)
- [ ] Conectado? (integrado com o resto)

### 3. Contagem
Total: X | Completos: Y | Parciais: Z | Faltando: W
Se W > 0 ou Z > 0 → continue implementando

### 4. Limite de Iteracoes
Maximo 2 ciclos de verificacao completos.
Se apos 2 ciclos ainda houver pendencias → reportar status ao usuario.
NAO entrar em loop infinito.

### 5. Declaracao
"Completei X/Y itens. [Status de pendencias se houver]."
