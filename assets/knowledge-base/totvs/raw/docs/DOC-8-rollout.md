# DOC 8 — Plano de Migração e Rollout

> Frontend TOTVS Educacional — Estratégia de transição do sistema nativo para o novo frontend.
> Objetivo: zero disrupção operacional durante a migração.

---

## 1. Premissas

- O TOTVS RM nativo **não será desligado** durante a migração — coexistência obrigatória
- O novo frontend é **read-first** — começar com consultas, depois habilitar escrita
- Cada escola migra independentemente — rollout por coligada/filial
- Rollback granular: qualquer escola pode voltar ao RM nativo a qualquer momento
- Dados vivem no TOTVS RM (MSSQL) — o frontend é uma camada de visualização

---

## 2. Fases de Rollout

### Fase 0: Infraestrutura (Semanas 1-2)

| Item | Descrição | Responsável |
|------|-----------|-------------|
| Projeto Vercel | Criar projeto, configurar domínio, env vars | DevOps |
| Clerk | Configurar org, perfis, convites | DevOps |
| MSSQL Access | Confirmar acesso ao banco de cada coligada | Jordani/Infra |
| VPN/Firewall | Garantir que Vercel Functions acessam o MSSQL (IP allow-list ou VPN) | Infra |
| Monitoramento | Sentry + Vercel Analytics configurados | DevOps |
| Schema validation | Executar queries DOC-2 contra banco real, confirmar nomes de tabelas | Dev |

**Gate**: Conexão MSSQL funcional do Vercel para o banco TOTVS RM.

### Fase 1: Piloto Read-Only (Semanas 3-6)

**Escolas piloto**: 2 unidades (1 RJ + 1 RS)
- Sugestão: **QI Tijuca** (coligada 2, filial 2) e **Leonardo da Vinci Canoas** (coligada 16)
- Critérios de seleção: equipe receptiva, volume moderado, representam praças diferentes

**Funcionalidades habilitadas**:
- Login + seletor de escola
- Dashboard secretaria (KPIs read-only)
- Lista de alunos (busca, filtros)
- Ficha do aluno (visualização)
- Gestão de turmas (visualização)
- Emissão de documentos (via API REST)

**Usuários piloto**: 3-5 por escola (secretárias + 1 coordenador)

**Treinamento**:
- Sessão de 1h por escola (videoconferência)
- Manual rápido (PDF de 5 páginas com screenshots)
- Canal Slack/Teams dedicado para suporte

**Métricas de sucesso (Fase 1)**:
| Métrica | Target | Como medir |
|---------|--------|------------|
| Uptime | >= 99.5% | Vercel status |
| Tempo de carregamento | < 2s (P95) | Vercel Speed Insights |
| Erros de dados | 0 divergências vs RM nativo | Comparação manual (sample 20 alunos) |
| Adoção | >= 80% dos pilotos usando diariamente | Vercel Analytics (DAU) |
| Satisfação | >= 4/5 NPS | Formulário ao final da fase |

**Gate**: Todas as métricas atingidas → prosseguir para Fase 2.

### Fase 2: Piloto com Escrita (Semanas 7-10)

**Mesmas escolas piloto** + expansão para mais 3-5 unidades

**Funcionalidades adicionadas**:
- Dashboard professor
- Diário de classe / chamada digital
- Lançamento de frequência
- Lançamento de notas
- Ocorrências disciplinares

**Usuários adicionados**: professores (5-10 por escola)

**Treinamento**:
- Sessão específica para professores (1h)
- Vídeos curtos (2-3min) por funcionalidade
- Acompanhamento presencial nos primeiros 3 dias

**Validação crítica (write operations)**:
- Após cada write no novo frontend, verificar no RM nativo que os dados estão corretos
- Amostra diária: 10 chamadas + 10 notas verificadas cruzando com RM
- Se divergência > 0: pausar writes, investigar, corrigir

**Métricas de sucesso (Fase 2)**:
| Métrica | Target |
|---------|--------|
| Divergência de dados | 0% (writes corretos) |
| Tempo para fazer chamada | < 3min (vs 5-8min no RM nativo) |
| Tempo para lançar notas | < 5min por turma (vs 10-15min no RM) |
| Satisfação professor | >= 3.5/5 NPS |
| Bugs reportados | < 5 por semana (non-blocking) |

**Gate**: Zero divergências de escrita + satisfação >= 3.5 → prosseguir.

### Fase 3: Expansão Gradual (Semanas 11-16)

**Rollout em ondas**:
- Onda 1: 5 escolas RJ (semanas 11-12)
- Onda 2: 5 escolas RS (semanas 13-14)
- Onda 3: restantes MG + demais (semanas 15-16)

**Funcionalidades adicionadas**:
- Grade curricular
- Calendário acadêmico
- Matrícula (criar novo aluno)
- Rematrícula
- Transferência
- Apuração de resultado

**Por escola**:
1. Provisionar usuários no Clerk (batch)
2. Treinamento (1h secretaria + 1h professores)
3. 3 dias de acompanhamento
4. Validação: comparar dados com RM nativo
5. Liberação completa

### Fase 4: Relatórios & Consolidação (Semanas 17-20)

**Funcionalidades finais**:
- Relatórios visuais (desempenho por turma/série/escola)
- Comparativos entre unidades
- Conselho de classe (visão 360°)
- Exportação (PDF, Excel)

**Consolidação**:
- Feedback consolidado de todas as escolas
- Ajustes de UX baseados em uso real
- Documentação final de usuário
- Definição de SLA operacional

---

## 3. Plano de Coexistência

Durante toda a migração, ambos os sistemas coexistem:

```
┌─────────────────────────────────────────┐
│           TOTVS RM (MSSQL)             │
│         Fonte única de verdade          │
├───────────────┬─────────────────────────┤
│               │                         │
│  RM Nativo    │   Novo Frontend         │
│  (Desktop)    │   (Web / Next.js)       │
│               │                         │
│  - Full CRUD  │   Fase 1: Read-only     │
│  - Relatórios │   Fase 2: Read + Write  │
│  - Config     │   Fase 3: Full CRUD     │
│               │                         │
│  Acesso:      │   Acesso:               │
│  VPN + Client │   Browser (qualquer)    │
│               │                         │
└───────────────┴─────────────────────────┘
```

### Regras de coexistência
1. **Dados no MSSQL são a verdade** — ambos os frontends leem/escrevem na mesma base
2. **Sem sincronização** necessária — é o mesmo banco
3. **Conflito de escrita**: improvável (secretária usa ou RM ou web, não ambos simultaneamente para o mesmo registro). Se ocorrer, last-write-wins (padrão do RM).
4. **Configurações do RM** (fórmulas, parâmetros) continuam sendo gerenciadas pelo RM nativo — o frontend lê essas configs do banco
5. **Relatórios complexos** continuam via RM nativo até Fase 4

---

## 4. Rollback Plan

### Por escola (granular)
1. Desabilitar acesso no Clerk (remover org)
2. Escola volta a usar exclusivamente RM nativo
3. Zero perda de dados (tudo está no MSSQL)
4. Pode ser feito em < 5 minutos

### Global (emergência)
1. Colocar Vercel deployment em maintenance mode (env var flag)
2. Notificar todas as escolas via email/WhatsApp
3. Todas voltam ao RM nativo
4. Investigar e corrigir o problema
5. Re-habilitar gradualmente

### Critérios para rollback automático
- Erro rate > 5% (Sentry alert)
- Divergência de dados detectada (verificação automática)
- MSSQL connection failure > 5min
- Vercel downtime > 15min

---

## 5. Gestão de Mudança

### Comunicação
| Público | Canal | Frequência |
|---------|-------|------------|
| Diretores | Email + reunião mensal | Mensal |
| Secretárias | WhatsApp grupo + email | Semanal durante rollout |
| Professores | Email + vídeos | Antes de cada fase |
| Coordenadores | Reunião + email | Quinzenal |
| TI (Jordani) | Slack/Teams direto | Contínua |

### Treinamento
- **Formato**: Vídeos curtos (2-3min cada) + sessão ao vivo (1h) + manual PDF
- **Conteúdo por perfil**:
  - Secretária: login, seletor escola, alunos, turmas, matrícula, documentos
  - Professor: login, dashboard, chamada, notas, ocorrências
  - Coordenador: tudo acima + relatórios, overrides
- **Suporte pós-treinamento**: Canal dedicado com SLA 4h úteis

### Resistência esperada e mitigação
| Resistência | Mitigação |
|-------------|-----------|
| "Já sei usar o RM" | Mostrar ganho de tempo (chamada: 3min vs 8min) |
| "E se der erro?" | Rollback instantâneo, dados no mesmo banco |
| "Mais um sistema?" | É substituição gradual, não adição |
| "Não tenho internet estável" | PWA com cache offline para consultas |

---

## 6. Métricas de Sucesso (pós-rollout completo)

| Métrica | Baseline (RM nativo) | Target | Como medir |
|---------|---------------------|--------|------------|
| Tempo para fazer chamada | 5-8 min | < 3 min | Timestamp início/fim |
| Tempo para lançar notas (turma) | 10-15 min | < 5 min | Idem |
| Tempo para emitir boletim | 3-5 min | < 1 min | Idem |
| Satisfação NPS | N/A | >= 4.0/5 | Survey trimestral |
| Adoção diária | N/A | >= 90% DAU | Vercel Analytics |
| Erros reportados | N/A | < 3/semana | Sentry + canal suporte |
| Uptime | N/A | >= 99.9% | Vercel status |

---

## 7. Cronograma Resumido

```
Sem 1-2:   [████] Infraestrutura
Sem 3-6:   [████████] Piloto Read-Only (2 escolas)
Sem 7-10:  [████████] Piloto com Escrita (5-7 escolas)
Sem 11-16: [████████████] Expansão Gradual (todas as escolas)
Sem 17-20: [████████] Relatórios & Consolidação
           ├── Gate: infra OK
           ├── Gate: read-only validado
           ├── Gate: write validado
           └── Gate: todas as escolas migradas
```

**Total: ~20 semanas (5 meses)** do início da implementação até rollout completo.

---

## 8. Dependências Externas

| Dependência | Responsável | Risco | Mitigação |
|-------------|-------------|-------|-----------|
| Acesso MSSQL do Vercel | Jordani/Infra | Alto | Testar conexão na Fase 0 |
| Credenciais API REST RM | TI TOTVS | Médio | Já temos Basic Auth funcional |
| Clerk setup | DevOps | Baixo | Auto-provisionamento via Marketplace |
| Treinamento presencial | Pedagógico | Médio | Vídeos como fallback |
| VPN/IP whitelist | Infra | Alto | Alternativa: tunnel via N8N |

---

## 9. Budget Estimado

| Item | Custo Mensal | Notas |
|------|-------------|-------|
| Vercel Pro | ~$20 | 1 projeto, uso moderado |
| Clerk Pro | ~$25 | ~200 users (secretárias + professores) |
| Vercel Blob | ~$5 | Documentos de alunos |
| Sentry | $0 | Plano free (5K events/mês suficiente) |
| Domínio | ~$12/ano | educacional.raizeducacao.com.br |
| **Total** | **~$50-60/mês** | Escalável conforme uso |

> O maior custo é de **desenvolvimento**, não de infraestrutura.
