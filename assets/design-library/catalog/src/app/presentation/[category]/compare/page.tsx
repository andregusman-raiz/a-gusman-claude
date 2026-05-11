import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  getCategory,
  getVariantsByCategory,
  PRESENTATION_CATEGORIES,
} from "@/lib/presentation-data";
import {
  CompareView,
  type CompareItem,
} from "@/components/presentation/compare-view";

export function generateStaticParams() {
  return PRESENTATION_CATEGORIES.map((c) => ({ category: c.slug }));
}

type Params = Promise<{ category: string }>;

export default async function PresentationComparePage({
  params,
}: {
  params: Params;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const variants = getVariantsByCategory(cat.id);
  if (variants.length === 0) notFound();

  const items: CompareItem[] = variants.map((v) => ({
    id: v.id,
    name: v.name,
    slug: cat.slug,
  }));

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/presentation"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Presentation</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-muted-foreground">{cat.title}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="font-semibold">Compare</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${cat.color}`}
              aria-hidden
            />
            <Link
              href="/presentation"
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Voltar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <CompareView items={items} categoryTitle={cat.title} />
      </main>
    </div>
  );
}
