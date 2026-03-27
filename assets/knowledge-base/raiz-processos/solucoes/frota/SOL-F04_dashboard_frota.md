# SOL-F04 — Dashboard de Controle de Frota (Sheets Estruturado + Mobi7)

**Processo**: Gestao de Frota — Raiz Educacao
**Nivel**: N1 (Google Sheets avancado, curto prazo) → N4 (Mobi7 full, medio prazo)
**Prioridade**: Consolidacao (N1) / Estrategico (N2)
**Timeline**: Sheets estruturado: 1 semana (Semana 1) | Mobi7 ativado: 2-4 semanas (Mes 2+)
**Responsavel**: Sarah Firmo (executa estrutura) + Maressa Mello (dono/valida dados) + Samara Santos (suporte)
**Resolve**: RC-F01

---

## Descricao

Solucao em dois niveis:

**Nivel 1 — Imediato (Sheets reestruturado)**:
Reorganizar a planilha atual para ter abas estruturadas com formulas automaticas, consolidacao por veiculo e alertas visuais (formatacao condicional para saldos baixos, vencimentos, multas abertas).

**Nivel 2 — Medio prazo (Mobi7)**:
O Mobi7 ja esta contratado (login: marcelle.gaudard@raizeducacao.com.br). Verificar quais modulos estao ativos e integrar dados do Mobi7 na planilha via exportacao periodica ou API.

**Posicao na Matriz Impacto x Esforco**: Esforco MEDIO / Impacto ALTO

### ROI Estimado

- Nivel 1: visibilidade imediata de custo por veiculo, sem custo adicional
- Nivel 2: rastreamento em tempo real ja contratado — ativar sem custo adicional

---

## Estrutura Proposta da Planilha (Nivel 1)

| Aba | Conteudo |
|-----|----------|
| Dashboard | Resumo por veiculo: saldo Sodexo, saldo ConectCar, multas abertas, custo mes corrente |
| Veiculos | Cadastro: placa, locadora, condutor designado, contrato, vencimento |
| Custos | Lancamentos mensais: aluguel, combustivel, pedagio, multas (por veiculo) |
| Multas | Registro de multas: status, condutor, valor, data prazo, data resolucao |
| Recargas | Historico de recargas Sodexo/ConectCar: data, valor, saldo resultante |
| ProRaiz | Controle especifico: data contrato, data prevista devolucao, checklist |

---

## Plano de Implementacao — Nivel 1 (Sheets)

### Pre-requisitos

- [ ] Acesso a planilha atual de controle de frota
- [ ] Lista completa dos 8 veiculos: placa, locadora, contrato, condutor designado
- [ ] Historico dos ultimos 3 meses de custos (aluguel, combustivel, pedagio, multas)

### Estrutura Detalhada das Abas

**Aba 1 — Dashboard** (unica aba de leitura):

| Campo | Fonte | Frequencia atualizacao |
|-------|-------|----------------------|
| Saldo Sodexo por veiculo | Aba Recargas (manual) | A cada recarga |
| Saldo ConectCar por veiculo | Aba Recargas (manual) | A cada recarga |
| Custo mes corrente por veiculo | Aba Custos (formula) | Automatico |
| Multas abertas | Aba Multas (formula) | A cada multa |
| Vencimentos proximos (30 dias) | Aba Veiculos (formula) | Automatico |

Formatacao condicional no Dashboard:
- Saldo < threshold → celula vermelha
- Vencimento em < 30 dias → celula amarela
- Multa status "aberta" por > 5 dias → celula laranja

**Aba 2 — Veiculos** (cadastro estatico):

| Placa | Veiculo | Locadora | Nro Contrato | Inicio Contrato | Fim Contrato | Condutor Designado | Email Condutor | CPF Condutor |
|-------|---------|----------|--------------|-----------------|-------------|-------------------|----------------|--------------|

**Aba 3 — Custos** (lancamentos mensais):

| Mes/Ano | Placa | Veiculo | Tipo (Aluguel/Combustivel/Pedagio/Multa/Manutencao) | Valor | Nro Ticket (se aplicavel) | Observacao |
|---------|-------|---------|---------------------------------------------------|-------|--------------------------|------------|

**Aba 4 — Multas** (registro e rastreio):

| Data Notificacao | Locadora | Placa | Veiculo | Condutor | Tipo Infracao | Valor | Prazo Recurso | Status | Data Assinatura Condutor | Data Envio Locadora | Data Desconto Folha |
|-----------------|---------|-------|---------|---------|--------------|-------|--------------|--------|--------------------------|---------------------|---------------------|

Status possiveis: Recebida | Condutor Identificado | Aguardando Assinatura | Enviada Locadora | Aguardando Financeiro | Concluida

**Aba 5 — Recargas** (historico Sodexo e ConectCar):

| Data | Sistema (Sodexo/ConectCar) | Placa | Veiculo | Valor Recarga | Saldo Antes | Saldo Apos | Solicitado por | Status (Solicitado/Processado) |
|------|--------------------------|-------|---------|--------------|-------------|-----------|----------------|-------------------------------|

**Aba 6 — ProRaiz** (controle especifico):

| Campo | Valor |
|-------|-------|
| Placa | |
| Locadora | |
| Numero do contrato | |
| Data inicio | |
| Data prevista devolucao | |
| Valor mensal | |
| Status checklist pre-devolucao | |
| Observacoes | |

### Plano de Execucao Nivel 1 (Dias 1-5)

**Dia 1**: Criar nova planilha Google Sheets com as 6 abas e estrutura de colunas acima
**Dia 2**: Importar dados historicos da planilha atual para as abas correspondentes
**Dia 2**: Preencher aba Veiculos com os 8 veiculos (dados do contrato com Movida/Localiza)
**Dia 3**: Configurar formulas no Dashboard (SUMIF por placa para custo mes, COUNTIF para multas abertas, MINIFS para proximos vencimentos)
**Dia 3**: Configurar formatacao condicional (regras de cor por threshold)
**Dia 4**: Validar com Maressa — percorrer cada aba e confirmar que dados fazem sentido
**Dia 4**: Definir responsabilidades: quem preenche cada aba, com qual frequencia
**Dia 5**: Sessao de treinamento (30min) com Sarah, Samara e Maressa — apresentar nova estrutura
Arquivar planilha antiga (nao deletar — manter como referencia)

### Responsabilidades por Aba

| Aba | Responsavel | Frequencia |
|-----|------------|-----------|
| Dashboard | Automatico (formulas) | — |
| Veiculos | Maressa | Quando houver mudanca |
| Custos | Samara / Sarah | Semanal |
| Multas | Sarah | A cada notificacao |
| Recargas | Sarah / Samara | A cada recarga |
| ProRaiz | Maressa | Mensal |

### Validacoes Pos-Implementacao (N1)

- [ ] Dashboard exibe todos os 8 veiculos com dados corretos
- [ ] Formatacao condicional dispara corretamente nos cenarios de teste
- [ ] Formulas de consolidacao calculam valores corretos (testar com dados conhecidos)
- [ ] Time consegue localizar informacoes de qualquer veiculo em < 30 segundos

### Plano de Rollback (N1)

Planilha antiga arquivada. Se nova planilha tiver problemas: retornar para planilha antiga enquanto corrige.

---

## Plano de Implementacao — Nivel 2 (Mobi7)

**Timeline**: Mes 2+ (apos N1-N3 estabilizados)
**Responsaveis**: TI + Maressa
**Acesso**: plataforma.mobi7.io | login: marcelle.gaudard@raizeducacao.com.br

### Escopo

1. Acessar Mobi7 (plataforma.mobi7.io) e mapear modulos ativos no contrato atual vs. modulos disponiveis
2. Verificar se Mobi7 possui relatorio de custo por veiculo ou integracao com Sodexo/ConectCar
3. Configurar exportacao periodica (semanal) de dados de uso para alimentar planilha
4. Avaliar se Mobi7 pode gerar alertas de saldo que substituam o SOL-F01 (ou complementem)
5. A longo prazo: avaliar se Mobi7 pode ser a unica fonte de verdade, substituindo a planilha

**Modulos Mobi7 a verificar**:
- Rastreamento em tempo real (N1 — ja deve estar ativo)
- Relatorios de uso por veiculo / motorista (N1 — configurar)
- Alertas de eventos (velocidade, trajeto, paradas) → pode substituir parte do controle manual
- Integrar dados do Mobi7 na planilha via exportacao periodica ou API

---

## KPIs de Sucesso

| KPI | Meta |
|-----|------|
| Custo por veiculo disponivel no dashboard em < 1 dia | Sim |
| Visibilidade custo por veiculo | Completa (dashboard) |

---

## Estimativa de Impacto

| Metrica | Antes | Depois (estimado) |
|---------|-------|-------------------|
| Visibilidade custo por veiculo | Parcial (planilha manual) | Completa (dashboard) |
| Manutencoes com custo registrado | Parcial | > 95% |

---

## Contexto no Roadmap

**Nivel 1 — Semana 1**: Estruturacao da planilha (paralela com SOL-F01 e SOL-F05)
**Nivel 2 — Mes 2+**: Ativacao modulos Mobi7 e integracao

**Posicao no plano geral**:

| # | Solucao | Responsavel | Timeline | Dependencias |
|---|---------|-------------|----------|-------------|
| 3 | SOL-F04-N1: Dashboard Sheets reestruturado | Sarah + Maressa | Semana 1 | Nenhuma (paralela) |
| 6 | SOL-F04-N2: Mobi7 integrado | TI | Mes 2+ | SOL-F04-N1 |
