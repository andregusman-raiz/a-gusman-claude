import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="standalone-state" id="main-content">
      <div className="state-card">
        <FileQuestion aria-hidden="true" size={32} strokeWidth={1.75} />
        <h1>Documento não encontrado</h1>
        <p>O endereço não existe ou não está autorizado pelo manifesto deste projeto.</p>
        <Link className="secondary-button" href="/">
          Voltar ao índice
        </Link>
      </div>
    </main>
  );
}
