import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { z } from "zod";

const entry_schema = z.object({
  path: z.string().min(1),
  category: z.string().min(1),
  recursive: z.boolean().optional().default(false),
});

const config_schema = z.object({
  project_title: z.string().min(1),
  entries: z.array(entry_schema).min(1),
});

export type ViewerEntry = z.infer<typeof entry_schema> & {
  absolute_path: string;
  real_path: string;
};

export type ViewerConfig = {
  project_root: string;
  project_title: string;
  entries: ViewerEntry[];
};

function is_inside(root_path: string, candidate_path: string): boolean {
  const relative_path = relative(root_path, candidate_path);
  return relative_path === "" || (!relative_path.startsWith(`..${sep}`) && relative_path !== "..");
}

function validate_entry_path(entry_path: string): void {
  if (
    isAbsolute(entry_path) ||
    entry_path.includes("\\") ||
    entry_path.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error(`Entrada inválida no manifesto: ${entry_path}`);
  }
}

export async function load_viewer_config(): Promise<ViewerConfig> {
  const configured_root = process.env.MARKDOWN_VIEWER_PROJECT_ROOT;
  if (!configured_root) {
    throw new Error("MARKDOWN_VIEWER_PROJECT_ROOT não foi definido.");
  }

  const project_root = await realpath(resolve(configured_root));
  const config_path = resolve(project_root, ".markdown-viewer.json");
  const raw_config: unknown = JSON.parse(await readFile(config_path, "utf8"));
  const parsed_config = config_schema.parse(raw_config);
  const entries: ViewerEntry[] = [];

  for (const entry of parsed_config.entries) {
    validate_entry_path(entry.path);
    const absolute_path = resolve(project_root, entry.path);
    const real_path = await realpath(absolute_path);
    if (!is_inside(project_root, real_path)) {
      throw new Error(`Entrada escapa do projeto: ${entry.path}`);
    }

    const entry_stat = await stat(real_path);
    if (entry.recursive && !entry_stat.isDirectory()) {
      throw new Error(`Entrada recursiva não é diretório: ${entry.path}`);
    }
    if (!entry.recursive && !entry_stat.isFile()) {
      throw new Error(`Entrada exata não é arquivo: ${entry.path}`);
    }

    entries.push({ ...entry, absolute_path, real_path });
  }

  return {
    project_root,
    project_title: parsed_config.project_title,
    entries,
  };
}
