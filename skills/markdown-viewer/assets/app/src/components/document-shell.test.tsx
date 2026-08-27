import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { DocumentShell } from "./document-shell";
import { MarkdownView } from "./markdown-view";
import type { PublishedDocument, PublishedDocumentContent } from "@/lib/document-types";

const documents: PublishedDocument[] = [
  { category: "Projeto", slug: ["README.md"], title: "Projeto Exemplo" },
  { category: "Análises", slug: ["docs", "analises", "custos.md"], title: "Custos" },
];

const current_document: PublishedDocumentContent = {
  ...documents[0],
  content: "# Projeto Exemplo\n\nConteúdo publicado.",
};

describe("DocumentShell", () => {
  beforeEach(() => {
    window.print = vi.fn();
  });

  test("filtra por título ou categoria e restaura o índice", async () => {
    const user = userEvent.setup();
    render(
      <DocumentShell
        current_document={current_document}
        documents={documents}
        project_title="Projeto Exemplo"
      />,
    );

    const search = screen.getByRole("searchbox", { name: "Filtrar documentos" });
    await user.type(search, "Análises");

    expect(screen.getByRole("link", { name: "Custos" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Projeto Exemplo" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getByRole("link", { name: "Projeto Exemplo" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("mostra estado vazio quando a busca não encontra documento", async () => {
    const user = userEvent.setup();
    render(
      <DocumentShell
        current_document={current_document}
        documents={documents}
        project_title="Projeto Exemplo"
      />,
    );

    await user.type(screen.getByRole("searchbox", { name: "Filtrar documentos" }), "inexistente");

    expect(screen.getByRole("status")).toHaveTextContent("Nenhum documento encontrado");
  });

  test("aciona a impressão do navegador", async () => {
    const user = userEvent.setup();
    render(
      <DocumentShell
        current_document={current_document}
        documents={documents}
        project_title="Projeto Exemplo"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Imprimir documento" }));

    expect(window.print).toHaveBeenCalledOnce();
  });

  test.each(["loading", "vazio", "erro"] as const)(
    "renderiza o estado forçado %s",
    (forced_state) => {
      render(
        <DocumentShell
          current_document={current_document}
          documents={documents}
          forced_state={forced_state}
          project_title="Projeto Exemplo"
        />,
      );

      expect(screen.getByTestId(`viewer-state-${forced_state}`)).toBeInTheDocument();
    },
  );
});

describe("MarkdownView", () => {
  test("protege links externos, ignora HTML bruto e não carrega imagens", () => {
    render(
      <MarkdownView
        content={'[Fonte](https://example.com)\n\n[Perigoso](javascript:alert(1))\n\n![sigilo](https://example.com/sigilo.png)\n\n<script>alert("x")</script>'}
      />,
    );

    expect(screen.getByRole("link", { name: "Fonte" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(screen.getByRole("link", { name: "Fonte" })).toHaveAttribute("target", "_blank");
    expect(screen.getByText(/Perigoso/).closest("a")).toBeNull();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(/Imagem não carregada/)).toHaveTextContent("Imagem não carregada: sigilo");
    expect(document.querySelector("script")).toBeNull();
  });
});
