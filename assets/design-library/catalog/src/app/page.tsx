"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  BarChart3, Table2, FileText, GitBranch, LayoutDashboard,
  Workflow, MessageSquare, BookOpen, QrCode, Code, GripVertical, FileDown,
  Sun, Moon, Check, Download, X, Search, Filter,
  Brain, Calendar, PieChart, Mic, FileSignature, Palette,
  Scale, Database, Rocket, Tv, Target, UserCheck,
} from "lucide-react";

// ─── Solution data ──────────────────────────────────────────────────────────

type Category = "Data Display" | "Forms" | "Workflow" | "Layout" | "AI" | "Media" | "Tools" | "Export" | "Legal";

interface Solution {
  id: string;
  name: string;
  desc: string;
  icon: typeof BarChart3;
  category: Category;
  complexity: "Baixa" | "Média" | "Alta" | "Muito Alta";
  tags: string[];
  miniPreview: "kpi" | "table" | "form" | "timeline" | "shell" | "flow" | "chat" | "book" | "qr" | "code" | "kanban" | "docs" | "rag" | "calendar" | "bi" | "transcript" | "clm" | "studio" | "legal" | "datacatalog" | "appbuilder" | "tvcounter" | "radar" | "contractor";
}

const solutions: Solution[] = [
  // ─── Padrões fundamentais de UI ───
  { id: "dashboard-kpi", name: "Metric Cards + Sparklines", desc: "Cards com sparkline, trend badge, status dots e accent colors", icon: BarChart3, category: "Data Display", complexity: "Baixa", tags: ["cards", "métricas", "sparkline", "kpi", "dashboard"], miniPreview: "kpi" },
  { id: "table-filters-export", name: "Data Table + Filtros + Export", desc: "Filtros multi-select, busca server-side, paginação, export Excel multi-sheet", icon: Table2, category: "Data Display", complexity: "Alta", tags: ["tabela", "filtros", "export", "excel", "paginação", "busca"], miniPreview: "table" },
  { id: "forms-multistep", name: "Dynamic Form Engine", desc: "Schema dinâmico, validação runtime, 14+ tipos de campo, steps condicionais", icon: FileText, category: "Forms", complexity: "Muito Alta", tags: ["formulário", "steps", "validação", "zod", "dynamic", "wizard"], miniPreview: "form" },
  { id: "status-workflow-timeline", name: "Status Machine + Audit Trail", desc: "Transições com role gates, timeline vertical, histórico de mudanças", icon: GitBranch, category: "Workflow", complexity: "Média", tags: ["status", "workflow", "timeline", "auditoria", "state-machine"], miniPreview: "timeline" },
  { id: "app-shell-sidebar", name: "App Shell Responsivo", desc: "Sidebar colapsável 3 modos, topbar, breadcrumbs, mobile drawer", icon: LayoutDashboard, category: "Layout", complexity: "Média", tags: ["sidebar", "topbar", "layout", "responsivo", "breadcrumbs", "shell"], miniPreview: "shell" },
  { id: "workflow-builder", name: "Visual Flow Designer", desc: "Editor visual drag-drop com node types, palette, undo/redo, validation", icon: Workflow, category: "Workflow", complexity: "Muito Alta", tags: ["flow", "react-flow", "nodes", "automação", "drag-drop", "editor"], miniPreview: "flow" },
  { id: "chat-ai-streaming", name: "Chat Interface + Streaming", desc: "Chat com streaming, tool calls, preview de artefatos em side panel", icon: MessageSquare, category: "AI", complexity: "Alta", tags: ["chat", "ai", "streaming", "tool-calls", "mensagens"], miniPreview: "chat" },
  { id: "pageflip-3d", name: "Document Viewer 3D", desc: "Viewer com page-turn animation, zoom, fullscreen, thumbnails", icon: BookOpen, category: "Media", complexity: "Média", tags: ["viewer", "flipbook", "3d", "pdf", "animação", "páginas"], miniPreview: "book" },
  { id: "qr-designer", name: "Interactive Code Generator", desc: "Gerador com customização visual, preview live, múltiplos formatos", icon: QrCode, category: "Tools", complexity: "Média", tags: ["gerador", "customização", "preview", "estilos", "download"], miniPreview: "qr" },
  { id: "code-editor", name: "Embedded Code Editor", desc: "Editor com temas branded, syntax highlighting, auto dark-mode, 30+ langs", icon: Code, category: "Tools", complexity: "Média", tags: ["editor", "código", "syntax", "monaco", "temas"], miniPreview: "code" },
  { id: "dragdrop-virtual-scroll", name: "Kanban Board + Virtual List", desc: "Drag-drop entre colunas, dependency lines, timeline virtualizada 1000+ itens", icon: GripVertical, category: "Data Display", complexity: "Alta", tags: ["kanban", "drag-drop", "virtual-scroll", "board", "colunas"], miniPreview: "kanban" },
  { id: "document-generation", name: "Multi-Format Export Engine", desc: "Pipeline compartilhado PDF/Word/Excel, lazy loading, branding consistente", icon: FileDown, category: "Export", complexity: "Média", tags: ["pdf", "word", "excel", "export", "documento", "geração"], miniPreview: "docs" },
  // ─── Padrões avançados de UI ───
  { id: "rag-knowledge-base", name: "Document Pipeline Manager", desc: "Upload, processing status com polling, organização por pastas, stats", icon: Brain, category: "AI", complexity: "Alta", tags: ["upload", "pipeline", "documentos", "pastas", "status", "polling"], miniPreview: "rag" },
  { id: "social-media-publisher", name: "Content Calendar + Composer", desc: "Calendário mensal com status pills, compositor com limites por canal", icon: Calendar, category: "Tools", complexity: "Alta", tags: ["calendário", "agendamento", "compositor", "limites", "canais"], miniPreview: "calendar" },
  { id: "bi-data-explorer", name: "Interactive Chart Builder", desc: "Drag-drop fields para construir qualquer visualização, auto-infer tipos", icon: PieChart, category: "Data Display", complexity: "Muito Alta", tags: ["gráficos", "exploração", "drag-drop", "visualização", "dados"], miniPreview: "bi" },
  { id: "meeting-transcript-ai", name: "Speaker Timeline + AI Summary", desc: "Timeline por speaker com cores, busca inline, resumo AI em 5 formatos", icon: Mic, category: "AI", complexity: "Alta", tags: ["timeline", "speakers", "transcrição", "resumo", "áudio"], miniPreview: "transcript" },
  { id: "contract-lifecycle", name: "Negotiation Flow + Risk Matrix", desc: "Rounds tipados (proposta/contra/aceite), AI risk matrix 3×3, gauge score", icon: FileSignature, category: "Workflow", complexity: "Muito Alta", tags: ["negociação", "risco", "rounds", "aprovação", "matriz"], miniPreview: "clm" },
  { id: "content-studio-ai", name: "Rich Content Studio", desc: "Editor WYSIWYG + slide builder + image canvas + AI side panel", icon: Palette, category: "AI", complexity: "Muito Alta", tags: ["editor", "slides", "imagens", "canvas", "wysiwyg", "blocos"], miniPreview: "studio" },
  { id: "litigation-case-manager", name: "Case Manager + AI Copilot", desc: "Lista de casos com risco, estratégia, provisões financeiras, playbooks, AI", icon: Scale, category: "Legal", complexity: "Alta", tags: ["casos", "estratégia", "provisões", "playbooks", "copilot"], miniPreview: "legal" },
  { id: "data-catalog-governance", name: "API Factory + Data Catalog", desc: "Catálogo de dados, clients com rate limits, grants, code snippets, governance", icon: Database, category: "Tools", complexity: "Muito Alta", tags: ["catálogo", "api", "clients", "governance", "endpoints", "dados"], miniPreview: "datacatalog" },
  { id: "ai-app-builder", name: "AI Build Pipeline + Preview", desc: "Wizard → pipeline multi-step → decision checkpoints → preview embedded → deploy", icon: Rocket, category: "AI", complexity: "Muito Alta", tags: ["pipeline", "wizard", "preview", "deploy", "steps", "decisão"], miniPreview: "appbuilder" },
  { id: "tv-realtime-counter", name: "Fullscreen Counter Display", desc: "Contador gigante com progress ring, celebrations animadas, polling real-time", icon: Tv, category: "Data Display", complexity: "Baixa", tags: ["contador", "fullscreen", "animação", "realtime", "tv", "ring"], miniPreview: "tvcounter" },
  { id: "skill-assessment-profiler", name: "Radar Chart + Profile Report", desc: "Radar SVG custom, bar chart com mediana, AI narrative report, print-ready", icon: Target, category: "Data Display", complexity: "Alta", tags: ["radar", "gráfico", "perfil", "avaliação", "relatório", "svg"], miniPreview: "radar" },
  { id: "contractor-management", name: "Multi-Step Onboarding + Import", desc: "Cadastro multi-seção, validação CNPJ, bulk CSV com preview e validação por linha", icon: UserCheck, category: "Forms", complexity: "Alta", tags: ["cadastro", "onboarding", "import", "csv", "validação", "steps"], miniPreview: "contractor" },
];

const ALL_CATEGORIES: Category[] = ["Data Display", "Forms", "Workflow", "Layout", "AI", "Media", "Tools", "Export", "Legal"];

const catColors: Record<Category, { bg: string; text: string; dot: string }> = {
  "Data Display": { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  Forms: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  Workflow: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  Layout: { bg: "bg-teal-500/10", text: "text-teal-400", dot: "bg-teal-400" },
  AI: { bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400" },
  Media: { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
  Tools: { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" },
  Export: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
  Legal: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
};

const cxColor: Record<string, string> = {
  Baixa: "text-green-500", Média: "text-blue-400", Alta: "text-[var(--raiz-orange)]", "Muito Alta": "text-red-400",
};

// ─── Mini preview SVGs ──────────────────────────────────────────────────────

function MiniPreview({ type }: { type: Solution["miniPreview"] }) {
  const c = "var(--raiz-orange)";
  return (
    <svg viewBox="0 0 120 64" className="h-full w-full" fill="none">
      {type === "kpi" && <>
        <rect x="2" y="8" width="35" height="48" rx="3" fill={c} fillOpacity="0.08" stroke={c} strokeOpacity="0.3" strokeWidth="0.5" />
        <rect x="7" y="14" width="16" height="2" rx="1" fill={c} fillOpacity="0.4" />
        <rect x="7" y="20" width="24" height="4" rx="1" fill={c} fillOpacity="0.7" />
        <polyline points="7,36 12,32 17,34 22,28 27,30" stroke={c} strokeWidth="1" strokeLinecap="round" />
        <rect x="42" y="8" width="35" height="48" rx="3" fill="#5BB5A2" fillOpacity="0.08" stroke="#5BB5A2" strokeOpacity="0.3" strokeWidth="0.5" />
        <rect x="47" y="14" width="16" height="2" rx="1" fill="#5BB5A2" fillOpacity="0.4" />
        <rect x="47" y="20" width="20" height="4" rx="1" fill="#5BB5A2" fillOpacity="0.7" />
        <polyline points="47,36 52,34 57,38 62,32 67,35" stroke="#5BB5A2" strokeWidth="1" strokeLinecap="round" />
        <rect x="82" y="8" width="35" height="48" rx="3" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.5" />
        <rect x="87" y="14" width="16" height="2" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="87" y="20" width="18" height="4" rx="1" fill="currentColor" fillOpacity="0.3" />
      </>}
      {type === "table" && <>
        <rect x="2" y="4" width="116" height="10" rx="2" fill={c} fillOpacity="0.06" />
        <rect x="6" y="7" width="20" height="4" rx="1" fill={c} fillOpacity="0.3" />
        <rect x="90" y="7" width="24" height="4" rx="1" fill={c} fillOpacity="0.15" />
        {[18, 28, 38, 48].map((y) => <line key={y} x1="2" y1={y} x2="118" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />)}
        {[18, 28, 38, 48].map((y, i) => <g key={`tr-${i}`}><rect x="6" y={y + 2} width={30 + i * 3} height="3" rx="1" fill="currentColor" fillOpacity="0.15" /><rect x="90" y={y + 2} width="14" height="3" rx="1" fill={i === 1 ? "#5BB5A2" : c} fillOpacity="0.3" /></g>)}
        <rect x="2" y="56" width="116" height="6" rx="2" fill="currentColor" fillOpacity="0.03" />
      </>}
      {type === "form" && <>
        <rect x="2" y="4" width="25" height="56" rx="2" fill={c} fillOpacity="0.06" />
        {[0, 1, 2].map((i) => <g key={`fs-${i}`}><circle cx="14" cy={16 + i * 16} r="4" fill={i === 1 ? c : "currentColor"} fillOpacity={i === 1 ? 0.3 : 0.08} /><text x="14" y={18 + i * 16} textAnchor="middle" fontSize="5" fill={i === 1 ? c : "currentColor"} fillOpacity={i === 1 ? 0.8 : 0.3}>{i + 1}</text></g>)}
        <rect x="32" y="4" width="86" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        {[12, 26, 40].map((y, i) => <g key={`fi-${i}`}><rect x="38" y={y} width={20 + i * 5} height="2.5" rx="1" fill="currentColor" fillOpacity="0.2" /><rect x="38" y={y + 5} width="74" height="6" rx="2" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" /></g>)}
      </>}
      {type === "timeline" && <>
        <rect x="2" y="4" width="55" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="8" y="10" width="30" height="3" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="8" y="18" width="16" height="5" rx="2" fill="#3B82F6" fillOpacity="0.2" />
        <rect x="8" y="30" width="40" height="4" rx="2" fill={c} fillOpacity="0.3" />
        <rect x="62" y="4" width="55" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <line x1="70" y1="12" x2="70" y2="52" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
        {[12, 24, 36, 48].map((y) => <circle key={y} cx="70" cy={y} r="2.5" fill={y === 48 ? "#2D9E6B" : c} fillOpacity="0.5" />)}
      </>}
      {type === "shell" && <>
        <rect x="2" y="4" width="22" height="56" rx="2" fill="currentColor" fillOpacity="0.08" />
        <rect x="6" y="8" width="14" height="3" rx="1" fill={c} fillOpacity="0.5" />
        {[16, 22, 28, 36, 42].map((y, i) => <rect key={y} x="6" y={y} width="14" height="2.5" rx="1" fill={i === 0 ? c : "currentColor"} fillOpacity={i === 0 ? 0.3 : 0.1} />)}
        <rect x="26" y="4" width="92" height="10" rx="0" fill="currentColor" fillOpacity="0.04" />
        <rect x="30" y="7" width="40" height="4" rx="1" fill="currentColor" fillOpacity="0.1" />
        <circle cx="110" cy="9" r="3" fill={c} fillOpacity="0.2" />
        <rect x="26" y="16" width="92" height="44" rx="0" fill="currentColor" fillOpacity="0.02" />
      </>}
      {type === "flow" && <>
        <circle cx="15" cy="32" r="6" fill="#2D9E6B" fillOpacity="0.2" stroke="#2D9E6B" strokeOpacity="0.4" strokeWidth="0.5" />
        <line x1="21" y1="32" x2="35" y2="32" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.5" />
        <rect x="35" y="24" width="24" height="16" rx="2" fill="#3B82F6" fillOpacity="0.1" stroke="#3B82F6" strokeOpacity="0.3" strokeWidth="0.5" />
        <line x1="59" y1="32" x2="70" y2="32" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.5" />
        <rect x="66" y="28" width="10" height="10" rx="0" fill="#EAB308" fillOpacity="0.1" stroke="#EAB308" strokeOpacity="0.3" strokeWidth="0.5" transform="rotate(45 71 33)" />
        <line x1="78" y1="26" x2="90" y2="18" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.5" />
        <rect x="90" y="10" width="24" height="14" rx="2" fill="#A855F7" fillOpacity="0.1" stroke="#A855F7" strokeOpacity="0.3" strokeWidth="0.5" />
        <line x1="78" y1="38" x2="90" y2="46" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.5" />
        <rect x="90" y="40" width="24" height="14" rx="2" fill="#06B6D4" fillOpacity="0.1" stroke="#06B6D4" strokeOpacity="0.3" strokeWidth="0.5" />
      </>}
      {type === "chat" && <>
        <rect x="2" y="4" width="80" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="30" y="10" width="48" height="8" rx="4" fill={c} fillOpacity="0.15" />
        <circle cx="12" cy="28" r="4" fill={c} fillOpacity="0.2" />
        <rect x="20" y="24" width="50" height="12" rx="4" fill="currentColor" fillOpacity="0.06" />
        <rect x="20" y="28" width="40" height="5" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.5" />
        <rect x="6" y="48" width="72" height="8" rx="3" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="86" y="4" width="32" height="56" rx="2" fill={c} fillOpacity="0.04" stroke={c} strokeOpacity="0.15" strokeWidth="0.5" />
      </>}
      {type === "book" && <>
        <rect x="20" y="6" width="38" height="52" rx="1" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.5" />
        <rect x="62" y="6" width="38" height="52" rx="1" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <line x1="60" y1="6" x2="60" y2="58" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        <rect x="26" y="16" width="26" height="3" rx="1" fill={c} fillOpacity="0.3" />
        <rect x="26" y="24" width="20" height="2" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="26" y="30" width="24" height="2" rx="1" fill="currentColor" fillOpacity="0.1" />
      </>}
      {type === "qr" && <>
        <rect x="35" y="8" width="50" height="50" rx="3" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        {[14, 22, 30, 38, 46].map((y, yi) => [40, 48, 56, 64, 72].map((x, xi) => <rect key={`qr-${xi}-${yi}`} x={x} y={y} width="5" height="5" rx="1" fill={c} fillOpacity={(xi + yi) % 3 === 0 ? 0.1 : 0.4} />))}
        <rect x="52" y="26" width="16" height="12" rx="2" fill="white" stroke={c} strokeOpacity="0.4" strokeWidth="0.5" />
        <text x="60" y="34" textAnchor="middle" fontSize="5" fill={c} fontWeight="900">rAIz</text>
      </>}
      {type === "code" && <>
        <rect x="2" y="4" width="116" height="8" rx="2" fill="currentColor" fillOpacity="0.06" />
        <circle cx="8" cy="8" r="2" fill="#DC3545" fillOpacity="0.4" />
        <circle cx="14" cy="8" r="2" fill="#EAB308" fillOpacity="0.4" />
        <circle cx="20" cy="8" r="2" fill="#2D9E6B" fillOpacity="0.4" />
        <rect x="2" y="14" width="12" height="44" rx="0" fill="currentColor" fillOpacity="0.04" />
        {[18, 24, 30, 36, 42, 48].map((y, i) => <text key={y} x="10" y={y + 3} textAnchor="end" fontSize="4" fill="currentColor" fillOpacity="0.2">{i + 1}</text>)}
        <rect x="18" y="18" width="22" height="3" rx="1" fill="#A855F7" fillOpacity="0.3" />
        <rect x="44" y="18" width="30" height="3" rx="1" fill="#2D9E6B" fillOpacity="0.3" />
        <rect x="22" y="24" width="18" height="3" rx="1" fill="#3B82F6" fillOpacity="0.3" />
        <rect x="18" y="30" width="50" height="3" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="22" y="36" width="35" height="3" rx="1" fill={c} fillOpacity="0.25" />
        <rect x="22" y="42" width="28" height="3" rx="1" fill="#2D9E6B" fillOpacity="0.25" />
      </>}
      {type === "kanban" && <>
        {[2, 32, 62, 92].map((x, col) => (
          <g key={`kb-${col}`}>
            <rect x={x} y="4" width="26" height="6" rx="1" fill={[c, "#3B82F6", "#A855F7", "#2D9E6B"][col]} fillOpacity="0.15" />
            {Array.from({ length: [2, 2, 1, 3][col] }, (_, i) => (
              <rect key={`kc-${col}-${i}`} x={x} y={14 + i * 14} width="26" height="11" rx="2" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
            ))}
          </g>
        ))}
      </>}
      {type === "docs" && <>
        {[{x: 6, c: "#DC3545", l: "PDF"}, {x: 46, c: "#3B82F6", l: "DOC"}, {x: 86, c: "#2D9E6B", l: "XLS"}].map((d) => (
          <g key={`doc-${d.l}`}>
            <rect x={d.x} y="6" width="28" height="36" rx="2" fill={d.c} fillOpacity="0.06" stroke={d.c} strokeOpacity="0.2" strokeWidth="0.5" />
            <rect x={d.x + 4} y="12" width="20" height="2" rx="1" fill={d.c} fillOpacity="0.3" />
            <rect x={d.x + 4} y="18" width="16" height="1.5" rx="0.5" fill="currentColor" fillOpacity="0.1" />
            <rect x={d.x + 4} y="22" width="18" height="1.5" rx="0.5" fill="currentColor" fillOpacity="0.1" />
            <rect x={d.x + 4} y="26" width="14" height="1.5" rx="0.5" fill="currentColor" fillOpacity="0.1" />
            <text x={d.x + 14} y="52" textAnchor="middle" fontSize="5" fill={d.c} fillOpacity="0.5" fontWeight="600">{d.l}</text>
          </g>
        ))}
      </>}
      {/* RAG — folders + docs + status */}
      {type === "rag" && <>
        <rect x="2" y="4" width="30" height="56" rx="2" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        {[12, 26, 40].map((y, i) => <g key={`rg-${i}`}><rect x="6" y={y} width="8" height="8" rx="1.5" fill={c} fillOpacity={i === 0 ? 0.3 : 0.1} /><rect x="16" y={y + 1} width="12" height="2" rx="0.5" fill="currentColor" fillOpacity="0.15" /><rect x="16" y={y + 5} width="8" height="1.5" rx="0.5" fill="currentColor" fillOpacity="0.08" /></g>)}
        <rect x="36" y="4" width="82" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        {[12, 22, 32, 42].map((y, i) => <g key={`rd-${i}`}><rect x="40" y={y} width="4" height="4" rx="0.5" fill="currentColor" fillOpacity="0.1" /><rect x="48" y={y} width={30 + i * 5} height="2" rx="0.5" fill="currentColor" fillOpacity="0.12" /><circle cx="110" cy={y + 2} r="2" fill={[c, c, "#3B82F6", "#EAB308"][i]} fillOpacity="0.4" /></g>)}
      </>}
      {/* Calendar — month grid + pills */}
      {type === "calendar" && <>
        <rect x="2" y="4" width="80" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="6" y="8" width="72" height="4" rx="1" fill="currentColor" fillOpacity="0.06" />
        {Array.from({length: 28}, (_, i) => <rect key={`cal-${i}`} x={6 + (i % 7) * 10.5} y={16 + Math.floor(i / 7) * 9} width="9" height="7" rx="1" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.06" strokeWidth="0.3" />)}
        <rect x="16.5" y="18" width="4" height="2" rx="0.5" fill="#EC4899" fillOpacity="0.5" />
        <rect x="48" y="27" width="4" height="2" rx="0.5" fill="#3B82F6" fillOpacity="0.5" />
        <rect x="27" y="36" width="4" height="2" rx="0.5" fill={c} fillOpacity="0.5" />
        <rect x="86" y="4" width="32" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="90" y="10" width="24" height="3" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="90" y="18" width="24" height="20" rx="1" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
        <rect x="90" y="44" width="24" height="4" rx="1" fill={c} fillOpacity="0.2" />
      </>}
      {/* BI — drag fields + chart */}
      {type === "bi" && <>
        <rect x="2" y="4" width="24" height="56" rx="2" fill="currentColor" fillOpacity="0.05" />
        {[10, 18, 26, 34, 42].map((y, i) => <rect key={`bf-${i}`} x="5" y={y} width="18" height="5" rx="1" fill={["#3B82F6", "#A855F7", "#2D9E6B", c, "#06B6D4"][i]} fillOpacity="0.15" stroke={["#3B82F6", "#A855F7", "#2D9E6B", c, "#06B6D4"][i]} strokeOpacity="0.2" strokeWidth="0.3" />)}
        <rect x="30" y="4" width="88" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        {[38, 52, 66, 80, 94, 108].map((x, i) => <rect key={`bb-${i}`} x={x} y={50 - [30, 22, 38, 18, 28, 35][i]} width="10" height={[30, 22, 38, 18, 28, 35][i]} rx="1" fill={c} fillOpacity={0.3 + i * 0.08} />)}
      </>}
      {/* Transcript — speaker segments + summary */}
      {type === "transcript" && <>
        <rect x="2" y="4" width="60" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        {[10, 22, 34, 46].map((y, i) => <g key={`sp-${i}`}><circle cx="10" cy={y + 3} r="3" fill={[c, "#5BB5A2", "#3B82F6", c][i]} fillOpacity="0.4" /><rect x="16" y={y} width={[40, 35, 42, 30][i]} height="2" rx="0.5" fill="currentColor" fillOpacity="0.12" /><rect x="16" y={y + 4} width={[35, 28, 38, 25][i]} height="1.5" rx="0.5" fill="currentColor" fillOpacity="0.06" /></g>)}
        <rect x="66" y="4" width="52" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="70" y="10" width="20" height="3" rx="1" fill={c} fillOpacity="0.2" />
        {[18, 24, 30, 36, 42].map((y) => <rect key={`sm-${y}`} x="70" y={y} width={36 + (y % 5) * 2} height="2" rx="0.5" fill="currentColor" fillOpacity="0.08" />)}
      </>}
      {/* CLM — gauge + negotiation rounds */}
      {type === "clm" && <>
        <rect x="2" y="4" width="55" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <circle cx="30" cy="28" r="16" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="3" />
        <circle cx="30" cy="28" r="16" fill="none" stroke={c} strokeWidth="3" strokeDasharray="48 100" strokeLinecap="round" transform="rotate(-90 30 28)" />
        <text x="30" y="31" textAnchor="middle" fontSize="8" fill={c} fontWeight="700">48</text>
        {[0, 1, 2].map((i) => <rect key={`rm-${i}`} x={10 + i * 14} y={50} width="10" height="6" rx="1" fill={["#DC3545", "#EAB308", "#2D9E6B"][i]} fillOpacity="0.2" />)}
        <rect x="62" y="4" width="56" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <line x1="68" y1="12" x2="68" y2="52" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.5" />
        {[12, 22, 32, 42].map((y, i) => <g key={`nr-${i}`}><circle cx="68" cy={y + 2} r="2" fill={["#3B82F6", c, "#A1A1AA", "#2D9E6B"][i]} fillOpacity="0.5" /><rect x="74" y={y} width={30 + i * 3} height="2" rx="0.5" fill="currentColor" fillOpacity="0.1" /><rect x="74" y={y + 4} width={20 + i * 2} height="1.5" rx="0.5" fill="currentColor" fillOpacity="0.06" /></g>)}
      </>}
      {/* Studio — slide navigator + canvas + AI panel */}
      {type === "studio" && <>
        <rect x="2" y="4" width="20" height="56" rx="2" fill="currentColor" fillOpacity="0.05" />
        {[8, 24, 40].map((y, i) => <rect key={`sl-${i}`} x="4" y={y} width="16" height="12" rx="1" fill={i === 1 ? c : "currentColor"} fillOpacity={i === 1 ? 0.15 : 0.06} stroke={i === 1 ? c : "currentColor"} strokeOpacity={i === 1 ? 0.3 : 0.1} strokeWidth="0.5" />)}
        <rect x="26" y="4" width="66" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="32" y="10" width="30" height="4" rx="1" fill={c} fillOpacity="0.3" />
        <rect x="32" y="18" width="50" height="2" rx="0.5" fill="currentColor" fillOpacity="0.1" />
        <rect x="32" y="24" width="20" height="20" rx="1" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="56" y="24" width="30" height="2" rx="0.5" fill="currentColor" fillOpacity="0.08" />
        <rect x="56" y="30" width="26" height="2" rx="0.5" fill="currentColor" fillOpacity="0.08" />
        <rect x="96" y="4" width="22" height="56" rx="2" fill={c} fillOpacity="0.03" stroke={c} strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="99" y="10" width="16" height="8" rx="1" fill="currentColor" fillOpacity="0.05" />
        <rect x="99" y="22" width="16" height="5" rx="1" fill={c} fillOpacity="0.1" />
      </>}
      {/* Legal — case list + sidebar */}
      {type === "legal" && <>
        <rect x="2" y="4" width="82" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        {[10, 24, 38].map((y, i) => <g key={`lc-${i}`}><rect x="6" y={y} width="74" height="11" rx="1.5" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.3" /><rect x="10" y={y + 2} width={20 + i * 5} height="2" rx="0.5" fill="currentColor" fillOpacity="0.15" /><rect x="10" y={y + 6} width={30 + i * 3} height="1.5" rx="0.5" fill="currentColor" fillOpacity="0.06" /><circle cx="74" cy={y + 5.5} r="2.5" fill={["#DC3545", "#EAB308", "#2D9E6B"][i]} fillOpacity="0.4" /></g>)}
        <rect x="88" y="4" width="30" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <circle cx="103" cy="20" r="6" fill={c} fillOpacity="0.1" stroke={c} strokeOpacity="0.2" strokeWidth="0.5" />
        <rect x="92" y="32" width="22" height="2" rx="0.5" fill="currentColor" fillOpacity="0.1" />
        <rect x="92" y="38" width="22" height="2" rx="0.5" fill="currentColor" fillOpacity="0.1" />
        <rect x="92" y="44" width="22" height="2" rx="0.5" fill="currentColor" fillOpacity="0.1" />
      </>}
      {/* Data Catalog — clients + products + code */}
      {type === "datacatalog" && <>
        {[2, 42].map((x, s) => <g key={`dc-${s}`}><rect x={x} y="4" width="36" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" /><rect x={x + 4} y="8" width="16" height="2.5" rx="0.5" fill={s === 0 ? c : "#5BB5A2"} fillOpacity="0.3" />{[16, 26, 36, 46].map((y, i) => <g key={`di-${s}-${i}`}><rect x={x + 4} y={y} width={20 + i * 2} height="2" rx="0.5" fill="currentColor" fillOpacity="0.12" /><circle cx={x + 32} cy={y + 1} r="1.5" fill={i < 2 ? "#2D9E6B" : i === 2 ? "#EAB308" : "#DC3545"} fillOpacity="0.4" /></g>)}</g>)}
        <rect x="82" y="4" width="36" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="86" y="8" width="12" height="2.5" rx="0.5" fill="#A855F7" fillOpacity="0.3" />
        {[16, 22, 28, 34].map((y) => <rect key={`cd-${y}`} x="86" y={y} width={24 - (y % 5)} height="2" rx="0.5" fill="currentColor" fillOpacity="0.08" />)}
      </>}
      {/* App Builder — steps + preview */}
      {type === "appbuilder" && <>
        <rect x="2" y="4" width="34" height="56" rx="2" fill="currentColor" fillOpacity="0.05" />
        {[10, 20, 30, 40, 50].map((y, i) => <g key={`ab-${i}`}><circle cx="12" cy={y} r="3" fill={i < 3 ? "#2D9E6B" : i === 3 ? "#3B82F6" : "currentColor"} fillOpacity={i < 3 ? 0.4 : i === 3 ? 0.4 : 0.1} /><rect x="18" y={y - 1.5} width="14" height="2.5" rx="0.5" fill="currentColor" fillOpacity={i <= 3 ? 0.15 : 0.06} /></g>)}
        <line x1="12" y1="13" x2="12" y2="47" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="40" y="4" width="78" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="44" y="8" width="70" height="6" rx="1" fill="currentColor" fillOpacity="0.04" />
        <rect x="48" y="10" width="20" height="2" rx="0.5" fill={c} fillOpacity="0.3" />
        <rect x="44" y="18" width="70" height="38" rx="1" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
        <rect x="48" y="22" width="30" height="3" rx="0.5" fill={c} fillOpacity="0.15" />
        {[30, 38, 46].map((y, i) => <rect key={`ap-${i}`} x="48" y={y} width={[20, 18, 22][i]} height="5" rx="1" fill={c} fillOpacity={0.08 + i * 0.06} />)}
      </>}
      {/* TV Counter — big number + ring */}
      {type === "tvcounter" && <>
        <rect x="2" y="4" width="116" height="56" rx="3" fill="#09090b" fillOpacity="0.5" />
        <circle cx="60" cy="30" r="20" fill="none" stroke="currentColor" strokeOpacity="0.06" strokeWidth="3" />
        <circle cx="60" cy="30" r="20" fill="none" stroke={c} strokeWidth="3" strokeDasharray="95 126" strokeLinecap="round" transform="rotate(-90 60 30)" opacity="0.6" />
        <text x="60" y="34" textAnchor="middle" fontSize="14" fill={c} fontWeight="900" opacity="0.8">2847</text>
        <text x="60" y="55" textAnchor="middle" fontSize="5" fill="currentColor" fillOpacity="0.2">matrículas 2026</text>
      </>}
      {/* Radar — spider chart + bars */}
      {type === "radar" && <>
        <rect x="2" y="4" width="56" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        {[0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI * 2 * i) / 6 - Math.PI / 2; const r2 = 18; return <line key={`ra-${i}`} x1="30" y1="32" x2={30 + Math.cos(a) * r2} y2={32 + Math.sin(a) * r2} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.3" />; })}
        <polygon points={[0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI * 2 * i) / 6 - Math.PI / 2; const d = [14, 16, 12, 17, 10, 15][i]; return `${30 + Math.cos(a) * d},${32 + Math.sin(a) * d}`; }).join(" ")} fill={c} fillOpacity="0.12" stroke={c} strokeWidth="0.8" />
        <rect x="62" y="4" width="56" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        {[12, 22, 32, 42].map((y, i) => <g key={`rb-${i}`}><rect x="66" y={y} width={[28, 20, 32, 18][i]} height="5" rx="1" fill="#5BB5A2" fillOpacity="0.3" /><line x1={66 + [22, 18, 26, 15][i]} y1={y} x2={66 + [22, 18, 26, 15][i]} y2={y + 5} stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.5" strokeDasharray="1 1" /></g>)}
      </>}
      {/* Contractor — steps + form + csv */}
      {type === "contractor" && <>
        <rect x="2" y="4" width="22" height="56" rx="2" fill="currentColor" fillOpacity="0.05" />
        {[10, 22, 34, 46].map((y, i) => <g key={`cs-${i}`}><circle cx="13" cy={y + 2} r="3" fill={i < 2 ? "#2D9E6B" : i === 2 ? c : "currentColor"} fillOpacity={i < 2 ? 0.3 : i === 2 ? 0.3 : 0.1} />{i < 2 && <text x="13" y={y + 4} textAnchor="middle" fontSize="4" fill="#2D9E6B" fillOpacity="0.6">&#10003;</text>}</g>)}
        <rect x="28" y="4" width="90" height="56" rx="2" fill="currentColor" fillOpacity="0.03" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
        <rect x="32" y="10" width="24" height="2.5" rx="0.5" fill={c} fillOpacity="0.2" />
        {[18, 30].map((y) => <g key={`cf-${y}`}><rect x="32" y={y} width="16" height="2" rx="0.5" fill="currentColor" fillOpacity="0.12" /><rect x="32" y={y + 4} width="38" height="6" rx="1" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" /><rect x="74" y={y} width="16" height="2" rx="0.5" fill="currentColor" fillOpacity="0.12" /><rect x="74" y={y + 4} width="38" height="6" rx="1" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.3" /></g>)}
        <rect x="32" y="48" width="24" height="6" rx="1.5" fill={c} fillOpacity="0.25" />
      </>}
    </svg>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function CatalogPage() {
  return <Suspense><CatalogContent /></Suspense>;
}

function CatalogContent() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  useEffect(() => setMounted(true), []);
  const [search, setSearch] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return solutions.filter((s) => {
      if (activeCategory && s.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q));
      }
      return true;
    });
  }, [search, activeCategory]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportSelected = () => {
    const data = solutions
      .filter((s) => selected.has(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.desc,
        complexity: s.complexity,
        tags: s.tags,
        spec_path: `~/Claude/assets/design-library/solutions/${solutions.indexOf(s) < 9 ? "0" : ""}${solutions.indexOf(s) + 1}-${s.id}/spec.md`,
      }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `design-library-selection-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            {/* rAIz logo text */}
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black tracking-tight" style={{ color: "var(--raiz-orange)" }}>RAIZ</span>
              <span className="text-sm font-normal tracking-widest" style={{ color: "var(--raiz-teal)" }}>educação</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Design Library</h1>
              <p className="text-xs text-muted-foreground">{solutions.length} soluções curadas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <button
                onClick={exportSelected}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: "var(--raiz-orange)" }}
              >
                <Download className="h-4 w-4" />
                Exportar {selected.size} {selected.size === 1 ? "solução" : "soluções"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground"
              placeholder="Buscar por nome, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!activeCategory ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
              style={!activeCategory ? { backgroundColor: "var(--raiz-orange)" } : {}}
            >
              Todas
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const cc = catColors[cat];
              const count = solutions.filter((s) => s.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeCategory === cat ? `${cc.bg} ${cc.text}` : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />
                  {cat}
                  <span className="opacity-50">({count})</span>
                </button>
              );
            })}
          </div>
          {(search || activeCategory) && (
            <button onClick={() => { setSearch(""); setActiveCategory(null); }} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {selected.size > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--raiz-orange)", backgroundColor: "var(--raiz-orange-light)" }}>
            <Check className="h-4 w-4" style={{ color: "var(--raiz-orange)" }} />
            <span>{selected.size} selecionada{selected.size > 1 ? "s" : ""}</span>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Limpar</button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const Icon = s.icon;
            const cc = catColors[s.category];
            const isSelected = selected.has(s.id);
            return (
              <div
                key={s.id}
                className={`group relative overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-lg ${isSelected ? "ring-2" : "border-border hover:border-[var(--raiz-orange)]/30"}`}
                style={isSelected ? { borderColor: "var(--raiz-orange)", outlineColor: "var(--raiz-orange)" } : {}}
              >
                {/* Select checkbox */}
                <button
                  onClick={() => toggleSelect(s.id)}
                  className={`absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded transition-all ${isSelected ? "text-white" : "border border-border bg-background opacity-0 group-hover:opacity-100"}`}
                  style={isSelected ? { backgroundColor: "var(--raiz-orange)" } : {}}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </button>

                {/* Mini preview */}
                <Link href={`/solutions/${s.id}`} className="block">
                  <div className="h-28 border-b border-border bg-muted/30 px-6 py-3">
                    <MiniPreview type={s.miniPreview} />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cc.bg} ${cc.text}`}>
                        <span className={`h-1 w-1 rounded-full ${cc.dot}`} />
                        {s.category}
                      </span>
                      <span className={`text-[10px] font-medium ${cxColor[s.complexity]}`}>{s.complexity}</span>
                    </div>
                    <p className="mt-1.5 font-semibold leading-tight transition-colors group-hover:text-[var(--raiz-orange)]">{s.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.tags.slice(0, 3).map((tag) => (
                        <button key={tag} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSearch(tag); }} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-[var(--raiz-orange)]/10 hover:text-[var(--raiz-orange)]">{tag}</button>
                      ))}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Filter className="mx-auto h-8 w-8 opacity-30" />
            <p className="mt-2 text-sm">Nenhuma solução encontrada</p>
          </div>
        )}
      </main>
    </div>
  );
}
