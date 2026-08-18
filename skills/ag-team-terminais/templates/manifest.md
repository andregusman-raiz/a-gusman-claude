# Team <slug> — <repo-nome>

> Criado: <YYYY-MM-DD HH:MM> | Status: ATIVO <!-- ATIVO | INTEGRANDO | ENCERRADO -->
> Coordenador: <nome-de-peer apos ROLLCALL; antes disso "(aguardando rollcall)">
> Coordenador executa papel? nao <!-- ou: sim — <papel> -->

## Config

- repo: <path absoluto>
- branch integradora: <main | develop | feat/...>
- ordem de integracao: <papel-1> → <papel-2> → <papel-3>
- gates do repo: <ex.: bun run typecheck && bun run lint && bun run test>

## Papeis

<!-- Um bloco por papel. Worker so edita o PROPRIO bloco. -->

### <papel-1>

- objetivo: <1 frase>
- done quando: <criterio verificavel — comando + resultado esperado>
- pode tocar: <paths>
- NAO pode tocar: <paths>
- branch: <tipo>/<slug>-<papel-1>
- worktree: <repo>/.claude/worktrees/<slug>-<papel-1>
- sessao: <nome-de-peer apos ROLLCALL>
- status: ABERTO <!-- ABERTO | EM_ANDAMENTO | BLOCKED | DONE | INTEGRADO -->

### <papel-2>

- objetivo:
- done quando:
- pode tocar:
- NAO pode tocar:
- branch:
- worktree:
- sessao:
- status: ABERTO

## Contratos de interface

<!-- Unica fonte para assinaturas/tipos/rotas compartilhados entre papeis.
     So o coordenador escreve aqui (workers pedem via NEED). -->

## Log

<!-- Append-only. Formato: - <YYYY-MM-DD HH:MM> [<quem>] <evento> -->
- <YYYY-MM-DD HH:MM> [coord] team criado
