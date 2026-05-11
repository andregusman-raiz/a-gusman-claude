# SOL-06 — MID para Substituicao de Plataforma OnFly (Condicional)

**Processo**: Viagens & Mobilidade (OnFly + Uber)
**Nivel**: N4 — Substituicao de solucao de mercado
**Prioridade**: Estrategico — ativado SOMENTE se gate CR5 = incompativel
**Timeline**: 60-90 dias (processo completo de MID)
**Responsavel**: Maressa + Diretoria + TI (avaliacao tecnica)
**Resolve**: CR5 (renovacao contratual OnFly incompativel com budget ou requisitos funcionais — especialmente automacao de aprovacao e integracao ZIV)
**Condicional**: Sim — ativado SOMENTE se renovacao OnFly for incompativel

---

## Descricao

Se a proposta de renovacao do OnFly for incompativel com o budget ou com os requisitos funcionais, iniciar processo de Market Intelligence Document (MID) para selecao de nova plataforma de gestao de viagens corporativas.

**Criterios de avaliacao para nova plataforma** (todos obrigatorios):
1. Workflow de aprovacao por faixa de valor configuravel
2. API REST documentada e publica para integracao com ZIV/Ticket Raiz
3. Modelo de faturamento pos-uso ou por fatura (nao adiantamento) — evitar recorrencia de CR2
4. Cobertura nacional: voos, hoteis, aluguel de veiculos
5. Suporte a multiplos perfis: Solicitante e Gerente de Viagem
6. Politica de hospedagem configuravel por cidade (RJ/SP R$300; demais R$250)
7. Custo dentro do budget aprovado

**Alternativas de mercado a avaliar**: Maxmilhas for Business, Omni, Worc Travel, Neles, TravelPort, Rexpense

**Acoes (passos do MID)**:
1. Definir criterios de avaliacao e pesos junto com Maressa e financeiro
2. Levantar alternativas de mercado (3-4 plataformas pre-selecionadas)
3. Solicitar demos e propostas comerciais
4. Matriz de avaliacao comparativa (funcionalidade + custo + suporte + API)
5. Apresentar recomendacao para aprovacao da diretoria
6. Negociar migracao com plataforma escolhida (incluindo historico de viagens)
7. Plano de transicao: periodo de paralelo obrigatorio (30 dias com 20% dos usuarios)
8. Migracao completa e desligamento do OnFly

**KPIs de sucesso**:
- MID concluido em ate 45 dias apos decisao de substituir
- Nova plataforma operacional sem interrupcao do servico de reservas
- Todos os requisitos obrigatorios atendidos

**Riscos**:
- Migracao pode gerar periodo de instabilidade operacional (mitigacao: periodo de paralelo obrigatorio)
- Curva de aprendizado do time com nova plataforma (mitigacao: treinamento formal incluso na proposta)

---

## Plano de Implementacao

**Nivel**: N4 | **Timeline**: 60-90 dias | **Resolve**: CR5

### Gatilho de Ativacao

Esta solucao e ativada SOMENTE se a proposta de renovacao do OnFly for incompativel com budget OU se a plataforma nao suportar os requisitos funcionais obrigatorios (workflow de aprovacao configuravel + API para integracao ZIV).

### Responsaveis

- Lider: Maressa
- Aprovacao: Diretoria
- Avaliacao tecnica: TI

### Criterios Obrigatorios para Nova Plataforma

1. Workflow de aprovacao por faixa de valor configuravel
2. API REST documentada e publica para integracao com ZIV
3. Modelo de faturamento pos-uso ou por fatura (nao adiantamento)
4. Cobertura: voos nacionais, hospedagem, aluguel de veiculo (R$201/dia de teto)
5. Suporte a perfis diferenciados: Solicitante e Gerente de Viagem
6. Politica de hospedagem configuravel por cidade (RJ/SP R$300; demais R$250)
7. Custo dentro do budget aprovado

### Plano de Acao

| Semana | Atividade |
|--------|-----------|
| Semana 1 | Definir criterios de avaliacao, pesos e budget maximo junto com Maressa e financeiro |
| Semana 1-2 | Identificar alternativas: Maxmilhas for Business, Omni, Worc Travel, Neles, TravelPort, Rexpense |
| Semana 2-3 | Solicitar demos e propostas comerciais para 3-4 plataformas pre-selecionadas |
| Semana 3-4 | Preencher matriz de avaliacao comparativa (funcionalidade + custo + suporte + API) |
| Semana 4 | Apresentar recomendacao para aprovacao da diretoria |
| Semana 5 | Negociar contrato com plataforma escolhida (incluir SLA de migracao e treinamento) |
| Semana 6-8 | Periodo de paralelo: nova plataforma em piloto com 20% dos usuarios; OnFly continua ativo |
| Semana 8-10 | Migracao completa; desligamento do OnFly |

### Validacoes Pos-Implementacao

- [ ] 100% dos criterios obrigatorios atendidos pela plataforma escolhida
- [ ] Migracao sem interrupcao do servico de reservas
- [ ] Time treinado e operacional na nova plataforma
- [ ] Todos os dados historicos migrados ou exportados

### Plano de Contingencia

Se nenhuma alternativa atender todos os criterios obrigatorios dentro do budget: negociar com OnFly versao com os requisitos necessarios como condicao da renovacao.

### KPIs de Acompanhamento

| KPI | Baseline | Meta MID | Meta pos-migracao |
|-----|---------|----------|-------------------|
| Criterios obrigatorios atendidos | 0/7 (OnFly) | Plataforma escolhida atende 7/7 | 7/7 |
| Interrupcao do servico de reservas | N/A | 0 dias | 0 dias |
| Time treinado na nova plataforma | N/A | N/A | 100% |
