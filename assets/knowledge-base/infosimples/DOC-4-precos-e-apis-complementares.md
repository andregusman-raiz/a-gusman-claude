# Infosimples — Preços e APIs Complementares

> Extraído em 2026-03-25

---

## Modelo de Cobrança

| Item | Valor |
|------|-------|
| **Tipo** | Pré-pago |
| **Crédito inicial** | R$ 100,00 ao criar conta |
| **Franquia mínima mensal** | R$ 100,00 (cobrada mesmo sem uso) |
| **Expiração saldo** | 12 meses de inatividade |
| **Modelo pós-pago** | Disponível mediante contato |

### Tabela de Preços Base (por volume mensal)

| Volume Mensal | Preço/Consulta |
|---|---|
| 1 – 500 | R$ 0,20 |
| 501 – 2.000 | R$ 0,16 |
| 2.001 – 5.000 | R$ 0,14 |
| 5.001 – 10.000 | R$ 0,13 |
| 10.001 – 30.000 | R$ 0,11 |
| 30.001 – 50.000 | R$ 0,10 |
| 50.001 – 80.000 | R$ 0,09 |
| 80.001 – 100.000 | R$ 0,07 |
| 100.001+ | R$ 0,05 |

Desconto automático conforme volume. Calculadora: https://infosimples.com/consultas/estimativa/

---

## APIs Relevantes — Receita Federal

### CNPJ (`receita-federal/cnpj`)
- **Preço adicional**: R$ 0,04/chamada
- **Parâmetros**: `cnpj` (obrigatório)
- **Campos**: razao_social, nome_fantasia, cnpj, abertura_data, natureza_juridica, porte, capital_social, atividade_economica, endereco completo, situacao_cadastral, qsa (sócios), certidao_baixa
- **40+ campos** de resposta

### CPF (`receita-federal/cpf`)
- **Preço adicional**: R$ 0,04/chamada
- **Parâmetros**: `cpf` + `birthdate` (obrigatórios)
- **Campos**: nome, nome_civil, nome_social, data_nascimento, situacao_cadastral, ano_obito, qrcode_url
- **19 campos** de resposta

### MEI (`receita-federal/mei`)
- **Preço adicional**: R$ 0,04/chamada
- **Parâmetros**: `cnpj` ou `cpf` + `login_cpf` + `login_senha` (obrigatórios)
- **Limite**: 50 consultas/dia por login no sistema de origem
- **35+ campos** incluindo periodos_mei

### CND Federal / PGFN (`receita-federal/pgfn`)
- **Preço adicional**: R$ 0,06/chamada
- **Parâmetros**: `cpf` ou `cnpj` (+ `birthdate` se CPF, + `preferencia_emissao=2via` se certidão positiva)
- **Campos**: certidao, certidao_codigo, debitos_pgfn, debitos_rfb, situacao, validade_data, conseguiu_emitir_certidao_negativa
- **22 campos** de resposta

### Simples Nacional (`receita-federal/simples`)
- **Preço adicional**: R$ 0,04/chamada
- **Parâmetros**: `cnpj` (obrigatório)
- **Campos**: simples_nacional_situacao, simei_situacao, periodos anteriores, eventos futuros

### IRPF (`receita-federal/irpf`)
- **Preço adicional**: R$ 0,04/chamada
- **Parâmetros**: `cpf` + `birthdate` + `year` (obrigatórios)
- **Campos**: situacao_restituicao, lote, banco, agencia, chave_pix, disponivel_data

---

## APIs Relevantes — Trabalhista

### TST / CNDT (`tst/cndt`)
- **Preço adicional**: R$ 0,04/chamada
- **Parâmetros**: `cnpj` ou `cpf`
- **Campos**: certidao, certidao_codigo, consta (boolean), processos_encontrados, total_de_processos, validade_data, conseguiu_emitir_certidao_negativa
- **17 campos** de resposta

### TST / Validação de CNDT (`tst/validar-cndt`)
- **Preço adicional**: R$ 0,00
- **Parâmetros**: `certidao_codigo` (obrigatório)

### TST / Banco de Falências (`tst/banco-falencias`)
- **Preço adicional**: R$ 0,00
- **Parâmetros**: `cnpj` ou `cpf`

---

## APIs Relevantes — Outras

### Dataprev / FAP (`dataprev/fap`)
- Fator Acidentário de Prevenção

### Dataprev / Qualificação (`dataprev/qualificacao`)
- Qualificação cadastral (eSocial)

### eCAC / DCTF Web (`ecac/dctf-web`)
- Declarações federais (requer certificado digital)

### eCAC / Situação Fiscal (`ecac/situacao-fiscal`)
- Situação fiscal completa (requer certificado digital)

### MTE / Débitos Trabalhistas (`mte/certidao-debitos`)
- Certidão de débitos trabalhistas do MTE

---

## Preços Consolidados (APIs do Projeto FGTS)

| API | Endpoint | Preço Total (até 500/mês) |
|-----|----------|--------------------------|
| CRF (Regularidade FGTS) | `caixa/regularidade` | R$ 0,26 |
| FGTS / Guia | `fgts/guia` | R$ 0,26 |
| FGTS / Guia Rápida | `fgts/guia-rapida` | R$ 0,26 |
| Receita / CNPJ | `receita-federal/cnpj` | R$ 0,24 |
| Receita / CPF | `receita-federal/cpf` | R$ 0,24 |
| CND Federal | `receita-federal/pgfn` | R$ 0,26 |
| Simples Nacional | `receita-federal/simples` | R$ 0,24 |
| TST / CNDT | `tst/cndt` | R$ 0,24 |
| TST / Validar CNDT | `tst/validar-cndt` | R$ 0,20 |
| Dataprev / FAP | `dataprev/fap` | R$ 0,20 |
| Dataprev / Qualificação | `dataprev/qualificacao` | R$ 0,20 |
