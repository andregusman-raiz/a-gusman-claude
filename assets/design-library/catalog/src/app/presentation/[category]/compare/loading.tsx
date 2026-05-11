export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-3.5 rounded bg-muted/60" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-3.5 rounded bg-muted/60" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
        </div>
      </header>
      <main
        className="mx-auto max-w-7xl px-6 py-6"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Carregando comparação…</span>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-[300px] flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              </div>
              <div className="flex-1 animate-pulse bg-muted/30" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
