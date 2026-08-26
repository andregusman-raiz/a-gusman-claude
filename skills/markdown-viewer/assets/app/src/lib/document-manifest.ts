import { readFile, readdir } from "node:fs/promises";
import { basename, extname, relative, sep } from "node:path";

import { is_denied } from "./document-path";
import type { PublishedDocument } from "./document-types";
import type { ViewerConfig, ViewerEntry } from "./viewer-config";

const title_collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

export function extract_title(content: string, file_path: string): string {
  const heading = content.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim();
  return heading || basename(file_path, extname(file_path));
}

async function create_document(
  absolute_path: string,
  entry: ViewerEntry,
  config: ViewerConfig,
): Promise<PublishedDocument> {
  const relative_path = relative(config.project_root, absolute_path).split(sep).join("/");
  let content = "";
  try {
    content = await readFile(absolute_path, "utf8");
  } catch {
    // A leitura completa continuará falhando na rota e ativará o estado de erro.
  }

  return {
    category: entry.category,
    slug: relative_path.split("/"),
    title: extract_title(content, absolute_path),
  };
}

async function walk_directory(
  directory_path: string,
  entry: ViewerEntry,
  config: ViewerConfig,
): Promise<PublishedDocument[]> {
  const documents: PublishedDocument[] = [];
  const children = await readdir(directory_path, { withFileTypes: true });

  for (const child of children) {
    const absolute_path = `${directory_path}${sep}${child.name}`;
    const relative_path = relative(config.project_root, absolute_path);
    if (is_denied(relative_path) || child.isSymbolicLink()) {
      continue;
    }
    if (child.isDirectory()) {
      documents.push(...(await walk_directory(absolute_path, entry, config)));
    } else if (child.isFile() && extname(child.name).toLocaleLowerCase("pt-BR") === ".md") {
      documents.push(await create_document(absolute_path, entry, config));
    }
  }

  return documents;
}

export async function list_documents(config: ViewerConfig): Promise<PublishedDocument[]> {
  const documents: PublishedDocument[] = [];

  for (const entry of config.entries) {
    const relative_path = relative(config.project_root, entry.absolute_path);
    if (is_denied(relative_path)) {
      continue;
    }
    if (entry.recursive) {
      documents.push(...(await walk_directory(entry.absolute_path, entry, config)));
    } else if (extname(entry.absolute_path).toLocaleLowerCase("pt-BR") === ".md") {
      documents.push(await create_document(entry.absolute_path, entry, config));
    }
  }

  return documents.sort(
    (left, right) =>
      title_collator.compare(left.category, right.category) ||
      title_collator.compare(left.title, right.title) ||
      title_collator.compare(left.slug.join("/"), right.slug.join("/")),
  );
}
