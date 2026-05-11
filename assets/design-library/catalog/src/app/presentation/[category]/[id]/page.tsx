import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  getCategory,
  getVariant,
  getVariantsByCategory,
  PRESENTATION_CATEGORIES,
  PRESENTATION_VARIANTS,
} from "@/lib/presentation-data";
import { PresentationDetail } from "@/components/presentation/presentation-detail";

export function generateStaticParams() {
  return PRESENTATION_VARIANTS.map((v) => {
    const cat = PRESENTATION_CATEGORIES.find((c) => c.id === v.categoryId);
    return { category: cat?.slug ?? v.categoryId, id: v.id };
  });
}

type Params = Promise<{ category: string; id: string }>;

export default async function PresentationVariantPage({
  params,
}: {
  params: Params;
}) {
  const { category, id } = await params;
  const cat = getCategory(category);
  const variant = getVariant(id);

  if (!cat || !variant || variant.categorySlug !== cat.slug) {
    notFound();
  }

  // Read source files from elements/ (the canonical location)
  const elementsRoot = path.resolve(
    process.cwd(),
    "..",
    "elements",
    variant.categoryId,
    variant.id,
  );
  const componentPath = path.join(elementsRoot, "component.tsx");
  const specPath = path.join(elementsRoot, "spec.md");

  let componentSource = "";
  let specSource = "";
  try {
    componentSource = fs.readFileSync(componentPath, "utf-8");
  } catch {
    componentSource = "// Component source not found";
  }
  try {
    specSource = fs.readFileSync(specPath, "utf-8");
  } catch {
    specSource = "# Spec not available";
  }

  const categoryVariants = getVariantsByCategory(variant.categoryId);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 px-6 py-5 pr-16 md:pr-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm">
            <Link
              href="/presentation"
              className="flex shrink-0 items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Presentation</span>
            </Link>
            <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/50 sm:inline" />
            <Link
              href="/presentation"
              className="hidden shrink-0 text-muted-foreground hover:text-foreground sm:inline"
            >
              {cat.title}
            </Link>
            <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/50 sm:inline" />
            <span className="truncate font-semibold">{variant.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/presentation"
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Voltar
            </Link>
          </div>
        </div>
      </header>

      <PresentationDetail
        variantId={variant.id}
        variantName={variant.name}
        categoryTitle={cat.title}
        categoryColor={cat.color}
        componentSource={componentSource}
        specSource={specSource}
        siblings={categoryVariants
          .filter((v) => v.id !== variant.id)
          .map((v) => ({ id: v.id, name: v.name, slug: cat.slug }))}
      />
    </div>
  );
}
