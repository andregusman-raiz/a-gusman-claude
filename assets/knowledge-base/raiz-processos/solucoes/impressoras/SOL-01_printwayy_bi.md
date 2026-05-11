# SOL-01 — Integrar Printwayy ao BI de Gestao

**Processo**: Gestao de Impressoras (Locadas e Proprias) — Raiz Educacao
**Nivel**: N2 (integracao nativa entre sistemas)
**Prioridade**: Quick Win
**Timeline**: 1 semana (configuracao) + 2 semanas (validacao) | Prazo: 30/abr/2026
**Responsavel**: Kevin (execucao tecnica) + Maressa (validacao) | Apoio: Time Operacoes
**Resolve**: CR-02

---

## Descricao

Ativar exportacao de dados do Printwayy (volume de impressao por equipamento/escola, alertas de consumivel, tempo de inatividade) para o BI. Criar dashboard consolidado por regiao/fornecedor.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto CRITICO — Quick Win prioritario

**Importancia estrategica**: SOL-01 desbloqueia SOL-06 (avaliacao custo Sul) e SOL-07 (migracao RICOH). Sem dados de volume, nao e possivel dimensionar o contrato RICOH nem calcular TCO.

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-01 (Printwayy→BI) | CR-02 | Visibilidade total da frota | Abr/2026 |

**Impacto financeiro potencial**: Reducao de custo insumos proprias estimavel apos SOL-01 e SOL-04 (baseline necessario).

### Riscos

- Printwayy pode nao ter API publica — verificar documentacao ou CSV export
- Dados historicos podem estar incompletos nos primeiros meses

---

## Plano de Implementacao

### Pre-requisitos

- Acesso de administrador ao Printwayy
- BI definido (Power BI, Looker Studio ou planilha Google como MVP)
- Lista de todas as escolas com equipamentos no Printwayy

### Plano Detalhado

| Dia | Atividade | Responsavel |
|-----|-----------|-------------|
| Dia 1 | Verificar opcoes de export Printwayy: API REST, webhook ou CSV agendado | Kevin |
| Dia 2-3 | Mapear campos necessarios: escola, equipamento, impressoes/mes, toner %, alertas, status | Kevin + Maressa |
| Dia 4-7 | Configurar pipeline de dados: Printwayy → planilha/BI (MVP: Google Sheets atualizado semanalmente) | Kevin |
| Dia 8-10 | Criar 3 visoes no BI: frota por regiao / custo estimado por equipamento / SLA por fornecedor | Kevin |
| Dia 11-14 | Validar com Maressa: dados corretos, visoes uteis, escolas cobertas | Maressa |
| Dia 15 | Go-live e documentar como relatorio mensal padrao | Kevin + Maressa |

Passos adicionais (S_melhorias):
1. Mapear exports disponiveis no Printwayy (API ou CSV agendado)
2. Definir campos necessarios: impressoes/mes, toner %, alertas, modelo, escola, fornecedor
3. Conectar ao BI (Power BI ou planilha consolidada como MVP)
4. Criar 3 visoes: (a) frota por regiao, (b) custo por equipamento, (c) SLA fornecedor
5. Validar com Maressa durante 2 semanas
6. Formalizar como relatorio mensal do time

### Checklist de Validacao Pos-Go-Live

- [ ] Dashboard atualiza automaticamente (minimo 1x/semana)
- [ ] 100% das escolas com Printwayy visivel no dashboard
- [ ] Campos disponiveis: volume de impressao, nivel de toner, status, escola, fornecedor
- [ ] Maressa consegue gerar relatorio mensal em < 10 minutos sem ajuda tecnica
- [ ] Dados de All In, Multimidia e Reprocopia separados por regiao

### Plano de Rollback

Nao aplicavel (adicao de visibilidade, nao alteracao de processo existente). Se dashboard ficar incorreto, desativar acesso e corrigir antes de reativar.

---

## Metricas de Sucesso

- Dashboard atualizado automaticamente (minimo semanal)
- Dados de volume disponiveis para 100% das escolas com Printwayy
- Primeiro relatorio mensal gerado ate 30/abr/2026

---

## Dependencias Entre Solucoes

```
SOL-01 (Printwayy→BI)
  → SOL-06 depende de SOL-01 (dados de volume Sul)
  → SOL-07 depende de SOL-01 (dados de volume RJ para proposta RICOH)

SOL-01 e SOL-02 sao independentes entre si — podem ser executados em paralelo.
```

---

## Contexto no Roadmap

**Imediato — Abril/2026 (Semanas 1-3)**

```
Abr/2026    Mai/2026    Jun/2026    Jul/2026    ...
SOL-01 >>>
```
