export type PresentationPreset = {
  id: string;
  name: string;
  description: string;
  icon: string;
  previewColor: string;
  promptHint?: string;
};

export const PRESENTATION_PRESETS: PresentationPreset[] = [
  {
    id: "raiz-default",
    name: "Raiz Default",
    description: "Identidade padrão rAIz (laranja/teal, rounded-xl, shadows sutis)",
    icon: "Sparkles",
    previewColor: "#FF6D00",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description:
      "Sem sombras, sem gradientes, rounded-sm, palette mono slate, tipografia fina",
    icon: "Minus",
    previewColor: "#64748b",
    promptHint:
      "Aplique estilo minimalista: remova todas as sombras (shadow-none), remova gradientes, use rounded-sm em todos os cards/buttons, palette exclusivamente slate/gray (sem cores de acento saturadas), tipografia font-light/font-normal ao invés de font-bold, borders finas (border border-slate-200 dark:border-slate-800).",
  },
  {
    id: "brutalist",
    name: "Brutalist",
    description:
      "rounded-none, borders 3px pretas, shadows offset duro, cores saturadas",
    icon: "Square",
    previewColor: "#000000",
    promptHint:
      "Aplique estilo brutalista: rounded-none em tudo, borders border-2 border-black (3px solid), shadow-[4px_4px_0_0_black] em cards e botões (nunca shadow-md/lg suave), cores de acento SATURADAS e primárias (amarelo #FFD700, rosa #FF006E, ciano #00FFFF), typography font-black e uppercase nos títulos, NENHUM gradient, bg-white ou bg-black sólidos.",
  },
  {
    id: "glass",
    name: "Glass Morphism",
    description:
      "backdrop-blur everywhere, semi-transparent backgrounds, subtle gradients, glow",
    icon: "Droplets",
    previewColor: "#06b6d4",
    promptHint:
      "Aplique estilo glassmorphism: backdrop-blur-xl em cards, bg-white/20 ou bg-slate-900/40 semi-transparente, borders border-white/20, subtle gradients (bg-gradient-to-br from-white/10 to-white/5), glow ring-2 ring-white/20 ring-offset-2 nos botões primários, fundos com bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 para destacar o blur.",
  },
  {
    id: "dark-mono",
    name: "Dark Mono",
    description:
      "Fundo quase-preto, palette zinc 950/900/800, acento único branco, tipografia tight",
    icon: "Circle",
    previewColor: "#18181b",
    promptHint:
      "Aplique estilo dark mono: background sempre bg-zinc-950 (ou #09090b), cards bg-zinc-900 border-zinc-800, texto zinc-50/200/400 em hierarquia, ZERO cores de acento (sem laranja, sem teal) — apenas escalas zinc e branco puro para CTA primário (bg-white text-zinc-950), tipografia tracking-tight, shadows sutis com shadow-black/50, radius moderado rounded-lg.",
  },
  {
    id: "soft-saas",
    name: "Soft SaaS",
    description:
      "Pastéis lavanda/pêssego, radius grande (rounded-3xl), shadows difusas, tom friendly",
    icon: "Heart",
    previewColor: "#a78bfa",
    promptHint:
      "Aplique estilo Soft SaaS: background bg-violet-50 dark:bg-violet-950, cards bg-white/80 dark:bg-slate-900/80, acentos pastel (violet-400, pink-300, peach-200 #FFDAB9), rounded-3xl em TODOS cards e botões (radius grande e aconchegante), shadows soft shadow-2xl shadow-violet-200/50, botões com bg-gradient-to-br from-violet-400 to-pink-400, tipografia font-medium (nada de font-black), emoji-friendly.",
  },
  {
    id: "neobrutalism",
    name: "Neobrutalism",
    description:
      "Brutalist amenizado — rounded-md, shadows offset coloridas, palette saturada pastel",
    icon: "BoxSelect",
    previewColor: "#ec4899",
    promptHint:
      "Aplique estilo neobrutalism: rounded-md (não rounded-none como brutalist puro), borders border-2 border-black, shadows offset COLORIDAS (shadow-[4px_4px_0_0_#ec4899] em botões, shadow-[6px_6px_0_0_#facc15] em cards destacados), cores saturadas pastel (bg-pink-300, bg-yellow-300, bg-lime-300, bg-sky-300), hover: translate-y-1 translate-x-1 com shadow shrink, tipografia font-extrabold tracking-wide, sem uppercase.",
  },
];

export const DEFAULT_PRESET_ID = "raiz-default";

export function getPresetById(id: string): PresentationPreset {
  return (
    PRESENTATION_PRESETS.find((p) => p.id === id) ?? PRESENTATION_PRESETS[0]
  );
}

export function getPresetWrapperClass(presetId: string): string {
  if (!presetId || presetId === DEFAULT_PRESET_ID) return "";
  return `preset-${presetId}`;
}
