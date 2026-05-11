# SOL-F02 — Automatizar Fluxo de Multas via n8n

**Processo**: Gestao de Frota — Raiz Educacao
**Nivel**: N3 (orquestracao via n8n)
**Prioridade**: Consolidacao
**Timeline**: 2-3 semanas (Semana 3-5 do roadmap)
**Responsavel**: TI / automacoes (desenvolve) + Maressa Mello (valida fluxo) + Sarah Firmo (testa)
**Resolve**: RC-F02

---

## Descricao

Criar um workflow n8n que automatize as etapas manualmente executadas hoje no processo de multas, reduzindo o tempo de resolucao e garantindo rastreio de status em cada etapa.

**Posicao na Matriz Impacto x Esforco**: Esforco MEDIO / Impacto ALTO

### Fluxo Atual (Manual)

```
Email da locadora → time le → busca placa em planilha → identifica condutor
→ contato manual → assinatura fisica → envio para locadora → acionamento financeiro
```

### Fluxo Proposto (n8n)

```
Email da locadora → n8n detecta (trigger: email com palavra "infracao"/"multa")
→ extrai placa do email → consulta planilha de condutores (Google Sheets via API)
→ cria tarefa no sistema de tickets com: placa, condutor, valor, prazo
→ envia email automatico ao condutor com link para assinar digitalmente (DocuSign ou similar)
→ monitora prazo: se nao assinado em 48h → lembrete automatico
→ apos assinatura: notifica financeiro (email estruturado) + atualiza planilha de controle
→ notifica Maressa quando processo concluido
```

### ROI Estimado

- Reducao de tempo por multa: de ~3-5 dias para < 24h
- Eliminacao de risco de prazo de recurso perdido
- Rastreio completo de status (audit trail)

### Riscos

- Emails de locadora podem ter formato variavel — parser precisa ser robusto
- Assinatura digital: verificar se locadoras aceitam assinatura digital no lugar da fisica
- Se locadora exige assinatura fisica: digitalizar apenas o rastreio de status, manter assinatura fisica

---

## Plano de Implementacao

### Pre-requisitos

- [ ] Acesso ao n8n (n8n.raizeducacao.com.br)
- [ ] Acesso a caixa gestao.utilidades@raizeducacao.com.br no n8n (configurar como trigger)
- [ ] Aba Veiculos da planilha preenchida com: placa → condutor → email → CPF (depende de SOL-F04-N1)
- [ ] Aba Multas da planilha criada (SOL-F04-N1)
- [ ] Definir se locadoras aceitam assinatura digital (verificar com Movida e Localiza)
- [ ] Se assinatura digital aceita: avaliar Google Forms + PDF gerado, DocuSign, ou Clicksign

**Dependencia**: SOL-F04-N1 deve estar concluido (aba Multas como destino e fonte de dados de condutores)

### Semana 3 — Mapeamento e Especificacao (3 dias)

1. Analisar os ultimos 5 emails de multa recebidos das locadoras (Movida e Localiza):
   - Qual o formato? (corpo do email, PDF anexo, portal online)
   - Quais campos aparecem? (placa, data infracao, tipo infracao, valor, prazo de indicacao do condutor)
   - Ha padrao de assunto? (ex: "Notificacao de Infracao — Movida")
2. Verificar com Movida e Localiza se aceitam:
   - Assinatura digital no documento de indicacao de condutor
   - Envio digital do termo de desconto em folha
3. Definir ferramenta de assinatura digital (se aceita): Clicksign (mercado brasileiro, mais barato), DocuSign, ou PDF assinado via Google Forms com upload
4. Desenhar fluxo final do workflow n8n (diagrama)

Passos adicionais de especificacao (S_melhorias):
- Mapear todos os tipos de notificacao de multa recebidos das locadoras (Movida, Localiza) — formato de email, campos disponiveis
- Criar tabela de condutores por placa na planilha de controle (se nao existir): placa | veiculo | condutor atual | email | CPF

### Semana 4 — Desenvolvimento

1. Configurar trigger n8n: Gmail trigger monitorando caixa gestao.utilidades@raizeducacao.com.br
   - Filtro: assunto contem "infracao" OR "multa" OR "penalidade" OR "notificacao de transito"
   - Frequencia: verificar a cada 15 minutos
2. Node de extracao de dados: usar expressoes regulares para extrair placa do email
   - Testar regex com os 5 emails analisados no passo anterior
3. Node de consulta na planilha: Google Sheets Read — busca placa na aba Veiculos → retorna dados do condutor
4. Node de criacao de registro: Google Sheets Append — insere linha na aba Multas com status "Recebida"
5. Node de notificacao ao condutor: Email para o condutor com:
   - Informacoes da infracao (placa, data, tipo, valor)
   - Link para assinar documento (se assinatura digital) OU instrucoes para assinatura fisica
   - Prazo para assinatura (ex: 48h)
   - Em copia: Maressa
6. Node de lembrete automatico: If status = "Recebida" por mais de 48h → enviar lembrete ao condutor + alerta para Maressa
7. Node pos-assinatura (webhook da ferramenta de assinatura): atualizar status na aba Multas para "Assinada"
8. Node de notificacao ao financeiro: email estruturado com: nome do condutor, CPF, valor, competencia, numero do ticket de desconto em folha

### Semana 5 — Testes e Ativacao

1. Testar workflow completo com email de multa simulado (criar email de teste com dados reais de uma multa antiga)
2. Verificar que todos os campos sao extraidos corretamente
3. Verificar que condutor recebe email correto com informacoes corretas
4. Testar lembrete automatico (alterar tempo de espera para 5 minutos no teste)
5. Testar notificacao ao financeiro
6. Executar 2-3 multas reais em paralelo (manual + automatico) para validacao
7. Ativar oficialmente e comunicar ao time

Passos adicionais (S_melhorias):
- Configurar notificacao ao financeiro com campos estruturados (nome, CPF, valor, competencia)
- Implementar log de status em aba da planilha: data recebimento | placa | condutor | status | data assinatura | data envio financeiro
- Testar com 2-3 multas reais em paralelo ao fluxo manual (validar antes de substituir)
- Ativar e descontinuar fluxo manual apos 2 semanas de operacao estavel

### Validacoes Pos-Implementacao

- [ ] Workflow processa email de multa em < 15 minutos apos recebimento
- [ ] Condutor correto recebe notificacao (testar com placa conhecida)
- [ ] Registro aparece na aba Multas com status correto
- [ ] Lembrete e enviado se nao houver resposta em 48h
- [ ] Financeiro recebe email estruturado com todos os campos necessarios
- [ ] Maressa recebe notificacao de conclusao do processo

### Plano de Rollback

Desativar trigger no n8n. Retornar ao fluxo manual de multas (nao ha alteracao no processo da locadora — o n8n apenas automatiza o lado interno). Todas as multas registradas na planilha permanecem.

---

## KPIs de Sucesso

| KPI | Meta |
|-----|------|
| Tempo medio de resolucao de multa | < 48h (vs. 3-5 dias hoje) |
| Multas com rastreio de status completo | > 95% |

---

## Estimativa de Impacto

| Metrica | Antes | Depois (estimado) |
|---------|-------|-------------------|
| Tempo resolucao de multa | 3-5 dias | < 24h |

---

## Contexto no Roadmap

**Semana 3-5 — Automacao** (apos SOL-F04-N1 concluido)

**Posicao no plano geral**:

| # | Solucao | Responsavel | Timeline | Dependencias |
|---|---------|-------------|----------|-------------|
| 5 | SOL-F02: Fluxo de multas automatizado (n8n) | TI + Maressa | Semana 3-5 | SOL-F04-N1 (aba multas) |
