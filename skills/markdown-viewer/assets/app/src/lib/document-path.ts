import { extname, isAbsolute, posix, relative, resolve, sep } from "node:path";

import type { ViewerConfig, ViewerEntry } from "./viewer-config";

const denied_exact = new Set(["CLAUDE.md", "AGENTS.md"]);
const denied_prefixes = ["docs/ai-state", "entrada"];

export function is_inside(root_path: string, candidate_path: string): boolean {
  const relative_path = relative(root_path, candidate_path);
  return relative_path === "" || (!relative_path.startsWith(`..${sep}`) && relative_path !== "..");
}

export function is_denied(relative_path: string): boolean {
  const normalized_path = relative_path.split(sep).join("/");
  const segments = normalized_path.split("/");

  return (
    denied_exact.has(normalized_path) ||
    denied_prefixes.some(
      (prefix) => normalized_path === prefix || normalized_path.startsWith(`${prefix}/`),
    ) ||
    segments.includes("Downloads")
  );
}

export function normalize_slug(slug: string[]): string | null {
  if (slug.length === 0) {
    return null;
  }

  const decoded_segments: string[] = [];
  for (const raw_segment of slug) {
    let segment: string;
    try {
      segment = decodeURIComponent(raw_segment);
    } catch {
      return null;
    }

    if (
      segment === "" ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      segment.includes("\0")
    ) {
      return null;
    }
    decoded_segments.push(segment);
  }

  const normalized_path = posix.normalize(decoded_segments.join("/"));
  if (
    isAbsolute(normalized_path) ||
    normalized_path.startsWith("../") ||
    extname(normalized_path).toLocaleLowerCase("pt-BR") !== ".md" ||
    is_denied(normalized_path)
  ) {
    return null;
  }

  return normalized_path;
}

export function find_entry(relative_path: string, config: ViewerConfig): ViewerEntry | null {
  const absolute_path = resolve(config.project_root, relative_path);

  for (const entry of config.entries) {
    if (entry.recursive && is_inside(entry.absolute_path, absolute_path)) {
      return entry;
    }
    if (!entry.recursive && absolute_path === entry.absolute_path) {
      return entry;
    }
  }

  return null;
}
