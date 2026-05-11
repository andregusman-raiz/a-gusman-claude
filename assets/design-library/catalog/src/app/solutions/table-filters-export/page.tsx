"use client";

import { useState, useMemo } from "react";
import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Search, Download, X, Filter } from "lucide-react";

const EMPLOYEES = [
  { id: "001", nome: "João Silva Costa", cargo: "Coordenador Pedagógico", secao: "Administração", admissao: "2019-03-15", situacao: "ativo", categoria: "administrativo", chapa: "10045" },
  { id: "002", nome: "Maria Oliveira Santos", cargo: "Professora — Matemática", secao: "Pedagógico", admissao: "2020-08-01", situacao: "ativo", categoria: "professor", chapa: "10102" },
  { id: "003", nome: "Pedro Almeida Rocha", cargo: "Auxiliar Administrativo", secao: "Financeiro", admissao: "2021-02-10", situacao: "ferias", categoria: "administrativo", chapa: "10156" },
  { id: "004", nome: "Ana Beatriz Lima", cargo: "Professora — Português", secao: "Pedagógico", admissao: "2018-01-20", situacao: "ativo", categoria: "professor", chapa: "09987" },
  { id: "005", nome: "Carlos Eduardo Martins", cargo: "Diretor", secao: "Diretoria", admissao: "2015-06-01", situacao: "ativo", categoria: "administrativo", chapa: "08234" },
  { id: "006", nome: "Fernanda Souza", cargo: "Estagiária — TI", secao: "Tecnologia", admissao: "2024-01-15", situacao: "ativo", categoria: "administrativo", chapa: "11890" },
  { id: "007", nome: "Roberto Nascimento", cargo: "Professor — Ciências", secao: "Pedagógico", admissao: "2022-07-01", situacao: "afastado", categoria: "professor", chapa: "10534" },
  { id: "008", nome: "Juliana Pereira", cargo: "Secretária Escolar", secao: "Secretaria", admissao: "2017-11-20", situacao: "ativo", categoria: "administrativo", chapa: "09456" },
  { id: "009", nome: "Lucas Ferreira", cargo: "Professor — Ed. Física", secao: "Pedagógico", admissao: "2023-02-01", situacao: "ativo", categoria: "professor", chapa: "11023" },
  { id: "010", nome: "Mariana Dias", cargo: "Analista Financeiro", secao: "Financeiro", admissao: "2020-04-10", situacao: "desligado", categoria: "administrativo", chapa: "10089" },
];

const CATEGORIAS = [
  { key: "todos", label: "Todos" },
  { key: "administrativo", label: "Admin" },
  { key: "professor", label: "Professor" },
];

const SIT_STYLES: Record<string, { bg: string; text: string }> = {
  ativo: { bg: "bg-green-500/10", text: "text-green-400" },
  ferias: { bg: "bg-blue-500/10", text: "text-blue-400" },
  afastado: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  desligado: { bg: "bg-red-500/10", text: "text-red-400" },
};

export default function TableFiltersExportPage() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [coligada, setColigada] = useState("Todas");
  const [page, setPage] = useState(0);
  const perPage = 5;

  const filtered = useMemo(() => {
    return EMPLOYEES.filter((e) => {
      if (busca && !e.nome.toLowerCase().includes(busca.toLowerCase()) && !e.cargo.toLowerCase().includes(busca.toLowerCase())) return false;
      if (categoria !== "todos" && e.categoria !== categoria) return false;
      return true;
    });
  }, [busca, categoria]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <SolutionLayout id="table-filters-export" title="Data Table + Filtros + Export" source="salarios-platform + auditoria-raiz" category="Data Display">
      <p className="mb-6 text-sm text-muted-foreground">
        Tabela com filtros multi-select, busca debounced, URL-persisted state e export Excel multi-sheet.
      </p>

      {/* Global filters bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          value={coligada}
          onChange={(e) => setColigada(e.target.value)}
        >
          <option>Todas</option>
          <option>Colégio QI</option>
          <option>Raiz Sul</option>
          <option>Raiz Educação</option>
        </select>
        <select className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
          <option>Todas filiais</option>
          <option>Matriz — Porto Alegre</option>
          <option>Filial — Canoas</option>
        </select>
        <select className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
          <option>Mar/2026</option>
          <option>Fev/2026</option>
          <option>Jan/2026</option>
        </select>
        {coligada !== "Todas" && (
          <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">
            1 filtro ativo <X className="h-3 w-3 cursor-pointer" onClick={() => setColigada("Todas")} />
          </span>
        )}
      </div>

      {/* Tab filters + search */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {CATEGORIAS.map((c) => (
            <button
              key={c.key}
              onClick={() => { setCategoria(c.key); setPage(0); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                categoria === c.key ? "bg-orange-500/15 text-orange-400" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-8 rounded-md border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(0); }}
            />
          </div>
          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_180px_140px_120px_100px] bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>Funcionário</span><span>Cargo</span><span>Seção</span><span>Admissão</span><span>Situação</span>
        </div>
        {paged.map((e) => {
          const sit = SIT_STYLES[e.situacao] ?? SIT_STYLES.ativo;
          return (
            <div key={e.id} className="grid grid-cols-[1fr_180px_140px_120px_100px] items-center border-t border-border px-4 py-3 text-sm hover:bg-muted/20 transition-colors">
              <div>
                <p className="font-medium">{e.nome}</p>
                <p className="text-xs text-muted-foreground">Chapa {e.chapa}</p>
              </div>
              <span className="text-muted-foreground">{e.cargo}</span>
              <span className="text-muted-foreground">{e.secao}</span>
              <span className="font-mono text-xs text-muted-foreground">{e.admissao}</span>
              <span className={cn("inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium capitalize", sit.bg, sit.text)}>
                {e.situacao}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span>{page + 1}/{totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-40"
          >
            Próximo
          </button>
        </div>
      </div>
    </SolutionLayout>
  );
}
