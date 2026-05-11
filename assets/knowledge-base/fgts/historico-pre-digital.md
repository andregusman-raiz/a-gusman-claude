# Debitos Pre-FGTS Digital — Consulta e Regularizacao

> Como consultar e regularizar debitos de FGTS de competencias anteriores a marco/2024,
> quando o sistema SEFIP/GFIP era obrigatorio.

**Ultima atualizacao**: 2026-03-23
**Sistemas**: SEFIP, Conectividade Social ICP V2, CAIXA Economica Federal
**Fonte**: Portal CAIXA FGTS Empresas, FAQ FGTS Digital v7

---

## Contexto

O FGTS Digital entrou em operacao em **marco/2024** para empresas privadas. Debitos de competencias **anteriores a 03/2024** NAO estao no FGTS Digital e devem ser consultados/regularizados pelos sistemas legados:

| Periodo | Sistema | Pagamento |
|---------|---------|-----------|
| Antes de 03/2024 | SEFIP + Conectividade Social | Boleto bancario (GRF) |
| 03/2024 em diante | FGTS Digital | Pix (GFD) |
| Reclamatorias trabalhistas (qualquer periodo) | SEFIP | Boleto bancario (GRF) |

---

## 1. Conectividade Social ICP V2 — Consulta de Extrato

### Acesso

```
URL: https://conectividadesocialv2.caixa.gov.br
Certificado: ICP-Brasil (e-CNPJ ou e-CPF com procuracao)
Navegador: Chrome ou Firefox (com plugin de certificado digital)
```

### Pre-requisitos

| Item | Detalhe |
|------|---------|
| Certificado digital | e-CNPJ A1 ou A3 (empresa) ou e-CPF com procuracao eletronica |
| Procuracao eletronica | Se usar e-CPF, cadastrar procuracao na propria Conectividade Social |
| Java/Plugin | Verificar compatibilidade do navegador com modulo de seguranca |
| Horario | Sistema disponivel de 6h as 24h (dias uteis) |

### Funcionalidades Disponiveis

| Funcao | Descricao |
|--------|-----------|
| Extrato por trabalhador | Saldo e movimentacoes FGTS de cada CPF |
| Extrato por empregador | Consolidado de depositos por competencia |
| Consulta de debitos | Competencias sem recolhimento ou com diferenca |
| Download de arquivos | RE (Relacao de Empregados), RDE, GRRF |
| Comunicacao CAIXA | Caixa postal para notificacoes e comunicados |
| Cadastrar procuracao | Outorgar acesso a contadores/terceiros |

### Passo a Passo — Consultar Debitos

1. Acessar https://conectividadesocialv2.caixa.gov.br
2. Inserir certificado digital (e-CNPJ ou e-CPF)
3. Menu: **Empregador → Extrato de Conta Vinculada**
4. Selecionar CNPJ da empresa
5. Informar periodo (competencia inicial e final)
6. Sistema exibe:
   - Competencias com deposito
   - Competencias sem deposito (lacunas)
   - Valores depositados vs valores devidos
   - Saldo atualizado (JAM)
7. Para extrato detalhado por trabalhador:
   - Menu: **Trabalhador → Extrato Analitico**
   - Informar CPF do trabalhador
   - Selecionar conta vinculada (pode ter mais de uma)

---

## 2. SEFIP — Regularizacao de Competencias Anteriores

### O que e o SEFIP

O SEFIP (Sistema Empresa de Recolhimento do FGTS e Informacoes a Previdencia Social) e um software desktop para Windows que gera arquivos GFIP para transmissao ao governo.

### Download e Instalacao

```
URL: https://www.caixa.gov.br/empresa/fgts-empresas/SEFIP-GRF/
Sistema: Windows (XP ate 11)
Versao atual: 8.4 (ultima atualizacao)
```

> **IMPORTANTE**: O SEFIP so e necessario para competencias pre-03/2024 e reclamatorias. Para competencias atuais, usar FGTS Digital.

### Passo a Passo — Gerar GFIP Retroativa

#### 1. Instalar e configurar SEFIP

- Baixar SEFIP do site da CAIXA
- Instalar (requer permissao de administrador)
- Cadastrar empresa (CNPJ, razao social, endereco)
- Cadastrar trabalhadores (ou importar arquivo)

#### 2. Informar dados da competencia em aberto

- Abrir SEFIP → Movimento → Novo Movimento
- Informar **competencia** (MM/AAAA) a regularizar
- **Codigo de recolhimento:**

| Codigo | Tipo |
|--------|------|
| 115 | Recolhimento mensal (situacao normal) |
| 145 | Recolhimento mensal — 13o salario |
| 150 | Recolhimento mensal — dissidio/convencao coletiva |
| 307 | Deposito recursal |
| 418 | Rescisao sem justa causa (pre-FGTS Digital) |
| 650 | Reclamatoria trabalhista — FGTS |
| 660 | Reclamatoria trabalhista — FGTS e contribuicao |

#### 3. Informar remuneracoes

- Para cada trabalhador: informar remuneracao do mes
- Selecionar categorias corretas (01-empregado, 04-domestico, 06-aprendiz, etc.)
- Informar admissao, afastamentos se houver

#### 4. Gerar arquivo NRA

- Menu: Movimento → Fechar Movimento
- SEFIP valida e gera arquivo **NRA** (Norma de Recolhimento e Arquivamento)
- Se houver erros, sistema indica para correcao

#### 5. Transmitir via Conectividade Social

- Acessar Conectividade Social ICP V2
- Menu: Transmissao → Enviar Arquivo
- Selecionar arquivo NRA gerado pelo SEFIP
- Aguardar confirmacao de recebimento (protocolo)

#### 6. Gerar GRF (Guia de Recolhimento)

Apos transmissao aceita:
- Conectividade Social gera a GRF (boleto bancario)
- Menu: FGTS → Gerar GRF
- Selecionar competencia e tipo de recolhimento
- GRF inclui encargos de mora (TR + juros)

#### 7. Pagar GRF

- Boleto bancario convencional
- Pagar em qualquer agencia bancaria, internet banking ou loteria
- **NAO aceita Pix** (somente GRF do SEFIP)
- Prazo: conforme data impressa no boleto

---

## 3. Parcelamento de Debitos Pre-03/2024

### Com a CAIXA Economica Federal

Debitos anteriores a 03/2024 sao parcelados **diretamente com a CAIXA**, nao pelo FGTS Digital.

#### Pre-requisitos

| Item | Detalhe |
|------|---------|
| CNPJ ativo | Empresa com inscricao regular na RFB |
| Documentacao | Contrato social, docs socios, procuracao (se terceiro) |
| GFIP das competencias | Todas as GFIP das competencias em debito devem estar transmitidas |
| Agencia CAIXA | Agencia com gerencia empresarial FGTS |
| Valor minimo da parcela | R$ 100,00 (pessoa juridica) |

#### Passo a Passo

1. Reunir documentacao:
   - CNPJ e contrato social/estatuto
   - Documentos dos socios/representantes legais
   - Procuracao (se nao for socio)
   - Extrato de debitos do FGTS (retirar na Conectividade Social)
   - GFIP transmitida para todas as competencias em aberto

2. Comparecer a agencia CAIXA:
   - Agendar atendimento empresarial
   - Solicitar "parcelamento de debitos FGTS"
   - Apresentar documentacao

3. CAIXA analisa e propoe:
   - Valor total do debito (com encargos atualizados)
   - Numero maximo de parcelas
   - Valor da entrada
   - Valor das parcelas mensais

4. Formalizar acordo:
   - Assinar termo de confissao de divida
   - Pagar entrada (primeira parcela)
   - Receber boletos das demais parcelas

#### Condicoes gerais

| Aspecto | Detalhe |
|---------|---------|
| Maximo de parcelas | Geralmente 60x (pode variar) |
| Entrada | Minimo 1/60 do valor total |
| Encargos | TR + juros + multa sobre saldo devedor |
| Inadimplencia | 3 parcelas em atraso = rescisao do acordo |
| CRF | Regularizado durante vigencia do parcelamento (se em dia) |

---

## 4. Situacoes Especificas

### Empresa encerrada com debitos FGTS

- Debitos FGTS **nao prescrevem** com encerramento da empresa
- Socios podem ser responsabilizados (desconsideracao personalidade juridica)
- Regularizacao: protocolar pedido na CAIXA com documentos de encerramento
- Socios devem comparecer pessoalmente

### Debitos oriundos de fiscalizacao (NFGC/NFGD)

- NFGC (Notificacao Fiscal para Contribuicao) — pre-03/2024
- NFGD (Notificacao Fiscal de Debito) — pos-03/2024
- Debitos de fiscalizacao tem tratamento especifico
- Parcelamento: solicitar a CAIXA (pre-digital) ou FGTS Digital (pos-digital)
- Recurso administrativo: prazo de 10 dias uteis da notificacao

### Transferencia de titularidade (sucessao empresarial)

- Se houve cisao, fusao ou incorporacao:
- Debitos FGTS acompanham os trabalhadores (nao a empresa)
- Sucessora assume os debitos FGTS dos trabalhadores incorporados
- Regularizacao: processo na CAIXA com documentos da operacao societaria

### Reclamatoria trabalhista

Mesmo apos 03/2024, reclamatorias trabalhistas sao pagas via SEFIP:
1. Sentenca judicial determina valores devidos
2. Gerar GFIP no SEFIP com codigo 650 (FGTS) ou 660 (FGTS + previdencia)
3. Transmitir via Conectividade Social
4. Gerar GRF (boleto)
5. Pagar dentro do prazo judicial

---

## 5. Consulta Rapida — Onde Encontrar Cada Informacao

| Informacao | Onde consultar | Periodo |
|-----------|----------------|---------|
| Saldo FGTS por trabalhador | Conectividade Social ou FGTS Digital | Qualquer periodo |
| Debitos em aberto (pre-03/2024) | Conectividade Social | Ate 02/2024 |
| Debitos em aberto (pos-03/2024) | FGTS Digital | 03/2024 em diante |
| Extrato analitico | Conectividade Social | Qualquer periodo |
| CRF | https://consulta-crf.caixa.gov.br | Situacao atual |
| Parcelamento (pre-digital) | Agencia CAIXA | Ate 02/2024 |
| Parcelamento (pos-digital) | FGTS Digital | 03/2024 em diante |
| GRF (boleto retroativo) | Conectividade Social | Ate 02/2024 |
| GFD (guia digital) | FGTS Digital | 03/2024 em diante |

---

## 6. Certificado Digital — Requisitos

### Tipos aceitos na Conectividade Social

| Tipo | Uso | Validade |
|------|-----|----------|
| e-CNPJ A1 | Arquivo digital (computador) | 1 ano |
| e-CNPJ A3 | Token USB ou smart card | 1-3 anos |
| e-CPF A1 | Pessoa fisica (com procuracao) | 1 ano |
| e-CPF A3 | Pessoa fisica (token/smart card) | 1-3 anos |

### Procuracao Eletronica

Se o contador ou terceiro vai acessar em nome da empresa:
1. Empresa (com e-CNPJ) acessa Conectividade Social
2. Menu: Procuracao Eletronica → Outorgar
3. Informar CPF do outorgado (contador)
4. Definir poderes (consulta, transmissao, etc.)
5. Confirmar com certificado digital
6. Outorgado passa a acessar com seu proprio e-CPF

---

## Notas Importantes

1. **NAO misturar sistemas**: competencias pre-03/2024 = SEFIP; pos-03/2024 = FGTS Digital
2. **Conectividade Social continuara ativa** por tempo indeterminado (debitos historicos)
3. **SEFIP nao recebe mais atualizacoes**, mas continua funcional para finalidade residual
4. **Certificado digital tem custo** (R$ 100-400/ano dependendo do tipo) — necessario para consultas
5. **FGTS nao prescreve em 5 anos** — mudanca jurisprudencial (STF, 2014): prescricao de 30 anos para depositos ate 11/2014, 5 anos para depositos apos essa data. Para cobrar diferenca, o trabalhador tem 2 anos apos desligamento.
6. **Guarde tudo por 30 anos**: GRF, GFIP, comprovantes de pagamento, extratos
