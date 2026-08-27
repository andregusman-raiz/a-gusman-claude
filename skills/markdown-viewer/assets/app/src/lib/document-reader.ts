import { readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";

import { extract_title } from "./document-manifest";
import { find_entry, is_inside, normalize_slug } from "./document-path";
import type { PublishedDocumentContent } from "./document-types";
import type { ViewerConfig } from "./viewer-config";

export async function read_document(
  slug: string[],
  config: ViewerConfig,
): Promise<PublishedDocumentContent | null> {
  const relative_path = normalize_slug(slug);
  if (!relative_path) {
    return null;
  }

  const entry = find_entry(relative_path, config);
  if (!entry) {
    return null;
  }

  const absolute_path = resolve(config.project_root, relative_path);
  let real_path: string;
  try {
    real_path = await realpath(absolute_path);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  if (!is_inside(config.project_root, real_path) || !is_inside(entry.real_path, real_path)) {
    return null;
  }

  const content = await readFile(real_path, "utf8");
  return {
    category: entry.category,
    content,
    slug: relative_path.split("/"),
    title: extract_title(content, relative_path),
  };
}
