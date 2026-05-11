# DOC 6 — Contrato de API do Frontend (BFF)

> Frontend TOTVS Educacional — Definição da API interna entre React e Server Actions/Route Handlers.
> Padrão: Next.js 16 Server Actions + Route Handlers, tipagem com TypeScript, validação com Zod.

---

## 1. Arquitetura BFF

```
Client (React)                    Server (Next.js)                    Data
┌─────────────────┐              ┌─────────────────────┐             ┌──────────┐
│ useServerAction  │─ invoke ──→ │ Server Action        │── SQL ───→ │ TOTVS RM │
│ or fetch()       │             │ (app/actions/*.ts)   │             │ (MSSQL)  │
│                  │← response ─│                      │← result ──│          │
│ Client           │             │ Service Layer        │             │          │
│ Components       │             │ ├── validation (Zod) │             │          │
│                  │             │ ├── auth check       │             │          │
│                  │             │ ├── CODCOLIGADA inject│            │          │
│                  │             │ ├── cache check      │             │          │
│                  │             │ └── query execute    │             │          │
└─────────────────┘              └─────────────────────┘             └──────────┘
                                 ┌─────────────────────┐             ┌──────────┐
                                 │ Route Handler        │── HTTP ──→ │ TOTVS RM │
                                 │ (app/api/**/*.ts)    │             │ REST API │
                                 │ → PDF reports only   │← PDF ────│          │
                                 └─────────────────────┘             └──────────┘
```

### Decisão: Server Actions vs Route Handlers
- **Server Actions** (default): todas as operações de dados (CRUD via SQL)
- **Route Handlers**: apenas relatórios PDF (proxy para API REST TOTVS RM)

---

## 2. Tipos Compartilhados (TypeScript)

### 2.1 Base Types

```typescript
// types/common.ts

/** Resposta padrão de Server Action */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'TOTVS_ERROR'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR';

/** Resposta paginada */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

/** Parâmetros de paginação */
export interface PaginationParams {
  page?: number;      // default: 1
  pageSize?: number;  // default: 50, max: 50
}

/** Parâmetros de busca com filtro */
export interface SearchParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Contexto de escola (injetado pelo auth layer) */
export interface EscolaContext {
  codColigada: number;
  codFilial: number;
  periodoLetivo: string;
}
```

### 2.2 Domain Types — Alunos

```typescript
// types/aluno.ts
import { z } from 'zod';

export const alunoResumoSchema = z.object({
  ra: z.string(),
  nome: z.string(),
  cpf: z.string().nullable(),
  dataNascimento: z.string().nullable(),
  turma: z.string().nullable(),
  serie: z.string().nullable(),
  statusMatricula: z.enum(['A', 'P', 'T', 'C', 'E']),  // Ativa, Pendente, Trancada, Cancelada, Evadida
  codTurma: z.string().nullable(),
});
export type AlunoResumo = z.infer<typeof alunoResumoSchema>;

export const alunoDetalheSchema = z.object({
  ra: z.string(),
  nome: z.string(),
  nomeSocial: z.string().nullable(),
  cpf: z.string().nullable(),
  dataNascimento: z.string().nullable(),
  sexo: z.enum(['M', 'F']).nullable(),
  nomePai: z.string().nullable(),
  nomeMae: z.string().nullable(),
  email: z.string().nullable(),
  telefone: z.string().nullable(),
  endereco: z.string().nullable(),
  bairro: z.string().nullable(),
  cidade: z.string().nullable(),
  uf: z.string().nullable(),
  cep: z.string().nullable(),
  nacionalidade: z.string().nullable(),
  naturalidade: z.string().nullable(),
});
export type AlunoDetalhe = z.infer<typeof alunoDetalheSchema>;

export const fichaAlunoSchema = z.object({
  dadosPessoais: alunoDetalheSchema,
  matriculaAtual: z.object({
    codCurso: z.string(),
    codHabilitacao: z.string(),
    codGrade: z.string(),
    codTurma: z.string().nullable(),
    codPeriodoLetivo: z.string(),
    status: z.string(),
    dataInicio: z.string().nullable(),
    dataFim: z.string().nullable(),
    turma: z.string().nullable(),
    serie: z.string().nullable(),
    curso: z.string().nullable(),
  }).nullable(),
  notas: z.array(z.object({
    disciplina: z.string(),
    etapa: z.string(),
    nota: z.number().nullable(),
    situacao: z.string().nullable(),
  })),
  frequencia: z.array(z.object({
    disciplina: z.string(),
    totalAulas: z.number(),
    presencas: z.number(),
    faltas: z.number(),
    faltasJustificadas: z.number(),
    percentualFreq: z.number(),
  })),
  ocorrencias: z.array(z.object({
    codOcorrencia: z.number(),
    data: z.string(),
    tipo: z.string(),
    descricao: z.string(),
    status: z.string(),
    professor: z.string().nullable(),
  })),
  historicoMatriculas: z.array(z.object({
    ano: z.number(),
    serie: z.string().nullable(),
    turma: z.string().nullable(),
    status: z.string(),
    dataInicio: z.string().nullable(),
    dataFim: z.string().nullable(),
  })),
});
export type FichaAluno = z.infer<typeof fichaAlunoSchema>;
```

### 2.3 Domain Types — Turmas

```typescript
// types/turma.ts
import { z } from 'zod';

export const turmaSchema = z.object({
  codTurma: z.string(),
  nome: z.string(),
  serie: z.string().nullable(),
  codTurno: z.string().nullable(),
  capacidade: z.number(),
  qtdAlunos: z.number(),
  professorRegente: z.string().nullable(),
  status: z.string(),
});
export type Turma = z.infer<typeof turmaSchema>;

export const alunoTurmaSchema = z.object({
  ra: z.string(),
  nome: z.string(),
  cpf: z.string().nullable(),
  statusMatricula: z.string(),
  numeroChamada: z.number(),
});
export type AlunoTurma = z.infer<typeof alunoTurmaSchema>;
```

### 2.4 Domain Types — Notas & Frequência

```typescript
// types/pedagogico.ts
import { z } from 'zod';

export const etapaSchema = z.object({
  codEtapa: z.string(),
  nome: z.string(),
  tipo: z.string(),
  peso: z.number(),
  dataIni: z.string(),
  dataFim: z.string(),
});
export type Etapa = z.infer<typeof etapaSchema>;

export const notaAlunoSchema = z.object({
  ra: z.string(),
  nome: z.string(),
  codEtapa: z.string(),
  nota: z.number().nullable(),
  situacao: z.string().nullable(),
});
export type NotaAluno = z.infer<typeof notaAlunoSchema>;

export const lancarNotaInputSchema = z.object({
  ra: z.string().min(1),
  codDisc: z.string().min(1),
  codTurma: z.string().min(1),
  codEtapa: z.string().min(1),
  nota: z.number().min(0).max(10),
});
export type LancarNotaInput = z.infer<typeof lancarNotaInputSchema>;

export const frequenciaSchema = z.object({
  ra: z.string(),
  nome: z.string(),
  foto: z.string().nullable(),
  numeroChamada: z.number(),
  frequenciaAtual: z.enum(['P', 'F', 'FJ', 'FA']).nullable(),
});
export type FrequenciaAluno = z.infer<typeof frequenciaSchema>;

export const registrarFrequenciaInputSchema = z.object({
  codTurma: z.string().min(1),
  codDisc: z.string().min(1),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  aula: z.number().int().min(1),
  registros: z.array(z.object({
    ra: z.string().min(1),
    tipo: z.enum(['P', 'F', 'FJ']),
  })),
});
export type RegistrarFrequenciaInput = z.infer<typeof registrarFrequenciaInputSchema>;

export const ocorrenciaInputSchema = z.object({
  ra: z.string().min(1),
  codDisc: z.string().nullable(),
  codTurma: z.string().min(1),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipo: z.enum(['ATRASO', 'INDISCIPLINA', 'MERITO', 'OBSERVACAO', 'OUTRO']),
  descricao: z.string().min(10).max(2000),
});
export type OcorrenciaInput = z.infer<typeof ocorrenciaInputSchema>;
```

### 2.5 Domain Types — Dashboard

```typescript
// types/dashboard.ts
import { z } from 'zod';

export const dashboardSecretariaSchema = z.object({
  totalAlunos: z.number(),
  totalTurmas: z.number(),
  frequenciaMedia: z.number(),
  matriculasPendentes: z.number(),
  matriculasPorSerie: z.array(z.object({
    serie: z.string(),
    total: z.number(),
  })),
});
export type DashboardSecretaria = z.infer<typeof dashboardSecretariaSchema>;

export const dashboardProfessorSchema = z.object({
  turmasHoje: z.array(z.object({
    codTurma: z.string(),
    turma: z.string(),
    disciplina: z.string(),
    horario: z.string(),
    chamadaFeita: z.boolean(),
  })),
  pendencias: z.array(z.object({
    turma: z.string(),
    disciplina: z.string(),
    etapa: z.string(),
    prazo: z.string(),
    totalAlunos: z.number(),
    notasLancadas: z.number(),
  })),
});
export type DashboardProfessor = z.infer<typeof dashboardProfessorSchema>;
```

### 2.6 Domain Types — Estrutura Acadêmica

```typescript
// types/academico.ts
import { z } from 'zod';

export const cursoSchema = z.object({
  codCurso: z.string(),
  nome: z.string(),
  habilitacoes: z.array(z.object({
    codHabilitacao: z.string(),
    nome: z.string(),
    grades: z.array(z.object({
      codGrade: z.string(),
      nome: z.string(),
      ativo: z.boolean(),
    })),
  })),
});
export type Curso = z.infer<typeof cursoSchema>;

export const disciplinaGradeSchema = z.object({
  periodo: z.number(),
  codDisc: z.string(),
  nome: z.string(),
  cargaHoraria: z.number(),
  tipo: z.string(),
});
export type DisciplinaGrade = z.infer<typeof disciplinaGradeSchema>;

export const periodoLetivoSchema = z.object({
  codPeriodoLetivo: z.string(),
  nome: z.string(),
  ano: z.number(),
  dataIni: z.string(),
  dataFim: z.string(),
  ativo: z.boolean(),
});
export type PeriodoLetivo = z.infer<typeof periodoLetivoSchema>;

export const calendarioEventoSchema = z.object({
  data: z.string(),
  tipo: z.enum(['LETIVO', 'FERIADO', 'RECESSO', 'PLANEJAMENTO', 'CONSELHO', 'EVENTO']),
  descricao: z.string(),
});
export type CalendarioEvento = z.infer<typeof calendarioEventoSchema>;

export const coligadaSchema = z.object({
  codColigada: z.number(),
  nome: z.string(),
  cidade: z.string().nullable(),
  uf: z.string().nullable(),
});
export type Coligada = z.infer<typeof coligadaSchema>;

export const filialSchema = z.object({
  codFilial: z.number(),
  nome: z.string(),
  endereco: z.string().nullable(),
  cidade: z.string().nullable(),
  uf: z.string().nullable(),
});
export type Filial = z.infer<typeof filialSchema>;
```

---

## 3. Server Actions — Catálogo Completo

### 3.1 Secretaria

| Action | Input | Output | Cache | Perfil |
|--------|-------|--------|-------|--------|
| `getDashboardSecretaria()` | — | `ActionResult<DashboardSecretaria>` | 5min | secretaria, coord, diretor |
| `getAlunos(params)` | `SearchParams & { codTurma?, codHabilitacao?, status? }` | `ActionResult<PaginatedResult<AlunoResumo>>` | 30s | secretaria, coord |
| `getFichaAluno(ra)` | `{ ra: string }` | `ActionResult<FichaAluno>` | 5min | secretaria, coord, professor (own) |
| `getTurmas()` | — | `ActionResult<Turma[]>` | 5min | secretaria, coord |
| `getAlunosTurma(codTurma)` | `{ codTurma: string }` | `ActionResult<AlunoTurma[]>` | 5min | secretaria, coord, professor (own) |
| `getAlunosSemTurma()` | — | `ActionResult<AlunoResumo[]>` | 30s | secretaria |
| `getTurmasComVagas()` | — | `ActionResult<(Turma & { vagasDisponiveis: number })[]>` | 30s | secretaria |
| `enturmarAluno(ra, codTurma)` | `{ ra: string; codTurma: string }` | `ActionResult<void>` | invalidate | secretaria |

### 3.2 Pedagógico

| Action | Input | Output | Cache | Perfil |
|--------|-------|--------|-------|--------|
| `getDashboardProfessor()` | — | `ActionResult<DashboardProfessor>` | 30s | professor, coord |
| `getAlunosChamada(codTurma, codDisc, data)` | `{ codTurma, codDisc, data }` | `ActionResult<FrequenciaAluno[]>` | 30s | professor (own), coord |
| `registrarFrequencia(input)` | `RegistrarFrequenciaInput` | `ActionResult<void>` | invalidate | professor (own) |
| `getNotasTurma(codTurma, codDisc, codEtapa)` | `{ codTurma, codDisc, codEtapa }` | `ActionResult<NotaAluno[]>` | 30s | professor (own), coord |
| `lancarNota(input)` | `LancarNotaInput` | `ActionResult<void>` | invalidate | professor (own), coord (override) |
| `lancarNotasBatch(notas)` | `LancarNotaInput[]` | `ActionResult<{ saved: number; errors: string[] }>` | invalidate | professor (own) |
| `getEtapas()` | — | `ActionResult<Etapa[]>` | 15min | todos |
| `getOcorrencias(params)` | `SearchParams & { codTurma?, tipo?, dataIni?, dataFim? }` | `ActionResult<PaginatedResult<Ocorrencia>>` | 30s | professor, coord |
| `criarOcorrencia(input)` | `OcorrenciaInput` | `ActionResult<{ codOcorrencia: number }>` | invalidate | professor, coord |

### 3.3 Estrutura Acadêmica

| Action | Input | Output | Cache | Perfil |
|--------|-------|--------|-------|--------|
| `getCursos()` | — | `ActionResult<Curso[]>` | 15min | todos |
| `getDisciplinasGrade(codGrade)` | `{ codGrade: string }` | `ActionResult<DisciplinaGrade[]>` | 15min | todos |
| `getPeriodosLetivos()` | — | `ActionResult<PeriodoLetivo[]>` | 1h | todos |
| `getCalendario(dataIni, dataFim)` | `{ dataIni: string; dataFim: string }` | `ActionResult<CalendarioEvento[]>` | 1h | todos |

### 3.4 Escola / Multi-tenant

| Action | Input | Output | Cache | Perfil |
|--------|-------|--------|-------|--------|
| `getColigadas()` | — | `ActionResult<Coligada[]>` | 1h | admin |
| `getFiliais(codColigada)` | `{ codColigada: number }` | `ActionResult<Filial[]>` | 1h | admin, diretor |

### 3.5 Autocomplete

| Action | Input | Output | Cache | Perfil |
|--------|-------|--------|-------|--------|
| `searchAlunos(term)` | `{ term: string }` | `ActionResult<Pick<AlunoResumo, 'ra' \| 'nome' \| 'cpf'>[]>` | 30s | secretaria, coord |
| `searchTurmas(term)` | `{ term: string }` | `ActionResult<Pick<Turma, 'codTurma' \| 'nome' \| 'serie'>[]>` | 30s | todos |

---

## 4. Route Handlers

### 4.1 Relatórios PDF

```typescript
// app/api/relatorios/[reportId]/route.ts

// POST /api/relatorios/:reportId
// Body: { ra?: string, codTurma?: string }
// Response: application/pdf (stream)
// Auth: secretaria, coordenador, diretor

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
): Promise<Response> {
  // 1. Auth check (Clerk)
  // 2. Get escola context (codColigada, codFilial)
  // 3. Proxy to TOTVS RM REST API:
  //    POST /api/educational/v1/EducationalReports/{reportId}/ViewEducationalReports
  // 4. Stream PDF response back to client
}
```

---

## 5. Tratamento de Erros Padronizado

### 5.1 Error Codes

| Code | HTTP equiv. | Descrição | Ação do client |
|------|------------|-----------|----------------|
| `UNAUTHORIZED` | 401 | Sessão expirada | Redirect para login |
| `FORBIDDEN` | 403 | Sem permissão | Toast error + disable action |
| `NOT_FOUND` | 404 | Recurso não encontrado | Toast + redirect para lista |
| `VALIDATION_ERROR` | 400 | Dados inválidos | Mostrar erros inline |
| `TOTVS_ERROR` | 502 | Erro na conexão MSSQL | Toast error + retry button |
| `TIMEOUT` | 504 | Query timeout | Toast error + retry button |
| `INTERNAL_ERROR` | 500 | Erro interno | Toast error + report button |

### 5.2 Padrão de Error Handling

```typescript
// lib/actions/utils.ts

export async function safeAction<T>(
  fn: () => Promise<T>,
  context: string
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    if (error instanceof DbExecutionError) {
      if (error.code === 'TIMEOUT') {
        return { success: false, error: `Timeout ao buscar ${context}`, code: 'TIMEOUT' };
      }
      if (error.code === 'CONNECTION_ERROR') {
        return { success: false, error: 'Conexão com TOTVS indisponível', code: 'TOTVS_ERROR' };
      }
    }
    console.error(`[${context}]`, error);
    return { success: false, error: 'Erro interno', code: 'INTERNAL_ERROR' };
  }
}
```

---

## 6. Rate Limiting

| Tipo de ação | Limite | Window |
|-------------|--------|--------|
| Leitura (GET-like) | 100 req/min | Por usuário |
| Escrita (mutation) | 30 req/min | Por usuário |
| Autocomplete | 60 req/min | Por usuário |
| Relatório PDF | 10 req/min | Por usuário |

Implementação: middleware com Upstash Redis rate limiter.

---

## 7. Convenções de Implementação

### File Structure
```
app/
  actions/
    secretaria.ts      # getDashboardSecretaria, getAlunos, etc.
    pedagogico.ts      # getDashboardProfessor, registrarFrequencia, etc.
    academico.ts       # getCursos, getEtapas, etc.
    escola.ts          # getColigadas, getFiliais
  api/
    relatorios/
      [reportId]/
        route.ts       # PDF proxy
lib/
  totvs/
    connection.ts      # MssqlDbExecutor (adapted from raiz-platform)
    cache.ts           # In-memory cache with TTL levels
    queries/
      alunos.ts        # SQL queries for alunos
      turmas.ts        # SQL queries for turmas
      notas.ts         # SQL queries for notas
      frequencia.ts    # SQL queries for frequência
      academico.ts     # SQL queries for academic structure
    config.ts          # TOTVS_CONFIG (timeouts, cache TTLs)
  auth/
    permissions.ts     # Profile-based permission checks
    escola-context.ts  # CODCOLIGADA/CODFILIAL resolution
types/
  common.ts
  aluno.ts
  turma.ts
  pedagogico.ts
  dashboard.ts
  academico.ts
```

### Naming Convention
- Server Actions: `get*` (reads), `criar*` (create), `atualizar*` (update), verbos em PT-BR
- Types: PascalCase em PT-BR (`AlunoResumo`, `DashboardProfessor`)
- Schemas: camelCase + `Schema` suffix (`alunoResumoSchema`)
- SQL queries: functions that return SQL string, named `sql*` (`sqlListarAlunos`)

---

## Server Actions — Módulo Financeiro

### `getFinanceiroKPIs(codColigada: number)`
- **Retorno:** `FinanceiroKPIs`
- **SQL:** Agregação FLAN + SBOLSAS + SALUNOS
- **Cache:** 5 min

### `getParcelasAluno(codColigada: number, ra: string)`
- **Retorno:** `Parcela[]`
- **SQL:** SELECT FLAN WHERE RA = @ra
- **Cache:** sem cache (real-time)

### `getAgingInadimplencia(codColigada: number)`
- **Retorno:** `AgingData[]`
- **SQL:** Agregação FLAN com DATEDIFF
- **Cache:** 5 min

### `getInadimplenciaPorTurma(codColigada: number)`
- **Retorno:** `InadimplenciaPorTurma[]`
- **SQL:** JOIN FLAN + STURMADISC
- **Cache:** 5 min

### `getBolsas(codColigada: number, filtros?: { ra?, tipo?, ativa? })`
- **Retorno:** `Bolsa[]`
- **SQL:** SELECT SBOLSAS
- **Cache:** 10 min

### `getContratos(codColigada: number, filtros?: { status?, anoLetivo? })`
- **Retorno:** `ContratoEducacional[]`
- **SQL:** SELECT FCFO
- **Cache:** 10 min

### `getRenegociacoes(codColigada: number)`
- **Retorno:** `Renegociacao[]`
- **Cache:** sem cache

### `getRelatorioMensal(codColigada: number, ano: number)`
- **Retorno:** `RelatorioFinanceiroItem[]`
- **SQL:** Agregação FLAN por mês
- **Cache:** 15 min

### `gerarSegundaViaBoleto(codColigada: number, idLan: number)`
- **Retorno:** `{ linhaDigitavel, codigoBarras, vencimento, valor }`
- **API:** POST /api/financeiro/v1/fbol/segunda-via
- **Cache:** sem cache (escrita)
