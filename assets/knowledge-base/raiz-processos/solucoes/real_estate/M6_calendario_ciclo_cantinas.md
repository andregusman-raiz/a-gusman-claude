# M6 — Calendario Formal do Ciclo de Cantinas

**Processo**: real_estate
**Nivel**: N1
**Prioridade**: Quick Win
**Timeline**: 2 dias
**Responsavel**: Erika Souza
**Resolve**: P5 (ciclo cantinas sem estrutura)

---

## Descricao

- **Problema resolvido**: P5 (ciclo cantinas sem estrutura)
- **Gap de origem**: Processo dependente de iniciativa sem gatilho

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Quick Win |
| **Problema(s)** | P5 |
| **Impacto** | 3/5 |
| **Esforco** | 1/5 |
| **Dono sugerido** | Erika Souza |
| **Timeline** | 2 dias |

**Descricao (o que fazer)**:

1. Criar aba "Ciclo Cantinas AAAA" na planilha de controle com as fases, responsaveis e prazos de cada etapa (Jun-Nov).
2. Documentar modelos A e B de contrato com campos criticos: valor/aluno, ajustes SAP (agua/energia +2%, gas +100%), clausulas de rescisao.
3. Configurar alerta Apps Script:
   - 1 junho: "Iniciar pesquisa satisfacao cantinas"
   - 1 agosto: "Consolidar pesquisa — prazo: 31 agosto"
   - 1 setembro: "Agendar reunioes de decisao"
   - 1 outubro: "Decisao final deve estar tomada — prazo: 30 novembro"
   - 1 maio: "Alinhar com Comercial sobre precificacao integral"
4. Incluir checklist de interface com Comercial: item de pauta em reuniao de maio.
5. Registrar resultado de cada ciclo para historico (quais unidades mudaram, por que, resultado).

**KPI de sucesso**:
- Metrica: ciclo iniciado na data prevista (junho) e decisao tomada ate novembro
- Baseline atual: sem calendario formal
- Meta: 100% das etapas cumpridas no prazo em 2026
- Como medir: aba de ciclo com datas reais vs planejadas

**Dependencias**: Pode ser desenvolvido junto com M3 (mesmo Apps Script)

---

## Plano de Implementacao

### Visao Geral (IMP-3 — M3 + M6 combinadas)

M6 e implementado em conjunto com M3 (Calendario Estruturado de Renovacoes) dentro do mesmo IMP-3.

- **Solucao**: Aba "CALENDARIO" no GSheets + alertas pontuais para ciclo Jun-Nov
- **Nivel**: N1
- **Sistema(s)**: Google Sheets + Apps Script
- **Esforco estimado**: Incluido nas 3-4 horas do IMP-3
- **Responsavel sugerido**: Erika Souza (conteudo) + Daniel Souza (script)

### Aba do Ciclo de Cantinas

**Estrutura**: FASE | DATA_INICIO | DATA_FIM | RESPONSAVEL | STATUS | OBSERVACOES

**Fases do ciclo anual**:

| Fase | Data inicio | Data fim | Responsavel |
|------|------------|---------|-------------|
| Alinhamento Comercial (precificacao integral) | 01/mai | 31/mai | Erika + Comercial |
| Pesquisa de satisfacao | 01/jun | 21/jul | Erika/Daniel |
| Consolidacao pesquisa | 22/jul | 05/ago | Erika |
| Reunioes com escolas e cantineiros | 01/ago | 30/set | Erika |
| Decisao e notificacao | 01/out | 30/nov | Erika + Marcelle |

**Modelos de contrato a documentar**:
- Modelo A Receber: valor/aluno, data de vencimento mensal, clausula de ajuste anual
- Modelo A Pagar (SAP): valor base + agua/energia +2% + gas +100% consumo
- Clausulas de rescisao: prazo minimo de aviso (30 dias)

### Alertas Pontuais (Apps Script)

Integrar ao mesmo script do M3 (digestSemanal). Alertas adicionais especificos para cantinas:
- 1 maio: "Alinhamento Cantinas x Comercial — agendar reuniao"
- 1 junho: "INICIAR pesquisa de satisfacao de cantinas"
- 31 julho: "Prazo de resposta da pesquisa — consolidar resultados"
- 1 setembro: "Agendar reunioes com escolas e cantineiros"
- 30 novembro: "DEADLINE decisao e notificacao de cantinas"

### Historico por Ciclo

Ao final de cada ciclo (dezembro), registrar:
- Quais unidades mantiveram cantineiro
- Quais mudaram e por que (resultado da pesquisa)
- Reajuste de valor/aluno negociado
- Pendencias para o proximo ciclo

### Rollback

Deletar os alertas especificos. Aba de ciclo permanece como referencia.

### Posicao no Cronograma

| Semana | Implementacao | Responsavel | Dependencia |
|--------|--------------|-------------|-------------|
| 1 (dias 3-5) | IMP-3: calendario anual + ciclo cantinas (M6 incluido) | Erika + Daniel | Nenhuma |
