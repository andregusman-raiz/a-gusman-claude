---
name: markdown-viewer
description: "Abrir, configurar ou validar documentos Markdown de um projeto no visualizador local seguro com Streamdown. Use quando o usuário pedir para visualizar, navegar, servir ou imprimir arquivos .md no navegador."
metadata:
  filePattern: ".markdown-viewer.json,**/*.md"
  bashPattern: "markdown-viewer|visualizar markdown|abrir markdown"
  priority: 82
---

# Markdown Viewer

Use o runtime canônico desta skill; não copie a aplicação para o projeto.

## Operação

Resolva o projeto-alvo e execute diretamente:

```bash
bash ~/Claude/.claude/skills/markdown-viewer/scripts/markdown-viewer.sh --project <PROJECT_ROOT>
```

- Validar sem subir servidor: acrescente `--check`.
- Criar o manifesto seguro padrão quando ele não existir: acrescente `--init`, depois revise a allowlist.
- A porta padrão é `3006`; use `--port N` somente em conflito.
- O servidor deve permanecer em `127.0.0.1`; nunca exponha com `0.0.0.0`.

Ao criar ou alterar a allowlist, leia [references/manifest.md](references/manifest.md). Para localhost, siga a regra global: navegação e screenshots via Playwright.

## Invariantes

- `.markdown-viewer.json` é obrigatório; ausência nunca libera um diretório por fallback.
- Não publique `CLAUDE.md`, `AGENTS.md`, `docs/ai-state/**`, `entrada/**`, `Downloads/**` ou formatos não Markdown.
- Preserve o manifesto existente; mudanças de escopo documental exigem edição explícita.
- A fonte canônica atende Claude e Codex por `.agents/skills -> .claude/skills`; não duplique a skill.
