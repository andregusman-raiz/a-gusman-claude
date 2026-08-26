import { access, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const requested_root = process.argv[2];
if (!requested_root) {
  throw new Error("Informe o projeto a inicializar.");
}

const project_root = resolve(requested_root);
const manifest_path = resolve(project_root, ".markdown-viewer.json");

try {
  await access(manifest_path);
  process.stdout.write(`Manifesto preservado: ${manifest_path}\n`);
} catch {
  const manifest = {
    project_title: basename(project_root),
    entries: [
      { path: "README.md", category: "Projeto" },
      { path: "docs", category: "Documentação", recursive: true },
    ],
  };
  await writeFile(manifest_path, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`Manifesto criado: ${manifest_path}\n`);
}
