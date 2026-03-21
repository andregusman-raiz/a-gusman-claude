# M9 — Dashboard Consolidado GSheets (View Unica)

**Processo**: real_estate
**Nivel**: N1
**Prioridade**: Quick Win
**Timeline**: 1 semana
**Responsavel**: Daniel Souza
**Resolve**: P1, P3, P4, P5, P7 (visibilidade geral do portfolio)

---

## Descricao

- **Problema resolvido**: Visibilidade geral do portfolio
- **Gap de origem**: Informacoes fragmentadas em 5 planilhas distintas

| Campo | Detalhe |
|-------|---------|
| **Tipo** | Quick Win |
| **Problema(s)** | P1, P3, P4, P5, P7 (visibilidade geral) |
| **Impacto** | 3/5 |
| **Esforco** | 2/5 |
| **Dono sugerido** | Daniel Souza |
| **Timeline** | 1 semana |

**Descricao (o que fazer)**:

1. Criar planilha "REAL ESTATE — PAINEL EXECUTIVO" com abas: Seguros, Contratos, IPTU, Cantinas, Overdue.
2. Cada aba puxa dados das planilhas originais via IMPORTRANGE (sem duplicar dados).
3. Aba "HOJE": view consolidada com alertas do dia — o que vence nos proximos 30/60/90 dias em todos os domínios.
4. Formatacao condicional: verde (ok), amarelo (alerta D-60), vermelho (alerta D-30 ou vencido).
5. Compartilhar com gerencia: acesso leitura para visibilidade executiva sem expor planilhas operacionais.

**KPI de sucesso**:
- Metrica: tempo para responder "qual o status do imovel X?" em reuniao de gestao
- Baseline atual: precisa abrir 3-5 planilhas
- Meta: resposta em < 30 segundos via painel unico
- Como medir: feedback qualitativo do time nas proximas 4 semanas

**Dependencias**: M1 (alertas configurados) deve ser feito antes para que o painel reflita os alertas

---

## Plano de Implementacao

### Visao Geral (IMP-9)

- **Solucao**: Planilha "PAINEL EXECUTIVO — REAL ESTATE" com IMPORTRANGE
- **Nivel**: N1
- **Sistema(s)**: Google Sheets
- **Esforco estimado**: 4-6 horas
- **Responsavel sugerido**: Daniel Souza

### Passo a Passo

1. Criar nova planilha: "PAINEL EXECUTIVO — REAL ESTATE"
2. Criar abas: HOJE | SEGUROS | CONTRATOS | IPTU | CANTINAS | OVERDUE
3. Em cada aba (exceto HOJE): usar IMPORTRANGE para puxar dados da planilha original
   ```
   =IMPORTRANGE("URL_PLANILHA_ORIGEM", "NomeAba!A:Z")
   ```
   Na primeira vez: clicar em "Permitir acesso"
4. Aba HOJE: usar QUERY + IMPORTRANGE para mostrar apenas registros com alertas ativos (diasRestantes <= 30 ou status vencido)
5. Formatacao condicional em todas as abas:
   - Verde: diasRestantes > 60 ou STATUS = "Em dia"
   - Amarelo: diasRestantes 31-60
   - Vermelho: diasRestantes <= 30 ou STATUS = "Vencido"
6. Compartilhar com gerencia: permissao de visualizacao apenas

**Verificacao**: Abrir o painel e confirmar que dados de pelo menos 2 planilhas originais aparecem corretamente

### Checklist de Go-Live

- [ ] Aba SEGUROS mostrando dados de DADOS IMOVEIS
- [ ] Aba CONTRATOS mostrando dados de CONTRATOS ATIVOS
- [ ] Aba IPTU mostrando dados de SITUACAO GERAL IPTU
- [ ] Aba CANTINAS mostrando dados de overdue de cantinas
- [ ] Aba OVERDUE mostrando dados de OVERDUE SUBLOCACAO E CANTINAS
- [ ] Aba HOJE mostrando apenas registros com vencimento em <= 30 dias
- [ ] Formatacao condicional aplicada em todas as abas
- [ ] Acesso de leitura compartilhado com gerencia

### Posicao no Cronograma

| Semana | Implementacao | Responsavel | Dependencia |
|--------|--------------|-------------|-------------|
| 3-4 | IMP-9: dashboard consolidado | Daniel | IMP-1 (M1) |
