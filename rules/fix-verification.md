# Fix Verification Protocol

## Regra Principal

NUNCA declarar um bug fix completo sem verificacao interativa via Playwright.
Build + typecheck passing NAO e suficiente. O fix deve ser verificado do ponto de vista do USUARIO.

## Protocolo Obrigatorio (para CADA bug corrigido)

### 1. Reproduzir o bug original
- Abrir Playwright no localhost ou deploy preview
- Seguir EXATAMENTE os passos do bug report
- Capturar screenshot ANTES do fix

### 2. Aplicar o fix

### 3. Verificar que o bug NAO acontece mais
- Repetir os mesmos passos do passo 1
- O resultado deve ser DIFERENTE (bug resolvido)
- Capturar screenshot DEPOIS do fix
- NAO basta ver "pagina carrega" — verificar que os DADOS estao corretos

### 4. Testar interacao adjacente
- Trocar filtro, mudar tab, selecionar outro item no dropdown
- Verificar que a interacao adjacente tambem funciona
- O fix nao deve quebrar funcionalidade adjacente

### 5. Tracar a cadeia de dados (quando aplicavel)
```
API → adapter → context → page → DOM
```
Verificar que o MESMO dado aparece em cada ponto da cadeia.

## Checklist por Fix

```
1. [ ] Reproduzi o bug original via Playwright? (screenshot ANTES)
2. [ ] Apliquei o fix?
3. [ ] Reproduzi o cenario do bug — bug NAO acontece? (screenshot DEPOIS)
4. [ ] Tracei a cadeia de dados: API → adapter → context → page → DOM?
5. [ ] Testei interacao adjacente (dropdown, filtro, tab)?
6. [ ] O dado exibido confere com o dado da API? (nao so "tem dado")
```

## 5 Anti-Patterns de Verificacao (NUNCA fazer)

### 1. Verificar PRESENCA em vez de CORRETUDE
- ERRADO: "pagina carrega sem crash" = fix ok
- CORRETO: "dropdown mostra disciplinas da turma correta" = fix ok

### 2. Testar API isolada sem testar o fluxo E2E
- ERRADO: `curl /api/disciplinas` retorna 200 = API ok = fix ok
- CORRETO: API retorna dados → dados aparecem no dropdown correto → selecionar muda tabela

### 3. Declarar fix baseado em build + typecheck
- ERRADO: `npm run build` = 0 erros + `tsc --noEmit` = 0 erros = fix completo
- CORRETO: build passa + usuario vê dados corretos na tela = fix completo

### 4. Medir presenca sintatica em vez de corretude semantica
- ERRADO: `/\d{2,}/.test(text)` = tem numeros = pagina funciona
- CORRETO: "o numero 4139 corresponde ao total de alunos da API" = dados corretos

### 5. Testar estado inicial sem testar interacao
- ERRADO: navegar para pagina, verificar HTML estatico, declarar pass
- CORRETO: navegar, clicar dropdown, selecionar opcao, verificar que dados mudam

## Enforcement

- ag-corrigir-bugs DEVE seguir este protocolo para CADA fix
- ag-4-teste-final DEVE usar QAT L2.5 (interaction layer) para verificar fixes
- PRs de fix DEVEM incluir screenshots antes/depois
