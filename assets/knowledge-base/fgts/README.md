# FGTS — Base de Conhecimento

> Documentacao tecnica completa sobre o Fundo de Garantia do Tempo de Servico (FGTS),
> com foco em geracao de guias de pagamento para empresas, integracao com eSocial e TOTVS RM.

**Ultima atualizacao**: 2026-03-23
**Fontes**: Portal FGTS Digital (gov.br), CAIXA Economica Federal, Manual de Orientacao FGTS Digital v1.40, TOTVS TDN/Central de Atendimento

---

## Indice de Documentos

| Arquivo | Conteudo |
|---------|----------|
| [README.md](README.md) | Este documento — visao geral completa |
| [guia-mensal.md](guia-mensal.md) | Passo a passo geracao guia mensal (GFD) |
| [guia-rescisoria.md](guia-rescisoria.md) | Passo a passo guia rescisoria |
| [historico-pre-digital.md](historico-pre-digital.md) | Consulta e regularizacao de debitos pre-03/2024 |
| [totvs-integracao.md](totvs-integracao.md) | Configuracao TOTVS RM para FGTS Digital |

---

## 1. Visao Geral do FGTS

### O que e

O FGTS (Fundo de Garantia do Tempo de Servico) e um fundo compulsorio criado pela Lei 5.107/1966 (atual Lei 8.036/1990), que funciona como poupanca forcada para o trabalhador. O empregador deposita mensalmente um percentual sobre a remuneracao do empregado em conta vinculada na CAIXA Economica Federal.

### Base Legal

| Norma | Conteudo |
|-------|----------|
| Lei 8.036/1990 | Lei principal do FGTS |
| Lei 9.491/1997 | Conselho Curador do FGTS |
| Decreto 99.684/1990 | Regulamento do FGTS |
| Lei 13.932/2019 | Saque-Aniversario |
| Lei 14.438/2022 | FGTS Digital (base legal) |
| Decreto 11.905/2024 | Regulamenta FGTS Digital |
| IN MTE 06/2024 | Normas operacionais FGTS Digital |
| Resolucao CCFGTS 1.057/2024 | Parcelamento de debitos |

### Aliquotas

| Tipo de Contrato | Aliquota FGTS | Base de Calculo |
|------------------|---------------|-----------------|
| CLT (geral) | **8%** | Remuneracao bruta (salario + adicionais) |
| Aprendiz (Lei 10.097) | **2%** | Remuneracao bruta |
| Domestico (LC 150/2015) | **8% + 3,2%** | 3,2% = antecipacao multa rescisoria |
| Contrato Verde e Amarelo* | **2%** | *Extinto — competencias 01-04/2020 |

### Sobre o que incide

**Incide FGTS:**
- Salario base
- Horas extras
- Adicional noturno, insalubridade, periculosidade
- Comissoes e gorjetas
- 13o salario
- Aviso previo (trabalhado ou indenizado)
- Ferias gozadas + 1/3
- DSR (Descanso Semanal Remunerado)
- Gratificacoes habituais
- Licenca-maternidade (os 120/180 dias)
- Primeiros 15 dias de afastamento por doenca

**NAO incide FGTS:**
- Ferias indenizadas + 1/3
- Indenizacao por tempo de servico (art. 477, CLT)
- Ajuda de custo (transferencia, art. 470 CLT)
- Participacao nos lucros (PLR)
- Vale-transporte, vale-refeicao (PAT)
- Diarias que nao excedam 50% do salario
- Abono pecuniario de ferias (venda de 10 dias)
- Complementacao de auxilio-doenca/acidente

### FGTS Mensal vs Rescisorio

| Aspecto | Mensal | Rescisorio |
|---------|--------|------------|
| **O que e** | Deposito regular sobre remuneracao | FGTS do mes da rescisao + multa sobre saldo |
| **Quando** | Todo mes (vencimento dia 20 seguinte) | Ate 10 dias apos desligamento |
| **Quem calcula** | FGTS Digital (via eSocial) | FGTS Digital (via evento S-2299/S-2399) |
| **Multa** | Nao ha | 40% (sem justa causa) ou 20% (acordo) |
| **Lote?** | SIM — uma GFD para todos | NAO — uma guia por rescisao |
| **Pagamento** | Pix (QR Code na GFD) | Pix (QR Code na GFD Rescisoria) |

---

## 2. Evolucao dos Sistemas — Timeline

### Era SEFIP/GFIP (1999–2024)

```
EMPREGADOR                    CAIXA ECONOMICA
    |                              |
    |-- Gera GFIP no SEFIP ------>|
    |   (software desktop)         |
    |                              |
    |-- Transmite via ------------>|
    |   Conectividade Social       |
    |   (certificado ICP-Brasil)   |
    |                              |
    |-- Recebe GRF <--------------|
    |   (Guia Recolhimento FGTS)  |
    |                              |
    |-- Paga via boleto bancario ->|
    |   (qualquer banco)           |
```

**Caracteristicas:**
- Software SEFIP (desktop Windows) gerava arquivo NRA
- Transmissao via Conectividade Social (applet Java, certificado digital)
- GRF = boleto bancario convencional
- Empregador declarava e calculava os valores (auto-declaratorio)
- Prazo: ate dia 7 do mes seguinte
- Retificacoes complexas (reprocessamento GFIP)

### Transicao (2019–2024)

| Data | Evento |
|------|--------|
| 2018 | eSocial inicia implantacao (Grupo 1 — grandes empresas) |
| 2019 | Grupos 2 e 3 aderem ao eSocial |
| 01/2023 | FGTS Digital — ambiente de producao restrita (testes) |
| 03/2024 | **FGTS Digital entra em vigor** para empresas privadas |
| 01/2025 | FGTS Digital para setor publico e organismos internacionais |
| 07/2025 | Modulo de parcelamento de debitos no FGTS Digital |

### Era FGTS Digital (2024+)

```
EMPREGADOR          eSocial              FGTS DIGITAL
    |                  |                      |
    |-- S-1200 ------->| (remuneracao)        |
    |-- S-1299 ------->| (fechamento folha)   |
    |                  |                      |
    |                  |-- Dados remuneracao ->|
    |                  |                      |
    |                  |   FGTS Digital CALCULA|
    |                  |   valores devidos     |
    |                  |                      |
    |-- Acessa portal -|--------------------->|
    |   gov.br                                |
    |                                         |
    |-- Gera GFD <----------------------------|
    |   (Guia FGTS Digital)                   |
    |                                         |
    |-- Paga via Pix (QR Code) -------------->|
```

**O que mudou:**
- eSocial e a **fonte unica** de dados (nao mais auto-declaratorio)
- FGTS Digital **calcula** os valores (empregador nao calcula mais)
- Pagamento **exclusivamente via Pix** (boleto descontinuado)
- Prazo mudou: ate dia **20** do mes seguinte (antes era dia 7)
- Guia = **GFD** (Guia FGTS Digital), nao mais GRF
- Portal web (gov.br), nao mais software desktop
- Certificado digital **nao obrigatorio** (login gov.br nivel prata/ouro)
- Retificacoes via eSocial (reenviar evento) — recalculo automatico

**O que ainda usa SEFIP:**
- Debitos de competencias **anteriores a 03/2024**
- Reclamatorias trabalhistas
- Empregadores que nao migraram para eSocial (raros)
- Recolhimento recursais (depositos judiciais FGTS)

---

## 3. Guia Mensal (GFD) — Resumo

> Detalhes completos em [guia-mensal.md](guia-mensal.md)

### Fluxo Simplificado

```
1. Processar folha de pagamento
2. Enviar S-1200 (remuneracao) ao eSocial
3. Enviar S-1299 (fechamento) ao eSocial
4. Aguardar retorno S-5003 (totalizador FGTS por trabalhador)
5. Acessar FGTS Digital (fgtsdigital.sistema.gov.br)
6. Gerar GFD (Guia Rapida ou Parametrizada)
7. Pagar via Pix (QR Code impresso na guia)
```

### Prazos

| Competencia | Vencimento | Observacao |
|-------------|------------|------------|
| Mensal (03/2024+) | Dia 20 do mes seguinte | Se cair em feriado/fim de semana: antecipa |
| 13o salario | 20/01 do ano seguinte | Sobre a parcela de dezembro |
| Mensal (pre-03/2024) | Dia 7 do mes seguinte | Via SEFIP/GRF |

### Operacao em Lote

**SIM** — A guia mensal pode (e deve) ser gerada em lote:
- Uma unica GFD pode conter **todos os funcionarios** da empresa
- Filtros disponiveis: CNPJ raiz, filial, lotacao, categoria
- Guia Rapida: consolida tudo automaticamente
- Guia Parametrizada: permite personalizar escopo

---

## 4. Guia Rescisoria — Resumo

> Detalhes completos em [guia-rescisoria.md](guia-rescisoria.md)

### Fluxo Simplificado

```
1. Processar rescisao no sistema de folha
2. Enviar S-2299 (desligamento CLT) ou S-2399 (domestico) ao eSocial
3. eSocial retorna S-5003 com valores FGTS da rescisao
4. FGTS Digital gera automaticamente a guia rescisoria
5. Acessar FGTS Digital → Gestao de Guias → Rescisoria
6. Gerar GFD Rescisoria
7. Pagar via Pix ate 10 dias corridos apos desligamento
```

### Componentes da Guia Rescisoria

| Componente | Descricao | Obrigatorio |
|------------|-----------|-------------|
| FGTS do mes da rescisao | 8% sobre remuneracao proporcional | Sempre |
| FGTS sobre 13o proporcional | 8% sobre 13o proporcional | Sempre |
| FGTS sobre aviso previo indenizado | 8% sobre API | Se aplicavel |
| Multa rescisoria 40% | Sobre **saldo total** da conta FGTS | Sem justa causa |
| Multa rescisoria 20% | Sobre **saldo total** da conta FGTS | Acordo (art. 484-A CLT) |

### NAO pode ser em lote

Cada rescisao gera **sua propria guia individual**, pois:
- Vinculada ao evento eSocial especifico (S-2299/S-2399)
- Multa calculada sobre saldo individual do trabalhador
- Data de vencimento individual (10 dias apos desligamento)
- Base de calculo diferente para cada caso (tipo de rescisao)

---

## 5. Consulta de Valores em Aberto

### 5.1 Debitos pos-03/2024 (FGTS Digital)

**Acesso:** https://fgtsdigital.sistema.gov.br → Login gov.br (prata/ouro)

**Menu:** Gestao de Guias → Consultar Guias

**Filtros disponiveis:**
- Competencia (inicial e final)
- CNPJ (14 posicoes — por filial)
- Tipo de debito (mensal, rescisorio, misto)
- Status (pago, em aberto, vencido)

**Guia Parametrizada para debitos:**
1. Menu Gestao de Guias → Emitir Guia → Parametrizada
2. Tipo de Debito: Mensal e/ou Rescisoria
3. Referencia Inicial/Final: periodo desejado
4. Empresa: selecionar CNPJ
5. Sistema mostra debitos em aberto com encargos atualizados
6. Gerar guia para pagamento

**Parcelamento (disponivel desde 07/2025):**
- Maximo **60 parcelas**
- Debitos de competencias a partir de 03/2024
- Acesso: FGTS Digital → Parcelamento
- Entrada minima: 1/60 do debito total
- Parcelas pagas via Pix
- **Restricoes iniciais:** nao disponivel para MEI, domesticos, segurados especiais sem CNO, parte da administracao publica

### 5.2 Debitos pre-03/2024 (Era SEFIP)

> Detalhes completos em [historico-pre-digital.md](historico-pre-digital.md)

**Conectividade Social ICP V2:** https://conectividadesocialv2.caixa.gov.br
- Requer certificado digital ICP-Brasil (e-CNPJ ou e-CPF com procuracao)
- Consulta extrato analitico por trabalhador
- Consulta debitos por competencia

**Regularizacao:**
1. Gerar GFIP retroativa no SEFIP (software desktop)
2. Transmitir via Conectividade Social
3. Gerar GRF (boleto) para pagamento
4. Pagar em qualquer agencia bancaria

**Parcelamento pre-03/2024:**
- Diretamente com CAIXA Economica Federal
- Agencia com gerencia empresarial FGTS
- Documentacao: CNPJ, contrato social, documentos dos socios, GFIP das competencias

### 5.3 Certificado de Regularidade — CRF

O **CRF** (Certificado de Regularidade do FGTS) atesta que a empresa esta em dia com obrigacoes FGTS.

**Consulta:** https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf

**Necessario para:**
- Participar de licitacoes publicas
- Obter financiamentos com recursos do FGTS
- Transferencia de sede
- Registro/arquivamento de atos na Junta Comercial
- Concessao de incentivos fiscais

**Validade:** 30 dias

**Causas de irregularidade:**
- Competencias sem recolhimento
- Diferenca entre declarado (eSocial/GFIP) e depositado
- Notificacoes/autos de infracao pendentes
- Parcelamento em atraso

---

## 6. Operacoes em Lote vs Individual

| Operacao | Lote? | Sistema | Observacao |
|----------|-------|---------|------------|
| Guia mensal (folha) | **SIM** | FGTS Digital | Uma GFD para todos os funcionarios |
| Guia rescisoria | **NAO** | FGTS Digital | Uma por desligamento (evento eSocial) |
| Consulta extrato empregador | **SIM** | FGTS Digital | Consolidado por CNPJ |
| Consulta extrato por trabalhador | Individual | FGTS Digital | Um por CPF |
| Parcelamento | Individual | FGTS Digital | Por debito/competencia |
| CRF (Certidao Regularidade) | **SIM** | CAIXA/FGTS Digital | Por CNPJ |
| Retificacao de valores | Individual | eSocial → FGTS Digital | Reenviar evento corrigido |
| Debitos pre-03/2024 | Individual | SEFIP/Conectividade Social | GFIP retroativa |
| Compensacao/deducao | **SIM** | FGTS Digital | Aplicavel na GFD mensal |
| Pedido de restituicao | Individual | FGTS Digital | Por competencia/trabalhador |

### Detalhamento do que pode ser lote

**Guia mensal em lote:**
- Todos os funcionarios ativos em uma unica GFD
- Todas as filiais (CNPJ raiz) em uma unica GFD
- Multiplas competencias em aberto em uma unica GFD
- Personalizar via Guia Parametrizada (filtrar por filial, lotacao, etc.)

**Guia rescisoria — por que NAO pode ser lote:**
- Cada rescisao tem **data de desligamento diferente**
- Multa rescisoria calculada sobre **saldo individual** (historico completo do trabalhador)
- Prazo de pagamento **individual** (10 dias a partir de cada desligamento)
- Evento eSocial (S-2299) e **por trabalhador**
- Excecao: se houver **rescisao coletiva** no mesmo dia, tecnicamente cada uma ainda gera guia individual, mas o FGTS Digital permite gerar multiplas guias na mesma sessao

---

## 7. Integracao com TOTVS RM

> Detalhes completos em [totvs-integracao.md](totvs-integracao.md)

### Eventos eSocial gerados pelo TOTVS RM FOP

| Evento | Descricao | Impacto no FGTS |
|--------|-----------|-----------------|
| S-1200 | Remuneracao do trabalhador | Base de calculo do FGTS mensal |
| S-1210 | Pagamentos de rendimentos | Informativo |
| S-1280 | Informacoes complementares | Ajuste base FGTS |
| S-1299 | Fechamento de eventos periodicos | Dispara calculo no FGTS Digital |
| S-2200 | Cadastramento inicial / admissao | Vinculo para FGTS |
| S-2299 | Desligamento | Dispara guia rescisoria |
| S-5003 | **Retorno** — Totalizador FGTS por trabalhador | Valores calculados pelo gov |

### Fluxo TOTVS RM → FGTS Digital

```
TOTVS RM (FOP)         Middleware eSocial        FGTS Digital
    |                       |                        |
    |-- Processa folha     |                        |
    |-- Gera S-1200 ------>|                        |
    |-- Gera S-1299 ------>|                        |
    |                       |-- Transmite eSocial -->|
    |                       |                        |
    |                       |<-- S-5003 (retorno) ---|
    |<-- Recebe S-5003 ----|                        |
    |                       |                        |
    |-- Relatorio FGTS     |                        |
    |   (conferencia)      |                        |
```

### Relatorio de Conferencia FGTS (tag dpsFGTS do S-5003)

O TOTVS RM permite comparar:
- Valores calculados pelo sistema de folha (RM FOP)
- Valores retornados pelo governo (evento S-5003)
- Divergencias que precisam ser corrigidas (reenviar eventos)

---

## 8. Penalidades e Compliance

### Multa por Atraso no Recolhimento

| Dias de atraso | Encargo |
|----------------|---------|
| Ate 1 dia | 0,0333% ao dia (pro rata) |
| Ate 30 dias | 5% sobre o valor devido |
| 31-60 dias | 10% |
| 61-90 dias | 15% |
| Acima de 90 dias | 20% |
| Juros de mora | Taxa SELIC acumulada (mensal) |
| Correcao monetaria | TR (Taxa Referencial) |

### Multa por Ausencia de Declaracao

Se o empregador nao enviar os eventos ao eSocial (S-1200/S-1299):
- Multa de R$ 600,00 por evento nao transmitido (pessoa juridica)
- Pode ser cumulativa por competencia e por trabalhador
- Alem da impossibilidade de emitir CRF

### Implicacoes no CRF

**CRF irregular impede:**
- Participacao em licitacoes (Lei 8.666/93 e Lei 14.133/21)
- Obtencao de financiamentos com recursos FGTS
- Registro na Junta Comercial (alteracoes contratuais)
- Certidao Negativa de Debitos Trabalhistas (CNDT) — bloqueio indireto
- Incentivos fiscais e regimes especiais

### Fiscalizacao

Com o FGTS Digital, a fiscalizacao tornou-se **automatizada**:
- Cruzamento automatico eSocial x depositos
- Notificacao automatica de diferenca
- Auto de infracao pode ser gerado sem fiscalizacao presencial
- Auditoria de Trabalho tem acesso direto aos dados do FGTS Digital

---

## 9. Glossario

| Sigla | Significado |
|-------|-------------|
| FGTS | Fundo de Garantia do Tempo de Servico |
| GFD | Guia FGTS Digital (substitui GRF) |
| GRF | Guia de Recolhimento do FGTS (sistema antigo) |
| GFIP | Guia de Recolhimento do FGTS e Informacoes a Previdencia Social |
| SEFIP | Sistema Empresa de Recolhimento do FGTS e Informacoes a Previdencia Social |
| CRF | Certificado de Regularidade do FGTS |
| eSocial | Sistema de Escrituracao Digital das Obrigacoes Fiscais, Previdenciarias e Trabalhistas |
| S-1200 | Evento eSocial — Remuneracao do trabalhador |
| S-1299 | Evento eSocial — Fechamento de eventos periodicos |
| S-2299 | Evento eSocial — Desligamento (CLT) |
| S-2399 | Evento eSocial — Desligamento (domestico/TSVE) |
| S-5003 | Evento eSocial — Retorno: totalizador FGTS por trabalhador |
| CNO | Cadastro Nacional de Obras |
| ICP-Brasil | Infraestrutura de Chaves Publicas Brasileira |
| TR | Taxa Referencial |
| SELIC | Sistema Especial de Liquidacao e Custodia |
| CCFGTS | Conselho Curador do FGTS |
| MTE | Ministerio do Trabalho e Emprego |

---

## 10. Links Uteis

### Portais Oficiais
- **FGTS Digital**: https://fgtsdigital.sistema.gov.br
- **Portal FGTS CAIXA**: https://www.fgts.gov.br
- **eSocial**: https://www.gov.br/esocial
- **Consulta CRF**: https://consulta-crf.caixa.gov.br
- **Conectividade Social ICP V2**: https://conectividadesocialv2.caixa.gov.br

### Documentacao Tecnica
- **Manual FGTS Digital v1.40**: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/manual-e-documentacao-tecnica
- **FAQ FGTS Digital CAIXA**: https://www.fgts.gov.br/Paginas/downloads/FAQ
- **Cartilha Empregador**: https://www.fgts.gov.br/Paginas/downloads/cartilhas
- **Perguntas Frequentes MTE**: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/perguntas-frequentes

### TOTVS
- **FGTS Digital — Espaco Legislacao**: https://espacolegislacao.totvs.com/fgts-digital/
- **Central de Atendimento — FGTS Digital**: https://centraldeatendimento.totvs.com/hc/pt-br/articles/5898581694103
- **TDN — Relatorio Conferencia FGTS**: https://tdn.totvs.com/pages/releaseview.action?pageId=536720973
- **TDN — Painel Conferencia FGTS**: https://tdn.totvs.com/pages/releaseview.action?pageId=528452163

### Legislacao
- **Lei 8.036/1990** (FGTS): http://www.planalto.gov.br/ccivil_03/leis/l8036.htm
- **Lei 14.438/2022** (FGTS Digital): http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14438.htm
- **Decreto 11.905/2024**: https://www.planalto.gov.br/ccivil_03/_Ato2023-2026/2024/Decreto/D11905.htm

---

## Notas de Implementacao

### Para sistemas de folha de pagamento

1. **Eventos eSocial sao a base de tudo** — sem S-1200/S-1299 corretos, FGTS Digital nao calcula
2. **Conferir S-5003 obrigatoriamente** — comparar valores do sistema vs retorno do governo
3. **Retificacao = reenviar evento** — corrigir rubrica no sistema e reenviar S-1200
4. **Multa rescisoria depende do saldo historico** — nao apenas do mes da rescisao
5. **Pix e o unico meio de pagamento** — integracoes de pagamento devem suportar QR Code Pix

### Para automacao

O FGTS Digital **nao possui API publica** para integracao direta. O fluxo e:
1. Integrar com eSocial (que tem API/webservice: https://www.gov.br/esocial/pt-br/documentacao-tecnica)
2. FGTS Digital calcula automaticamente com base nos eventos eSocial
3. Geracao da GFD e pagamento sao feitos manualmente no portal ou via sistemas ERP integrados (TOTVS, SAP, etc.)

### Pontos de atencao

- **Dia 20 = deadline rigido** — nao ha prorrogacao automatica (exceto decreto especifico)
- **Pix expira** — o QR Code da GFD tem validade (geralmente 24-48h), regerar se necessario
- **Multa rescisoria sobre SALDO, nao sobre ultimo deposito** — considerar todo o historico
- **Competencias mistas** — uma GFD pode ter debitos mensais + rescisorio (Guia Mista)
- **Setor publico desde 01/2025** — regras similares mas com particularidades (RPPS, regime estatutario)
