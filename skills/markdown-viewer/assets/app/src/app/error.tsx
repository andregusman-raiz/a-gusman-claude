"use client";

import Link from "next/link";

import { ErrorState } from "@/components/viewer-states";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="standalone-state" id="main-content">
      <ErrorState on_retry={reset} />
      <Link className="secondary-button" href="/">
        Voltar ao índice
      </Link>
    </main>
  );
}
