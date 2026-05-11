"use server";

import Anthropic from "@anthropic-ai/sdk";
import {
  PRESENTATION_CATEGORIES,
  PRESENTATION_VARIANTS,
  getVariant,
} from "@/lib/presentation-data";
import { PRESENTATION_PRESETS } from "@/lib/presentation-presets";
import { buildPrompt, layoutHintFromId, type PromptTarget } from "@/lib/presentation-prompt";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];

export type RedesignClassification = {
  category: string;
  categorySlug: string;
  suggestedVariant: string;
  alternatives: string[];
  preset: string;
  structure: string;
  voice: string;
  confidence: "high" | "medium" | "low";
  notes?: string;
};

export type RedesignResult = {
  ok: true;
  mode: "live" | "demo";
  classification: RedesignClassification;
  prompt: string;
  promptTarget: PromptTarget;
};

export type RedesignError = {
  ok: false;
  error: string;
};

export type AnalyzeResponse = RedesignResult | RedesignError;

function isAllowedMime(mime: string): mime is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

function normalizeCategoryToSlug(raw: string): {
  categoryTitle: string;
  categorySlug: string;
} {
  const match = PRESENTATION_CATEGORIES.find(
    (c) =>
      c.id === raw ||
      c.slug === raw ||
      c.title.toLowerCase() === raw.toLowerCase() ||
      raw.toLowerCase().includes(c.slug),
  );
  if (match) return { categoryTitle: match.title, categorySlug: match.slug };
  return { categoryTitle: raw, categorySlug: "hero" };
}

function coerceVariantId(raw: string, categorySlug: string): string {
  if (getVariant(raw)) return raw;
  const inCategory = PRESENTATION_VARIANTS.filter(
    (v) => v.categorySlug === categorySlug,
  );
  if (inCategory.length > 0) return inCategory[0].id;
  return "04a-centered-text";
}

function coercePresetId(raw: string): string {
  const match = PRESENTATION_PRESETS.find(
    (p) =>
      p.id === raw ||
      p.name.toLowerCase() === raw.toLowerCase() ||
      raw.toLowerCase().includes(p.id),
  );
  return match?.id ?? "raiz-default";
}

function sanitizeClassification(parsed: unknown): RedesignClassification {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const rawCategory = typeof obj.category === "string" ? obj.category : "Hero Sections";
  const { categoryTitle, categorySlug } = normalizeCategoryToSlug(rawCategory);

  const rawVariant =
    typeof obj.suggestedVariant === "string" ? obj.suggestedVariant : "";
  const suggestedVariant = coerceVariantId(rawVariant, categorySlug);

  const rawAlts = Array.isArray(obj.alternatives) ? obj.alternatives : [];
  const alternatives = rawAlts
    .filter((v): v is string => typeof v === "string")
    .map((v) => coerceVariantId(v, categorySlug))
    .filter((v, i, arr) => v !== suggestedVariant && arr.indexOf(v) === i)
    .slice(0, 3);

  const preset = coercePresetId(
    typeof obj.preset === "string" ? obj.preset : "raiz-default",
  );

  const structure =
    typeof obj.structure === "string" ? obj.structure.slice(0, 400) : "";
  const voice = typeof obj.voice === "string" ? obj.voice.slice(0, 200) : "";
  const confidenceRaw =
    typeof obj.confidence === "string" ? obj.confidence.toLowerCase() : "";
  const confidence: "high" | "medium" | "low" =
    confidenceRaw === "high" || confidenceRaw === "medium" || confidenceRaw === "low"
      ? confidenceRaw
      : "medium";
  const notes = typeof obj.notes === "string" ? obj.notes.slice(0, 500) : undefined;

  return {
    category: categoryTitle,
    categorySlug,
    suggestedVariant,
    alternatives,
    preset,
    structure,
    voice,
    confidence,
    notes,
  };
}

function extractJsonBlock(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function buildClassificationPromptForVariant(
  classification: RedesignClassification,
  target: PromptTarget,
): string {
  const variant = getVariant(classification.suggestedVariant);
  const variantName = variant?.name ?? classification.suggestedVariant;
  const whenToUse =
    [classification.structure, classification.voice ? `Tom: ${classification.voice}.` : ""]
      .filter(Boolean)
      .join(" ") ||
    `Recriar a estrutura observada no screenshot usando a variante ${variantName}.`;

  return buildPrompt(target, {
    variantId: classification.suggestedVariant,
    variantName,
    categoryTitle: classification.category,
    whenToUse,
    layoutHint: layoutHintFromId(classification.suggestedVariant),
    presetId: classification.preset,
  });
}

function demoClassification(): RedesignClassification {
  return {
    category: "Hero Sections",
    categorySlug: "hero",
    suggestedVariant: "04b-split-text-image",
    alternatives: ["04a-centered-text", "04e-product-screenshot-below", "04c-animated-gradient"],
    preset: "raiz-default",
    structure: "Split 50/50 com texto à esquerda e imagem/screenshot à direita.",
    voice: "SaaS corporate B2B — tom profissional e direto.",
    confidence: "medium",
    notes: "Demo mode — ANTHROPIC_API_KEY não configurada. Esta resposta é ilustrativa.",
  };
}

function buildSystemPrompt(): string {
  const categories = PRESENTATION_CATEGORIES.map((c) => `- ${c.slug}: ${c.title}`).join("\n");
  const variants = PRESENTATION_VARIANTS.map((v) => `- ${v.id} (${v.categorySlug})`).join("\n");
  const presets = PRESENTATION_PRESETS.map((p) => `- ${p.id}: ${p.description}`).join("\n");
  return `You are a senior UI design classifier for a rAIz Educação design library.

Your job: given a UI screenshot, map it to the internal library.

Available categories (use slug):
${categories}

Available variants (IDs you MUST pick from):
${variants}

Available style presets (IDs):
${presets}

Return ONLY a single valid JSON object, with NO prose, NO markdown fences, and NO commentary. Schema:
{
  "category": "<category slug, e.g. hero>",
  "suggestedVariant": "<one variant id from the list>",
  "alternatives": ["<variant id>", "<variant id>", "<variant id>"],
  "preset": "<preset id>",
  "structure": "<1-2 sentence description of the visual layout>",
  "voice": "<tone/voice detected, e.g. 'SaaS corporate B2B', 'playful consumer'>",
  "confidence": "<high|medium|low>",
  "notes": "<optional, short>"
}

Rules:
- suggestedVariant MUST be one of the listed variant IDs exactly.
- alternatives MUST contain 3 different variant IDs, all different from suggestedVariant.
- preset MUST be one of the listed preset IDs.
- category MUST be one of the listed category slugs.
- If uncertain, choose the closest match and set confidence to "low" or "medium".`;
}

export async function analyzeImage(formData: FormData): Promise<AnalyzeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const promptTarget: PromptTarget = "claude";

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return { ok: false, error: "Nenhuma imagem enviada." };
  }
  if (image.size === 0) {
    return { ok: false, error: "Arquivo vazio." };
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Imagem muito grande (${(image.size / 1024 / 1024).toFixed(1)}MB). Máximo 5MB.`,
    };
  }
  if (!isAllowedMime(image.type)) {
    return {
      ok: false,
      error: `Tipo não suportado: ${image.type}. Use PNG, JPEG, WEBP ou GIF.`,
    };
  }

  if (!apiKey) {
    const classification = demoClassification();
    return {
      ok: true,
      mode: "demo",
      classification,
      prompt: buildClassificationPromptForVariant(classification, promptTarget),
      promptTarget,
    };
  }

  try {
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.type as AllowedMime,
                data: base64,
              },
            },
            {
              type: "text",
              text: "Classify this UI screenshot. Return only the JSON object.",
            },
          ],
        },
      ],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "Resposta da API sem conteúdo textual." };
    }
    const parsed = extractJsonBlock(textBlock.text);
    if (!parsed) {
      return {
        ok: false,
        error: "Não foi possível fazer parse do JSON retornado pela API.",
      };
    }
    const classification = sanitizeClassification(parsed);
    return {
      ok: true,
      mode: "live",
      classification,
      prompt: buildClassificationPromptForVariant(classification, promptTarget),
      promptTarget,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido ao chamar a API.";
    return {
      ok: false,
      error: `Falha na análise: ${message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")}`,
    };
  }
}

export async function hasApiKey(): Promise<boolean> {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
