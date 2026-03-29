# DOC-4: Zeev — Limites de Acesso e Lacunas

> O que NÃO temos acesso via APIs e por quê.
> Data: 2026-03-24

---

## 1. O que temos vs. o que não temos

### Acesso Completo

| Recurso | Via | Nível |
|---------|-----|-------|
| Tarefas pendentes de qualquer usuário | API Nativa + impersonação | Leitura + escrita (finalizar, encaminhar) |
| Solicitações de qualquer usuário | API Nativa + impersonação | Leitura |
| Campos preenchidos de uma instância | API Nativa (`formFields`) | Leitura (somente instâncias existentes) |
| Etapas/tarefas de uma instância | API Nativa (`instanceTasks`) | Leitura |
| Lista de fluxos ativos | API Nativa (`/flows/edit`) | Leitura (somente nome) |
| Grupos organizacionais | API Nativa (`/groups`) | Leitura |
| SLA (no prazo / atrasado) | API Nativa (`/assignments/report`) | Leitura |
| Dados financeiros extraídos | API Dados (metabases) | Leitura |
| Estatísticas agregadas | API Dados | Leitura |

### Acesso Parcial

| Recurso | O que temos | O que falta |
|---------|-------------|-------------|
| Fluxos/processos | Nome, ID, flowCode | Desenho do fluxo, etapas, regras de roteamento, SLAs configurados, formulários |
| Campos de formulário | Campos preenchidos em instâncias existentes | Template/definição do formulário (tipos, validações, opções de dropdown, campos obrigatórios) |
| Subprocessos | `masterInstanceId` e `starterInstanceId` nos dados | API para navegar árvore de subprocessos |
| Serviços | ID, nome, código | Configuração, permissões, regras |

### Sem Acesso

| Recurso | Motivo |
|---------|--------|
| **Definição completa de fluxos** (lanes, gateways, condições, timers) | API Nativa v2 não expõe modelagem de processos |
| **Schema dos formulários** (definição de campos, tipos, validações, options) | Só temos `formFields` preenchidos — não o template |
| **Integrações configuradas** (webhooks, APIs externas, conectores) | Não exposto pela API |
| **Regras de negócio** (condições de roteamento, expressões, automações) | Não exposto pela API |
| **Permissões por fluxo** (quem pode iniciar, quem executa cada etapa) | Só vemos grupos, não a matriz fluxo×grupo×etapa |
| **Log de auditoria completo** (quem fez o quê, quando) | Só temos `reportLink` (URL para ver no Zeev) |
| **Campos de fluxos sem instâncias** | Sem instância = sem formFields para inspecionar |
| **Métricas de performance por etapa** | Derivamos aging do report, mas não temos tempo por etapa |
| **Configuração de SLA por fluxo** | Sabemos se está late, mas não o SLA configurado |
| **Usuários e suas permissões** | Impersonamos, mas não listamos todos os usuários |
| **Notificações e escalações** | Não exposto pela API |
| **Anexos/documentos** de instâncias | Não implementado (API pode suportar) |
| **Comentários** em tarefas/instâncias | Não implementado |
| **Criação de novas instâncias** (abrir solicitação) | Não implementado (API suporta) |

---

## 2. Limitações Técnicas

### 2.1 Paginação do Report

- `assignments/report` retorna máximo 500 items por página
- Backend só consulta página 1 → se houver >500 tarefas, backlog/aging ficam incompletos
- Impacto: indicadores SLA podem subestimar volume real

### 2.2 Cache e Freshness

| Cache | TTL | Impacto |
|-------|-----|---------|
| Token de impersonação | 8min | Dados podem ter até 8min de atraso |
| Response cache (proxy) | 2min | Tarefas finalizadas podem aparecer por até 2min |
| Response cache (dados) | 5min | Dados financeiros com até 5min de atraso |

### 2.3 Timeout e Resiliência

- Timeout hard por request: 10s
- Timeout global da agent tool: 12s
- Retry: 2 tentativas em 401/5xx
- Se Zeev estiver lento (>10s), todas as consultas falham

### 2.4 Shape Inconsistente

- API retorna arrays OU `{ data: [...] }` — handler aceita ambos
- Não há garantia de quais campos opcionais virão preenchidos
- `formFields` pode ter valores de qualquer tipo (`unknown`)

---

## 3. Caminhos para Expandir o Acesso

### 3.1 Engenharia Reversa via Instâncias (viável)

Para montar o schema aproximado dos formulários:
1. Coletar `formFields` de múltiplas instâncias de cada fluxo
2. Inferir tipos e campos possíveis por análise estatística
3. Limitação: campos nunca preenchidos ficam invisíveis

### 3.2 API v3 ou Endpoints Admin (investigar)

- Verificar se Zeev oferece `/api/2/flows/{id}/definition` ou similar
- Verificar se há API de modelagem (Zeev Flow Editor API)
- Contatar suporte Zeev para documentação de endpoints admin

### 3.3 Scraping do Painel Admin (último recurso)

- Acessar `raizeducacao.zeev.it` como admin via browser
- Exportar definições de fluxos manualmente
- Documentar no knowledge base

### 3.4 Endpoints Não Implementados (API Nativa pode suportar)

Com base na documentação geral do Zeev, estes endpoints provavelmente existem mas não foram implementados na raiz-platform:

| Endpoint Provável | Recurso |
|-------------------|---------|
| `POST /api/2/instances` | Criar nova solicitação |
| `GET /api/2/instances/{id}/attachments` | Anexos de uma instância |
| `GET /api/2/instances/{id}/comments` | Comentários |
| `GET /api/2/instances/{id}/timeline` | Timeline/auditoria |
| `GET /api/2/users` | Lista de usuários |
| `GET /api/2/flows/{id}` | Definição do fluxo |
| `GET /api/2/services` | Lista de serviços |

> **Nota**: Estes são especulativos baseados no padrão REST típico do Zeev. Precisam ser validados contra a API real.
