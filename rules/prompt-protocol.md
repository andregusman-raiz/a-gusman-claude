# Protocolo Rewrite + Routing

## Principio

Antes de executar pedidos nao-triviais, Claude DEVE emitir um preamble curto e visivel com:
1. **Rewrite** do intent (desambiguado, contexto implicito resgatado)
2. **Rota** escolhida (ferramenta/agent/skill/machine) com justificativa
3. Confirmacao de execucao

O preamble e visivel para o usuario auditar em tempo real — anti-teatro.

## Formato Obrigatorio (3 linhas, nada alem disso)

```
**Rewrite:** [intent em 1 linha, <=20 palavras, incluindo contexto implicito resgatado]
**Rota:** [ferramenta] — [justificativa em <=15 palavras]
**Executando.**
```

Exemplo:
```
**Rewrite:** Corrigir dropdown de disciplinas em /turmas/[id] que mostra dados da turma errada.
**Rota:** /ag-2-corrigir — bug com cadeia API->adapter->context, precisa root-cause + Playwright verify.
**Executando.**
```

## Gatilhos — APLICAR quando

- Verbo vago: "organiza", "melhora", "ve", "ajeita", "olha"
- Escopo multi-arquivo, multi-repo ou paralelismo envolvido
- 2+ rotas viaveis (ex: `/commit` vs `ag-versionar-codigo`, Edit direto vs ag-2-corrigir)
- Prompt pede algo que implica escolha de ferramenta (ex: "testa isso")
- Intent composto ("corrige X e testa Y")

## Gatilhos — PULAR quando

- Comando atomico explicito: `/commit`, `/ag-1-construir feature X`, "roda `bun test`"
- Continuacao direta de tarefa em andamento (mesmo escopo, mesmo arquivo)
- Pergunta factual pura ("quantas linhas tem X?", "qual a versao?")
- Prompt ja contem a rota ("use ag-1-construir para Y") — so fazer rewrite, nao re-rotear
- Flag `--go` ou `--skip-routing` no final do prompt
- Prompt < 5 palavras sem ambiguidade ("commit", "deploy preview", "typecheck")

## Anti-Teatro (5 regras)

1. **Preamble visivel** — nunca "interno e invisivel". Se nao aparece no output, nao vale.
2. **Rota obvia = declaracao curta** — se a rota e evidente (ex: `/commit` para commit), dizer "rota obvia" em 1 linha e executar, sem 3 linhas.
3. **Rewrite deve mudar algo** — se o rewrite e identico ao prompt, nao fazer rewrite. Anunciar "prompt ja claro, rota: X".
4. **Executar = seguir a rota anunciada** — se anunciou ag-2-corrigir mas executou com Edit direto, e teatro. Parar e justificar a mudanca.
5. **Max 3 linhas** — se o preamble passa de 3 linhas, esta virando verborreia. Cortar.

## Flags de Bypass

| Flag | Efeito |
|------|--------|
| `--go` | Pula protocolo completo, executa direto |
| `--skip-routing` | Pula apenas routing, mantem rewrite |
| `--autonomo` | Pula checkpoints interativos (ja existe em activation-modes.md) |

## Referencias (onde esta a matriz completa)

- **Matriz machine vs agent vs skill vs plugin** → `agent-decision-guide.md`
- **Skill vs Agent vs Teams vs Worktree** → `agent-invocation.md`
- **Plugin vs agent** → `plugin-routing.md`
- **Deploy routing** → `deploy-routing.md`
- **Ativacao (autonomo/draft/interativo)** → `activation-modes.md`
- **Paralelismo (worktree, overlap)** → `multi-agent-isolation.md` + `agent-boundaries.md`
- **Arvore expandida + exemplos** → `/ag-referencia-roteamento`

## Regra de Ouro

Prompt ambiguo sem rota obvia → `/ag-0-orquestrador [intent]` classifica e roteia.
Quando em duvida entre 2 rotas → invocar `/ag-referencia-roteamento` para auditar escolha.
