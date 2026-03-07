# Playbook 09: Integracao de MCPs

> MCP (Model Context Protocol) — protocolo padrao para ferramentas externas.

## Governanca de MCPs

### Principios
1. **Sequential** — um MCP por vez, nunca paralelo
2. **Validar output** — verificar resultado antes de usar
3. **Fallback** — ter alternativa se MCP falhar
4. **Auditoria** — registrar chamadas para debug

### MCPs Comuns

| MCP | Funcao |
|-----|--------|
| GitHub | PRs, issues, repos |
| Filesystem | Leitura/escrita de arquivos |
| Google Workspace | Gmail, Drive, Docs |
| Memory | Memoria persistente |
| Database | Queries diretas |

## Regras de Uso

### 1. Chamada Sequential
```
❌ Chamar MCP-A e MCP-B em paralelo
✅ Chamar MCP-A → validar → Chamar MCP-B → validar
```

### 2. Validacao de Output
- Verificar dados validos
- Verificar formato correto
- Verificar se nao retornou erro silencioso
- Logar resultado

### 3. Error Handling
```
MCP falhou?
├── Erro de rede → Retry (max 3x com backoff)
├── Erro de auth → Verificar credenciais
├── Erro de dados → Validar input
└── Erro desconhecido → Fallback manual + log
```

### 4. Rate Limiting
- Respeitar limites de API
- Implementar throttling
- Cache de resultados quando possivel

## Configuracao (.mcp.json)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

## Troubleshooting

| Problema | Solucao |
|----------|---------|
| MCP nao responde | Restart do MCP server |
| Dados incorretos | Verificar versao do MCP |
| Timeout | Aumentar timeout ou dividir |
| Auth error | Renovar credenciais |
