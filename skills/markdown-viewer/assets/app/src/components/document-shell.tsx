"use client";

import { FileText, Menu, Printer, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { PublishedDocument, PublishedDocumentContent } from "@/lib/document-types";
import { MarkdownView } from "./markdown-view";
import { EmptyState, ErrorState, LoadingState, type ViewerStateName } from "./viewer-states";

type DocumentShellProps = {
  project_title: string;
  documents: PublishedDocument[];
  current_document: PublishedDocumentContent | null;
  forced_state?: ViewerStateName;
};

function document_href(document: PublishedDocument): string {
  return `/documento/${document.slug.map(encodeURIComponent).join("/")}`;
}

function normalize_search(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function DocumentShell({
  project_title,
  documents,
  current_document,
  forced_state,
}: DocumentShellProps) {
  const [query, set_query] = useState("");
  const [mobile_open, set_mobile_open] = useState(false);
  const normalized_query = normalize_search(query.trim());
  const filtered_documents = useMemo(
    () =>
      documents.filter((document) =>
        normalize_search(`${document.title} ${document.category}`).includes(normalized_query),
      ),
    [documents, normalized_query],
  );
  const categories = useMemo(
    () =>
      Array.from(new Set(filtered_documents.map(({ category }) => category))).map((category) => ({
        category,
        documents: filtered_documents.filter((document) => document.category === category),
      })),
    [filtered_documents],
  );

  const content = (() => {
    if (forced_state === "loading") return <LoadingState />;
    if (forced_state === "vazio") return <EmptyState />;
    if (forced_state === "erro") return <ErrorState />;
    if (!current_document) return <EmptyState />;
    return <MarkdownView content={current_document.content} />;
  })();

  return (
    <div className="viewer-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo principal
      </a>

      <header className="viewer-header">
        <button
          aria-controls="document-sidebar"
          aria-expanded={mobile_open}
          aria-label="Abrir menu de documentos"
          className="icon-button menu-button"
          onClick={() => set_mobile_open(true)}
          type="button"
        >
          <Menu aria-hidden="true" size={20} strokeWidth={1.75} />
        </button>
        <div className="brand-mark" aria-hidden="true">R</div>
        <div className="header-title">
          <span>Biblioteca Markdown</span>
          <strong>{project_title}</strong>
        </div>
        <button
          aria-label="Imprimir documento"
          className="print-button"
          disabled={!current_document}
          onClick={() => window.print()}
          type="button"
        >
          <Printer aria-hidden="true" size={18} strokeWidth={1.75} />
          <span>Imprimir</span>
        </button>
      </header>

      {mobile_open ? (
        <button
          aria-label="Fechar menu de documentos"
          className="sidebar-backdrop"
          onClick={() => set_mobile_open(false)}
          type="button"
        />
      ) : null}

      <aside className={mobile_open ? "viewer-sidebar sidebar-open" : "viewer-sidebar"} id="document-sidebar">
        <div className="sidebar-heading">
          <span>Documentos publicados</span>
          <button
            aria-label="Fechar menu"
            className="icon-button close-button"
            onClick={() => set_mobile_open(false)}
            type="button"
          >
            <X aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
        </div>

        <label className="search-field">
          <span className="sr-only">Filtrar documentos</span>
          <Search aria-hidden="true" size={17} strokeWidth={1.75} />
          <input
            aria-label="Filtrar documentos"
            onChange={(event) => set_query(event.target.value)}
            placeholder="Buscar por título..."
            type="search"
            value={query}
          />
          {query ? (
            <button aria-label="Limpar busca" onClick={() => set_query("")} type="button">
              <X aria-hidden="true" size={17} strokeWidth={1.75} />
            </button>
          ) : null}
        </label>

        <nav aria-label="Índice de documentos" className="document-navigation">
          {categories.length === 0 ? (
            <EmptyState search={Boolean(query)} />
          ) : (
            categories.map(({ category, documents: category_documents }) => (
              <section className="document-category" key={category}>
                <h2>{category}</h2>
                <ul>
                  {category_documents.map((document) => {
                    const active = document.slug.join("/") === current_document?.slug.join("/");
                    return (
                      <li key={document.slug.join("/")}>
                        <a
                          aria-current={active ? "page" : undefined}
                          href={document_href(document)}
                          onClick={() => set_mobile_open(false)}
                        >
                          <FileText aria-hidden="true" size={17} strokeWidth={1.75} />
                          <span>{document.title}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </nav>
      </aside>

      <main id="main-content" className="viewer-main">
        <article className="document-surface">{content}</article>
      </main>
    </div>
  );
}
