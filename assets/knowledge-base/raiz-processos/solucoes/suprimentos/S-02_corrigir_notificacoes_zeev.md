# S-02 — Corrigir Bug de Notificacoes do Zeev

**Processo**: Suprimentos (Compras e Cotacao)
**Nivel**: N1 — Configuracao/bug fix no Zeev BPM (fallback N3 via n8n)
**Prioridade**: Quick Win
**Timeline**: 1-3 dias (depende da complexidade do bug); fallback ativavel em < 1 dia
**Responsavel**: TI (resolucao do bug)
**Resolve**: CR-02 (notificacoes quebradas)

---

## Descricao

**Impacto**: CRITICO | **Esforco**: BAIXO

1. Escalar chamado de TI existente para prioridade P1 (impacto em ciclo de aprovacao documentado)
2. Diagnosticar: checar logs do servidor Zeev, configuracao SMTP, versao apos atualizacao de outubro/2024
3. Correcao primaria: restaurar notificacoes nativas do Zeev para aprovadores

**Fallback se bug demorar (N3 — n8n)**:
Enquanto TI resolve, configurar flow no n8n:
- Trigger: webhook do Zeev ao criar tarefa de aprovacao
- Acao: enviar email para o aprovador com link direto para o pedido no Zeev
- Regra: se pedido sem acao em 24h, reenviar email com flag "URGENTE"

**ROI estimado**: Elimina delay medio de +2 dias por pedido. Para 20 pedidos/mes: economia de 40 dias de espera/mes.

**Ferramenta**: Zeev admin panel → Configuracoes → Notificacoes + SMTP. Fallback: n8n (ja disponivel na Raiz, usado em LinkedIn Strategy).

---

## Plano de Implementacao

**Responsavel**: TI (resolucao do bug)
**Prazo**: 2026-03-20 (4 dias uteis) — ou ativar fallback n8n enquanto bug e resolvido
**Dependencia**: Logs do servidor Zeev; chamado TI ja existente deve ser escalado para P1

### Linha Principal (bug fix)

1. TI escala chamado existente de notificacoes para prioridade P1 — impacto em cycle time documentado
2. TI diagnostica: logs de SMTP, configuracao de notificacoes do Zeev pos-outubro/2024, versao instalada
3. TI restaura notificacoes nativas
4. Teste: criar tarefa de aprovacao e confirmar que o aprovador recebe email/notificacao em < 5 min

### Fallback n8n (se bug levar mais de 3 dias)

1. Configurar flow no n8n:
   - Trigger: webhook Zeev ao criar tarefa de aprovacao pendente
   - Acao: email para o aprovador com link direto para o pedido no Zeev
   - Regra: se pedido sem acao em 24h, reenviar email com assunto "ACAO NECESSARIA: pedido ha 24h sem aprovacao"
2. Fabiane e aprovadores confirmam recebimento dos emails

### Validacoes de Sucesso

- [ ] Criar pedido de teste: aprovador recebe notificacao em < 5 min
- [ ] Pedido sem acao por 24h: aprovador recebe lembrete automatico
- [ ] Zero pedidos descobertos por email ou cobrado verbalmente por 2 semanas seguidas

### Dependencias e Riscos

| Dependencia Critica | Risco | Mitigacao |
|---------------------|-------|-----------|
| Bug pode ser complexo | Bug nao resolvivel rapidamente | Fallback n8n disponivel em < 1 dia |
