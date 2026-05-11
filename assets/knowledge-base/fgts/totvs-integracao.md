# Integracao TOTVS RM com FGTS Digital

> Configuracao e operacao do TOTVS RM (FOP/Folha de Pagamento) para geracao de eventos
> eSocial que alimentam o FGTS Digital.

**Ultima atualizacao**: 2026-03-23
**Sistema**: TOTVS RM (Linha RM) — modulo FOP (Folha de Pagamento)
**Fontes**: Central de Atendimento TOTVS, TDN (TOTVS Developer Network), Espaco Legislacao TOTVS

---

## Visao Geral da Integracao

O TOTVS RM **nao integra diretamente** com o FGTS Digital. A integracao e **indireta**, via eSocial:

```
TOTVS RM (FOP)        Middleware eSocial       eSocial (Gov)       FGTS Digital
    |                       |                      |                    |
    |-- Processa folha     |                      |                    |
    |                       |                      |                    |
    |-- Gera eventos ------>|                      |                    |
    |   S-1200, S-1299      |                      |                    |
    |   S-2299, etc.        |                      |                    |
    |                       |-- Transmite -------->|                    |
    |                       |                      |                    |
    |                       |                      |-- Alimenta ------>|
    |                       |                      |   (automatico)     |
    |                       |                      |                    |
    |                       |<-- Retorno S-5003 ---|                    |
    |<-- Recebe S-5003 ----|                      |                    |
    |                       |                      |                    |
    |-- Conferencia FGTS   |                      |                    |
    |   (Relatorio)        |                      |                    |
```

---

## Eventos eSocial Relevantes para FGTS

### Eventos gerados pelo TOTVS RM FOP

| Evento | Nome | Impacto FGTS | Periodicidade |
|--------|------|-------------|---------------|
| S-1200 | Remuneracao do trabalhador | **Base de calculo FGTS mensal** | Mensal |
| S-1202 | Remuneracao servidor RPPS | Base FGTS (se servidor com FGTS) | Mensal |
| S-1210 | Pagamentos de rendimentos | Informativo (nao gera FGTS) | Mensal |
| S-1260 | Comercializacao producao rural PF | Base FGTS especifica | Mensal |
| S-1270 | Contratacao trabalhadores avulsos | Base FGTS avulsos | Mensal |
| S-1280 | Info complementares (desoneradas) | Ajuste base FGTS | Mensal |
| S-1298 | Reabertura eventos periodicos | Permite retificacao | Eventual |
| S-1299 | **Fechamento eventos periodicos** | **Dispara calculo FGTS Digital** | Mensal |
| S-2190 | Registro preliminar | Cadastro previo | Admissao |
| S-2200 | Admissao / cadastramento inicial | Cria vinculo FGTS | Admissao |
| S-2206 | Alteracao contrato de trabalho | Atualiza contrato | Eventual |
| S-2299 | **Desligamento** | **Dispara guia rescisoria** | Rescisao |
| S-2399 | Desligamento — TSVE | Dispara guia rescisoria | Rescisao |

### Eventos de retorno (recebidos pelo RM)

| Evento | Nome | Conteudo |
|--------|------|----------|
| S-5001 | Totalizador contribuicao previdenciaria | Base previdencia (informativo) |
| S-5002 | Totalizador IRRF | Base IRRF (informativo) |
| **S-5003** | **Totalizador FGTS por trabalhador** | **Valores FGTS calculados pelo governo** |
| S-5011 | Totalizador contribuicoes sociais | Consolidado previdencia |
| S-5013 | Totalizador FGTS consolidado | Consolidado FGTS por empregador |

---

## Configuracao do TOTVS RM para FGTS

### 1. Parametrizador eSocial

**Acesso:** RM → Configuracoes → Parametrizador → eSocial

#### Aba "Integracao com Middleware"

| Parametro | Descricao | Valor recomendado |
|-----------|-----------|-------------------|
| URL API Middleware | Endereco do middleware eSocial | Conforme ambiente (prod/homolog) |
| APP Middleware | Codigo do aplicativo | Conforme licenca |
| Certificado digital | Caminho do certificado A1 | Arquivo .pfx da empresa |
| Senha certificado | Senha do certificado | Cadastrada no parametrizador |
| Ambiente | Producao ou producao restrita | 1-Producao (apos homologacao) |

#### Aba "FGTS" (ou "Rescisao")

| Parametro | Descricao | Opcoes |
|-----------|-----------|--------|
| Base calculo multa rescisoria | CNPJ Raiz ou CNO | **CNPJ Raiz** (padrao geral) |
| Considera aviso previo indenizado | Incluir API na base FGTS | SIM |
| Tipo calculo 13o FGTS | Mensal ou anual | Conforme pratica da empresa |
| Codigo incidencia FGTS | Tabela 21 eSocial | Verificar por rubrica |

### 2. Tabela de Rubricas

A tabela de rubricas e **critica** para o calculo correto do FGTS. Cada rubrica deve ter a incidencia FGTS corretamente configurada.

**Acesso:** RM → Administracao de Pessoal → Tabelas → Eventos (Rubricas)

#### Incidencias FGTS (Tabela 21 eSocial)

| Codigo | Descricao | Exemplo de Rubrica |
|--------|-----------|-------------------|
| 11 | Base de calculo FGTS | Salario, horas extras, adicionais |
| 12 | Base FGTS — 13o salario | 13o salario (parcelas) |
| 21 | Incidencia suspensa por decisao judicial | Liminar |
| 91 | Sem incidencia FGTS | VT, VR, PLR |

**Erros comuns em rubricas:**
- Rubrica de hora extra sem incidencia FGTS (codigo 11) → FGTS menor que o devido
- Rubrica de PLR com incidencia FGTS → FGTS maior que o devido
- 13o salario com incidencia errada (deve ser 12, nao 11)
- Rubrica informativa cadastrada como tributada

### 3. Configuracao do Middleware eSocial

O Middleware eSocial e o componente que faz a ponte entre o TOTVS RM e o portal eSocial do governo.

**Acesso:** RM → eSocial → Configuracao Middleware

| Configuracao | Descricao |
|-------------|-----------|
| Grupo de eventos | Definir quais eventos transmitir |
| Ordem de envio | Eventos de tabela antes de periodicos |
| Retry automatico | Configurar reenvio em caso de falha |
| Log de transmissao | Habilitar para auditoria |

### 4. Lotacoes e Estabelecimentos

Para que o FGTS Digital reconheca corretamente as filiais:

**Acesso:** RM → Administracao de Pessoal → Tabelas → Lotacoes

| Campo | Descricao | Impacto FGTS |
|-------|-----------|-------------|
| Tipo lotacao | Estabelecimento, obra, etc. | Define agrupamento na GFD |
| CNPJ | CNPJ 14 digitos | Identificacao na guia |
| CNO | Cadastro Nacional de Obras | Para construcao civil |
| CAEPF | Atividade economica PF | Para empregador PF |

---

## Relatorio de Conferencia de FGTS

### O que e

O Relatorio de Conferencia de FGTS compara:
- **Valores calculados pelo RM** (sistema de folha)
- **Valores retornados pelo governo** (evento S-5003, tag `dpsFGTS`)

### Acesso

```
RM → eSocial → Relatorios → Conferencia de FGTS
```

Ou via TDN: https://tdn.totvs.com/pages/releaseview.action?pageId=536720973

### Campos do Relatorio

| Campo | Fonte | Descricao |
|-------|-------|-----------|
| Base FGTS (sistema) | RM FOP | Soma das rubricas com incidencia FGTS |
| Base FGTS (governo) | S-5003 | Base calculada pelo eSocial |
| Valor FGTS devido (sistema) | RM FOP | 8% (ou 2%) x base sistema |
| Valor FGTS devido (governo) | S-5003 | Valor calculado pelo FGTS Digital |
| Diferenca | Calculo | Sistema - Governo |
| Status | Automatico | OK / Divergente |

### Como Interpretar Divergencias

| Situacao | Causa Provavel | Acao |
|----------|---------------|------|
| Sistema > Governo | Rubrica com incidencia no RM mas sem no eSocial | Verificar tabela de rubricas. Alinhar incidencias. |
| Sistema < Governo | Rubrica sem incidencia no RM mas com no eSocial | Verificar cadastro da rubrica na tabela 21. |
| Diferenca centavos | Arredondamento | Geralmente aceitavel. Monitorar. |
| Trabalhador ausente no S-5003 | S-1200 rejeitado | Verificar eSocial → Gestao de Eventos. Reenviar. |
| Competencia inteira divergente | S-1299 nao enviado | Enviar fechamento para disparar calculo. |

### Acoes de Correcao

1. **Corrigir rubrica no RM** (se a incidencia esta errada no sistema)
   - RM → Tabelas → Eventos → Alterar incidencia FGTS
   - Reprocessar folha da competencia afetada
   - Regerar S-1200 para os trabalhadores afetados

2. **Retificar evento no eSocial** (se o evento foi enviado com erro)
   - RM → eSocial → Gestao de Eventos → Selecionar S-1200
   - Retificar → Regerar XML → Retransmitir
   - Aguardar novo S-5003

3. **Excluir e reenviar** (casos graves)
   - Reabrir periodo: enviar S-1298 (reabertura)
   - Excluir S-1200 errado
   - Gerar novo S-1200 corrigido
   - Fechar novamente: enviar S-1299

---

## Painel de Conferencia FGTS (TOTVS Automacao Fiscal)

Alem do relatorio no RM, o **TOTVS Automacao Fiscal (TAF)** oferece um painel visual:

**Acesso TDN:** https://tdn.totvs.com/pages/releaseview.action?pageId=528452163

| Funcionalidade | Descricao |
|----------------|-----------|
| Dashboard visual | Grafico de conferencia sistema vs governo |
| Drill-down | Clicar em divergencia para ver detalhes por trabalhador |
| Exportacao | Exportar para Excel/CSV |
| Filtros | Por competencia, filial, categoria |
| Alertas | Notificacao de divergencias acima de threshold |

---

## Lancamento Financeiro da GFD

Apos gerar a GFD no FGTS Digital, o TOTVS RM permite registrar o lancamento financeiro:

### Fluxo

```
FGTS Digital (gera GFD) → RM Financeiro (lanca provisao) → Pagamento (Pix)
                                                            → Baixa no RM
```

### Contabilizacao

| Debito | Credito | Evento |
|--------|---------|--------|
| Despesa com FGTS (resultado) | FGTS a recolher (passivo) | Provisao mensal |
| FGTS a recolher (passivo) | Banco c/c (ativo) | Pagamento da GFD |
| Despesa multa FGTS (resultado) | FGTS multa a recolher (passivo) | Provisao rescisoria |
| FGTS multa a recolher (passivo) | Banco c/c (ativo) | Pagamento GFD rescisoria |

---

## Rescisao no TOTVS RM — Fluxo FGTS

### Passo a Passo

1. **Processar rescisao no RM:**
   - RM → Administracao de Pessoal → Funcionarios → Rescisao
   - Informar data desligamento, motivo (codigo tabela 19)
   - Sistema calcula verbas rescisorias automaticamente

2. **Gerar evento S-2299:**
   - RM → eSocial → Gerar Eventos → S-2299 (Desligamento)
   - Verificar XML gerado (conferir rubricas e valores)
   - Transmitir via Middleware

3. **Receber retorno S-5003:**
   - Middleware recebe retorno do eSocial
   - Valores FGTS calculados pelo governo
   - Conferir no Relatorio de Conferencia FGTS

4. **Emitir guia rescisoria no FGTS Digital:**
   - Acessar portal FGTS Digital (gov.br)
   - Menu Gestao de Guias → Rescisoria
   - Gerar GFD Rescisoria → Pagar via Pix

5. **Lancar financeiro no RM:**
   - Lancamento a pagar (FGTS deposito + multa)
   - Baixar apos pagamento

### Configuracao da Multa Rescisoria

| Opcao | Quando usar |
|-------|-------------|
| CNPJ Raiz | Empresas em geral (padrao) |
| CNO | Empresas de construcao civil com obras registradas |

**Acesso:** RM → Parametrizador → eSocial → Rescisao → Base calculo multa FGTS

> **NOTA**: A multa e calculada pelo FGTS Digital com base no saldo da conta vinculada na CAIXA. O RM calcula uma **estimativa** para o TRCT, mas o valor **oficial** e o do FGTS Digital.

---

## Troubleshooting — Problemas Comuns

### S-1200 rejeitado pelo eSocial

| Erro | Causa | Solucao |
|------|-------|---------|
| "Rubrica nao encontrada" | Rubrica nao cadastrada na tabela S-1010 | Enviar S-1010 (tabela de rubricas) antes |
| "Trabalhador nao cadastrado" | S-2200 nao enviado/aceito | Verificar admissao no eSocial |
| "Competencia ja fechada" | S-1299 ja transmitido | Reabrir com S-1298, corrigir, fechar novamente |
| "Valor invalido" | Remuneracao com formato incorreto | Verificar decimais (2 casas, sem R$) |

### Divergencia S-5003 vs RM

| Divergencia | Acao |
|-------------|------|
| < 1% do valor total | Aceitavel (arredondamento). Monitorar. |
| 1-5% | Verificar rubricas especificas. Provavel incidencia errada. |
| > 5% | Revisar TODA a tabela de rubricas. Pode haver erro sistematico. |
| Trabalhador faltando | S-1200 rejeitado. Verificar eSocial. |
| Competencia inteira zerada | S-1299 nao enviado. Verificar middleware. |

### FGTS Digital nao mostra valores

| Situacao | Causa | Solucao |
|----------|-------|---------|
| Nenhum debito listado | S-1299 nao transmitido | Verificar status no middleware. Retransmitir. |
| Valores zerados | S-1200 com rubricas sem incidencia FGTS | Corrigir rubricas. Reenviar S-1200. |
| "Empregador nao encontrado" | Empresa nao cadastrada no eSocial | Enviar S-1000 (informacoes empregador). |
| Rescisoria nao aparece | S-2299 rejeitado ou pendente | Verificar status S-2299 no middleware. |

---

## Referencias TOTVS

| Recurso | URL |
|---------|-----|
| Central Atendimento — FGTS Digital | https://centraldeatendimento.totvs.com/hc/pt-br/articles/5898581694103 |
| TDN — Relatorio Conferencia FGTS | https://tdn.totvs.com/pages/releaseview.action?pageId=536720973 |
| TDN — Painel Conferencia FGTS | https://tdn.totvs.com/pages/releaseview.action?pageId=528452163 |
| TDN — Novidades eSocial Linha RM | https://tdn.totvs.com/display/public/LRM/Novidades+eSocial+-+Linha+RM |
| Espaco Legislacao — FGTS Digital | https://espacolegislacao.totvs.com/fgts-digital/ |
| Central — Geracao S-1200/S-1210 | https://centraldeatendimento.totvs.com/hc/pt-br/articles/360015349532 |
