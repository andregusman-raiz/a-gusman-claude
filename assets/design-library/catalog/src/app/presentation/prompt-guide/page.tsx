import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Copy } from "lucide-react";

export const metadata = {
  title: "Prompt Guide — Presentation Library",
  description:
    "Estrutura canônica de 6 blocos para gerar UI de alta qualidade em Claude/Cursor/Lovable/v0.",
};

const BLOCKS = [
  {
    n: "1",
    title: "Contexto",
    hint: "Quem usa, para quê, em que produto",
    example: "App SaaS de gestão educacional. Usuário: coordenador pedagógico. Objetivo: autenticar rapidamente.",
  },
  {
    n: "2",
    title: "Layout base",
    hint: "Estrutura geométrica pretendida em 1-2 frases",
    example: "Layout 50/50 desktop, stack mobile, form à esquerda, visual à direita.",
  },
  {
    n: "3",
    title: "Estilo",
    hint: "Tokens: cores, radius, tipografia, spacing, dark mode strategy",
    example: "Laranja #FF6D00 primary, teal #006E6A secondary, rounded-xl, Inter, dark via class.",
  },
  {
    n: "4",
    title: "Referências",
    hint: "Screenshots, URLs, ID de variante do design-library, preset estético",
    example: "Library: 04b-split-text-image. Preset: raiz-default. Screenshot anexo.",
  },
  {
    n: "5",
    title: "Constraints",
    hint: "Stack, deps permitidas, a11y, mobile, tamanho, idioma",
    example: "Next.js 16 + Tailwind v4 + shadcn + lucide-react. A11y: aria-labels, focus rings. Mobile-first. PT-BR.",
  },
  {
    n: "6",
    title: "Entregável",
    hint: "Formato: 1 arquivo TSX, múltiplos arquivos, spec markdown, prompt otimizado",
    example: "1 arquivo component.tsx self-contained, sem prosa antes ou depois.",
  },
];

const TARGETS = [
  {
    id: "claude",
    name: "Claude (Cursor chat, API)",
    tip: "Responde bem a metadados ricos. Começar com <task>...</task> XML e terminar com <format>código sem prosa</format>.",
    fit: "Contexto longo + decisões arquiteturais",
  },
  {
    id: "cursor",
    name: "Cursor Composer",
    tip: "Contexto limitado. Versão condensada: 1 linha por bloco, max 10 linhas total.",
    fit: "Edição iterativa em projeto existente",
  },
  {
    id: "v0",
    name: "v0.dev (Vercel)",
    tip: "Tom visual. Foque estética e responsive notes. Ignora contexto de negócio longo.",
    fit: "Protótipos visuais rápidos",
  },
  {
    id: "lovable",
    name: "Lovable",
    tip: "Gera app completo. Inclua jornada + telas relacionadas para evitar inconsistência.",
    fit: "App-building completo a partir de zero",
  },
];

const ANTI_PATTERNS: { bad: string; why: string; good: string }[] = [
  {
    bad: "Crie um hero bonito",
    why: "Sem contexto, estilo, referências — AI inventa tudo",
    good: "Template completo com blocos 1-6",
  },
  {
    bad: "É um SaaS de gestão, preciso de landing",
    why: "Contexto sem estilo — AI entrega visual genérico",
    good: "Contexto + bloco de Estilo com tokens específicos",
  },
  {
    bad: "Hero minimalist, giant typography, neutral",
    why: "Estilo sem contexto — AI faz genérico sem aderir à ação",
    good: "Adicionar persona + ação que o hero leva",
  },
  {
    bad: "Começar pedindo login e mudar para dashboard no meio",
    why: "Escopo divergente confunde o modelo",
    good: "Um prompt = uma entrega. Telas múltiplas = múltiplos prompts",
  },
  {
    bad: '"Como o Stripe / Linear / Vercel"',
    why: "Interpretado de N jeitos diferentes",
    good: 'Usar como referência adicional: "estética Stripe + seus tokens"',
  },
  {
    bad: "Esquecer de mencionar mobile",
    why: "AI entrega desktop-only por padrão",
    good: 'Sempre incluir "mobile-first" nos Constraints',
  },
  {
    bad: 'Deixar a11y "pra depois"',
    why: "AI gera sem aria-labels, sem focus rings",
    good: "Incluir a11y explicitamente em Constraints",
  },
];

const MASTER_TEMPLATE = `# Build: <NOME DO COMPONENTE>

## Contexto
Você é um designer senior implementando uma seção de <CATEGORIA> para <PRODUTO>.
Usuário final: <PERSONA>. Objetivo: <O QUE O USUÁRIO FAZ/SENTE>.

## Layout base
<DESCRIÇÃO ESTRUTURAL EM 1-2 FRASES>

## Estilo (design tokens)
- Cor primária: <HEX> (--raiz-orange)
- Cor secundária: <HEX> (--raiz-teal)
- Radius: 0.75rem (rounded-xl)
- Typography: Inter
- Dark mode: class strategy
- Spacing: 8pt grid
- Shadows: subtle

## Referências
- Design-library: <ID da variante>
- Preset: <raiz-default | minimalist | brutalist | glass>

## Constraints (stack rAIz)
- React 19 + TypeScript strict
- Tailwind v4 + shadcn/ui
- lucide-react para ícones
- Mobile-first (md:, lg:)
- A11y: aria-labels, focus rings, labels em forms
- Placeholder content em PT-BR
- 50-200 linhas
- Sem business logic — apenas UI + handlers placeholder

## Entregável
1 arquivo .tsx self-contained.`;

export default function PromptGuidePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-6 py-4 pl-16 md:flex md:items-center md:justify-between md:py-6 md:pl-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/presentation"
              aria-label="Voltar para Presentation"
              className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex shrink-0 items-baseline gap-0.5">
              <span
                className="text-2xl font-black tracking-tight"
                style={{ color: "var(--raiz-orange)" }}
              >
                RAIZ
              </span>
              <span
                className="text-sm font-normal tracking-widest"
                style={{ color: "var(--raiz-teal)" }}
              >
                educação
              </span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight">Prompt Guide</h1>
              <p className="text-xs text-muted-foreground">
                Estrutura canônica para gerar UI via AI
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-8">
        {/* Intro */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Princípio
          </h2>
          <p className="text-lg leading-relaxed">
            Builder AI gera <em>o que você descreve</em>, não o que você quer. Prompt fraco =
            5-15 iterações queimando créditos. Prompt estruturado = 1-2 shots para resultado
            utilizável.
          </p>
          <p className="text-sm text-muted-foreground">
            A diferença entre um prompt que queima tempo e um que acerta está em quantos tipos
            de informação ele carrega, não em quão longo é.
          </p>
        </section>

        {/* 6 Blocks */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Estrutura em 6 blocos</h2>
            <span className="text-xs text-muted-foreground">
              Nesta ordem. Skippar qualquer = AI inventa.
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {BLOCKS.map((b) => (
              <div
                key={b.n}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-[var(--raiz-orange)]/30"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="rounded-md px-2 py-0.5 font-mono text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--raiz-orange)" }}
                  >
                    {b.n}
                  </span>
                  <h3 className="text-lg font-semibold">{b.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{b.hint}</p>
                <div className="mt-3 rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed text-foreground/80">
                  {b.example}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Master template */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Template mestre</h2>
          <p className="text-sm text-muted-foreground">
            Copiar, preencher placeholders, colar no builder. Toda variante do
            <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">/presentation</code>
            já gera este template pronto via botão &quot;Copy as AI prompt&quot;.
          </p>
          <pre className="overflow-x-auto rounded-xl border border-border bg-zinc-950 p-5 font-mono text-xs leading-relaxed text-zinc-100">
            {MASTER_TEMPLATE}
          </pre>
        </section>

        {/* Targets */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Adaptação por alvo</h2>
          <p className="text-sm text-muted-foreground">
            Cada builder AI tem tom próprio. O mesmo prompt-base ajusta-se ligeiramente
            dependendo de onde você cola.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {TARGETS.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t.tip}</p>
                <p className="mt-3 text-xs">
                  <span
                    className="mr-2 rounded px-2 py-0.5 font-mono"
                    style={{
                      backgroundColor: "var(--raiz-teal-light, rgba(0,110,106,0.1))",
                      color: "var(--raiz-teal)",
                    }}
                  >
                    Ideal para
                  </span>
                  {t.fit}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Anti-patterns */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Anti-patterns</h2>
          <div className="space-y-3">
            {ANTI_PATTERNS.map((ap, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-xl border border-border bg-card p-5 md:grid-cols-[1fr_auto_1fr] md:items-center"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                  <div>
                    <p className="font-mono text-sm text-foreground/80">&quot;{ap.bad}&quot;</p>
                    <p className="mt-1 text-xs text-muted-foreground">{ap.why}</p>
                  </div>
                </div>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden />
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                    aria-hidden
                  />
                  <p className="text-sm">{ap.good}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Workflow recomendado</h2>
          <ol className="space-y-2 text-sm">
            {[
              "Navegar /presentation, filtrar por categoria",
              "Escolher variante visualmente (compare view ajuda)",
              "Selecionar preset estético (Raiz / Minimalist / Brutalist / Glass)",
              "Clicar \"Copy as AI prompt\" + selecionar alvo (Claude / Cursor / v0)",
              "Colar no builder (Lovable / Cursor / Composer / v0)",
              "Receber resultado em 1-2 iterações",
            ].map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--raiz-teal)" }}
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Pronto para testar?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Abra qualquer variante do library e use o botão &quot;Copy as AI prompt&quot; — o
            template já vem preenchido.
          </p>
          <Link
            href="/presentation"
            className="mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "var(--raiz-orange)" }}
          >
            <Copy className="h-4 w-4" aria-hidden />
            Navegar variantes
          </Link>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Skill canônica: <code className="font-mono">/ag-referencia-prompt-guide</code> ·
          Taxonomia: <code className="font-mono">/ag-referencia-design-presentation</code>
        </p>
      </main>
    </div>
  );
}
