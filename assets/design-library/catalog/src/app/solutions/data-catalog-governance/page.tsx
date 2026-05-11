"use client";

import { SolutionLayout } from "@/components/solutions/solution-layout";
import { cn } from "@/lib/utils";
import { Database, Key, Activity, Code, Shield, Clock, CheckCircle, XCircle } from "lucide-react";

const CLIENTS = [
  { name: "Dashboard RH", status: "active", rpm: 100, requests: "12.4K", lastUsed: "27/03 15:30", grants: 3 },
  { name: "App Professores", status: "active", rpm: 50, requests: "8.2K", lastUsed: "27/03 14:15", grants: 2 },
  { name: "BI Reports (Legacy)", status: "suspended", rpm: 200, requests: "45.1K", lastUsed: "15/03 09:00", grants: 5 },
];

const DATA_PRODUCTS = [
  { name: "Funcionários Ativos", slug: "/api/v1/employees", status: "published", queries: 3, lastSync: "27/03 06:00" },
  { name: "Folha Mensal", slug: "/api/v1/payroll", status: "published", queries: 2, lastSync: "01/03 00:00" },
  { name: "Matrículas 2026", slug: "/api/v1/enrollments", status: "review", queries: 1, lastSync: "N/A" },
  { name: "Inadimplência", slug: "/api/v1/delinquency", status: "published", queries: 4, lastSync: "27/03 06:00" },
];

export default function DataCatalogPage() {
  return (
    <SolutionLayout id="data-catalog-governance" title="API Factory + Data Catalog" source="raiz-platform" category="Tools">
      <p className="mb-6 text-sm text-muted-foreground">
        SQL catalog → data products → managed REST endpoints. Clients com rate limits, grants scoped, governance queue.
      </p>

      <div className="space-y-6">
        {/* API Clients */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2"><Key className="h-4 w-4 text-[var(--raiz-orange)]" /><span className="text-sm font-medium">API Clients</span></div>
            <button className="rounded-md px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: "var(--raiz-orange)" }}>+ Novo Client</button>
          </div>
          <div className="divide-y divide-border">
            {CLIENTS.map((c) => (
              <div key={c.name} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{c.name}</p>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", c.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.grants} grants · {c.rpm} req/min</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{c.requests}</p>
                  <p className="text-[10px] text-muted-foreground">{c.lastUsed}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Products */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2"><Database className="h-4 w-4 text-[var(--raiz-teal)]" /><span className="text-sm font-medium">Data Products</span></div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> 1 em review
            </div>
          </div>
          <div className="divide-y divide-border">
            {DATA_PRODUCTS.map((dp) => (
              <div key={dp.slug} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{dp.name}</p>
                    {dp.status === "review" ? (
                      <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-medium text-yellow-400"><Clock className="h-2.5 w-2.5" /> review</span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-medium text-green-400"><CheckCircle className="h-2.5 w-2.5" /> published</span>
                    )}
                  </div>
                  <code className="text-xs text-muted-foreground">{dp.slug}</code>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{dp.queries} queries</p>
                  <p>Sync: {dp.lastSync}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code snippet */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium"><Code className="h-4 w-4 text-[var(--raiz-orange)]" /> Code Snippet</div>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-6">
            <span className="text-purple-400">const</span> <span className="text-zinc-300">response</span> = <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-green-400">&quot;https://api.raiz.edu.br/v1/employees&quot;</span>, {"{"}
{"\n"}  headers: {"{"} <span className="text-green-400">&quot;X-API-Key&quot;</span>: <span className="text-green-400">&quot;rz_live_...&quot;</span> {"}"}
{"\n"}{"}"});
{"\n"}<span className="text-purple-400">const</span> <span className="text-zinc-300">data</span> = <span className="text-purple-400">await</span> response.<span className="text-blue-400">json</span>();
          </pre>
        </div>
      </div>
    </SolutionLayout>
  );
}
