# Framework (Global)

> Tabelas globais compartilhadas por todos os módulos TOTVS RM. Definem a estrutura organizacional (coligadas, filiais), cadastro unificado de pessoas e controle de acesso.

---

## Hierarquia

```
GCOLIGADA (Empresa/Instituição)
├── GFilial (Filial/Campus)
├── GUSUARIO (Usuários do sistema)
│   ├── GPERMIS (Permissões)
│   └── GUSRPERFIL (Perfis)
└── PPESSOA* (Cadastro master de pessoas)
    ├── → SALUNO (módulo Educacional)
    ├── → SPROFESSOR (módulo Educacional)
    └── → PFUNC (módulo RH/Folha)
```
*PPESSOA não está no DataServer mas é referenciada por CODPESSOA em todas as entidades de pessoa.

---

## Tabelas (5)

| Tabela | Nome de Negócio | DataServer | Campos | PII |
|--------|----------------|------------|--------|-----|
| GColigada | Empresa/Instituição | GlbColigadaData | 28 | Sim |
| GFilial | Filial/Campus | GlbColigadaData | 4 | Sim |
| GPERMIS | Permissões de Acesso | GlbUsuarioData | 10 |  |
| GUSRPERFIL | Perfil do Usuário | GlbUsuarioData | 12 |  |
| GUSUARIO | Usuário do Sistema | GlbUsuarioData | 41 | Sim |

---

## Campos por Tabela

### GColigada — Empresa/Instituição (28 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| NOMEFANTASIA | Nome Fantasia | xs:string | Sim |  | PII |
| CGC | CNPJ / CPF / CEI | xs:string | Sim |  | PII |
| NOME | Nome | xs:string | Sim |  | PII |
| INSCRICAOESTADUAL | Inscrição Estadual | xs:string |  |  |  |
| TELEFONE | Telefone | xs:string |  |  | PII |
| FAX | Fax | xs:string |  |  | PII |
| EMAIL | E-Mail | xs:string |  |  | PII |
| RUA | Rua | xs:string |  |  | PII |
| NUMERO | Número | xs:string |  |  | PII |
| COMPLEMENTO | Complemento | xs:string |  |  | PII |
| BAIRRO | Bairro | xs:string |  |  | PII |
| CIDADE | Cidade | xs:string |  |  | PII |
| ESTADO | Estado | xs:string |  |  |  |
| PAIS | País | xs:string |  |  |  |
| CEP | Cep | xs:string |  |  | PII |
| PRODUTORRURAL | Produtor Rural | xs:string |  |  |  |
| ATIVO | Ativo | xs:string |  |  |  |
| CODEXTERNO | Código Externo | xs:string |  |  |  |
| IMPORTADA | Importada Via Aponta | xs:string |  |  |  |
| CODCOLIGADA | Código | xs:short | Sim | → GCOLIGADA |  |
| CONTROLACGC | Hist. CNPJ | xs:short |  |  |  |
| CONTROLE1 | Controle1 | xs:short |  |  |  |
| CONTROLE2 | Controle2 | xs:short |  |  |  |
| CONTROLE3 | Controle3 | xs:short |  |  |  |
| IDIMAGEM | Identificador da Imagem | xs:int |  |  |  |
| IMAGEM | Imagem | xs:base64Binary |  |  |  |
| INTEGRADOFLUIG | Integrado | xs:short |  |  |  |
| DATALIMITELICENCAS | DATALIMITELICENCAS | xs:dateTime |  |  |  |

### GFilial — Filial/Campus (4 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| NOME | Nome | xs:string | Sim |  | PII |
| CGC | CNPJ/CPF/CEI | xs:string |  |  | PII |
| CODCOLIGADA | Coligada | xs:short | Sim | → GCOLIGADA |  |
| CODFILIAL | Filial | xs:short | Sim | → GFILIAL |  |

### GPERMIS — Permissões de Acesso (10 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODSISTEMA | CODSISTEMA | xs:string | Sim |  |  |
| CODUSUARIO | CODUSUARIO | xs:string | Sim |  |  |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| SUPERVISOR | SUPERVISOR | xs:short |  |  |  |
| CONTROLE | CONTROLE | xs:short |  |  |  |
| CRIARELAT | CRIARELAT | xs:short |  |  |  |
| RECCREATEDBY | RECCREATEDBY | xs:string |  |  |  |
| RECCREATEDON | RECCREATEDON | xs:dateTime |  |  |  |
| RECMODIFIEDBY | RECMODIFIEDBY | xs:string |  |  |  |
| RECMODIFIEDON | RECMODIFIEDON | xs:dateTime |  |  |  |

### GUSRPERFIL — Perfil do Usuário (12 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODUSUARIO | CODUSUARIO | xs:string | Sim |  |  |
| CODSISTEMA | CODSISTEMA | xs:string | Sim |  |  |
| CODPERFIL | CODPERFIL | xs:string | Sim |  |  |
| CODCOLIGADA | CODCOLIGADA | xs:short | Sim | → GCOLIGADA |  |
| INDICE | INDICE | xs:short | Sim |  |  |
| CONTROLE | CONTROLE | xs:short |  |  |  |
| RECCREATEDBY | RECCREATEDBY | xs:string |  |  |  |
| RECCREATEDON | RECCREATEDON | xs:dateTime |  |  |  |
| RECMODIFIEDBY | RECMODIFIEDBY | xs:string |  |  |  |
| RECMODIFIEDON | RECMODIFIEDON | xs:dateTime |  |  |  |
| STATUS | STATUS | xs:short |  |  |  |
| IDPERFIL | IDPERFIL | xs:string |  |  |  |

### GUSUARIO — Usuário do Sistema (41 campos)

| Campo | Caption | Tipo | Obrig. | FK | PII |
|-------|---------|------|--------|----|----- |
| CODUSUARIO | Usuário | xs:string | Sim |  |  |
| NOME | Nome | xs:string |  |  | PII |
| CODACESSO | Código de Acesso | xs:string | Sim |  |  |
| OBRIGAALTERARSENHA | Alterar senha no Próximo Login | xs:string |  |  |  |
| EMAIL | E-Mail | xs:string |  |  | PII |
| ACESSONET | Permite Acesso ao TOTVS RM Portal | xs:string |  |  |  |
| CODUSUARIOREDE | Usuário de rede | xs:string |  |  |  |
| DOMINIOREDE | Domínio de rede | xs:string |  |  |  |
| LIVEID | LIVEID | xs:string |  |  |  |
| USUARIOTWITTER | Usuário do Twitter | xs:string |  |  |  |
| SENHATWITTER | Senha do Twitter | xs:string |  |  |  |
| USUARIOFACEBOOK | USUARIOFACEBOOK | xs:string |  |  |  |
| SENHAFACEBOOK | SENHAFACEBOOK | xs:string |  |  |  |
| USUARIOLINKEDIN | USUARIOLINKEDIN | xs:string |  |  |  |
| SENHALINKEDIN | SENHALINKEDIN | xs:string |  |  |  |
| USERID | UserId | xs:string |  |  |  |
| USERIDFLUIGIDENTITY | USERIDFLUIGIDENTITY | xs:string |  |  |  |
| IGNORARAUTENTICACAOLDAP | Ignorar Integração/Logon LDAP | xs:string |  |  |  |
| NOMESOCIAL | Nome Social | xs:string |  |  | PII |
| CODEXTERNO | Código externo | xs:string |  |  |  |
| STATUS | Ativo | xs:short |  |  |  |
| DATAINICIO | Início de Validade | xs:dateTime | Sim |  |  |
| DATAEXPIRACAO | Expiração de Validade | xs:dateTime |  |  |  |
| CONFIRMABTNOK | Confirmação de Operação | xs:short |  |  |  |
| SENHA | Senha  | xs:string |  |  |  |
| CONTROLE | CRC do Usuário | xs:short |  |  |  |
| ULTIMACOLIGADA | Última Coligada Acessada | xs:int |  |  |  |
| DTAEXPSENHA | Data de expiração da senha | xs:dateTime |  |  |  |
| DIASEXPSENHA | Dias de expiração da senha | xs:int |  |  |  |
| NUMLOGININVALIDO | Número de Logins Inválidos | xs:int |  |  |  |

*... e mais 11 campos. Ver schema.json para lista completa.*

---

## Regras de Negócio

- CODCOLIGADA é a chave multi-tenant — presente em TODAS as tabelas
- PPESSOA é o cadastro unificado — alunos, professores e funcionários apontam para ela
- Permissões são por perfil × coligada × funcionalidade

---

## Queries Disponíveis (1)

| Query | Descrição | Tabelas | Caso de Uso |
|-------|-----------|---------|-------------|
| comparativo-coligadas | Métricas comparativas entre coligadas (alunos, receita, inadimplência) | GCOLIGADA, SMATRICPL, FLAN | Dashboard executivo multi-unidade |

---

## APIs

### SOAP DataServers neste domínio
- `GlbColigadaData`
- `GlbUsuarioData`

*Ver apis.json para endpoints REST e status detalhado.*
