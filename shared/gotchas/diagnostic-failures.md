# Diagnostic Failures — 5 Patterns de Falha em QA

Documentado apos 21 PRs de fixes no SophiA Educacional Frontend onde 4 bugs persistiram em producao.
Todos os bugs foram "corrigidos" e passaram em todos os testes automaticos.

## Pattern 1: Verificar CARGA, nao FUNCIONALIDADE

**Sintoma**: Testes passam mas usuario reporta bug no mesmo fluxo.
**Causa**: Teste verifica que pagina renderiza (body.length > 200), nao que dados estao corretos.
**Exemplo**: Diario de classe — teste verifica que `<table>` existe, mas disciplinas no dropdown estao erradas.
**Fix**: Sempre verificar CONTEUDO semantico, nao apenas existencia de elementos DOM.

## Pattern 2: Testar API isolada, ignorar fluxo E2E

**Sintoma**: API retorna 200 com dados, pagina mostra dados errados.
**Causa**: Bug esta no adapter, filter ou mapping entre API e componente.
**Exemplo**: `turmasProf.flatMap(t => t.disciplinas)` retorna disciplinas erradas porque o lookup de turma por professor esta incorreto.
**Fix**: Tracar cadeia completa: API → adapter → context → page → DOM.

## Pattern 3: Build + Typecheck = Fix completo

**Sintoma**: Zero erros de tipo, build limpo, mas funcionalidade quebrada.
**Causa**: TypeScript nao valida logica de negocio, apenas tipos.
**Exemplo**: `(p.disciplinas ?? []).length` resolve null safety mas o problema real e o lookup de ID do professor.
**Fix**: Apos build+typecheck, SEMPRE verificar via Playwright que a funcionalidade esta correta.

## Pattern 4: Medir PRESENCA sintatica, nao CORRETUDE semantica

**Sintoma**: QAT score alto (7-8/10) mas usuario ve dados errados.
**Causa**: QAT verifica existencia de numeros (`/\d{2,}/`), nomes (`/[A-Z][a-z]+/`), mas nao verifica se sao os dados CORRETOS.
**Exemplo**: Pagina mostra 4139 alunos (numero correto) mas filtro de status nao filtra (mostra todos independente do filtro selecionado).
**Fix**: QAT L2.5 interaction layer — clicar filtro, verificar que dados MUDAM.

## Pattern 5: Testar estado inicial, ignorar INTERACAO

**Sintoma**: Pagina carrega perfeitamente, mas clicar em qualquer coisa quebra.
**Causa**: Teste navega para URL, espera carregar, analisa HTML estatico. Nunca clica, seleciona, digita.
**Exemplo**: Filtro de status existe no DOM, tem opcoes corretas, mas selecionar "Pendente" nao filtra a lista.
**Fix**: QAT deve incluir interacoes Playwright — click, select, type — e verificar que o resultado muda.

## Regra de Ouro

> Para cada teste que declara PASS, perguntar:
> "Se o dado exibido estivesse ERRADO mas a pagina renderizasse perfeitamente, este teste falharia?"
> Se a resposta e "nao" → teste e insuficiente.
