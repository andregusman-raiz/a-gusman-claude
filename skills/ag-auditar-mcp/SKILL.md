---
name: ag-auditar-mcp
description: "Audita a superficie MCP e skills de terceiros ANTES de instalar: tool poisoning, rug pull, dep nao pinada, segredo em config, injecao indireta em descricao de tool/skill. Offline por padrao."
context: fork
allowed-tools: Read, Glob, Grep, Bash, Write
argument-hint: "[--baseline | --scan <dir> | --pre-install <repo-url-ou-path>]"
metadata:
  scoring: none
  priority: 88
---

# ag-auditar-mcp — auditoria da superficie MCP e de skills de terceiros

## Por que existe (delimitacao vs `ag-auditar-harness`)

`ag-auditar-harness` / HCS.injection cobre **codigo do harness**: `eval $(...)` em hook,
`bash -c "$var"`, `curl | sh`. Este skill cobre um vetor diferente e nao coberto:
**texto que o modelo le como dado e obedece como instrucao**.

Uma tool MCP anuncia um `name` e uma `description` em linguagem natural. O modelo le a
description **antes** de decidir chamar a tool. Instrucao escondida ali e obedecida sem
que nada apareca para o usuario — e injecao indireta entregue pela cadeia de suprimentos
(OWASP **MCP03:2025**, MITRE ATLAS **AML.T0010** / **AML.T0051.001**). O mesmo vale para
o `description:` de qualquer SKILL.md de terceiro instalado no harness.

## Quando invocar

- **Antes de adicionar um MCP server** novo (proprio ou de terceiro)
- **Antes de instalar skills/plugins de terceiro** — o `--scan` roda no repo clonado, antes do install
- Periodicamente, para pegar **rug pull**: um servidor ja aprovado cuja config/descricao muda depois
- Quando um agente tomou acao inesperada compativel com tool poisoning

## Ferramenta local (offline, stdlib, nao executa MCP server)

```bash
S=~/Claude/.claude/scripts/mcp-baseline-audit.py

python3 $S                       # inventario + diff contra baseline
python3 $S --save-baseline       # (re)arma deteccao de rug pull
python3 $S --scan-skills <dir>   # varre SKILL.md de terceiros antes de instalar
python3 $S --json                # machine-readable
python3 $S --strict              # exit 2 se houver P0 (uso em gate/CI)
```

Baseline: `~/.claude/state/mcp-baseline.json` (hash de `command`/`args`/`url`/chaves de
`env` e `headers` por servidor). Mudanca silenciosa nesse conjunto = **P0 config mudou**.

O que ele detecta:

| Sinal | Sev | Por que importa |
|---|---|---|
| Config de servidor mudou vs baseline | P0 | rug pull: aprovado num estado, rodando em outro |
| Instrucao ao assistente em descricao ("ignore previous", "nao conte ao usuario") | P0 | tool/skill poisoning |
| Caractere invisivel (ZWSP/ZWJ/BOM) ou bidi override | P0 | payload escondido do revisor humano |
| Path de segredo (`~/.ssh`, `id_rsa`, `.aws/credentials`) em descricao | P0 | alvo classico de exfiltracao |
| `curl \| sh` no start do servidor | P0 | download+exec a cada boot |
| Transporte `http://` remoto sem TLS | P0 | tool call em claro |
| `npx -y pkg@latest` sem pin de versao | P1 | codigo remoto novo a cada start, sem revisao |
| Segredo literal em `env`/`headers` da config | P1 | vaza em backup, sync e transcript |
| Servidor novo desde o baseline | P1 | entrou sem passar por revisao |
| Homoglifo CYRILLIC+LATIN no nome | P1 | typosquat de tool confiavel |

Match dentro de bloco de codigo ou aspas cai para **P2** ("em exemplo/codigo") — sem isso,
toda skill que *ensina* sobre injecao dispara alarme falso.

## Limites honestos

- E **triagem deterministica**, nao veredito. P0 exige leitura humana do trecho citado.
- Nao le descricao de tool em runtime: para isso seria preciso **iniciar o servidor**, o que
  este script deliberadamente nao faz. Cobre config + SKILL.md/arquivos em disco.
- Skill de seguranca legitima cita os proprios padroes que detectamos — por isso a heuristica
  de exemplo/codigo. Falso positivo residual e esperado e preferivel a falso negativo.

## Passo opt-in: scanner externo (envia dados a terceiro — decisao do usuario)

O scanner de mercado e o antigo `invariantlabs-ai/mcp-scan`, hoje **`snyk/agent-scan`**.
Duas consequencias que **precisam** ser ditas ao usuario antes de rodar:

1. **Compartilha dados**: nomes e descricoes de tools, skills e agent apps sao enviados a
   Snyk para validacao ("skills, agent applications, tool names, and descriptions are shared
   with Snyk" — README do projeto). Nas nossas configs isso descreveria a superficie interna
   do Data Engine, gusman-os, cumbuca e escuta-memoria para um terceiro.
2. **Executa os servidores**: escanear uma config **inicia os MCP servers stdio** definidos
   nela. Ha prompt de consentimento por servidor; `--dangerously-run-mcp-servers` o remove.

Portanto: **nunca rodar sem confirmacao explicita do usuario.** Se autorizado:

```bash
uvx agent-scan@latest ~/.claude.json      # consentimento interativo por servidor
```

Nao usar `--dangerously-run-mcp-servers` neste workspace.

## Fluxo canonico

1. `python3 $S` — inventario e diff. P0 => parar e investigar antes de qualquer outra coisa.
2. Para cada P0/P1: abrir o arquivo citado, ler o trecho, decidir (remediar / aceitar / remover servidor).
3. Remediacoes tipicas:
   - dep nao pinada => fixar versao no `args` (`@upstash/context7-mcp@1.2.3`)
   - segredo literal => mover para env var (`${VAR}`) e rotacionar o valor exposto
   - servidor de terceiro nao auditado => nao instalar, ou isolar sem acesso a dados Raiz
4. `python3 $S --save-baseline` **depois** de decidir — o baseline registra o estado aprovado.
5. Antes de instalar skills de terceiros: `python3 $S --scan-skills <clone>` e ler todo P0.

## Estado atual (auditoria de 2026-08-02)

18 servidores MCP em 2 configs, baseline armado. P0=0. P1=7: 4 servidores em `npx -y`
sem pin (`context7`, `docs-search`, `knowledge-graph`, `semantic-code-search`) e 3 com
segredo literal em `~/.claude.json` (`configurador-escolas`, `configurador-remoto`,
`gusman-os`). Nenhum tratado ainda — sao decisao do dono.

## Referencias

- OWASP MCP Top 10 — MCP03:2025 Tool Poisoning: https://owasp.org/www-project-mcp-top-10/
- MITRE ATLAS AML.T0010 / AML.T0051.001: https://atlas.mitre.org/
- snyk/agent-scan (ex-invariantlabs mcp-scan): https://github.com/snyk/agent-scan
- Regras relacionadas: `.claude/rules/supply-chain.md`, `.claude/rules/harness-coverage.md` (R3, R7)
