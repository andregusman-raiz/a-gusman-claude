# Layers Education — Modelo de Permissionamento

---

## Visao Geral

A Layers permite que cada comunidade tenha sua propria organizacao de papeis (roles) e permissoes. O sistema oferece controle granular onde permissoes sao ajustaveis para cada papel dentro de uma comunidade.

---

## Conceitos Fundamentais

### Comunidades (Communities)
Unidade organizacional primaria na Layers. Cada instituicao, desenvolvedor ou provedor mantem uma comunidade contendo seus dados e aplicacoes instaladas.

**Hierarquia de comunidades:** Instituicoes com multiplas unidades podem estabelecer estruturas hierarquicas onde uma comunidade-pai (sede) conecta-se a comunidades-filhas (filiais), permitindo que usuarios de nivel pai acessem e se comuniquem entre as subsidiarias.

### Contas (Accounts)
Existem independentemente de comunidades, contendo apenas dados pessoais essenciais: nome e email. Criadas automaticamente no primeiro registro.

### Usuarios (Users)
Representam individuos acessando comunidades especificas. Uma pessoa pode manter multiplos perfis de usuario em diferentes comunidades enquanto compartilha uma unica conta vinculada ao email.

### Membros (Members)
Entidades do mundo real dentro de comunidades (tipicamente alunos). Cada membro requer identificador unico e nome.

### Grupos (Groups)
Agregacoes de membros (turmas/cohorts). Podem designar usuarios especificos como administradores.

### Matriculas (Enrollments)
Formalizam a conexao entre membros e grupos.

---

## Roles (Papeis)

Cada comunidade define seus proprios papeis. Exemplos comuns:
- **Aluno** (Student)
- **Professor** (Teacher)
- **Responsavel/Guardiao** (Guardian/Parent)
- **Coordenador** (Coordinator)
- **Administrador** (Administrator)

Papeis sao completamente customizaveis por comunidade — nao ha papeis fixos no sistema.

---

## Formato de Permissoes

Permissoes na Layers sao **strings no formato `entidade:acao`** e governam o acesso a rotas da API.

Exemplos:
- `webhook` — acesso total a webhooks
- `webhook:read` — leitura de webhooks
- `webhookAttempt:read` — leitura de historico de tentativas
- `webhookAttempt:resend` — reenvio de webhooks

---

## Perfis de Permissao

O sistema permite **agregacao de permissoes** atraves de perfis customizaveis — colecoes de permissoes atribuiveis tanto a **aplicacoes** quanto a **usuarios**.

### Niveis de atribuicao:
1. **App-Level Permissions** — Aplicacoes expoem seus conjuntos de permissoes as comunidades durante a instalacao
2. **Role-Level Permissions** — Cada comunidade configura quais papeis possuem quais permissoes para cada app

---

## Configuracao pelo Administrador

O administrador da comunidade pode:

1. **Definir visibilidade** de apps por papel atraves da tela de configuracoes
2. **Atribuir permissoes** granularmente de apps expostas a papeis clicando em "Alterar"
3. **Determinar acesso** de quem pode e quem nao pode acessar aplicacoes especificas

---

## Integracao com Apps

### Apps no Ecossistema
Todos os apps de terceiros passam por avaliacao rigorosa antes de disponibilizacao no marketplace. Apps possuem tres caracteristicas definidoras:

1. **Identidade** — Nome, icone, identificador e descricao (exibidos na Layers Store e dentro de comunidades)
2. **Funcionalidade** — Selecao de features disponiveis da Layers para implementar
3. **Visibilidade** — Configuracoes de exibicao no marketplace e requisitos de aprovacao para instalacao

### Permissoes Proprietarias
Aplicacoes podem estabelecer **permissoes proprietarias** para controlar acesso as features implementadas. Durante a integracao, definicoes de permissao sao passadas, permitindo niveis de permissao pre-configurados para cada funcao exposta.

---

## API de Permissoes

### GET /v1/permissions — Listar Permissoes

Lista as permissoes disponiveis na comunidade.

**Headers:**
- `Authorization: Bearer {token}`
- `community-id: {community_id}`

---

## Modelo de Seguranca

- Apps passam por avaliacao rigorosa antes de disponibilizacao
- Cada comunidade controla independentemente suas permissoes
- Permissoes sao atribuidas por papel, nao por usuario individual
- Apps expoem permissoes durante instalacao — comunidade decide a configuracao
- Hierarquia de comunidades permite propagacao controlada de acesso

---

## Notas

- Nao ha papeis ou permissoes "default" no sistema — tudo e customizavel por comunidade
- Um usuario pode ter papeis diferentes em comunidades diferentes
- Permissoes se aplicam tanto a API quanto a interface visual
- Administradores tem controle total sobre a configuracao de acesso
