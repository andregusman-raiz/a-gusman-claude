# SOL-F03 — Integrar Ticket Frota com Planilha de Controle de Custos

**Processo**: Gestao de Frota — Raiz Educacao
**Nivel**: N2/N3 (integracao nativa se Heflo tem webhook, ou n8n como middleware)
**Prioridade**: Consolidacao
**Timeline**: 1-2 semanas (Semana 2-3 do roadmap)
**Responsavel**: TI / automacoes + Maressa Mello (validacao)
**Resolve**: RC-F04

---

## Descricao

Cada aprovacao de ticket "gestao de frota" (solicitacao de veiculo ou manutencao) deve automaticamente gerar um registro na planilha de controle de custos da frota, com os campos: data, tipo (uso/manutencao), veiculo, solicitante, aprovador, valor estimado (se informado).

**Posicao na Matriz Impacto x Esforco**: Esforco MEDIO / Impacto MEDIO

### ROI Estimado

- Rastreabilidade de 100% das manutencoes aprovadas
- Visibilidade de custo por veiculo sem lancamento manual adicional

### Riscos

- Heflo pode nao ter API publica — verificar na documentacao antes de iniciar
- Se Heflo nao tem API nem webhook, considerar substituicao do ticket por formulario Google Forms integrado ao n8n

---

## Plano de Implementacao

**Dependencia**: SOL-F04-N1 deve estar concluido (aba "Custos" como destino)

### Pre-requisitos

- [ ] Verificar documentacao API do Heflo (https://www.heflo.com/api) — existe webhook ou API de saida?
- [ ] Acesso de admin ao Heflo para configurar webhooks
- [ ] Acesso ao n8n (n8n.raizeducacao.com.br)
- [ ] Service Account Google para acessar a planilha via API
- [ ] SOL-F04-N1 concluido (aba Custos com colunas definidas)

### Semana 2 — Investigacao e Especificacao (3 dias)

1. Acessar documentacao Heflo e verificar se existe webhook para evento "ticket aprovado"
2. Se sim (caminho N2): mapear payload do webhook — quais campos retorna?
3. Se nao (caminho N3 polling): verificar API de listagem de tickets com filtro por status e data
4. Definir campos do ticket que devem ir para a planilha:
   - Numero do ticket
   - Data de abertura e data de aprovacao
   - Placa do veiculo (campo obrigatorio no ticket)
   - Tipo (uso de veiculo / manutencao)
   - Valor estimado (se preenchido)
   - Nome do solicitante
   - Nome do aprovador
5. Verificar se campos necessarios existem no formulario do ticket "gestao de frota" no Heflo
   - Se nao: solicitar ao admin do Heflo adicionar campo "Placa" como obrigatorio no formulario
6. Criar especificacao tecnica do workflow n8n

Passos adicionais (S_melhorias):
- **Se Heflo tem webhook**: configurar webhook para evento "ticket aprovado" com filtro categoria = "gestao de frota" → n8n recebe e insere linha na planilha
- **Se Heflo nao tem webhook**: configurar polling via n8n (consulta Heflo API a cada hora para tickets aprovados nao registrados)
- Criar aba "Lancamentos por ticket" na planilha de controle com esses campos
- Configurar validacao: se ticket de manutencao, criar campo para lancamento do valor real apos servico concluido

### Semana 2-3 — Desenvolvimento e Testes

1. Criar workflow n8n:
   - Trigger: webhook Heflo (ou HTTP Request polling a cada 2h)
   - Filtro: apenas tickets da categoria "gestao de frota" com status "aprovado"
   - Transformacao: mapear campos do ticket para colunas da planilha
   - Acao: append linha na aba "Custos" da planilha via Google Sheets API
   - Notificacao: enviar email para Maressa quando novo lancamento inserido
2. Testar com 5 tickets reais criados no Heflo (modo teste: inserir em aba de staging antes da aba Custos)
3. Validar com Maressa que dados inseridos estao corretos
4. Ativar para producao

Passos adicionais (S_melhorias):
- Testar com 5 tickets reais
- Comunicar ao time que o preenchimento dos campos de veiculo no ticket e obrigatorio para o controle funcionar

### Validacoes Pos-Implementacao

- [ ] Criar 3 tickets de teste no Heflo (aprovados) e confirmar que aparecem na planilha em < 10 minutos
- [ ] Verificar que campos obrigatorios (placa, tipo, data) estao preenchidos corretamente
- [ ] Confirmar que tickets rejeitados NAO aparecem na planilha
- [ ] Testar cenario de erro: o que acontece se a planilha estiver indisponivel? (n8n deve registrar erro e retentar)

### Plano de Rollback

Desativar workflow no n8n. Retornar a lancamento manual na planilha. Tickets continuam funcionando normalmente no Heflo (o workflow e aditivo, nao interfere no Heflo).

---

## KPIs de Sucesso

| KPI | Meta |
|-----|------|
| Manutencoes com lancamento de custo registrado | > 90% |

---

## Contexto no Roadmap

**Semana 2-3 — Integracoes**

**Posicao no plano geral**:

| # | Solucao | Responsavel | Timeline | Dependencias |
|---|---------|-------------|----------|-------------|
| 4 | SOL-F03: Ticket frota → planilha | TI + Maressa | Semana 2-3 | SOL-F04-N1 (aba destino) |
