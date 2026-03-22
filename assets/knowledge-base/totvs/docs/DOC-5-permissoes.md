# DOC-5 — Mapa de Permissões e Perfis

**Projeto**: TOTVS Educacional Frontend
**Versão**: 1.0
**Data**: 2026-03-20
**Status**: Referência oficial

---

## Sumário

1. [Visão Geral dos Perfis](#1-visão-geral-dos-perfis)
2. [Matriz de Permissões](#2-matriz-de-permissões)
3. [Regras de Escopo de Dados](#3-regras-de-escopo-de-dados)
4. [Acesso Multi-escola (Multi-tenant)](#4-acesso-multi-escola-multi-tenant)
5. [Permissões Granulares (Feature-level)](#5-permissões-granulares-feature-level)
6. [Mapeamento TOTVS RM → Frontend](#6-mapeamento-totvs-rm--frontend)
7. [Fluxo de Provisionamento de Usuários](#7-fluxo-de-provisionamento-de-usuários)
8. [Considerações de Segurança](#8-considerações-de-segurança)

---

## 1. Visão Geral dos Perfis

O sistema possui cinco perfis de acesso, cada um correspondendo a um papel institucional distinto. Os perfis são atribuídos no momento do provisionamento (Clerk) e determinam tanto o conjunto de funcionalidades disponíveis quanto o escopo de dados visível.

### 1.1 `secretaria`

Usuário operacional da secretaria escolar. Responsável por toda a gestão administrativa de alunos: matrículas, rematrículas, enturmação, emissão de documentos e manutenção de fichas.

- **Escopo de dados**: todos os alunos da escola à qual está vinculado (CODCOLIGADA + CODFILIAL)
- **Acesso**: leitura e escrita no módulo de secretaria
- **Restrições**: sem acesso ao módulo pedagógico (diário, notas, frequência)

### 1.2 `professor`

Docente da instituição. Opera exclusivamente no módulo pedagógico, restrito às próprias turmas e alunos.

- **Escopo de dados**: apenas alunos e turmas onde `STURMADISC.CODPROFESSOR` = código do professor logado
- **Acesso**: leitura e escrita no diário de classe, lançamento de notas e frequência
- **Restrições**: sem acesso a dados de outros professores, sem acesso ao módulo secretaria

### 1.3 `coordenador`

Coordenador pedagógico. Supervisiona todas as turmas da escola. Pode visualizar dados administrativos, mas sem poder de escrita sobre matrículas.

- **Escopo de dados**: todos os alunos e turmas da escola vinculada
- **Acesso**: leitura no módulo secretaria + leitura e escrita no módulo pedagógico (todas as turmas)
- **Diferenciais**: pode realizar override de notas, aprovar ocorrências, abonar faltas

### 1.4 `diretor`

Gestor executivo da unidade escolar. Visão ampla sobre todos os dados, com poder de aprovação em operações críticas.

- **Escopo de dados**: todos os dados da escola vinculada + relatórios comparativos entre escolas (quando multi-escola)
- **Acesso**: leitura em todos os módulos + aprovação de matrículas, documentos e enturmações
- **Diferenciais**: acesso a relatórios executivos e comparações cross-unidade

### 1.5 `admin`

Administrador do sistema (equipe rAIz CSC). Acesso irrestrito a todos os dados de todas as escolas.

- **Escopo de dados**: todas as escolas (todos os CODCOLIGADA)
- **Acesso**: leitura e escrita em todos os módulos
- **Diferenciais**: gestão de configurações do sistema, provisionamento de usuários, acesso a todos os relatórios

---

## 2. Matriz de Permissões

Legenda:
- **RW** — Leitura + Escrita (Read + Write)
- **R** — Somente leitura (Read only)
- **R*** — Leitura com restrição de escopo (ver nota)
- **Approve** — Pode aprovar/assinar, sem criação direta
- **—** — Sem acesso

### 2.1 Módulo Secretaria

| Funcionalidade | secretaria | professor | coordenador | diretor | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard Secretaria | RW | — | R | R | R |
| Lista de Alunos | RW | R* ¹ | R | R | R |
| Ficha do Aluno | RW | R* ² | R | R | R |
| Matrícula (criar) | RW | — | — | Approve | RW |
| Rematrícula | RW | — | — | Approve | RW |
| Enturmação | RW | — | R | Approve | RW |
| Gestão de Turmas | RW | R* ³ | R | R | RW |
| Emissão de Documentos | RW | — | R | Approve+Sign | RW |

> ¹ Professor vê apenas alunos das suas turmas
> ² Professor vê apenas fichas dos seus alunos
> ³ Professor vê apenas suas próprias turmas

### 2.2 Módulo Pedagógico

| Funcionalidade | secretaria | professor | coordenador | diretor | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard Professor | — | RW | R | R | R |
| Diário de Classe | — | RW* ⁴ | R | R | R |
| Lançamento de Notas | — | RW* ⁴ | RW* ⁵ | R | RW |
| Lançamento de Frequência | — | RW* ⁴ | RW* ⁶ | R | RW |
| Ocorrências | R | RW* ⁷ | RW* ⁸ | R | RW |
| Grade Curricular | R | R | R | R | RW |
| Calendário | R | R | R | R | RW |

> ⁴ Restrito às próprias turmas
> ⁵ Coordenador pode fazer override em qualquer turma da escola
> ⁶ Coordenador pode abonar faltas em qualquer turma da escola
> ⁷ Professor cria ocorrências; não pode aprovar
> ⁸ Coordenador pode criar e aprovar ocorrências

### 2.3 Relatórios e Configurações

| Funcionalidade | secretaria | professor | coordenador | diretor | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Relatórios Administrativos | R | — | R | R | R |
| Relatórios Pedagógicos | — | R* ⁹ | R | R | R |
| Relatórios Executivos | — | — | — | R | R |
| Relatórios Cross-escola | — | — | — | R | R |
| Configurações do Sistema | — | — | — | R | RW |
| Gestão de Usuários | — | — | — | — | RW |

> ⁹ Professor vê apenas relatórios das suas turmas

---

## 3. Regras de Escopo de Dados

O escopo de dados define quais registros do banco cada perfil pode consultar. Todas as regras são aplicadas server-side, nas Server Actions e na camada BFF.

### 3.1 Perfil `professor`

```
Escopo: STURMADISC.CODPROFESSOR = {ID do professor logado}
```

- Consultas de alunos sempre incluem `JOIN STURMADISC ON STURMADISC.CODPROFESSOR = @professorId`
- Acesso negado a qualquer aluno não presente nas turmas do professor
- O `CODPROFESSOR` é lido da sessão Clerk (metadata), nunca do cliente

### 3.2 Perfil `secretaria`

```
Escopo: CODCOLIGADA = {coligada ativa} AND CODFILIAL = {filial ativa}
```

- Visualiza todos os alunos matriculados na escola atribuída
- O par CODCOLIGADA + CODFILIAL vem da sessão e do seletor de escola no header
- Não pode acessar dados de outras filiais ou coligadas

### 3.3 Perfil `coordenador`

```
Escopo: CODCOLIGADA = {coligada ativa} AND CODFILIAL = {filial ativa}
```

- Sem filtro de professor — vê todas as turmas e alunos da escola
- Pode sobrescrever notas de qualquer turma dentro do escopo da escola
- Acesso a ocorrências de todos os professores da escola

### 3.4 Perfil `diretor`

```
Escopo principal: CODCOLIGADA = {coligada ativa}
Escopo relatórios: todas as escolas vinculadas ao diretor
```

- Vê todos os dados da escola (todas as filiais da coligada ativa)
- Para relatórios comparativos, pode selecionar múltiplas coligadas se tiver autorização multi-escola
- Não realiza operações de escrita direta — aprova operações iniciadas por outros perfis

### 3.5 Perfil `admin`

```
Escopo: sem restrição de CODCOLIGADA
```

- Acesso a todas as coligadas e filiais cadastradas
- Seletor de escola no header permite navegar entre qualquer unidade
- Usado exclusivamente pela equipe rAIz CSC para suporte e administração

---

## 4. Acesso Multi-escola (Multi-tenant)

### 4.1 Vinculação Usuário × Escola

Cada usuário é vinculado a um ou mais pares `CODCOLIGADA + CODFILIAL` no momento do provisionamento. Essa vinculação é armazenada nos metadados públicos do usuário no Clerk:

```json
{
  "profile": "coordenador",
  "schools": [
    { "codcoligada": 1, "codfilial": 1, "label": "Escola Central" },
    { "codcoligada": 1, "codfilial": 2, "label": "Escola Norte" }
  ]
}
```

### 4.2 Seletor de Escola no Header

- O componente de seletor exibe apenas as escolas presentes em `publicMetadata.schools`
- Ao trocar de escola, o contexto ativo (`CODCOLIGADA` + `CODFILIAL`) é atualizado na sessão
- Todas as queries subsequentes utilizam o contexto da escola selecionada
- O contexto ativo é armazenado em cookie HTTP-only ou em state server-side — nunca em localStorage

### 4.3 Perfis com Múltiplas Escolas

Um usuário pode ter perfis distintos em escolas diferentes. Exemplos válidos:

| Escola | Perfil |
|---|---|
| Escola Central | `coordenador` |
| Escola Norte | `professor` |

Nesse caso, ao trocar para "Escola Norte", as permissões do usuário mudam para `professor` automaticamente. A lógica de resolução é:

```
permissão_efetiva = schools[escola_ativa].profile
```

### 4.4 Admin Multi-escola

Usuários com perfil `admin` não necessitam de vinculações explícitas. O sistema concede acesso irrestrito a todas as escolas cadastradas. O seletor exibe todas as coligadas/filiais disponíveis.

---

## 5. Permissões Granulares (Feature-level)

Além dos perfis macro, o sistema implementa permissões granulares por funcionalidade. Essas permissões são derivadas do perfil mas permitem controle fino em casos de exceção.

### 5.1 Tabela de Permissões por Feature

| Permissão | secretaria | professor | coordenador | diretor | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| `enrollment.create` | ✓ | — | — | — | ✓ |
| `enrollment.cancel` | ✓ | — | — | — | ✓ |
| `enrollment.transfer` | ✓ | — | — | — | ✓ |
| `grades.enter` | — | ✓ | ✓ | — | ✓ |
| `grades.override` | — | — | ✓ | — | ✓ |
| `grades.close_period` | — | — | ✓ | — | ✓ |
| `attendance.enter` | — | ✓ | ✓ | — | ✓ |
| `attendance.excuse` | — | — | ✓ | — | ✓ |
| `occurrence.create` | — | ✓ | ✓ | — | ✓ |
| `occurrence.approve` | — | — | ✓ | — | ✓ |
| `document.generate` | ✓ | — | ✓ | — | ✓ |
| `document.sign` | — | — | — | ✓ | ✓ |
| `report.view_own` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `report.view_school` | ✓ | — | ✓ | ✓ | ✓ |
| `report.view_all` | — | — | — | ✓ | ✓ |
| `config.manage` | — | — | — | — | ✓ |

### 5.2 Descrição das Permissões

| Permissão | Descrição |
|---|---|
| `enrollment.create` | Criar nova matrícula de aluno |
| `enrollment.cancel` | Cancelar matrícula existente |
| `enrollment.transfer` | Transferir aluno entre turmas ou escolas |
| `grades.enter` | Lançar notas nas próprias turmas |
| `grades.override` | Alterar notas já lançadas por outros professores |
| `grades.close_period` | Fechar período de lançamento de notas |
| `attendance.enter` | Registrar presença/falta nas próprias turmas |
| `attendance.excuse` | Abonar faltas de alunos |
| `occurrence.create` | Registrar ocorrência disciplinar ou pedagógica |
| `occurrence.approve` | Aprovar ou encerrar ocorrência registrada |
| `document.generate` | Gerar declarações, históricos e outros documentos |
| `document.sign` | Assinar digitalmente documentos emitidos |
| `report.view_own` | Visualizar relatórios do próprio escopo (turmas/escola) |
| `report.view_school` | Visualizar relatórios agregados da escola |
| `report.view_all` | Visualizar relatórios cross-escola |
| `config.manage` | Acessar e alterar configurações do sistema |

### 5.3 Verificação de Permissão no Código

As permissões são verificadas via helper server-side. Nunca verificar apenas no cliente.

```typescript
// Padrão de uso nas Server Actions
import { assertPermission } from '@/lib/auth/permissions'

export async function lancarNota(data: LancarNotaInput) {
  const session = await getServerSession()
  await assertPermission(session, 'grades.enter', {
    codcoligada: data.codcoligada,
    codturma: data.codturma,
  })
  // ... lógica de negócio
}
```

---

## 6. Mapeamento TOTVS RM → Frontend

### 6.1 Separação de Sistemas de Auth

O frontend TOTVS Educacional utiliza autenticação própria via **Clerk**, completamente separada do sistema de permissões do TOTVS RM. Não há sincronização direta entre os dois sistemas.

| Aspecto | TOTVS RM | Frontend |
|---|---|---|
| Sistema de auth | GUSUARIO / GPERMISSAO (próprio RM) | Clerk |
| Credenciais | Login/senha RM | E-mail + senha Clerk |
| Perfis | Configurados no RM | Metadados Clerk |
| Escopo de dados | Controlado pelo RM | Server Actions com CODCOLIGADA/CODFILIAL |

### 6.2 Acesso ao Banco MSSQL

- As credenciais de conexão ao MSSQL (TOTVS RM Database) são **exclusivamente server-side**
- Armazenadas em variáveis de ambiente no servidor (Vercel env vars)
- Nunca expostas ao cliente, nunca presentes em respostas de API
- O frontend conecta ao MSSQL via Server Actions e BFF, usando uma service account dedicada

### 6.3 Ausência de Criação de Usuários no RM

Não é necessário criar usuários no TOTVS RM para o acesso ao frontend. O frontend opera com:

1. Uma única service account no RM (para leitura/escrita de dados educacionais)
2. Controle de acesso gerenciado pelo Clerk + regras de escopo por CODCOLIGADA

Os usuários finais (secretaria, professor, etc.) nunca precisam de login no TOTVS RM.

---

## 7. Fluxo de Provisionamento de Usuários

### 7.1 Fluxo Padrão

```
[Admin] Cria usuário no Clerk
    ↓
[Admin] Define publicMetadata: profile + schools
    ↓
[Clerk] Envia e-mail de convite para o usuário
    ↓
[Usuário] Acessa link do convite e define senha
    ↓
[Sistema] Lê publicMetadata na autenticação
    ↓
[Sistema] Aplica permissões conforme profile e escola ativa
```

### 7.2 Detalhamento de Cada Etapa

**Etapa 1 — Criação no Clerk**

O administrador acessa o painel de gestão de usuários do frontend e preenche:
- Nome completo
- E-mail institucional
- Perfil (`secretaria`, `professor`, `coordenador`, `diretor`)
- Escola(s) vinculada(s) com respectivos CODCOLIGADA + CODFILIAL

**Etapa 2 — Atribuição de Metadados**

Os metadados são gravados em `publicMetadata` via Clerk Management API (server-side):

```json
{
  "profile": "professor",
  "schools": [
    {
      "codcoligada": 2,
      "codfilial": 1,
      "label": "Colégio São Paulo",
      "codprofessor": 147
    }
  ]
}
```

> Para professores, incluir o `CODPROFESSOR` correspondente no TOTVS RM para aplicar o filtro de turmas.

**Etapa 3 — Convite por E-mail**

O Clerk envia automaticamente um e-mail de convite com link de ativação. O template de e-mail é personalizado com a identidade visual da instituição.

**Etapa 4 — Ativação pelo Usuário**

O usuário acessa o link, define sua senha e realiza o primeiro login. Após a ativação, a conta está pronta para uso.

**Etapa 5 — Resolução de Permissões em Runtime**

A cada requisição autenticada, o sistema:

1. Lê o token JWT do Clerk
2. Extrai `publicMetadata.profile` e `publicMetadata.schools`
3. Identifica a escola ativa no contexto da sessão
4. Resolve as permissões efetivas para a escola ativa
5. Injeta CODCOLIGADA + CODFILIAL em todas as queries

### 7.3 Alteração de Perfil

Para alterar o perfil de um usuário existente, o administrador atualiza o `publicMetadata` via painel. A alteração tem efeito imediato na próxima requisição do usuário (o token JWT é revalidado).

### 7.4 Desativação de Usuário

Usuários desligados da instituição devem ser suspensos no Clerk (não deletados). A suspensão invalida imediatamente todos os tokens ativos e bloqueia novos logins. O histórico de ações do usuário é preservado no audit log.

---

## 8. Considerações de Segurança

### 8.1 Enforcement Server-side Obrigatório

Toda operação privilegiada é validada no servidor. A UI oculta elementos não autorizados por conveniência do usuário, mas não como mecanismo de segurança.

```
Regra: se a validação existir só no cliente, não existe.
```

Cada Server Action segue o padrão:

1. Verificar autenticação (sessão Clerk válida)
2. Verificar perfil do usuário
3. Verificar escopo de dados (CODCOLIGADA correto)
4. Verificar permissão granular específica da operação
5. Executar a operação
6. Registrar no audit log

### 8.2 Proteção Contra CODCOLIGADA Injection

O `CODCOLIGADA` e o `CODFILIAL` utilizados nas queries **sempre** vêm da sessão server-side. Nunca são aceitos como parâmetros vindos do cliente.

```typescript
// CORRETO: CODCOLIGADA da sessão
const { codcoligada } = await getActiveSchoolContext(session)
const alunos = await db.query(`SELECT * FROM SALUNO WHERE CODCOLIGADA = @cod`, { cod: codcoligada })

// ERRADO: CODCOLIGADA do cliente — NUNCA fazer
const { codcoligada } = req.body // ← vulnerabilidade
```

### 8.3 Audit Log

Todas as operações de escrita são registradas em tabela de auditoria com:

| Campo | Descrição |
|---|---|
| `user_id` | ID do usuário Clerk |
| `user_email` | E-mail do usuário |
| `profile` | Perfil no momento da ação |
| `codcoligada` | Escola ativa no momento da ação |
| `action` | Permissão granular exercida (ex: `grades.enter`) |
| `entity` | Entidade afetada (ex: `SLANOTA`) |
| `entity_id` | Identificador do registro afetado |
| `before` | Estado anterior (JSON) |
| `after` | Estado posterior (JSON) |
| `timestamp` | Data/hora UTC da operação |
| `ip` | IP de origem da requisição |

### 8.4 Rate Limiting e Abuse Prevention

- Operações de escrita em lote (ex: lançamento de notas em massa) têm limite de frequência
- Tentativas de acesso a recursos fora do escopo são logadas e podem acionar alertas
- Tokens JWT têm expiração curta (configurável no Clerk, recomendado: 60 minutos)

### 8.5 Princípio do Menor Privilégio

Novos usuários são provisionados com o perfil mínimo necessário para sua função. Expansão de acesso requer aprovação explícita de um administrador e fica registrada no audit log.

---

## Apêndice A — Resumo de Perfis

| Perfil | Módulo Secretaria | Módulo Pedagógico | Relatórios | Config | Escopo |
|---|:---:|:---:|:---:|:---:|---|
| `secretaria` | RW | — | Próprio | — | Escola vinculada |
| `professor` | R (próprias turmas) | RW (próprias turmas) | Próprias turmas | — | Próprias turmas |
| `coordenador` | R | RW (todas turmas) | Escola | — | Escola vinculada |
| `diretor` | R + Approve | R | Executivo + Cross | R | Escola + Cross |
| `admin` | RW | RW | Todos | RW | Todas as escolas |

---

## Apêndice B — Glossário

| Termo | Definição |
|---|---|
| CODCOLIGADA | Identificador da empresa/coligada no TOTVS RM |
| CODFILIAL | Identificador da filial/unidade no TOTVS RM |
| CODPROFESSOR | Identificador do professor na tabela STURMADISC do TOTVS RM |
| Clerk | Plataforma de autenticação e gestão de usuários utilizada pelo frontend |
| publicMetadata | Metadados do usuário armazenados no Clerk, visíveis server-side e client-side |
| Server Action | Função Next.js executada exclusivamente no servidor |
| BFF | Backend for Frontend — camada intermediária entre Next.js e TOTVS RM MSSQL |
| Audit Log | Registro imutável de todas as operações de escrita no sistema |
| Service Account | Conta de banco de dados dedicada para o frontend, sem relação com usuários finais |
