# SOL-F05 — Processo Formal de Devolucao ProRaiz com Alerta de Prazo

**Processo**: Gestao de Frota — Raiz Educacao
**Nivel**: N1 (configuracao de alerta + checklist documentado)
**Prioridade**: Quick Win
**Timeline**: 2-3 dias uteis
**Responsavel**: Maressa Mello (dono do processo) + Sarah Firmo (executa)
**Resolve**: RC-F05

---

## Descricao

Criar processo formal para a devolucao do veiculo ProRaiz em maio/2026, incluindo: alerta de prazo, checklist pre-devolucao e comunicacao com a locadora.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto MEDIO — Quick Win

### ROI Estimado

Evita custo de 1+ mes de aluguel desnecessario (estimativa: R$3.000-R$6.000/mes por veiculo de locacao) por devolucao atrasada.

---

## Plano de Implementacao

### Pre-requisitos

- [ ] Identificar qual locadora e o veiculo ProRaiz (verificar planilha atual — provavelmente Movida ou Localiza)
- [ ] Confirmar data exata do vencimento do contrato com a locadora (prazo real, nao estimativa)
- [ ] Acesso ao Google Calendar corporativo

### Dia 2 — Mapeamento

1. Acessar planilha atual de controle de frota — localizar linha do veiculo ProRaiz
2. Identificar: placa, locadora, numero do contrato, data de inicio, data prevista de termino
3. Contatar locadora para confirmar data exata e condicoes de devolucao (multa por atraso? inspecao obrigatoria?)
4. Registrar informacoes na aba "ProRaiz" da planilha (criar aba se nao existir)

### Dia 3 — Alertas e Checklist

1. Criar eventos recorrentes no Google Calendar (calendario compartilhado da frota):
   - Evento: "ProRaiz — Revisar condicoes" → 60 dias antes da devolucao
   - Evento: "ProRaiz — Confirmar logistica devolucao com locadora" → 30 dias antes
   - Evento: "ProRaiz — Checklist pre-devolucao" → 15 dias antes
   - Evento: "ProRaiz — Confirmar data/hora com locadora" → 7 dias antes
   - Evento: "ProRaiz — DEVOLUCAO" → dia da devolucao
2. Convidar para todos os eventos: Maressa, Sarah, e o diretor responsavel pelo ProRaiz
3. Criar e salvar o checklist de devolucao no documento de referencia

### Checklist Pre-Devolucao ProRaiz (executar D-15)

- [ ] Vistoria visual completa do veiculo — fotos de todas as faces (frente, traseira, laterais, interior)
- [ ] Verificar presenca: CRLV, manual do veiculo, chave reserva, macaco e triangulo
- [ ] Verificar quilometragem: esta dentro do limite mensal contratado?
- [ ] Verificar nivel de combustivel conforme contrato (cheio? nivel livre?)
- [ ] Verificar presenca de acessorios originais (tapetes, protetor de porta-malas)
- [ ] Verificar eventuais avarias e avaliar necessidade de reparo antes da devolucao
- [ ] Cancelar tag ConectCar associada ao veiculo (ou transferir para outro)
- [ ] Cancelar cartao Sodexo associado ao veiculo (ou transferir saldo)
- [ ] Comunicar Mobi7 para desativar rastreador (se instalado)
- [ ] Solicitar protocolo de devolucao da locadora (comprovante)

4. Registrar checklist na aba "ProRaiz" da planilha (SOL-F04 Nivel 1)
5. Comunicar por email ao diretor responsavel: prazo de devolucao e proximas etapas

### Validacoes Pos-Implementacao

- [ ] Todos os 5 eventos criados no calendario e confirmados pelos participantes
- [ ] Checklist salvo em local acessivel ao time (pasta Google Drive da frota)
- [ ] Data exata confirmada com a locadora (nao apenas estimativa)
- [ ] Aba "ProRaiz" na planilha preenchida com dados do contrato

### Plano de Rollback

Nao aplicavel — processo documental. Se data mudar: atualizar eventos no calendario.

---

## Aba ProRaiz na Planilha (Estrutura)

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

---

## KPIs de Sucesso

| KPI | Meta |
|-----|------|
| Checklist ProRaiz criado e compartilhado | Sim |
| Risco custo residual ProRaiz | Controlado (alertas 60/30/15/7 dias) |

---

## Estimativa de Impacto

| Metrica | Antes | Depois (estimado) |
|---------|-------|-------------------|
| Risco custo residual ProRaiz | Sem monitoramento | Controlado (alertas 60/30/15/7 dias) |

---

## Contexto no Roadmap

**Semana 1 — Quick Wins (Dias 2-3)**, em paralelo com SOL-F01

**Posicao no plano geral**:

| # | Solucao | Responsavel | Timeline | Dependencias |
|---|---------|-------------|----------|-------------|
| 2 | SOL-F05: Processo devolucao ProRaiz | Maressa + Sarah | Dias 2-3 | Nenhuma |
