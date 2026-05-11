"use client";

import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  data: Record<string, unknown>;
  filename: string;
  className?: string;
}

export function ExportButton({ data, filename, className }: ExportButtonProps) {
  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exportado", { description: `${filename}.json (${(json.length / 1024).toFixed(1)}KB)` });
  };

  return (
    <button onClick={handleExport} className={cn("flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted", className)}>
      <Download className="h-3.5 w-3.5" /> Exportar JSON
    </button>
  );
}

export function CopySpecButton({ data, className }: { data: Record<string, unknown>; className?: string }) {
  const handleCopy = () => {
    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json);
    toast.success("Spec copiado para clipboard", { description: `${Object.keys(data).length} campos · ${(json.length / 1024).toFixed(1)}KB` });
  };

  return (
    <button onClick={handleCopy} className={cn("flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted", className)}>
      <Copy className="h-3.5 w-3.5" /> Copiar Spec
    </button>
  );
}
