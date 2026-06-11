export const meta = {
  name: 'e2e-batch',
  description: 'Suite E2E Playwright em batches com auto-fix convergente (max 3 ciclos)',
  whenToUse: 'Rodar suite E2E completa com retry/auto-fix deterministico. Engine do modo e2e da ag-4-teste-final (substitui o loop em prosa de ag-testar-e2e-batch). args: {projectDir: string, specs?: string[], batchSize?: number}',
  phases: [
    { title: 'Run', detail: 'executa batch e parseia report JSON' },
    { title: 'Fix', detail: '1 agent sonnet por falha, com schema validado' },
  ],
}

// Piloto W6 do harness overhaul (ADR-0002). Loop deterministico em JS:
// batching, contadores, criterio de parada e progresso saem da prosa da skill.
const projectDir = args?.projectDir
if (!projectDir) throw new Error('args.projectDir obrigatorio (raiz do projeto com playwright.config)')
const BATCH = args?.batchSize || 15
const MAX_CYCLES = 3

const REPORT = {
  type: 'object',
  properties: {
    total: { type: 'number' },
    passed: { type: 'number' },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          spec: { type: 'string' },
          test: { type: 'string' },
          error: { type: 'string' },
          category: { type: 'string', enum: ['selector', 'timing', 'mock', 'assertion', 'infra', 'other'] },
        },
        required: ['spec', 'error', 'category'],
      },
    },
  },
  required: ['total', 'passed', 'failures'],
}

const FIX = {
  type: 'object',
  properties: {
    fixed: { type: 'boolean' },
    category: { type: 'string' },
    files_changed: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['fixed', 'summary'],
}

// Pre-flight: infra viva antes de gastar ciclos
phase('Run')
const preflight = await agent(
  `Pre-flight E2E em ${projectDir}: confirme que playwright.config existe, deps instaladas (bunx playwright --version) e, se o config exige webServer/porta, que esta disponivel. Responda com o estado real encontrado.`,
  { label: 'preflight', phase: 'Run', model: 'haiku', schema: { type: 'object', properties: { ok: { type: 'boolean' }, problema: { type: 'string' } }, required: ['ok'] } }
)
if (!preflight?.ok) return { aborted: true, reason: preflight?.problema || 'pre-flight falhou' }

let pendingSpecs = args?.specs || null // null = suite inteira no 1o ciclo
let cycle = 0
const history = []

while (cycle < MAX_CYCLES) {
  cycle++
  const target = pendingSpecs ? pendingSpecs.join(' ') : ''
  const report = await agent(
    `Em ${projectDir}, rode: bunx playwright test ${target} --reporter=json (filtre output: so o sumario e as falhas — nunca dump bruto). Se a suite for grande, rode em batches de ${BATCH} specs. Categorize cada falha (selector|timing|mock|assertion|infra|other). Retorne os dados.`,
    { label: `run:ciclo${cycle}`, phase: 'Run', schema: REPORT }
  )
  if (!report) return { aborted: true, reason: 'runner morreu', history }
  history.push({ cycle, total: report.total, passed: report.passed, failed: report.failures.length })
  log(`ciclo ${cycle}: ${report.passed}/${report.total} passou, ${report.failures.length} falhas`)

  if (report.failures.length === 0) return { converged: true, cycles: cycle, history }

  // Fix paralelo: 1 agent por falha (specs distintas — sem conflito de arquivo de teste)
  const fixes = await parallel(report.failures.map((f) => () =>
    agent(
      `Corrija esta falha E2E em ${projectDir}:\nSpec: ${f.spec}\nTeste: ${f.test || ''}\nCategoria: ${f.category}\nErro: ${f.error}\n\nDiagnostique a causa real (seletor quebrado? timing? mock desatualizado? bug de produto?). Aplique fix MINIMO no spec/mock — se for bug de PRODUTO, NAO conserte o produto: reporte fixed=false com summary explicando. Rode o spec isolado para confirmar.`,
      { label: `fix:${f.spec.split('/').pop()}`, phase: 'Fix', schema: FIX }
    ).then((r) => ({ spec: f.spec, fix: r }))
  ))

  const unresolved = fixes.filter(Boolean).filter((x) => !x.fix?.fixed).map((x) => x.spec)
  const productBugs = fixes.filter(Boolean).filter((x) => x.fix && !x.fix.fixed)
  if (unresolved.length === 0) { pendingSpecs = report.failures.map((f) => f.spec); continue }
  pendingSpecs = report.failures.map((f) => f.spec) // re-roda todos os que falharam p/ validar fixes
  if (cycle === MAX_CYCLES) return { converged: false, cycles: cycle, unresolved, productBugs: productBugs.map((p) => ({ spec: p.spec, summary: p.fix.summary })), history }
}
return { converged: false, cycles: cycle, history }
