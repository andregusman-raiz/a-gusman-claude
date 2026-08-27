import { notFound } from "next/navigation";

import { DocumentShell } from "@/components/document-shell";
import type { ViewerStateName } from "@/components/viewer-states";
import { list_documents } from "@/lib/document-manifest";
import { read_document } from "@/lib/document-reader";
import { load_viewer_config } from "@/lib/viewer-config";

type DocumentPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ estado?: string }>;
};

function demo_state(value: string | undefined): ViewerStateName | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  return value === "loading" || value === "vazio" || value === "erro" ? value : undefined;
}

export default async function DocumentPage({ params, searchParams }: DocumentPageProps) {
  const [{ slug }, { estado }] = await Promise.all([params, searchParams]);
  const config = await load_viewer_config();
  const [documents, current_document] = await Promise.all([
    list_documents(config),
    read_document(slug, config),
  ]);

  if (!current_document) {
    notFound();
  }

  return (
    <DocumentShell
      current_document={current_document}
      documents={documents}
      forced_state={demo_state(estado)}
      project_title={config.project_title}
    />
  );
}
