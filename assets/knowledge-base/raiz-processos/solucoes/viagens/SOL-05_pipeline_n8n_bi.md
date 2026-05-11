# SOL-05 — Pipeline n8n para Extracao Automatica de Dados para BI

**Processo**: Viagens & Mobilidade (OnFly + Uber)
**Nivel**: N3 — Orquestracao via middleware (n8n)
**Prioridade**: Medio prazo — independente de CR5
**Timeline**: 3-5 semanas
**Responsavel**: TI (+ Maressa para validacao de requisitos de dados)
**Resolve**: CR3 (fragmentacao de plataformas — OnFly, OnRuby, BirdFly, Uber sem consolidacao; extracao manual mensal de 2-4 HH)
**Condicional**: Nao — pode iniciar independentemente

---

## Descricao

Criar pipeline automatizado no n8n que:
1. Conecta nas APIs das plataformas: OnFly, OnRuby, BirdFly, Uber Corporativo
2. Extrai dados de uso, custos e viagens realizadas em periodicidade configuravel (diaria ou semanal)
3. Consolida e transforma os dados em formato padrao
4. Alimenta o BI corporativo automaticamente

**Acoes**:
1. Mapear APIs disponiveis de cada plataforma (OnFly, OnRuby, BirdFly, Uber) — verificar documentacao ou contatar suporte
2. Definir schema de dados consolidado (quais campos, quais metricas, granularidade)
3. Configurar nodes de extracao no n8n para cada plataforma
4. Implementar transformacao e limpeza de dados (normalizar moedas, datas, IDs de colaboradores)
5. Configurar node de envio para o BI (endpoint, formato)
6. Testar com dados reais de 1 mes
7. Configurar schedule: execucao diaria ou semanal
8. Configurar alertas de falha no n8n (email para Maressa se pipeline falhar)

**KPIs de sucesso**:
- Dados de viagens disponiveis no BI com defasagem maxima de 24h (vs 30+ dias atual)
- Zero horas de extracao manual mensal
- Taxa de sucesso do pipeline >99% ao mes

**Riscos**:
- Plataformas SaaS podem nao ter API publica (mitigacao: verificar antes; fallback para scraping via browser automation se necessario)
- Mudancas de API podem quebrar o pipeline (mitigacao: monitoramento de alertas + versionamento do workflow n8n)

---

## Plano de Implementacao

**Nivel**: N3 | **Timeline**: 3-5 semanas | **Resolve**: CR3

### Responsaveis

- Principal: TI (desenvolvimento do pipeline n8n)
- Apoio: Maressa (validacao de requisitos de dados)

### Plataformas Alvo

- OnFly (viagens aereas, hospedagem, aluguel)
- OnRuby (verificar escopo exato com Maressa)
- BirdFly (verificar escopo exato com Maressa)
- Uber Corporativa (corridas da conta corporativa)

### Plano de Acao

| Semana | Atividade |
|--------|-----------|
| Semana 1 | Reuniao com Maressa: quais metricas o BI precisa? (custo por area, custo por colaborador, custo por tipo de viagem, SLA de antecedencia, etc.) |
| Semana 1 | Verificar APIs disponiveis de cada plataforma; documentar endpoints, autenticacao, rate limits |
| Semana 1 | Definir schema de dados consolidado: campos, formatos, granularidade (por viagem ou por periodo) |
| Semana 2 | Criar e testar node de extracao no n8n para cada plataforma individualmente |
| Semana 2 | Implementar transformacao e normalizacao de dados (moedas, datas, IDs de colaboradores vs CNPJ) |
| Semana 3 | Configurar node de envio para o BI (verificar endpoint/formato aceito pelo BI atual) |
| Semana 3 | Testar pipeline completo com dados de 1 mes real |
| Semana 4 | Configurar schedule: execucao diaria as 6h |
| Semana 4 | Configurar alertas de falha: email para Maressa e TI se qualquer node falhar |
| Semana 5 | Monitorar por 2 semanas; ajustar se necessario |

### Validacoes Pos-Implementacao

- [ ] Dados de todas as plataformas disponiveis no BI com defasagem maxima de 24h
- [ ] Taxa de sucesso do pipeline >99% na primeira quinzena
- [ ] Schema de dados validado por Maressa: campos corretos, granularidade adequada
- [ ] Alertas de falha testados e funcionando
- [ ] Zero HH de extracao manual apos ativacao

### Plano de Rollback

**Condicao**: Pipeline gerando dados incorretos no BI
**Acao**: Desativar schedule; TI corrige no n8n; Maressa faz extracao manual no intervalo
**Responsavel**: TI
**Tempo**: 1-4 horas para desativar; correcao conforme diagnostico

### KPIs de Acompanhamento

| KPI | Baseline | Meta 30 dias | Meta 90 dias |
|-----|---------|--------------|--------------|
| Defasagem de dados no BI de viagens | 30+ dias | 30+ dias (pipeline em build) | <24h |
| HH de extracao manual por mes | ~3h | ~3h (transicao) | 0h |
| Taxa de sucesso do pipeline | N/A | N/A | >99% |
