# Guia Rescisoria (GFD Rescisoria) — Passo a Passo

> Como gerar e pagar a Guia FGTS Digital rescisoria no desligamento de funcionario.

**Ultima atualizacao**: 2026-03-23
**Sistema**: FGTS Digital (desligamentos a partir de 03/2024)
**Fonte**: Manual de Orientacao FGTS Digital v1.40, FAQ CAIXA v7, Portal gov.br

---

## Visao Geral

A guia rescisoria e gerada quando um trabalhador e desligado da empresa. Ela contem:
1. **FGTS do mes da rescisao** — deposito proporcional aos dias trabalhados
2. **FGTS sobre verbas rescisorias** — 13o proporcional, aviso previo indenizado, ferias proporcionais
3. **Multa rescisoria** — 40% ou 20% sobre o **saldo total** da conta vinculada FGTS

**Importante:** A guia rescisoria e **individual** (uma por trabalhador desligado) e **nao pode ser consolidada em lote**.

---

## Tipos de Rescisao e Obrigacoes FGTS

| Motivo de Desligamento | Codigo eSocial | FGTS Rescisao | Multa | % Multa | Saque |
|------------------------|---------------|---------------|-------|---------|-------|
| Sem justa causa | 02 | SIM | SIM | 40% | SIM |
| Termino contrato prazo | 04 | SIM | NAO | — | SIM |
| Acordo (art. 484-A) | 07 | SIM | SIM | 20% | SIM (80% saldo) |
| Justa causa | 01 | SIM | NAO | — | NAO |
| Pedido de demissao | 03 | SIM | NAO | — | NAO |
| Aposentadoria | 08 | SIM | SIM | 40% | SIM |
| Falecimento | 09 | SIM | NAO | — | SIM (herdeiros) |
| Culpa reciproca | 05 | SIM | SIM | 20% | SIM |
| Rescisao indireta | 06 | SIM | SIM | 40% | SIM |
| Forca maior | 10 | SIM | SIM | 20% | SIM |

> **FGTS Rescisao = SIM** em todos os casos: o deposito do mes da rescisao (proporcional) e **sempre obrigatorio**, independente do motivo. O que varia e a multa e o direito ao saque.

---

## Pre-requisitos

| Item | Detalhe |
|------|---------|
| Cadastro gov.br | Nivel prata ou ouro |
| Rescisao processada | TRCT/TQRCT calculado no sistema de folha |
| S-2299 enviado | Evento de desligamento transmitido ao eSocial |
| S-2299 aceito | Evento processado sem rejeicao |
| S-5003 recebido | Retorno com FGTS rescisorio calculado |
| Saldo FGTS disponivel | Para calculo da multa (FGTS Digital consulta CAIXA) |

---

## Passo a Passo

### 1. Processar rescisao no sistema de folha

No TOTVS RM ou outro sistema:
- Calcular verbas rescisorias (saldo salario, 13o, ferias, aviso previo)
- Gerar TRCT (Termo de Rescisao de Contrato de Trabalho)
- Verificar que todas as rubricas com incidencia FGTS estao corretas

### 2. Enviar evento S-2299 ao eSocial

O S-2299 (Desligamento) contem:
- Data do desligamento
- Motivo (codigo tabela 19 eSocial)
- Verbas rescisorias com rubricas
- Indicativo de pagamento de aviso previo

**Prazo para envio do S-2299:**
- Ate **10 dias** apos a data do desligamento
- Excecao: aviso previo trabalhado — ate dia 15 do mes seguinte

### 3. Aguardar processamento no eSocial

- eSocial valida o evento S-2299
- Se aceito: gera retorno S-5003 com valores FGTS
- Se rejeitado: corrigir e reenviar

**Tempo de processamento:** geralmente minutos, mas pode levar ate 24h em periodos de pico.

### 4. Acessar FGTS Digital

```
URL: https://fgtsdigital.sistema.gov.br
Login: gov.br (prata/ouro)
Perfil: Empregador
```

### 5. Menu Gestao de Guias → Rescisoria

```
Dashboard → Gestao de Guias → Emitir Guia → Tipo: Rescisoria
```

O FGTS Digital identifica automaticamente os desligamentos com guia pendente.

### 6. Selecionar o trabalhador

- Sistema lista trabalhadores com S-2299 processado e guia pendente
- Selecionar o trabalhador especifico
- Verificar dados: nome, CPF, data desligamento, motivo

### 7. Conferir valores

A guia rescisoria apresenta:

| Componente | Calculo |
|------------|---------|
| FGTS do mes | 8% x remuneracao proporcional (dias trabalhados) |
| FGTS sobre 13o proporcional | 8% x 13o proporcional |
| FGTS sobre aviso previo indenizado | 8% x valor aviso previo (se indenizado) |
| FGTS sobre ferias proporcionais + 1/3 | 8% x ferias proporcionais |
| **Subtotal depositos** | Soma dos itens acima |
| **Multa rescisoria** | 40% (ou 20%) x **saldo total conta FGTS** |
| **Total da guia** | Subtotal depositos + Multa |

**Sobre a multa:**
- Base = **saldo total da conta vinculada** (todo o historico, nao apenas ultimo mes)
- Inclui: depositos + JAM (Juros e Atualizacao Monetaria)
- FGTS Digital consulta o saldo automaticamente na CAIXA
- Se houve saque parcial (saque-aniversario, etc.), a multa incide sobre o **saldo remanescente**

### 8. Gerar GFD Rescisoria

- Clicar em "Emitir Guia"
- PDF gerado com QR Code Pix
- **Validade do QR Code**: verificar (geralmente 24-48h)

### 9. Pagar via Pix

- Escanear QR Code ou copiar codigo Pix copia-e-cola
- Pagar pelo app bancario da empresa
- **Prazo: ate 10 dias corridos apos a data do desligamento**

---

## Prazos Detalhados

| Tipo de Aviso | Prazo para pagamento FGTS |
|---------------|---------------------------|
| Aviso previo trabalhado | Ate 10 dias corridos apos ultimo dia de trabalho |
| Aviso previo indenizado | Ate 10 dias corridos apos comunicacao da dispensa |
| Acordo (art. 484-A CLT) | Ate 10 dias corridos apos data do acordo |
| Contrato por prazo determinado | Ate 10 dias apos o termino |
| Falecimento | Ate 10 dias apos o obito |

> Se o 10o dia cair em sabado, domingo ou feriado: **antecipa** para ultimo dia util anterior.

---

## Calculo da Multa — Exemplos

### Exemplo 1: Dispensa sem justa causa

```
Trabalhador: Joao Silva
Salario: R$ 5.000,00
Tempo na empresa: 3 anos
Saldo FGTS acumulado: R$ 18.500,00 (depositos + JAM)
Data desligamento: 15/03/2026
Aviso previo: Indenizado (30 dias)

FGTS do mes (15 dias):    8% x R$ 2.500,00 = R$ 200,00
FGTS sobre 13o proporcional: 8% x R$ 1.250,00 = R$ 100,00
FGTS sobre aviso previo:  8% x R$ 5.000,00 = R$ 400,00
Subtotal depositos:        R$ 700,00

Multa 40%: 40% x R$ 18.500,00 = R$ 7.400,00

Total guia rescisoria: R$ 700,00 + R$ 7.400,00 = R$ 8.100,00
Prazo: ate 25/03/2026 (10 dias corridos)
```

### Exemplo 2: Acordo (art. 484-A CLT)

```
Mesmos dados, porem:
Multa 20%: 20% x R$ 18.500,00 = R$ 3.700,00
Trabalhador saca 80% do saldo: R$ 14.800,00
Total guia rescisoria: R$ 700,00 + R$ 3.700,00 = R$ 4.400,00
```

### Exemplo 3: Justa causa

```
Mesmos dados, porem:
Multa: NAO HA
Total guia rescisoria: R$ 700,00 (apenas depositos do mes)
Trabalhador NAO saca o FGTS
```

---

## Situacoes Especiais

### Rescisao com controversia no saldo

Se o saldo FGTS consultado pelo FGTS Digital esta divergente:
1. Consultar extrato detalhado na Conectividade Social
2. Verificar se ha competencias sem deposito (pre-03/2024)
3. Se houver debitos anteriores, regularizar via SEFIP primeiro
4. Saldo atualizado refletira na proxima consulta do FGTS Digital

### Rescisao de domestico (S-2399)

- Evento eSocial diferente: S-2399 (nao S-2299)
- Domesticos tem antecipacao de multa (3,2% mensal via DAE)
- Multa rescisoria: 40% sobre saldo **menos** a antecipacao acumulada
- Guia rescisoria gerada no FGTS Digital (desde 01/2024)

### Rescisao retroativa

Se a rescisao esta sendo processada fora do prazo (ex: pendencia judicial):
1. Enviar S-2299 retroativo ao eSocial
2. FGTS Digital calcula com encargos de mora
3. Multa por atraso no recolhimento sera incluida automaticamente

### Rescisao com salarios atrasados

Se ha competencias em aberto (FGTS nao pago em meses anteriores):
1. Regularizar competencias em aberto **antes** da rescisao
2. Ou: gerar guia mista (mensal + rescisoria) na Guia Parametrizada
3. Multa incide sobre o saldo que **deveria** estar na conta (incluindo debitos em aberto)

### Reclamatoria trabalhista

Para rescisoes oriundas de decisao judicial:
- Se a competencia e anterior a 03/2024: usar **SEFIP** (nao FGTS Digital)
- Se a competencia e posterior a 03/2024: usar FGTS Digital
- Guia especifica para reclamatoria (tipo de debito: Reclamatoria)
- Codigo de recolhimento especifico (650/660)

---

## Erros Comuns e Solucoes

| Erro | Causa | Solucao |
|------|-------|---------|
| "Saldo FGTS indisponivel" | CAIXA nao retornou saldo a tempo | Aguardar 24-48h. Se persistir, contatar CAIXA. |
| "S-2299 nao encontrado" | Evento rejeitado ou nao enviado | Verificar eSocial → Gestao de Eventos. Corrigir e reenviar. |
| Multa com valor zerado | Saldo FGTS = R$ 0 (sem depositos historicos) | Verificar se ha debitos FGTS em aberto. Regularizar antes. |
| "Guia ja emitida" | Guia anterior gerada (pode estar vencida) | Verificar status. Se QR Code vencido, gerar nova. |
| Valor do mes incorreto | Rubrica com incidencia FGTS errada | Corrigir rubrica → retificar S-2299 → aguardar recalculo. |
| Trabalhador com saque-aniversario | Saldo menor que esperado | Multa incide sobre saldo **atual** (apos saques). Correto. |

---

## Checklist Rescisao — FGTS

### Antes do desligamento
- [ ] Todas as competencias mensais de FGTS estao pagas (sem debitos em aberto)
- [ ] Rubricas rescisorias com incidencia FGTS correta
- [ ] Codigo do motivo de desligamento correto (tabela 19 eSocial)

### No desligamento
- [ ] S-2299 (ou S-2399) enviado e aceito pelo eSocial
- [ ] S-5003 retornado com valores FGTS
- [ ] Valores conferidos entre sistema de folha e FGTS Digital

### Apos desligamento
- [ ] GFD Rescisoria gerada no FGTS Digital
- [ ] Pagamento via Pix realizado dentro do prazo (10 dias)
- [ ] Comprovante arquivado (PDF guia + comprovante Pix)
- [ ] Chave de saque informada ao trabalhador (se aplicavel)
- [ ] Homologacao no sindicato (se tempo de servico > 1 ano e CCT exigir)

### Documentacao obrigatoria para arquivo (30 anos)
- TRCT assinado
- GFD Rescisoria (PDF)
- Comprovante de pagamento Pix
- Protocolo S-2299 (numero do recibo eSocial)
- Extrato FGTS do trabalhador (comprovante entregue ao empregado)
