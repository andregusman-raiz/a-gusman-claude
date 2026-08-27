# Manifesto `.markdown-viewer.json`

O manifesto é uma allowlist. Cada entrada é um arquivo exato ou um diretório recursivo; não há glob implícito.

```json
{
  "project_title": "Nome exibido",
  "entries": [
    { "path": "README.md", "category": "Projeto" },
    { "path": "docs/specs", "category": "Especificações", "recursive": true }
  ]
}
```

Regras:

- `path` é relativo ao projeto, sem `/` inicial, `..`, `.` ou barra invertida.
- Entrada sem `recursive` deve apontar para um arquivo existente.
- Entrada com `recursive: true` deve apontar para um diretório existente.
- Somente `.md` é listado, inclusive dentro de diretórios autorizados.
- Symlinks não são listados e nunca podem escapar da raiz real autorizada.
- A denylist interna continua valendo mesmo se o manifesto tentar incluir um caminho bloqueado.

Para projetos confidenciais, prefira diretórios pequenos e categorias explícitas. Rode `--check` após cada alteração.
