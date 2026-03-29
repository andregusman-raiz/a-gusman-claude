# Infosimples — APIs FGTS (Documentação Detalhada)

> Versão da API: 2.2.35 (25/02/2026)
> Preço base: R$ 0,20/consulta + R$ 0,06 adicional = **R$ 0,26/consulta**

---

## 1. Caixa / Regularidade do Empregador (CRF)

Consulta a situação de regularidade do empregador e obtém os dados do Certificado de Regularidade do FGTS (CRF).

### Requisição

| Campo | Valor |
|-------|-------|
| **Método** | POST |
| **URL** | `https://api.infosimples.com/api/v2/consultas/caixa/regularidade` |
| **Fonte** | https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf |
| **Preço** | R$ 0,20 + R$ 0,06 = **R$ 0,26** |

### Parâmetros

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `token` | Sim | Chave de acesso |
| `cnpj` | Opcional* | CNPJ da empresa (14 dígitos) |
| `cei` | Opcional* | Cadastro Específico do INSS |
| `aceita_resultado_parcial` | Opcional | `0` (padrão): retorna 620 se dados incompletos. `1`: retorna 200 com dados parciais |

*Informar `cnpj` OU `cei`.

### Resposta (code 200)

```json
{
  "code": 200,
  "data": [{
    "crf": "1111111111111111111111",
    "datahora": "10/03/2019 11:13:56",
    "endereco": "ROD RS 324 / SN / S J DA BELA VISTA PASSO FUNDO - RS",
    "historico_cabecalho": [
      "Data de Emissão/Leitura",
      "Data de Validade - Início",
      "Data de Validade - Fim",
      "Número do CRF"
    ],
    "historico_lista": [
      ["26/02/2019", "26/02/2019", "27/03/2019", "2019022602493515835020"],
      ["07/02/2019", "07/02/2019", "08/03/2019", "2019020702123047511768"]
    ],
    "inscricao": "11.111.111/1111-11",
    "razao_social": "EMPRESA EXEMPLO S.A.",
    "situacao": "REGULAR",
    "validade_fim_data": "27/03/2019",
    "validade_inicio_data": "26/02/2019",
    "site_receipt": "https://..."
  }]
}
```

### Campos de Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `crf` | string | Número do CRF |
| `datahora` | string | Data/hora da consulta |
| `endereco` | string | Endereço do empregador |
| `historico_cabecalho` | array | Cabeçalhos do histórico |
| `historico_lista` | array[array] | Histórico de CRFs (emissão, validade, número) |
| `inscricao` | string | CNPJ formatado |
| `razao_social` | string | Razão social |
| `situacao` | string | `REGULAR` ou `IRREGULAR` |
| `validade_fim_data` | string | Data fim da validade do CRF |
| `validade_inicio_data` | string | Data início da validade |

---

## 2. FGTS / Guia de Arrecadação

Consulta Guias de Arrecadação de FGTS no portal do FGTS Digital.

### Requisição

| Campo | Valor |
|-------|-------|
| **Método** | POST |
| **URL** | `https://api.infosimples.com/api/v2/consultas/fgts/guia` |
| **Fonte** | https://fgtsdigital.sistema.gov.br/portal/login |
| **Preço** | R$ 0,20 + R$ 0,06 = **R$ 0,26** |

### Parâmetros

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `token` | Sim | Chave de acesso |
| `login_cpf` | Sim | CPF para login no GOV.BR |
| `login_senha` | Sim | Senha do GOV.BR |
| `pagina` | Opcional | Página de guias (max 10 por página, default: 1) |
| `periodo` | Opcional | Formato `YYYYMM` (default: mês anterior) |
| `representado` | Opcional | CNPJ representado (acesso como Procurador) |
| `pkcs12_cert` | Opcional | Certificado digital A1 encriptado (para login com e-CNPJ) |
| `pkcs12_pass` | Opcional | Senha do certificado A1 encriptada |

### Resposta (code 200)

```json
{
  "code": 200,
  "data": [{
    "empregador": "Exemplo de Nome",
    "guias": [
      {
        "data_arrecadacao": "11/11/1111",
        "data_emissao": "11/11/1111",
        "data_limite_pagamento": "11/11/1111",
        "numero": "1111111111",
        "situacao": "Paga Individualizada",
        "tipo": "MENSAL",
        "valor_total": 9999.99,
        "guia_pdf_url": "https://..."
      }
    ],
    "procurador": "Exemplo de Nome",
    "total_guias": "1",
    "total_paginas": "3",
    "usuario": "Exemplo de Nome",
    "site_receipt": "https://..."
  }]
}
```

### Campos de Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `empregador` | string | Nome do empregador |
| `guias` | array | Lista de guias |
| `guias[].data_arrecadacao` | string | Data de arrecadação |
| `guias[].data_emissao` | string | Data de emissão |
| `guias[].data_limite_pagamento` | string | Data limite para pagamento |
| `guias[].numero` | string | Número da guia |
| `guias[].situacao` | string | Status: "Paga Individualizada", "Aberta", etc. |
| `guias[].tipo` | string | Tipo: "MENSAL", "RESCISÓRIA", etc. |
| `guias[].valor_total` | number | Valor total da guia |
| `guias[].guia_pdf_url` | string | URL do PDF da guia |
| `procurador` | string | Nome do procurador (se aplicável) |
| `total_guias` | string | Total de guias encontradas |
| `total_paginas` | string | Total de páginas |
| `usuario` | string | Nome do usuário logado |

---

## 3. FGTS / Emissão de Guia Rápida (GFD)

Emite a Guia Rápida de Arrecadação de FGTS no portal do FGTS Digital.

### Requisição

| Campo | Valor |
|-------|-------|
| **Método** | POST |
| **URL** | `https://api.infosimples.com/api/v2/consultas/fgts/guia-rapida` |
| **Fonte** | https://fgtsdigital.sistema.gov.br/portal/login |
| **Preço** | R$ 0,20 + R$ 0,06 = **R$ 0,26** |

### Parâmetros

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `token` | Sim | Chave de acesso |
| `representado` | Opcional | CNPJ representado (acesso como Procurador) |
| `periodo` | Opcional | Formato `YYYYMM` (default: primeiro mês disponível) |
| `login_cpf` | Opcional* | CPF para login no GOV.BR |
| `login_senha` | Opcional* | Senha do GOV.BR |
| `pkcs12_cert` | Opcional* | Certificado digital A1 encriptado |
| `pkcs12_pass` | Opcional* | Senha do certificado A1 encriptada |

*Informar `login_cpf` + `login_senha` OU `pkcs12_cert` + `pkcs12_pass`.

### Resposta (code 200)

```json
{
  "code": 200,
  "data": [{
    "consignado": {
      "competencia": "111111",
      "data_vencimento": "11/11/1111",
      "valor_mensal": 1234.56,
      "valor_total": 1234.56
    },
    "competencia": "111111",
    "data_vencimento": "11/11/1111",
    "empregador": "Exemplo de Nome",
    "guia_pdf_url": "https://...",
    "procurador": "Exemplo de Nome",
    "quantidade_trabalhadores": "1",
    "total_paginas_pdf": 1,
    "valor_compensatorio": 0.0,
    "valor_encargos": 100.0,
    "valor_mensal": 240.0,
    "valor_rescisorio": 0.0,
    "valor_total": 240.0,
    "site_receipt": "https://..."
  }]
}
```

### Campos de Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `competencia` | string | Competência (YYYYMM) |
| `data_vencimento` | string | Data de vencimento da guia |
| `empregador` | string | Nome do empregador |
| `guia_pdf_url` | string | URL do PDF da GFD (com QR Code Pix) |
| `procurador` | string | Nome do procurador |
| `quantidade_trabalhadores` | string | Qtde de trabalhadores |
| `total_paginas_pdf` | number | Páginas no PDF |
| `valor_compensatorio` | number | Valor compensatório |
| `valor_encargos` | number | Valor de encargos |
| `valor_mensal` | number | Valor mensal FGTS |
| `valor_rescisorio` | number | Valor rescisório |
| `valor_total` | number | Valor total da guia |
| `consignado.competencia` | string | Competência do consignado |
| `consignado.data_vencimento` | string | Vencimento do consignado |
| `consignado.valor_mensal` | number | Valor mensal consignado |
| `consignado.valor_total` | number | Valor total consignado |

---

## Observações Importantes

### Autenticação GOV.BR
As APIs `fgts/guia` e `fgts/guia-rapida` requerem login no GOV.BR (CPF + senha ou certificado digital e-CNPJ). A API `caixa/regularidade` é pública (apenas CNPJ).

### Certificados Digitais
Para usar certificado digital A1:
1. Encriptar o conteúdo do arquivo `.pfx` seguindo instruções em `/consultas/docs/criptografia`
2. Enviar como `pkcs12_cert` (conteúdo encriptado) e `pkcs12_pass` (senha encriptada)

### Limitações
- APIs cobrem apenas **FGTS Digital** (competências a partir de 03/2024)
- Débitos antigos (SEFIP/GRF pré-03/2024) não têm API disponível
- Guias PDF ficam disponíveis por 7 dias nos `site_receipts`

### Custo Estimado (cenário típico)
- 10 CNPJs × CRF diário × 22 dias = 220 consultas/mês = R$ 57,20/mês
- 10 CNPJs × guia mensal = 10 consultas/mês = R$ 2,60/mês
- 10 CNPJs × GFD mensal = 10 consultas/mês = R$ 2,60/mês
- **Total estimado**: ~R$ 62,40/mês (dentro da franquia de R$ 100)
