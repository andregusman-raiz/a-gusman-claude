// Shared prompt generation for presentation layouts.
// Used by /presentation/redesign (and any future server-side prompt builder).

import {
  DEFAULT_PRESET_ID,
  getPresetById,
} from "@/lib/presentation-presets";

export type PromptTarget = "claude" | "cursor" | "v0";

export const PROMPT_TARGETS: { value: PromptTarget; label: string; hint: string }[] = [
  { value: "claude", label: "Claude / Generic", hint: "Markdown estruturado" },
  { value: "cursor", label: "Cursor", hint: "Com context tags" },
  { value: "v0", label: "v0 / Lovable", hint: "Visual-first, conciso" },
];

export function extractWhenToUse(spec: string): string {
  const patterns = [
    /##\s*Quando usar[\s\S]*?(?=\n##\s|$)/i,
    /##\s*When to use[\s\S]*?(?=\n##\s|$)/i,
    /##\s*Uso[\s\S]*?(?=\n##\s|$)/i,
  ];
  for (const p of patterns) {
    const m = spec.match(p);
    if (m) {
      return m[0]
        .replace(/^##\s*(Quando usar|When to use|Uso)\s*/i, "")
        .trim()
        .slice(0, 600);
    }
  }
  const lines = spec
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return (
    lines.slice(0, 3).join(" ").slice(0, 400) ||
    "Layout base documentado no spec interno."
  );
}

export function layoutHintFromId(id: string): string {
  const lower = id.toLowerCase();
  if (lower.includes("split")) return "Layout 50/50 desktop, stack vertical no mobile";
  if (lower.includes("centered")) return "Conteúdo centralizado, max-width controlado";
  if (lower.includes("full-bleed")) return "Full-width, sem max-width, edge-to-edge";
  if (lower.includes("bento")) return "Grid assimétrico (bento), 2-3 colunas no desktop";
  if (lower.includes("grid")) return "Grid responsivo, colunas adaptativas por breakpoint";
  if (lower.includes("sidebar")) return "Sidebar fixo à esquerda, conteúdo à direita";
  if (lower.includes("floating")) return "Elemento flutuante (pill/card), sticky ou fixo";
  if (lower.includes("sticky")) return "Sticky ou fixed no viewport";
  if (lower.includes("marquee")) return "Scroll horizontal infinito (marquee animation)";
  if (lower.includes("masonry")) return "Masonry/Pinterest grid";
  if (lower.includes("accordion")) return "Lista vertical colapsável (accordion)";
  if (lower.includes("tab")) return "Navegação por tabs com conteúdo dinâmico";
  if (lower.includes("carousel")) return "Carrossel horizontal com paginação";
  if (lower.includes("stacked")) return "Empilhamento vertical mobile-first";
  if (lower.includes("wizard") || lower.includes("multi-step"))
    return "Multi-step com progresso entre etapas";
  return "Layout conforme descrição abaixo";
}

export function buildPrompt(
  target: PromptTarget,
  args: {
    variantId: string;
    variantName: string;
    categoryTitle: string;
    whenToUse: string;
    layoutHint: string;
    presetId: string;
  },
): string {
  const { variantId, variantName, categoryTitle, whenToUse, layoutHint, presetId } = args;
  const preset = getPresetById(presetId);
  const presetBlock =
    presetId !== DEFAULT_PRESET_ID && preset.promptHint
      ? `\n\n## Style preset: ${preset.name}\n${preset.description}\n\n${preset.promptHint}`
      : "";

  const core = `# Build: ${variantName}

## Contexto
Você é um designer senior implementando uma seção de ${categoryTitle} para um projeto Next.js + Tailwind + shadcn/ui.

## Layout base
${whenToUse}

## Descrição estrutural
${layoutHint}.

## Design tokens (rAIz Educação)
- Cor primária: laranja #FF6D00 (--raiz-orange)
- Cor secundária: teal #006E6A (--raiz-teal)
- Radius: 0.75rem (rounded-xl)
- Font: Inter (sans-serif)
- Dark mode via class strategy

## Stack
- React 19 + TypeScript strict
- Tailwind v4
- lucide-react para ícones
- Componentes shadcn/ui quando aplicável
- Mobile-first, "md:" e "lg:" para breakpoints

## Entregável
1 arquivo \`component.tsx\` self-contained. Props tipadas. Dark mode. Acessibilidade (aria-*, focus rings). Placeholder content em PT-BR.

## Referência
Esta é uma adaptação do layout "${variantId}" do nosso design library interno.${presetBlock}`;

  if (target === "cursor") {
    return `<<context>>
You are helping a senior designer implement a reusable ${categoryTitle} section. The codebase uses Next.js 16 App Router, Tailwind v4, and shadcn/ui. Favor Server Components; use "use client" only for interactivity. All copy in pt-BR.
<</context>>

${core}`;
  }

  if (target === "v0") {
    return `Construa a seção "${variantName}" (${categoryTitle}).

Layout: ${layoutHint}.
${whenToUse}

Stack: Next.js + Tailwind + shadcn/ui + lucide-react.
Cores: primary laranja #FF6D00, secondary teal #006E6A.
Radius rounded-xl. Dark mode via class. Mobile-first.
Conteúdo em PT-BR, placeholder realista (não lorem).
Entregue 1 componente .tsx self-contained, tipado, acessível.${presetBlock}`;
  }

  return core;
}
