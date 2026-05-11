# DOC-1: API Reference Completa — TOTVS RM Educacional

**Versão:** 12.1.2502
**Data:** 2026-03-20
**Status:** Referência técnica ativa — baseada em specs OpenAPI 3.0.1 do portal TOTVS + testes em ambiente DEV

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Autenticação](#2-autenticação)
3. [Parâmetros Multi-tenant](#3-parâmetros-multi-tenant)
4. [Catálogo de Endpoints](#4-catálogo-de-endpoints)
   - 4.1 [Contexto do Aluno](#41-contexto-do-aluno)
   - 4.2 [Contexto do Professor](#42-contexto-do-professor)
   - 4.3 [Acadêmico / Secretaria](#43-acadêmico--secretaria)
   - 4.4 [Turmas](#44-turmas)
   - 4.5 [Relatórios](#45-relatórios)
   - 4.6 [Processo Seletivo](#46-processo-seletivo)
   - 4.7 [Biblioteca](#47-biblioteca)
   - 4.8 [Publicações](#48-publicações)
   - 4.9 [Framework (não-educacional)](#49-framework-não-educacional)
5. [Limitações Conhecidas](#5-limitações-conhecidas)
6. [Matriz de Cobertura](#6-matriz-de-cobertura)
7. [Endpoints Testados (Ambiente DEV)](#7-endpoints-testados-ambiente-dev)

---

## 1. Visão Geral

| Propriedade | Valor |
|---|---|
| Produto | TOTVS RM Educacional |
| Versão da API | v12.1.2502 |
| Protocolo | HTTPS REST |
| Formato | JSON (OpenAPI 3.0.1) |
| Base URL Educacional | `https://raizeducacao160289.rm.cloudtotvs.com.br:8051/api/educational/v1/` |
| Base URL Framework | `https://raizeducacao160289.rm.cloudtotvs.com.br:8051/api/framework/v1/` |
| Ambiente DEV | `https://raizeducacao160289.rm.cloudtotvs.com.br:8051` |

### Bases de URL por módulo

| Módulo | Base URL |
|---|---|
| Educacional (aluno, professor, acadêmico) | `.../api/educational/v1/` |
| Framework (coligadas, filiais) | `.../api/framework/v1/` |

---

## 2. Autenticação

### Tipo: Basic Authentication

Todos os endpoints requerem autenticação HTTP Basic. O token é enviado no header `Authorization`.

```
Authorization: Basic <base64(usuario:senha)>
```

**Geração do token:**

```bash
# Exemplo (bash)
echo -n "usuario:senha" | base64
# Resultado: dXN1YXJpbzpzZW5oYQ==

# Header resultante:
Authorization: Basic dXN1YXJpbzpzZW5oYQ==
```

**Exemplo em JavaScript/TypeScript:**

```typescript
const token = Buffer.from(`${usuario}:${senha}`).toString('base64');
const headers = {
  'Authorization': `Basic ${token}`,
  'Content-Type': 'application/json',
};
```

### Gerenciamento de Sessão

- A API TOTVS RM não emite tokens JWT ou cookies de sessão — cada requisição é autenticada individualmente via Basic Auth.
- Não há endpoint de login/logout explícito.
- Credenciais devem ser armazenadas de forma segura no servidor (variáveis de ambiente), nunca expostas no cliente.
- Recomendado: camada BFF (Backend for Frontend) que injeta as credenciais nas chamadas ao TOTVS, evitando exposição no browser.

### Rate Limits

| Parâmetro | Valor |
|---|---|
| Limite de requisições | Desconhecido — a ser testado |
| Janela temporal | A determinar |
| Header de controle | Não documentado |
| Comportamento ao exceder | A validar (possivelmente HTTP 429) |

> **Nota:** Não há documentação oficial de rate limits na versão 12.1.2502. Recomenda-se implementar retry com backoff exponencial e monitorar respostas 429/503.

---

## 3. Parâmetros Multi-tenant

A TOTVS RM opera com estrutura hierárquica de empresas. A maioria dos endpoints educacionais requer identificação do contexto organizacional.

### Parâmetros Globais de Contexto

| Parâmetro | Nome RM | Tipo | Obrigatório | Descrição |
|---|---|---|---|---|
| `CompanyCode` | Coligada | `integer` | Sim (maioria) | Código da coligada (empresa) no RM |
| `BranchCode` | Filial | `integer` | Sim (maioria) | Código da filial dentro da coligada |

### Passagem dos Parâmetros

Os parâmetros de contexto são tipicamente passados como **query parameters** ou **path parameters** dependendo do endpoint:

```
GET /api/framework/v1/branches?CompanyCode=1
GET /api/educational/v1/StudentContexts?CompanyCode=1&BranchCode=1
```

### Coligadas Conhecidas (Ambiente DEV)

| CompanyCode | Empresa |
|---|---|
| 1–20 | 20 coligadas retornadas pelo endpoint `/api/framework/v1/companies` |
| N (QI) | Filiais QI Faculdade & Escola (10 filiais identificadas) |

> Consultar endpoint `GET /api/framework/v1/companies` para lista atualizada de coligadas ativas.

---

## 4. Catálogo de Endpoints

### Convenções de Documentação

| Símbolo | Significado |
|---|---|
| `{Id}` | Identificador interno do registro no RM |
| `{StudentInternalId}` | ID interno do aluno (obtido via StudentContexts) |
| `{ProfessorInternalId}` | ID interno do professor (obtido via ProfessorContexts) |
| `{AcademicInternalId}` | ID interno do contexto acadêmico |
| `R` | Endpoint somente leitura |
| `RW` | Endpoint com leitura e escrita (CRUD completo) |

---

### 4.1 Contexto do Aluno

> Todos os endpoints desta categoria retornam dados **do aluno autenticado** (user-context). Requer usuário com perfil de aluno no RM.

#### GET /StudentContexts

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/StudentContexts` |
| Categoria | Aluno |
| Acesso | R |
| Descrição | Retorna todos os contextos do aluno autenticado no Educacional. Ponto de entrada principal para obter o `StudentInternalId` necessário nos demais endpoints de aluno. |

**Parâmetros de Query:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `CompanyCode` | integer | Recomendado | Filtra por coligada |
| `BranchCode` | integer | Recomendado | Filtra por filial |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de contextos do aluno (pode ser vazia para usuário admin) |
| 400 | Parâmetros inválidos |

---

#### GET /Students/{StudentInternalId}/CalendarEvents

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Students/{StudentInternalId}/CalendarEvents` |
| Categoria | Aluno |
| Acesso | R |
| Descrição | Retorna todos os eventos educacionais do calendário do aluno (aulas, provas, feriados, eventos institucionais). |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `StudentInternalId` | string/integer | Sim | ID interno do aluno (obtido via StudentContexts) |

**Parâmetros de Query:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `CompanyCode` | integer | Recomendado | Código da coligada |
| `BranchCode` | integer | Recomendado | Código da filial |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de eventos do calendário do aluno |
| 400 | Parâmetros inválidos ou StudentInternalId não encontrado |

---

#### GET /Students/{StudentInternalId}/studentwarnings

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Students/{StudentInternalId}/studentwarnings` |
| Categoria | Aluno |
| Acesso | R |
| Descrição | Retorna todas as ocorrências/avisos registrados para o aluno, visíveis pelo próprio aluno. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `StudentInternalId` | string/integer | Sim | ID interno do aluno |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de ocorrências do aluno |
| 400 | Parâmetros inválidos |

---

#### GET /Students/{StudentInternalId}/studentwarning/{InternalId}

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Students/{StudentInternalId}/studentwarning/{InternalId}` |
| Categoria | Aluno |
| Acesso | R |
| Descrição | Retorna detalhes de uma ocorrência específica do aluno. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `StudentInternalId` | string/integer | Sim | ID interno do aluno |
| `InternalId` | string/integer | Sim | ID interno da ocorrência |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Detalhes da ocorrência |
| 404 | Ocorrência não encontrada |

---

#### GET /Students/{StudentInternalId}/LessonPlans

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Students/{StudentInternalId}/LessonPlans` |
| Categoria | Aluno |
| Acesso | R |
| Descrição | Retorna todos os planos de aula disponíveis para o aluno. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `StudentInternalId` | string/integer | Sim | ID interno do aluno |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de planos de aula |
| 400 | Parâmetros inválidos |

---

#### GET /Students/{StudentInternalId}/LessonPlans/{InternalId}

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Students/{StudentInternalId}/LessonPlans/{InternalId}` |
| Categoria | Aluno |
| Acesso | R |
| Descrição | Retorna detalhes de um plano de aula específico. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `StudentInternalId` | string/integer | Sim | ID interno do aluno |
| `InternalId` | string/integer | Sim | ID interno do plano de aula |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Detalhes do plano de aula |
| 404 | Plano de aula não encontrado |

---

#### GET /students/{StudentInternalId}/offeredactivities

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/students/{StudentInternalId}/offeredactivities` |
| Categoria | Aluno |
| Acesso | R |
| Descrição | Retorna todas as atividades ofertadas que o aluno pode visualizar e se inscrever. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `StudentInternalId` | string/integer | Sim | ID interno do aluno |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de atividades ofertadas |
| 400 | Parâmetros inválidos |

---

#### GET /students/{StudentInternalId}/offeredactivities/{InternalId}

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/students/{StudentInternalId}/offeredactivities/{InternalId}` |
| Categoria | Aluno |
| Acesso | R |
| Descrição | Retorna detalhes de uma atividade ofertada específica. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `StudentInternalId` | string/integer | Sim | ID interno do aluno |
| `InternalId` | string/integer | Sim | ID interno da atividade |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Detalhes da atividade ofertada |
| 404 | Atividade não encontrada |

---

#### POST /students/{StudentInternalId}/paymentplans/{PaymentPlanInternalId}/simulations

| Propriedade | Valor |
|---|---|
| Método | `POST` |
| Path completo | `/api/educational/v1/students/{StudentInternalId}/paymentplans/{PaymentPlanInternalId}/simulations` |
| Categoria | Aluno / Financeiro |
| Acesso | RW |
| Descrição | Executa simulação de valores de parcelas de um plano de pagamento para o aluno. Útil para exibir simulações financeiras antes da confirmação de matrícula. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `StudentInternalId` | string/integer | Sim | ID interno do aluno |
| `PaymentPlanInternalId` | string/integer | Sim | ID interno do plano de pagamento |

**Body:** JSON com parâmetros da simulação (campos a confirmar via teste em DEV).

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Resultado da simulação de parcelas |
| 400 | Parâmetros inválidos ou plano não encontrado |

---

### 4.2 Contexto do Professor

> Todos os endpoints desta categoria retornam dados **do professor autenticado** (user-context). Requer usuário com perfil de professor no RM.

#### GET /ProfessorContexts

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/ProfessorContexts` |
| Categoria | Professor |
| Acesso | R |
| Descrição | Retorna todos os contextos do professor autenticado no Educacional. Ponto de entrada principal para obter o `ProfessorInternalId` necessário nos demais endpoints de professor. |

**Parâmetros de Query:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `CompanyCode` | integer | Recomendado | Filtra por coligada |
| `BranchCode` | integer | Recomendado | Filtra por filial |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de contextos do professor (vazia para usuário admin) |
| 400 | Parâmetros inválidos |

---

#### GET /Professors/{ProfessorInternalId}/disciplineclasses

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/disciplineclasses` |
| Categoria | Professor |
| Acesso | R |
| Descrição | Retorna todas as turmas/disciplinas associadas ao professor autenticado. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de turmas/disciplinas do professor |
| 400 | Parâmetros inválidos |

---

#### GET/POST /professors/{ProfessorInternalId}/assignments

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/professors/{ProfessorInternalId}/assignments` |
| Categoria | Professor |
| Acesso | RW |
| Descrição | Lista ou cria provas/avaliações de turmas/disciplinas do professor. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |

**GET - Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de provas/avaliações |
| 400 | Parâmetros inválidos |

**POST - Body:** JSON com dados da prova/avaliação (campos a confirmar em DEV).

**POST - Respostas:**

| Código | Significado |
|---|---|
| 200 | Prova/avaliação criada com sucesso |
| 400 | Dados inválidos |

---

#### GET/PUT/DELETE /professors/{ProfessorInternalId}/assignments/{InternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/professors/{ProfessorInternalId}/assignments/{InternalId}` |
| Categoria | Professor |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui uma prova/avaliação específica do professor. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |
| `InternalId` | string/integer | Sim | ID interno da avaliação |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes da avaliação | Avaliação alterada | — |
| 204 | — | — | Avaliação excluída |
| 400 | — | Dados inválidos | — |
| 404 | Avaliação não encontrada | Avaliação não encontrada | Avaliação não encontrada |

---

#### GET/POST /Professors/{ProfessorInternalId}/Buildings

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/Buildings` |
| Categoria | Professor / Infraestrutura |
| Acesso | RW |
| Descrição | Lista ou cadastra prédios educacionais acessíveis pelo professor. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de prédios / prédio criado |
| 400 | Parâmetros inválidos |

---

#### GET/PUT/DELETE /Professors/{ProfessorInternalId}/Buildings/{BuildingInternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/Buildings/{BuildingInternalId}` |
| Categoria | Professor / Infraestrutura |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui um prédio educacional específico. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |
| `BuildingInternalId` | string/integer | Sim | ID interno do prédio |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes do prédio | Prédio alterado | — |
| 204 | — | — | Prédio excluído |
| 400 | — | Dados inválidos | — |
| 404 | Prédio não encontrado | Prédio não encontrado | Prédio não encontrado |

---

#### GET/POST /Professors/{ProfessorInternalId}/buildings/{BuildingInternalId}/Blocks

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/buildings/{BuildingInternalId}/Blocks` |
| Categoria | Professor / Infraestrutura |
| Acesso | RW |
| Descrição | Lista ou cadastra blocos de um prédio educacional. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |
| `BuildingInternalId` | string/integer | Sim | ID interno do prédio |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de blocos / bloco criado |
| 400 | Parâmetros inválidos |

---

#### GET/PUT/DELETE /Professors/{ProfessorInternalId}/buildings/{BuildingInternalId}/Blocks/{InternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/buildings/{BuildingInternalId}/Blocks/{InternalId}` |
| Categoria | Professor / Infraestrutura |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui um bloco educacional específico. |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes do bloco | Bloco alterado | — |
| 204 | — | — | Bloco excluído |
| 400 | — | Dados inválidos | — |
| 404 | Bloco não encontrado | Bloco não encontrado | Bloco não encontrado |

---

#### GET /Professors/{ProfessorInternalId}/buildings/{BuildingInternalId}/Blocks/{BlockInternalId}/Rooms

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/buildings/{BuildingInternalId}/Blocks/{BlockInternalId}/Rooms` |
| Categoria | Professor / Infraestrutura |
| Acesso | R |
| Descrição | Retorna todas as salas de um bloco de um prédio educacional. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |
| `BuildingInternalId` | string/integer | Sim | ID interno do prédio |
| `BlockInternalId` | string/integer | Sim | ID interno do bloco |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de salas |
| 400 | Parâmetros inválidos |

---

#### GET /Professors/{ProfessorInternalId}/buildings/{BuildingInternalId}/Blocks/{BlockInternalId}/Rooms/{InternalId}

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/buildings/{BuildingInternalId}/Blocks/{BlockInternalId}/Rooms/{InternalId}` |
| Categoria | Professor / Infraestrutura |
| Acesso | R |
| Descrição | Retorna detalhes de uma sala educacional específica. |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Detalhes da sala |
| 404 | Sala não encontrada |

---

#### GET /Professors/{ProfessorInternalId}/classShifts

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/classShifts` |
| Categoria | Professor |
| Acesso | R |
| Descrição | Retorna todos os turnos educacionais disponíveis para o professor. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de turnos |
| 400 | Parâmetros inválidos |

---

#### GET /Professors/{ProfessorInternalId}/ClassShifts/{ClassShiftInternalId}

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/ClassShifts/{ClassShiftInternalId}` |
| Categoria | Professor |
| Acesso | R |
| Descrição | Retorna detalhes de um turno educacional específico. |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Detalhes do turno |
| 404 | Turno não encontrado |

---

#### GET /Professors/{ProfessorInternalId}/StudentWarningGroups

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/StudentWarningGroups` |
| Categoria | Professor |
| Acesso | R |
| Descrição | Retorna todos os grupos de ocorrência disponíveis para o professor. Grupos são categorias/classificações para ocorrências de alunos. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de grupos de ocorrência |
| 400 | Parâmetros inválidos |

---

#### GET /Professors/{ProfessorInternalId}/StudentWarningGroups/{InternalId}

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/StudentWarningGroups/{InternalId}` |
| Categoria | Professor |
| Acesso | R |
| Descrição | Retorna detalhes de um grupo de ocorrência específico. |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Detalhes do grupo de ocorrência |
| 404 | Grupo não encontrado |

---

#### GET/POST /Professors/{ProfessorInternalId}/studentwarnings

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/studentwarnings` |
| Categoria | Professor |
| Acesso | RW |
| Descrição | Lista ou cria ocorrências de alunos pelo professor. Permite ao professor registrar ocorrências disciplinares ou acadêmicas. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |

**Respostas:**

| Código | GET | POST |
|---|---|---|
| 200 | Lista de ocorrências | Ocorrência criada |
| 400 | Parâmetros inválidos | — |
| 404 | — | Professor não encontrado |

---

#### GET/PUT/DELETE /Professors/{ProfessorInternalId}/studentwarning/{InternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/Professors/{ProfessorInternalId}/studentwarning/{InternalId}` |
| Categoria | Professor |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui uma ocorrência de aluno registrada pelo professor. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ProfessorInternalId` | string/integer | Sim | ID interno do professor |
| `InternalId` | string/integer | Sim | ID interno da ocorrência |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes da ocorrência | Ocorrência alterada | Ocorrência excluída |
| 404 | Não encontrada | Não encontrada | Não encontrada |

---

### 4.3 Acadêmico / Secretaria

> Endpoints desta categoria requerem perfil acadêmico ou de secretaria no RM. Operações CRUD sobre estrutura curricular.

#### GET/POST /Academics/{AcademicInternalID}/Courses

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/Academics/{AcademicInternalID}/Courses` |
| Categoria | Acadêmico |
| Acesso | RW |
| Descrição | Lista todos os cursos cadastrados no sistema ou inclui um novo curso. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `AcademicInternalID` | string/integer | Sim | ID interno do contexto acadêmico |

**Respostas:**

| Código | GET | POST |
|---|---|---|
| 200 | Lista de cursos | Curso criado |
| 400 | Parâmetros inválidos | Dados inválidos |

---

#### GET/PUT/DELETE /Academics/{AcademicInternalID}/Courses/{InternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/Academics/{AcademicInternalID}/Courses/{InternalId}` |
| Categoria | Acadêmico |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui um curso específico. |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes do curso | Curso alterado | — |
| 204 | — | — | Curso excluído |
| 400 | — | Dados inválidos | — |
| 404 | Não encontrado | Não encontrado | Não encontrado |

---

#### GET/POST /Academics/{AcademicInternalId}/CurriculumGrids

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/Academics/{AcademicInternalId}/CurriculumGrids` |
| Categoria | Acadêmico / Secretaria |
| Acesso | RW |
| Descrição | Lista ou cria matrizes curriculares educacionais. |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de matrizes / matriz criada |
| 400 | Parâmetros inválidos |

---

#### GET/PUT/DELETE /Academics/{AcademicInternalId}/CurriculumGrids/{InternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/Academics/{AcademicInternalId}/CurriculumGrids/{InternalId}` |
| Categoria | Acadêmico / Secretaria |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui uma matriz curricular específica. |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes da matriz | Matriz alterada | — |
| 204 | — | — | Matriz excluída |
| 400 | — | Dados inválidos | — |
| 404 | Não encontrada | Não encontrada | Não encontrada |

---

#### GET/POST /Academics/{AcademicInternalId}/Majors

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/Academics/{AcademicInternalId}/Majors` |
| Categoria | Acadêmico / Secretaria |
| Acesso | RW |
| Descrição | Lista ou cria habilitações educacionais (especializações dentro de um curso). |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de habilitações / habilitação criada |
| 400 | Parâmetros inválidos |

---

#### GET/PUT/DELETE /Academics/{AcademicInternalId}/Majors/{InternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/Academics/{AcademicInternalId}/Majors/{InternalId}` |
| Categoria | Acadêmico / Secretaria |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui uma habilitação específica. |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes da habilitação | Habilitação alterada | — |
| 204 | — | — | Habilitação excluída |
| 400 | — | Dados inválidos | — |
| 404 | Não encontrada | Não encontrada | Não encontrada |

---

#### GET/POST /Academics/{GradeInternalID}/Periods

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/Academics/{GradeInternalID}/Periods` |
| Categoria | Acadêmico |
| Acesso | RW |
| Descrição | Lista ou cria períodos de uma matriz curricular (semestres, anos, módulos). |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `GradeInternalID` | string/integer | Sim | ID interno da grade/matriz curricular |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de períodos / período criado |
| 400 | Parâmetros inválidos |

---

#### GET/PUT/DELETE /Academics/{GradeInternalID}/Periods/{InternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/Academics/{GradeInternalID}/Periods/{InternalId}` |
| Categoria | Acadêmico |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui um período específico de uma matriz. |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes do período | Período alterado | — |
| 204 | — | — | Período excluído |
| 400 | — | Dados inválidos | — |
| 404 | Não encontrado | Não encontrado | Não encontrado |

---

#### GET/POST /Academics/{AcademicInternalID}/terms

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/Academics/{AcademicInternalID}/terms` |
| Categoria | Acadêmico |
| Acesso | RW |
| Descrição | Lista ou cria períodos letivos (anos/semestres letivos da instituição). |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de períodos letivos / período criado |
| 400 | Parâmetros inválidos |

---

#### GET/PUT/DELETE /Academics/{AcademicInternalID}/terms/{InternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/Academics/{AcademicInternalID}/terms/{InternalId}` |
| Categoria | Acadêmico |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui um período letivo específico. |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes do período letivo | Período alterado | — |
| 204 | — | — | Período excluído |
| 400 | — | Dados inválidos | — |
| 404 | Não encontrado | Não encontrado | Não encontrado |

---

#### GET/POST /academics/{AcademicInternalId}/periods/{PeriodInternalId}/griddisciplines

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/academics/{AcademicInternalId}/periods/{PeriodInternalId}/griddisciplines` |
| Categoria | Acadêmico |
| Acesso | RW |
| Descrição | Lista ou adiciona disciplinas em um período específico de uma grade curricular. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `AcademicInternalId` | string/integer | Sim | ID interno do contexto acadêmico |
| `PeriodInternalId` | string/integer | Sim | ID interno do período da grade |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de disciplinas da grade / disciplina adicionada |
| 400 | Parâmetros inválidos |

---

#### GET/PUT/DELETE /academics/{AcademicInternalId}/periods/{PeriodInternalId}/griddisciplines/{InternalId}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/academics/{AcademicInternalId}/periods/{PeriodInternalId}/griddisciplines/{InternalId}` |
| Categoria | Acadêmico |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui uma disciplina específica de um período de grade. |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Detalhes da disciplina da grade | Disciplina alterada | — |
| 204 | — | — | Disciplina excluída |
| 400 | — | Dados inválidos | — |
| 404 | Não encontrada | Não encontrada | Não encontrada |

---

### 4.4 Turmas

> Endpoints de turmas e participantes. Observação: a spec lista esses endpoints no segmento "Recursos Humanos" mas são de uso educacional.

#### GET/POST /classes

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/classes` |
| Categoria | Turmas |
| Acesso | RW |
| Descrição | Lista todas as turmas cadastradas no sistema ou cria uma nova turma. |

**Parâmetros de Query (GET):**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `CompanyCode` | integer | Recomendado | Filtra por coligada |
| `BranchCode` | integer | Recomendado | Filtra por filial |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de turmas / turma criada |
| 400 | Parâmetros inválidos |

---

#### GET/PUT/DELETE /classes/{id}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/classes/{id}` |
| Categoria | Turmas |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui uma turma específica. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string/integer | Sim | ID interno da turma |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Dados da turma | Turma alterada | Turma excluída |
| 400 | Parâmetros inválidos | Dados inválidos | Parâmetros inválidos |

---

#### GET/POST /classParticipants

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `POST` |
| Path completo | `/api/educational/v1/classParticipants` |
| Categoria | Turmas |
| Acesso | RW |
| Descrição | Lista todos os participantes de turmas cadastrados ou adiciona um novo participante. |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de participantes / participante adicionado |
| 400 | Parâmetros inválidos |

---

#### GET/PUT/DELETE /classParticipants/{id}

| Propriedade | Valor |
|---|---|
| Métodos | `GET`, `PUT`, `DELETE` |
| Path completo | `/api/educational/v1/classParticipants/{id}` |
| Categoria | Turmas |
| Acesso | RW |
| Descrição | Consulta, altera ou exclui um participante de turma específico. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | string/integer | Sim | ID interno do registro de participante |

**Respostas:**

| Código | GET | PUT | DELETE |
|---|---|---|---|
| 200 | Dados do participante | Participante alterado | Participante excluído |
| 400 | Parâmetros inválidos | Dados inválidos | — |
| 405 | — | — | Método não permitido (validar) |

---

### 4.5 Relatórios

#### GET /EducationalReports

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/EducationalReports` |
| Categoria | Relatórios |
| Acesso | R |
| Descrição | Retorna a lista de todos os relatórios educacionais disponíveis/parametrizados na base. Usado para obter o `EducationalReportId` necessário para gerar o relatório. |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de relatórios educacionais disponíveis |
| 400 | Parâmetros inválidos |

---

#### POST /EducationalReports/{EducationalReportId}/ViewEducationalReports

| Propriedade | Valor |
|---|---|
| Método | `POST` |
| Path completo | `/api/educational/v1/EducationalReports/{EducationalReportId}/ViewEducationalReports` |
| Categoria | Relatórios |
| Acesso | RW |
| Descrição | Gera e retorna o relatório educacional especificado. Retorna conteúdo binário (PDF ou formato configurado). |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `EducationalReportId` | string/integer | Sim | ID do relatório (obtido via GET /EducationalReports) |

**Body:** JSON com parâmetros do relatório (filtros, datas, turmas, etc. — variam por relatório).

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Conteúdo do relatório (binário/PDF) |
| 400 | Parâmetros inválidos ou relatório não encontrado |

> **Importante:** A resposta é binária (PDF). O Content-Type da resposta deve ser verificado. O frontend deve tratar como download ou exibição em iframe, não como JSON.

---

### 4.6 Processo Seletivo

#### GET /SelectionProcesses/SelectionProcessExplorer

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/SelectionProcesses/SelectionProcessExplorer` |
| Categoria | Processo Seletivo |
| Acesso | R |
| Descrição | Retorna os processos seletivos disponíveis (venda online de cursos). Usado para o portal de inscrições. |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de processos seletivos disponíveis |
| 403 | Acesso não autorizado |
| 404 | Nenhum processo seletivo encontrado |

---

#### GET /SelectionProcesses/{SelectionProcessId}/AvailableCourses

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/SelectionProcesses/{SelectionProcessId}/AvailableCourses` |
| Categoria | Processo Seletivo |
| Acesso | R |
| Descrição | Retorna todas as áreas de interesse (cursos) ofertadas em um processo seletivo específico. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `SelectionProcessId` | string/integer | Sim | ID do processo seletivo |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de cursos ofertados no processo seletivo |
| 400 | Parâmetros inválidos |

---

#### GET /SelectionProcesses/{SelectionProcessId}/AvailableCourses/{AvailableCourseId}

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/SelectionProcesses/{SelectionProcessId}/AvailableCourses/{AvailableCourseId}` |
| Categoria | Processo Seletivo |
| Acesso | R |
| Descrição | Retorna detalhes de uma área de interesse ofertada específica em um processo seletivo. |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Detalhes do curso ofertado |
| 400 | Parâmetros inválidos |

---

#### GET /ApplicantResults/{Id}

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/ApplicantResults/{Id}` |
| Categoria | Processo Seletivo |
| Acesso | R |
| Descrição | Retorna detalhes do resultado de um candidato no processo seletivo (aprovado, reprovado, classificação, nota). |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Id` | string/integer | Sim | ID do resultado do candidato |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Detalhes do resultado do candidato |
| 403 | Acesso não autorizado |
| 404 | Resultado não encontrado |

---

> **Nota:** Não foram identificados endpoints para `InscriptionFiles` na spec atual. Verificar se existe endpoint separado não catalogado.

---

### 4.7 Biblioteca

> Endpoints de biblioteca para gestão de empréstimos, reservas e renovações de publicações.

#### GET /Publications

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Publications` |
| Categoria | Biblioteca |
| Acesso | R |
| Descrição | Retorna todas as publicações disponíveis no acervo da biblioteca, de acordo com filtros aplicados. |

**Parâmetros de Query:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `SearchField` | string | Opcional | Termo de busca para filtrar publicações por título, autor, ISBN, etc. |
| `CompanyCode` | integer | Recomendado | Código da coligada |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de publicações filtradas |
| 400 | Parâmetros inválidos |

---

#### GET /Publications/{PublicationInternalId}

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `/api/educational/v1/Publications/{PublicationInternalId}` |
| Categoria | Biblioteca |
| Acesso | R |
| Descrição | Retorna detalhes de uma publicação específica do acervo. |

**Parâmetros de Path:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `PublicationInternalId` | string/integer | Sim | ID interno da publicação |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Detalhes da publicação |
| 404 | Publicação não encontrada |

---

> **Nota:** Os endpoints `bookloans`, `bookings`, `CancelBookings`, `RenewBookLoans` são referenciados no contexto do sistema mas não aparecem explicitamente na spec JSON carregada. Podem estar em specs separadas não incluídas neste conjunto. Verificar com equipe TOTVS.

---

### 4.8 Publicações

> Veja seção 4.7 — o endpoint `/Publications` cobre tanto o acervo da biblioteca quanto publicações gerais do Educacional.

---

### 4.9 Framework (não-educacional)

> Endpoints base do framework RM, usados para obter estrutura organizacional (coligadas e filiais).

#### GET /api/framework/v1/companies

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `https://raizeducacao160289.rm.cloudtotvs.com.br:8051/api/framework/v1/companies` |
| Categoria | Framework |
| Acesso | R |
| Descrição | Retorna todas as coligadas (empresas) cadastradas no sistema RM. Usado para popular seletores de contexto e obter `CompanyCode` válidos. |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de coligadas (testado: 20 coligadas retornadas) |
| 401 | Credenciais inválidas |
| 403 | Acesso não autorizado |

---

#### GET /api/framework/v1/branches

| Propriedade | Valor |
|---|---|
| Método | `GET` |
| Path completo | `https://raizeducacao160289.rm.cloudtotvs.com.br:8051/api/framework/v1/branches` |
| Categoria | Framework |
| Acesso | R |
| Descrição | Retorna as filiais de uma coligada específica. Usado para popular seletores de filial e obter `BranchCode` válidos. |

**Parâmetros de Query:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `CompanyCode` | integer/string | Sim | Código da coligada (ex: `N` para QI) |

**Respostas:**

| Código | Significado |
|---|---|
| 200 | Lista de filiais da coligada (testado: 10 filiais para QI) |
| 401 | Credenciais inválidas |
| 403 | Acesso não autorizado |

---

## 5. Limitações Conhecidas

### 5.1 Arquitetura User-Context

A maioria dos endpoints educacionais são **user-context-based**: retornam dados relativos ao usuário autenticado, não permitem listar dados globais.

| Endpoint | Comportamento com usuário admin |
|---|---|
| `GET /StudentContexts` | Retorna 0 resultados (admin não é aluno) |
| `GET /ProfessorContexts` | Retorna 0 resultados (admin não é professor) |
| Demais endpoints `/students/{id}/...` | Requerem ID válido de aluno com perfil correto |
| Demais endpoints `/professors/{id}/...` | Requerem ID válido de professor com perfil correto |

**Implicação para o frontend:** Para funcionalidades administrativas que precisam listar todos os alunos ou professores, é necessário acesso direto ao banco de dados SQL via queries específicas. A API REST não oferece endpoints de listagem global.

### 5.2 Ausência de Endpoints Administrativos/Bulk

Não existem endpoints REST para:

| Funcionalidade ausente | Workaround necessário |
|---|---|
| Listar todos os alunos matriculados | Query SQL direta (SALUNO, SHABILITACAOALUNO) |
| Listar todas as matrículas | Query SQL direta |
| Listar todos os professores | Query SQL direta |
| Buscar aluno por CPF/nome | Query SQL direta |
| Dashboard com métricas gerais | Query SQL direta + agregação |
| Frequência/faltas por turma | Query SQL direta |
| Notas/boletim global | Query SQL direta |

### 5.3 Operações de Escrita Disponíveis

| Entidade | Operações REST disponíveis |
|---|---|
| Provas/Avaliações | CRUD completo (via professor) |
| Ocorrências do aluno | CRUD completo (via professor) |
| Prédios | CRUD completo (via professor) |
| Blocos | CRUD completo (via professor) |
| Turmas | CRUD completo |
| Participantes de Turma | CRUD completo |
| Cursos | CRUD completo (via acadêmico) |
| Matrizes Curriculares | CRUD completo (via acadêmico) |
| Habilitações | CRUD completo (via acadêmico) |
| Períodos | CRUD completo (via acadêmico) |
| Períodos Letivos | CRUD completo (via acadêmico) |
| Disciplinas da Grade | CRUD completo (via acadêmico) |
| Relatórios | Somente geração (POST) |
| Salas | Somente leitura (GET) |
| Turnos | Somente leitura (GET) |

### 5.4 Relatórios

- Relatórios são gerados via `POST /EducationalReports/{id}/ViewEducationalReports`
- A resposta é **binária (PDF)**, não JSON
- Parâmetros variam por relatório — não documentados na spec
- Necessário testar cada relatório individualmente em DEV para identificar payload esperado

### 5.5 Inconsistências de Casing nas URLs

A API TOTVS apresenta inconsistência de casing nas rotas:

| Padrão | Exemplos |
|---|---|
| PascalCase | `/StudentContexts`, `/ProfessorContexts`, `/Buildings`, `/Blocks` |
| camelCase | `/classParticipants`, `/classes`, `/classShifts` |
| lowercase | `/academics/`, `/students/`, `/professors/` |

**Atenção:** Sempre usar o path exato documentado na spec. Algumas implementações podem ser case-sensitive.

---

## 6. Matriz de Cobertura

Mapeamento entre funcionalidades do frontend e disponibilidade via API REST vs. SQL direto.

| Funcionalidade Frontend | Endpoint REST Disponível | Cobertura | Requer SQL Direto |
|---|---|---|---|
| Login / Autenticação | Basic Auth (sem endpoint específico) | Parcial | Não |
| Contexto do aluno logado | `GET /StudentContexts` | Total | Não |
| Contexto do professor logado | `GET /ProfessorContexts` | Total | Não |
| Calendário do aluno | `GET /Students/{id}/CalendarEvents` | Total | Não |
| Plano de aulas do aluno | `GET /Students/{id}/LessonPlans` | Total | Não |
| Ocorrências do aluno (leitura) | `GET /Students/{id}/studentwarnings` | Total | Não |
| Ocorrências do aluno (escrita) | `POST/PUT/DELETE /Professors/{id}/studentwarnings` | Total | Não |
| Atividades ofertadas | `GET /students/{id}/offeredactivities` | Total | Não |
| Simulação de parcelas | `POST /students/{id}/paymentplans/{id}/simulations` | Total | Não |
| Turmas do professor | `GET /Professors/{id}/disciplineclasses` | Total | Não |
| Provas/Avaliações | CRUD via `/professors/{id}/assignments` | Total | Não |
| Grupos de ocorrências | `GET /Professors/{id}/StudentWarningGroups` | Leitura | Não |
| Prédios, Blocos, Salas | CRUD via `/Professors/{id}/Buildings/...` | Total | Não |
| Turnos | `GET /Professors/{id}/classShifts` | Leitura | Não |
| Turmas (CRUD) | `GET/POST/PUT/DELETE /classes` | Total | Não |
| Participantes de turma | CRUD via `/classParticipants` | Total | Não |
| Cursos | CRUD via `/Academics/{id}/Courses` | Total | Não |
| Matrizes Curriculares | CRUD via `/Academics/{id}/CurriculumGrids` | Total | Não |
| Habilitações | CRUD via `/Academics/{id}/Majors` | Total | Não |
| Períodos de grade | CRUD via `/Academics/{id}/Periods` | Total | Não |
| Períodos letivos | CRUD via `/Academics/{id}/terms` | Total | Não |
| Disciplinas da grade | CRUD via `/academics/{id}/periods/{id}/griddisciplines` | Total | Não |
| Relatórios educacionais | `GET /EducationalReports` + `POST /ViewEducationalReports` | Total | Não |
| Processos seletivos | `GET /SelectionProcesses/SelectionProcessExplorer` | Leitura | Não |
| Cursos ofertados (seletivo) | `GET /SelectionProcesses/{id}/AvailableCourses` | Leitura | Não |
| Resultado de candidato | `GET /ApplicantResults/{id}` | Leitura | Não |
| Publicações da biblioteca | `GET /Publications` | Leitura | Não |
| Coligadas/Empresas | `GET /api/framework/v1/companies` | Total | Não |
| Filiais | `GET /api/framework/v1/branches` | Total | Não |
| **Listagem global de alunos** | Inexistente | **Nenhuma** | **Sim** |
| **Busca de aluno por CPF/nome** | Inexistente | **Nenhuma** | **Sim** |
| **Matrículas/Histórico acadêmico** | Inexistente | **Nenhuma** | **Sim** |
| **Frequência/Faltas por turma** | Inexistente | **Nenhuma** | **Sim** |
| **Boletim/Notas (admin view)** | Inexistente | **Nenhuma** | **Sim** |
| **Dashboard gerencial** | Inexistente | **Nenhuma** | **Sim** |
| **Financeiro/Parcelas (admin)** | Inexistente (exceto simulação) | **Parcial** | **Sim** |
| Empréstimos de livros | Não confirmado na spec | Indefinido | A validar |
| Reservas de livros | Não confirmado na spec | Indefinido | A validar |

---

## 7. Endpoints Testados (Ambiente DEV)

Resultados de testes realizados diretamente no ambiente de desenvolvimento TOTVS RM.

| Endpoint | Método | Status HTTP | Resultado | Observações |
|---|---|---|---|---|
| `/api/framework/v1/companies` | GET | 200 | 20 coligadas retornadas | Funcional com credenciais admin |
| `/api/framework/v1/branches?CompanyCode=N` | GET | 200 | 10 filiais para QI | `CompanyCode=N` é o código da QI Faculdade & Escola |
| `/api/educational/v1/StudentContexts` | GET | 200 | 0 resultados | Esperado — usuário admin não tem perfil de aluno |
| `/api/educational/v1/ProfessorContexts` | GET | 200 | 0 resultados | Esperado — usuário admin não tem perfil de professor |

### Próximos Testes Necessários

| Endpoint | Prioridade | Dependência |
|---|---|---|
| `/api/educational/v1/StudentContexts` | Alta | Credencial de usuário aluno |
| `/api/educational/v1/ProfessorContexts` | Alta | Credencial de usuário professor |
| `/api/educational/v1/EducationalReports` | Alta | Qualquer credencial válida |
| `/api/educational/v1/classes` | Média | Qualquer credencial válida |
| `/api/educational/v1/Publications` | Média | Qualquer credencial válida |
| `/api/educational/v1/SelectionProcesses/SelectionProcessExplorer` | Média | Qualquer credencial válida |
| Rate limit (stress test) | Baixa | Após endpoints core validados |

---

---

## Módulo Financeiro

### FLAN — Lançamentos Financeiros

| Campo | Método | Endpoint | Descrição |
|-------|--------|----------|-----------|
| Listar parcelas | GET | `/api/financeiro/v1/flan?codColigada={id}&codAluno={ra}` | Lista lançamentos financeiros do aluno |
| Parcela por ID | GET | `/api/financeiro/v1/flan/{idLan}` | Detalhe de um lançamento |
| Parcelas vencidas | GET | `/api/financeiro/v1/flan?status=vencida&codColigada={id}` | Filtro por status |

**Query params:** `codColigada` (obrigatório), `codAluno`, `status` (em_dia, vencida, paga, renegociada), `competenciaInicio`, `competenciaFim`, `page`, `pageSize`

### FBOL — Boletos

| Campo | Método | Endpoint | Descrição |
|-------|--------|----------|-----------|
| Gerar 2ª via | POST | `/api/financeiro/v1/fbol/segunda-via` | Gera boleto atualizado |
| Listar boletos | GET | `/api/financeiro/v1/fbol?codColigada={id}&idLan={idLan}` | Boletos vinculados ao lançamento |

**Body (2ª via):** `{ "codColigada": number, "idLan": number }`
**Response:** `{ "linhaDigitavel": string, "codigoBarras": string, "vencimento": string, "valor": number }`

### SBOLSAS — Bolsas e Descontos

| Campo | Método | Endpoint | Descrição |
|-------|--------|----------|-----------|
| Listar bolsas | GET | `/api/educacional/v1/sbolsas?codColigada={id}` | Todas as bolsas ativas e inativas |
| Bolsa por aluno | GET | `/api/educacional/v1/sbolsas?codColigada={id}&ra={ra}` | Bolsas do aluno |

**Query params:** `codColigada`, `ra`, `tipo` (integral, parcial, merito, social, convenio, funcionario), `ativa` (true/false), `page`, `pageSize`

### FCFO — Contratos / Fichas Financeiras

| Campo | Método | Endpoint | Descrição |
|-------|--------|----------|-----------|
| Listar contratos | GET | `/api/financeiro/v1/fcfo?codColigada={id}` | Contratos educacionais |
| Contrato por ID | GET | `/api/financeiro/v1/fcfo/{codCfo}` | Detalhe do contrato |

**Query params:** `codColigada`, `status` (ativo, encerrado, cancelado, pendente_assinatura), `anoLetivo`, `page`, `pageSize`

### Prioridade de Validação — Financeiro

| Endpoint | Prioridade | Observação |
|----------|-----------|-----------|
| GET /flan (parcelas) | Alta | Core do módulo financeiro |
| POST /fbol/segunda-via | Alta | Funcionalidade crítica para pais |
| GET /sbolsas | Média | Gestão interna |
| GET /fcfo | Média | Gestão interna |

---

*Documento gerado em 2026-03-20. Atualizado em 2026-03-21 com endpoints financeiros (FLAN, FBOL, SBOLSAS, FCFO). Baseado em specs OpenAPI 3.0.1 do portal TOTVS + testes em ambiente DEV.*
