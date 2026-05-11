# Guia Mensal (GFD) — Passo a Passo

> Como gerar e pagar a Guia FGTS Digital mensal para recolhimento regular de FGTS.

**Ultima atualizacao**: 2026-03-23
**Sistema**: FGTS Digital (competencias a partir de 03/2024)
**Fonte**: Manual de Orientacao FGTS Digital v1.40, Portal gov.br

---

## Pre-requisitos

Antes de gerar a GFD mensal, garantir que:

| Item | Detalhe |
|------|---------|
| Cadastro gov.br | Nivel prata ou ouro (empregador ou procurador) |
| Folha processada | Remuneracoes calculadas no sistema de folha |
| S-1200 enviado | Evento de remuneracao transmitido ao eSocial |
| S-1299 enviado | Evento de fechamento transmitido ao eSocial |
| S-5003 recebido | Retorno do governo com totalizador FGTS processado |
| Prazo | Ate dia 20 do mes seguinte a competencia |

---

## Passo a Passo — Guia Rapida

A **Guia Rapida** consolida automaticamente todos os debitos FGTS em aberto (mensal + rescisorio + misto) em uma unica guia. E a forma mais simples e recomendada para recolhimento mensal.

### 1. Acessar o FGTS Digital

```
URL: https://fgtsdigital.sistema.gov.br
Login: gov.br (nivel prata ou ouro)
```

- Se o empregador for pessoa juridica, usar e-CNPJ ou CPF de socio/procurador
- Selecionar o perfil "Empregador" apos login
- Se tiver multiplos vinculos (procurador de varias empresas), selecionar o CNPJ desejado

### 2. Menu Gestao de Guias

```
Dashboard → Gestao de Guias → Emitir Guia
```

### 3. Selecionar "Guia Rapida"

- Sistema exibe automaticamente todos os debitos pendentes
- Valores ja calculados pelo FGTS Digital (com base no eSocial)
- Encargos por atraso ja inclusos (se apos vencimento)
- Valor total consolidado

### 4. Conferir valores

Antes de gerar, conferir:
- Numero de trabalhadores incluidos
- Competencia(s) abrangida(s)
- Valor total vs valor esperado (comparar com relatorio de folha)
- Se houver divergencia → verificar S-5003 no sistema de folha

### 5. Definir data de vencimento

- Padrao: dia 20 do mes seguinte a competencia
- Se ja vencido: sistema calcula encargos automaticamente
- Pode selecionar data futura (dentro do mes de competencia)

### 6. Gerar GFD

- Clicar em "Emitir Guia" ou "Baixar"
- Sistema gera PDF com QR Code Pix
- Guia contem: identificacao empregador, competencia, valor, QR Code, codigo de barras Pix

### 7. Pagar via Pix

- Abrir app bancario da empresa
- Escanear QR Code impresso na GFD ou copiar codigo Pix
- Confirmar pagamento
- **IMPORTANTE**: QR Code tem validade (geralmente 24-48h) — se expirar, regerar guia

---

## Passo a Passo — Guia Parametrizada

A **Guia Parametrizada** permite personalizar o escopo da guia com filtros avancados.

### Quando usar Guia Parametrizada

- Pagar apenas uma filial especifica
- Separar guia mensal de rescisoria
- Gerar guia para competencia especifica (nao consolidar tudo)
- Excluir determinadas lotacoes ou categorias

### 1-2. Mesmos passos da Guia Rapida (acessar portal, menu Gestao de Guias)

### 3. Selecionar "Guia Parametrizada"

### 4. Configurar filtros

| Filtro | Opcoes | Observacao |
|--------|--------|------------|
| Tipo de Debito | Mensal, Rescisoria, Mista | Selecionar um ou mais |
| Referencia Inicial | Competencia (MM/AAAA) | Desde 03/2024 |
| Referencia Final | Competencia (MM/AAAA) | Ate competencia atual |
| Vencimento | Data desejada | Sistema calcula encargos |
| Empresa | CNPJ (14 posicoes) | Filial especifica |
| Lotacao | Codigo lotacao eSocial | Opcional — filtro fino |
| Categoria | Categoria eSocial | Ex: 101 (empregado geral) |
| Trabalhador | CPF | Opcional — guia individual |

### 5. Visualizar debitos filtrados

- Sistema exibe lista de debitos que atendem aos filtros
- Selecionar quais debitos incluir na guia
- Pode marcar/desmarcar individualmente

### 6-7. Gerar GFD e pagar via Pix (mesmo processo da Guia Rapida)

---

## Compensacoes e Deducoes

O FGTS Digital permite abater valores na GFD mensal:

### Compensacao

Quando houve pagamento a maior em competencia anterior:
1. Menu Gestao de Guias → Compensacao
2. Informar competencia e valor pago a maior
3. Sistema deduz da proxima GFD

### Deducao

Valores que podem ser deduzidos da GFD mensal:
- Licenca-maternidade paga pela empresa (120/180 dias)
- Servico militar obrigatorio
- Acidente de trabalho (primeiros 15 dias ja pagos)

**Como aplicar:**
1. Certificar que evento eSocial reflete a deducao
2. FGTS Digital calcula automaticamente com base no eSocial
3. Se nao refletir, verificar rubricas e reenviar S-1200

---

## Regras de Vencimento

| Situacao | Prazo | Base Legal |
|----------|-------|------------|
| Competencia mensal regular | Dia 20 do mes seguinte | Art. 15, Lei 8.036/90 (alterado) |
| 13o salario | 20 de janeiro do ano seguinte | Art. 15, §1o |
| Competencia mensal vencida | Dia 20 + encargos moratoria | IN MTE 06/2024 |
| Sabado, domingo ou feriado | Antecipa para ultimo dia util anterior | Art. 7o, Decreto 11.905/2024 |

---

## Situacoes Especiais

### Empresa sem movimento

Se nao houve remuneracao na competencia:
- Enviar S-1299 com indicativo "sem movimento"
- FGTS Digital nao gera debito
- Nao precisa emitir GFD (valor = R$ 0,00)

### Multiplos estabelecimentos (filiais)

- FGTS e recolhido por **CNPJ raiz** (matriz)
- Guia Rapida consolida todas as filiais automaticamente
- Guia Parametrizada permite gerar por filial (CNPJ 14 digitos)
- Cada filial deve enviar seus proprios eventos eSocial

### Construcao civil (CNO)

- Obras registradas no CNO tem lotacao especifica
- FGTS pode ser recolhido por CNO (separar da matriz)
- Guia Parametrizada: filtrar por lotacao (tipo CNO)

### Empregador domestico

- Domesticos usam eSocial Simplificado (portal)
- DAE (Documento de Arrecadacao eSocial) ja inclui FGTS
- **NAO geram GFD** no FGTS Digital — pagamento via DAE
- Excecao: rescisoria de domestico (S-2399) gera guia no FGTS Digital desde 01/2024

### Retificacao apos pagamento

Se foi pago valor incorreto:
1. Corrigir evento no eSocial (retificar S-1200)
2. Aguardar reprocessamento do S-5003
3. FGTS Digital recalcula automaticamente
4. Diferenca a maior → solicitar restituicao ou compensar
5. Diferenca a menor → nova GFD complementar

---

## Erros Comuns e Solucoes

| Erro | Causa | Solucao |
|------|-------|---------|
| "Nenhum debito encontrado" | S-1200/S-1299 nao enviados ou nao processados | Verificar status no eSocial. Aguardar S-5003. |
| Valor divergente do sistema de folha | Rubricas com incidencia FGTS incorreta | Conferir tabela de rubricas no eSocial. Corrigir incidencia. Reenviar S-1200. |
| QR Code expirado | Guia gerada ha mais de 48h | Regerar GFD no portal. |
| "Competencia ja paga" | Pagamento anterior na mesma competencia | Verificar extrato FGTS Digital. Se pago parcial, gerar complementar. |
| Trabalhador nao aparece na guia | Evento S-1200 rejeitado ou pendente | Verificar portal eSocial → Gestao de Eventos. Corrigir e retransmitir. |
| "Procuracao nao encontrada" | Procurador sem vinculo no gov.br | Cadastrar procuracao eletronica no portal e-CAC ou FGTS Digital. |

---

## Checklist Pos-Pagamento

Apos pagar a GFD mensal, verificar:

- [ ] Pagamento confirmado no extrato bancario
- [ ] Status no FGTS Digital: "Pago" (pode levar 1-2 dias uteis)
- [ ] CRF regular (consultar em https://consulta-crf.caixa.gov.br)
- [ ] Valores conferidos com relatorio S-5003 do sistema de folha
- [ ] Comprovante arquivado (PDF + comprovante Pix) — manter por 30 anos (prescricao FGTS)
