# Log de Validação — Testes Realizados

> Data: 2026-03-20

---

## 1. API REST TOTVS RM

### Credencial Professor (CPF 16573780710)
- **Endpoint**: `GET /api/educational/v1/ProfessorContexts`
- **Resultado**: `401 - FE005: Senha expirada`
- **Ação necessária**: Trocar senha no portal TOTVS RM (somente via client RM nativo)

### Credencial Automação (automacao.acessos)
- **Endpoint**: `GET /api/framework/v1/companies`
- **Resultado**: `401 - FE005: Usuário ou Senha inválidos`
- **Análise**: Credencial rotacionada desde os últimos testes. Funcionava anteriormente (20 coligadas retornadas).
- **Ação necessária**: Solicitar nova credencial ao Jordani/TI

### Status API REST
| Credencial | Status | Ação |
|-----------|--------|------|
| `automacao.acessos` | Senha inválida (rotacionada) | Solicitar reset ao TI |
| CPF 16573780710 (professor) | Senha expirada | Trocar via portal RM |

---

## 2. Conexão MSSQL Direta

### Credenciais
- **Host**: `189.126.153.77:38000`
- **User**: `CLT160286AndreGusman`
- **Database**: `C3U7RQ_160286_RM_PD`

### Resultado
- **Erro**: `Failed to connect in 15000ms` (timeout)
- **Análise**: MSSQL acessível apenas via VPN ou IP whitelist. A máquina local não tem acesso direto.
- **Confirmação**: O raiz-platform em produção (Vercel) acessa o MSSQL — significa que os IPs do Vercel estão na whitelist.

### Ação necessária
Para validar o schema (DOC-2), precisa de:
1. **VPN ativa** na máquina local, OU
2. **Acesso via deploy** — deploy a app no Vercel e rodar queries de validação de lá, OU
3. **Solicitar ao Jordani** que execute as queries de validação do DOC-2 no banco e retorne os resultados

---

## 3. Env Vars (.env.local)

### Problema detectado
Os valores em `.env.local` do raiz-platform contêm `\n` literal em vários campos:
```
TOTVS_MSSQL_HOST="189.126.153.77\n"   ← \n no final
TOTVS_MSSQL_PORT="38000\n"             ← \n no final
TOTVS_MSSQL_DATABASE="C3U7RQ_160286_RM_PD\n"  ← \n no final
```
Isso pode causar falha de conexão mesmo com IP correto. O código do raiz-platform provavelmente trata isso (trim), mas para o novo projeto precisa estar limpo.

---

## 4. Resumo de Bloqueios

| Bloqueio | Severidade | Quem resolve |
|----------|-----------|-------------|
| Credencial API REST inválida | Alta | Jordani/TI TOTVS |
| Senha professor expirada | Média | Professor ou admin RM |
| MSSQL inacessível localmente | Alta | VPN ou Jordani (IP whitelist) |
| \n nos env vars | Baixa | Limpar ao configurar novo projeto |

### Próximo passo recomendado
1. Pedir ao Jordani: nova credencial API REST + IP whitelist para dev local (ou VPN)
2. Alternativa: fazer deploy no Vercel de um script minimal que roda as queries de validação do DOC-2 e retorna os resultados
