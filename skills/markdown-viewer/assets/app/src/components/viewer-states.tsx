import { AlertTriangle, FileQuestion, SearchX } from "lucide-react";

export type ViewerStateName = "loading" | "vazio" | "erro";

export function LoadingState() {
  return (
    <div className="state-loading" data-testid="viewer-state-loading" role="status">
      <span className="sr-only">Carregando documentos</span>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line skeleton-line-short" />
      <div className="skeleton skeleton-block" />
    </div>
  );
}

export function EmptyState({ search = false }: { search?: boolean }) {
  const Icon = search ? SearchX : FileQuestion;
  return (
    <div className="state-card" data-testid="viewer-state-vazio" role="status">
      <Icon aria-hidden="true" size={28} strokeWidth={1.75} />
      <h2>{search ? "Nenhum documento encontrado" : "Nenhum documento publicado"}</h2>
      <p>
        {search
          ? "Ajuste o termo ou limpe a busca para restaurar o índice."
          : "Revise a allowlist do manifesto deste projeto."}
      </p>
    </div>
  );
}

export function ErrorState({ on_retry }: { on_retry?: () => void }) {
  return (
    <div className="state-card state-card-error" data-testid="viewer-state-erro" role="alert">
      <AlertTriangle aria-hidden="true" size={28} strokeWidth={1.75} />
      <h2>Não foi possível abrir o documento</h2>
      <p>O arquivo permitido existe, mas sua leitura ou renderização falhou.</p>
      {on_retry ? (
        <button className="secondary-button" onClick={on_retry} type="button">
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}
