import { mkdtemp, mkdir, rename, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { list_documents } from "./document-manifest";
import { read_document } from "./document-reader";
import { load_viewer_config } from "./viewer-config";

const original_project_root = process.env.MARKDOWN_VIEWER_PROJECT_ROOT;

afterEach(() => {
  if (original_project_root === undefined) {
    delete process.env.MARKDOWN_VIEWER_PROJECT_ROOT;
  } else {
    process.env.MARKDOWN_VIEWER_PROJECT_ROOT = original_project_root;
  }
});

async function create_project(): Promise<string> {
  const project_root = await mkdtemp(join(tmpdir(), "markdown-viewer-"));
  await mkdir(join(project_root, "docs", "analises"), { recursive: true });
  await mkdir(join(project_root, "docs", "ai-state"), { recursive: true });
  await writeFile(join(project_root, "README.md"), "# Projeto Exemplo\n");
  await writeFile(join(project_root, "docs", "analises", "zeta.md"), "# Zeta\n");
  await writeFile(join(project_root, "docs", "analises", "alfa.md"), "sem heading\n");
  await writeFile(join(project_root, "docs", "ai-state", "segredo.md"), "# Segredo\n");
  await writeFile(
    join(project_root, ".markdown-viewer.json"),
    JSON.stringify({
      project_title: "Projeto Exemplo",
      entries: [
        { path: "README.md", category: "Projeto" },
        { path: "docs/analises", category: "Análises", recursive: true },
      ],
    }),
  );
  process.env.MARKDOWN_VIEWER_PROJECT_ROOT = project_root;
  return project_root;
}

describe("manifesto de documentos", () => {
  test("publica somente a allowlist, extrai títulos e ordena deterministicamente", async () => {
    await create_project();

    const config = await load_viewer_config();
    const documents = await list_documents(config);

    expect(documents).toEqual([
      { category: "Análises", slug: ["docs", "analises", "alfa.md"], title: "alfa" },
      { category: "Análises", slug: ["docs", "analises", "zeta.md"], title: "Zeta" },
      { category: "Projeto", slug: ["README.md"], title: "Projeto Exemplo" },
    ]);
  });

  test("usa o nome do arquivo quando o conteúdo não tem heading UTF-8 válido", async () => {
    const project_root = await create_project();
    await writeFile(join(project_root, "docs", "analises", "binario.md"), Buffer.from([0xff, 0xfe]));

    const documents = await list_documents(await load_viewer_config());

    expect(documents.some(({ title }) => title === "binario")).toBe(true);
  });
});

describe("leitura segura", () => {
  test.each([
    [["..", "CLAUDE.md"]],
    [["/etc/passwd"]],
    [["docs", "analises", "arquivo.pdf"]],
    [["docs", "ai-state", "segredo.md"]],
    [["docs", "analises", "..", "..", "ai-state", "segredo.md"]],
  ])("rejeita slug não autorizado %j", async (slug) => {
    await create_project();

    await expect(read_document(slug, await load_viewer_config())).resolves.toBeNull();
  });

  test("rejeita symlink que escapa do projeto", async () => {
    const project_root = await create_project();
    const outside_root = await mkdtemp(join(tmpdir(), "markdown-outside-"));
    const outside_file = join(outside_root, "externo.md");
    await writeFile(outside_file, "# Externo\n");
    await symlink(outside_file, join(project_root, "docs", "analises", "externo.md"));

    await expect(
      read_document(["docs", "analises", "externo.md"], await load_viewer_config()),
    ).resolves.toBeNull();
  });

  test("lê UTF-8 permitido sem expor caminho absoluto", async () => {
    await create_project();

    const document = await read_document(
      ["docs", "analises", "zeta.md"],
      await load_viewer_config(),
    );

    expect(document).toEqual({
      category: "Análises",
      content: "# Zeta\n",
      slug: ["docs", "analises", "zeta.md"],
      title: "Zeta",
    });
    expect(JSON.stringify(document)).not.toContain(tmpdir());
  });

  test("propaga falha de leitura de arquivo permitido para o error boundary", async () => {
    const project_root = await create_project();
    const document_path = join(project_root, "docs", "analises", "zeta.md");
    await rename(document_path, `${document_path}.backup`);
    await mkdir(document_path);

    await expect(
      read_document(["docs", "analises", "zeta.md"], await load_viewer_config()),
    ).rejects.toThrow();
  });
});
