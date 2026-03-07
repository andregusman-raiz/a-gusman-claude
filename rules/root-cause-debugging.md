# Root Cause Debugging Protocol

## Principio
Corrigir a CAUSA RAIZ, nunca o sintoma. Um fix que nao resolve a causa raiz
apenas adia o problema e cria deploy-fix-deploy loops custosos.

## Antes de Implementar Qualquer Fix
1. **Ler o erro completo** — stack trace, logs, contexto
2. **Tracar a cadeia de chamadas** — do erro ate a origem
3. **Verificar nomes reais** — nao assumir (ex: `this.db` vs `this.supabase`)
4. **Identificar a causa raiz** — por que o erro acontece, nao apenas onde
5. **Confirmar com o usuario** se a causa raiz faz sentido (para bugs complexos)

## Apos Implementar o Fix
1. Executar o codigo afetado para confirmar resolucao
2. Se nao resolveu → PARAR e reanalisar causa raiz
3. NUNCA aplicar um segundo fix em cima do primeiro sem entender por que o primeiro falhou
4. Maximo 2 tentativas de fix → escalar ao usuario

## Antipatterns (EVITAR)
- Corrigir binding (.bind(this)) sem verificar se a propriedade existe
- Adicionar try/catch sem entender o que esta falhando
- Mudar tipos sem entender por que o tipo original foi escolhido
- Adicionar null checks sem entender por que o valor e null
