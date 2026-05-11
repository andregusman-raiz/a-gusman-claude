import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RedesignClient } from "./redesign-client";
import { hasApiKey } from "./actions";

export const metadata = {
  title: "Redesign from Screenshot — Presentation Library",
  description:
    "Upload an image of any UI, get a matching rAIz variant + preset + ready-to-use prompt.",
};

export default async function RedesignPage() {
  const apiKeyConfigured = await hasApiKey();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4 pl-16 md:py-6 md:pl-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/presentation"
              aria-label="Voltar para Presentation Layouts"
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
            <div className="hidden h-6 w-px bg-border md:block" />
            <nav
              aria-label="Breadcrumb"
              className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex"
            >
              <Link href="/presentation" className="hover:text-foreground">
                Presentation
              </Link>
              <span aria-hidden>›</span>
              <span className="font-medium text-foreground">Redesign</span>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/presentation"
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Layouts
            </Link>
            <Link
              href="/presentation/prompt-guide"
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Prompt Guide
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-black tracking-tight md:text-4xl">
            Redesign from Screenshot
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Upload an image or paste a URL, get a matching variant + preset +
            ready-to-use prompt.
          </p>
        </div>

        {!apiKeyConfigured && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200"
          >
            <strong className="font-semibold">Demo mode:</strong>{" "}
            ANTHROPIC_API_KEY not configured. You will get a sample
            classification. Set the env var to enable real analysis.
          </div>
        )}

        <RedesignClient demoMode={!apiKeyConfigured} />
      </main>
    </div>
  );
}
