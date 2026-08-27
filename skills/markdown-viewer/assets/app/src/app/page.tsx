import { redirect } from "next/navigation";

import { DocumentShell } from "@/components/document-shell";
import type { ViewerStateName } from "@/components/viewer-states";
import { list_documents } from "@/lib/document-manifest";
import { read_document } from "@/lib/document-reader";
import { load_viewer_config } from "@/lib/viewer-config";

type HomePageProps = {
  searchParams: Promise<{ estado?: string }>;
};

function demo_state(value: string | undefined): ViewerStateName | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  return value === "loading" || value === "vazio" || value === "erro" ? value : undefined;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const config = await load_viewer_config();
  const documents = await list_documents(config);
  const { estado } = await searchParams;
  const forced_state = demo_state(estado);

  if (!forced_state && documents[0]) {
    redirect(`/documento/${documents[0].slug.map(encodeURIComponent).join("/")}`);
  }

  const current_document = documents[0] ? await read_document(documents[0].slug, config) : null;
  return (
    <DocumentShell
      current_document={current_document}
      documents={documents}
      forced_state={forced_state}
      project_title={config.project_title}
    />
  );
}
