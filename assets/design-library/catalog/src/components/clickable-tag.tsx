"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ClickableTagProps {
  tag: string;
  /** Which section to search in. If omitted, searches current page */
  section?: "solutions" | "elements" | "modules";
  className?: string;
}

/**
 * Tag that when clicked navigates to the section grid with that tag as search query.
 * Uses URL search params so the grid page picks it up.
 */
export function ClickableTag({ tag, section, className }: ClickableTagProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const path = section === "elements" ? "/elements" : section === "modules" ? "/modules" : "/";
    // Navigate with tag as search param
    router.push(`${path}?q=${encodeURIComponent(tag)}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-[var(--raiz-orange)]/10 hover:text-[var(--raiz-orange)]",
        className
      )}
      title={`Buscar "${tag}" no catálogo`}
    >
      {tag}
    </button>
  );
}
