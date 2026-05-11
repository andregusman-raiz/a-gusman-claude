# M3 — Calendario Estruturado de Renovacoes e Ciclos (SOP)

**Processo**: real_estate
**Nivel**: N1
**Prioridade**: Quick Win
**Timeline**: 2-3 dias
**Responsavel**: Erika Souza
**Resolve**: P3 (contratos), P5 (cantinas)

---

## Descricao

- **Problema resolvido**: P3 (contratos), P5 (cantinas)
- **Gap de origem**: Ausencia de SOP com datas e gatilhos para processos ciclicos

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Quick Win + Mudanca de Politica |
| **Problema(s)** | P3, P5 |
| **Impacto** | 3/5 |
| **Esforco** | 1/5 |
| **Dono sugerido** | Erika Souza |
| **Timeline** | 2-3 dias |

**Descricao (o que fazer)**:

1. Criar aba "Calendario Operacional" na planilha DADOS IMOVEIS (ou planilha dedicada).
2. Mapear todos os eventos ciclicos anuais com datas fixas:
   - Jan-Mar: levantamento de contratos a vencer no ano
   - Maio: interface com Comercial (precificacao cantinas)
   - Jun: inicio pesquisa satisfacao cantinas
   - Jul: consolidacao pesquisa cantinas
   - Ago: inicio renovacao de seguros (meta: renovar antes de set)
   - Set: reunioes de decisao de cantinas
   - Out: renovacao anual seguros (deadline)
   - Nov: decisao/notificacao cantinas (deadline)
   - Rolling: D-120, D-90, D-60, D-30 antes de cada vencimento de contrato
3. Adicionar Apps Script que envia digest semanal toda segunda-feira com eventos da semana e proximas 4 semanas.
4. Documentar como SOP de 1 pagina: "Calendario Real Estate — ciclos anuais e gatilhos de acao".
5. Revisar o calendario em janeiro de cada ano.

**KPI de sucesso**:
- Metrica: zero acoes iniciadas fora do prazo ideal (descoberta tardia)
- Baseline atual: processos ciclicos sem calendario formal
- Meta: 100% dos processos ciclicos iniciados na janela correta
- Como medir: registro de data de inicio vs data ideal no SOP

**Riscos e mitigacao**:

| Risco | Probabilidade | Mitigacao |
|-------|-------------|-----------|
| Digest semanal ignorado | Media | Manter alerts pontuais adicionalmente (M1) |
| Calendario desatualizado apos rotatividade de pessoal | Media | Revisao anual obrigatoria registrada no proprio calendario |

**Dependencias**: Pode ser feito em paralelo com M1 (Apps Script) — reutilizar a mesma infraestrutura

---

## Plano de Implementacao

### Visao Geral (IMP-3 — Melhorias M3 + M6 combinadas)

- **Solucao**: Aba "CALENDARIO" no GSheets + digest semanal via Apps Script
- **Nivel**: N1
- **Sistema(s)**: Google Sheets + Apps Script
- **Esforco estimado**: 3-4 horas
- **Responsavel sugerido**: Erika Souza (conteudo) + Daniel Souza (script)

### Passo 1: Criar aba CALENDARIO

**Estrutura**: DATA | TIPO | DESCRICAO | RESPONSAVEL | STATUS | PRIORIDADE

**Eventos fixos do ciclo anual**:

| Data | Tipo | Descricao | Responsavel |
|------|------|-----------|-------------|
| 15/jan | Renovacao | Levantamento contratos a vencer no ano | Erika |
| 01/mai | Cantinas | Alinhamento com Comercial — precificacao integral | Erika |
| 01/jun | Cantinas | Inicio pesquisa satisfacao cantinas | Erika/Daniel |
| 31/jul | Cantinas | Prazo consolidacao pesquisa satisfacao | Erika |
| 01/ago | Seguros | INICIO renovacao de seguros (meta: concluir antes de set) | Erika |
| 01/set | Cantinas | Agendar reunioes de decisao com gestores | Erika |
| 30/set | Seguros | Deadline renovacao de seguros | Erika |
| 31/out | Seguros | Deadline absoluto renovacao anual | Erika |
| 30/nov | Cantinas | Decisao final + notificacao eventuais mudancas | Erika |
| 01/dez | IPTU | Inicio mapeamento IPTU proximo ano | Daniel |

**ALERTA ESPECIAL para 2026**: Em agosto/26, seguros devem ser renovados com vigencia ABR/26 → ABR/27 (verificar se ja foram renovados corretamente antes desta data).

### Passo 2: Digest semanal (Apps Script)

Funcao `digestSemanal()` roda toda segunda-feira 07:00. Le a aba CALENDARIO e envia email com:
- Eventos urgentes (proximos 7 dias)
- Eventos proximos (8 a 30 dias)

Nao envia email se nao ha eventos na janela.

**Trigger**: Semanal > Segunda-feira > 07:00-08:00

### Rollback

Deletar o trigger. Aba CALENDARIO permanece como referencia mesmo sem automacao.

### Posicao no Cronograma

| Semana | Implementacao | Responsavel | Dependencia |
|--------|--------------|-------------|-------------|
| 1 (dias 3-5) | IMP-3: calendario anual + ciclo cantinas | Erika + Daniel | Nenhuma |
