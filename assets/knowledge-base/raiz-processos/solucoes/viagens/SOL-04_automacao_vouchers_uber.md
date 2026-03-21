# SOL-04 — Automacao de Vouchers Uber via Ticket Raiz (ZIV)

**Processo**: Viagens & Mobilidade (OnFly + Uber)
**Nivel**: N1 — Configuracao de workflow no ZIV (Ticket Raiz)
**Prioridade**: Quick Win — iniciar imediatamente (independente de CR5)
**Timeline**: 1-2 semanas
**Responsavel**: Maressa + TI
**Resolve**: CR4 (maioria dos usos de Uber via reembolso em vez de conta corporativa; solicitacoes informais via WhatsApp/email)
**Condicional**: Nao — pode iniciar imediatamente

---

## Descricao

Substituir o processo manual de solicitacao e aprovacao de vouchers Uber por um workflow automatizado no ZIV:
- Colaborador solicita voucher via formulario no ZIV
- Sistema encaminha automaticamente para aprovacao do gestor da area (nao mais via WhatsApp/email informal)
- Se aprovado: voucher emitido diretamente pela plataforma Uber Corporativa (ou notificacao ao time de contratos)
- Notificacao automatica para o colaborador com o voucher

Isso nao amplia o acesso ao Uber Corporativo para todos (politica se mantem), mas automatiza o processo de solicitacao de voucher para quem tem direito.

**Acoes**:
1. Mapear fluxo atual de solicitacao de voucher (quem solicita, quem aprova, como voucher e gerado)
2. Criar formulario de solicitacao no ZIV com campos obrigatorios (destino, data, justificativa, gestor aprovador)
3. Configurar workflow de aprovacao no ZIV com escalada automatica
4. Verificar se Uber Corporativa tem API para emissao automatica de vouchers
5. Se API disponivel: integrar ZIV com Uber Corporativa via n8n para emissao automatica
6. Se API nao disponivel: workflow aprova no ZIV e notifica o time de contratos para emitir o voucher manualmente (reduz o WhatsApp mas mantem passo humano)
7. Comunicar politica e novo processo para todos os colaboradores

**KPIs de sucesso**:
- % de solicitacoes de voucher via ZIV (meta: 100% em 30 dias)
- Tempo de aprovacao de voucher (meta: <4h vs atual indeterminado)
- Reducao de solicitacoes via WhatsApp para vouchers (meta: zero)

**Riscos**:
- Uber Corporativa pode nao ter API publica para emissao de vouchers (mitigacao: verificar com suporte; se nao tiver, manter emissao manual mas com aprovacao automatizada)

---

## Plano de Implementacao

**Nivel**: N1 | **Timeline**: 1-2 semanas | **Resolve**: CR4

### Responsaveis

- Principal: Maressa
- Executor: TI (configuracao ZIV + eventual integracao n8n)

### Fluxo Alvo

```
Colaborador solicita voucher via formulario no ZIV
    → ZIV encaminha para aprovacao do gestor da area
    → Gestor aprova ou rejeita no ZIV (nao via WhatsApp)
    → Se aprovado: notificacao automatica ao time de contratos
    → Time de contratos emite voucher na plataforma Uber Corporativa
    → Colaborador recebe voucher por email
```

Versao avancada (se Uber tiver API): emissao automatica do voucher sem passo manual do time de contratos.

### Plano de Acao

| Dia | Atividade |
|-----|-----------|
| Dia 1 | Mapear fluxo atual exato: quem solicita, como, quem aprova, como voucher e emitido |
| Dia 1 | Verificar com Uber Corporativa se ha API para emissao programatica de vouchers |
| Dia 2 | Criar formulario de solicitacao no ZIV: campos obrigatorios (data, destino, justificativa, gestor aprovador, tipo de viagem) |
| Dia 3 | Configurar workflow de aprovacao no ZIV com escalada automatica (se gestor nao aprovar em 4h, escala para Maressa) |
| Dia 4 | Testar fluxo completo com 2-3 solicitacoes piloto |
| Dia 5 | Comunicar todos os colaboradores sobre novo processo: vouchers apenas via ZIV |
| Semana 2 | Se API Uber disponivel: integrar ZIV com Uber via n8n para emissao automatica |

### Validacoes Pos-Implementacao

- [ ] 100% das solicitacoes de voucher via ZIV em 30 dias
- [ ] Tempo de aprovacao de voucher < 4 horas (vs atual indeterminado)
- [ ] Zero solicitacoes de voucher via WhatsApp ou email informal
- [ ] Relatorio mensal de vouchers emitidos disponivel no ZIV

### Plano de Rollback

**Condicao**: Falha no workflow ZIV impedindo emissao de vouchers urgentes
**Acao**: Time de contratos emite voucher manualmente; processo no ZIV corrigido em paralelo
**Responsavel**: Maressa
**Tempo**: Imediato (nao bloqueia operacao)

### KPIs de Acompanhamento

| KPI | Baseline | Meta 30 dias | Meta 90 dias |
|-----|---------|--------------|--------------|
| Solicitacoes de voucher via ZIV | ~0% | 80% | 100% |
| Tempo de aprovacao de voucher | Indefinido | <4h | <4h |
| Solicitacoes via WhatsApp | ~100% | 0% | 0% |
