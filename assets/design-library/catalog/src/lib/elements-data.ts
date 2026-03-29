// ─── UI Elements Catalog — Best-in-class references ─────────────────────────

export type ElementCategory =
  | "Data Display"
  | "Navigation"
  | "Forms & Input"
  | "Actions"
  | "Feedback"
  | "Layout"
  | "Filters & Search"
  | "Lists"
  | "Media"
  | "Communication"
  | "Auth & Onboarding"
  | "Dashboards"
  | "Workflow"
  | "Drag & Drop"
  | "Animation"
  | "3D & Visual"
  | "E-Commerce"
  | "Documentation";

export interface UIElement {
  id: string;
  name: string;
  desc: string;
  category: ElementCategory;
  subcategory: string;
  lib: string;
  repo: string;
  tags: string[];
  preview: string; // mini SVG type
  code?: string;   // usage snippet
}

export const ELEMENT_CATEGORIES: ElementCategory[] = [
  "Data Display", "Navigation", "Forms & Input", "Actions", "Feedback",
  "Layout", "Filters & Search", "Lists", "Media", "Communication",
  "Auth & Onboarding", "Dashboards", "Workflow", "Drag & Drop",
  "Animation", "3D & Visual", "E-Commerce", "Documentation",
];

export const ELEMENT_CAT_COLORS: Record<ElementCategory, { bg: string; text: string; dot: string }> = {
  "Data Display": { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  "Navigation": { bg: "bg-teal-500/10", text: "text-teal-400", dot: "bg-teal-400" },
  "Forms & Input": { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  "Actions": { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  "Feedback": { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  "Layout": { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  "Filters & Search": { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" },
  "Lists": { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
  "Media": { bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400" },
  "Communication": { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  "Auth & Onboarding": { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  "Dashboards": { bg: "bg-sky-500/10", text: "text-sky-400", dot: "bg-sky-400" },
  "Workflow": { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
  "Drag & Drop": { bg: "bg-lime-500/10", text: "text-lime-400", dot: "bg-lime-400" },
  "Animation": { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", dot: "bg-fuchsia-400" },
  "3D & Visual": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  "E-Commerce": { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
  "Documentation": { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-400" },
};

// ─── Foundation Libraries ────────────────────────────────────────────────────

export interface FoundationLibrary {
  id: string;
  name: string;
  desc: string;
  scope: string;
  repo: string;
  componentCount: string;
  tags: string[];
}

export const foundationLibraries: FoundationLibrary[] = [
  { id: "shadcn-ui", name: "shadcn/ui", desc: "Componentes copy-paste, Tailwind + Radix. Você controla o código.", scope: "~50 componentes", repo: "github.com/shadcn-ui/ui", componentCount: "50+", tags: ["copy-paste", "tailwind", "radix", "base"] },
  { id: "radix-ui", name: "Radix UI", desc: "Primitivos headless com acessibilidade AAA. Comportamento sem estilo.", scope: "30+ primitivos", repo: "github.com/radix-ui/primitives", componentCount: "30+", tags: ["headless", "acessibilidade", "primitivos", "a11y"] },
  { id: "react-aria", name: "React Aria (Adobe)", desc: "Hooks de acessibilidade — a mais rigorosa em WCAG. Alternativa ao Radix.", scope: "40+ hooks", repo: "github.com/adobe/react-spectrum", componentCount: "40+", tags: ["adobe", "hooks", "wcag", "acessibilidade"] },
  { id: "mantine", name: "Mantine", desc: "100+ componentes com hooks utilitários. Dark mode, forms, notifications.", scope: "100+ componentes", repo: "github.com/mantinedev/mantine", componentCount: "100+", tags: ["hooks", "utilitários", "dark-mode", "completo"] },
  { id: "mui", name: "MUI (Material UI)", desc: "Material Design para React. Enterprise, extenso, com Joy UI alternativo.", scope: "100+ componentes", repo: "github.com/mui/material-ui", componentCount: "100+", tags: ["material", "enterprise", "google", "design-system"] },
  { id: "ant-design", name: "Ant Design", desc: "Enterprise com i18n, RTL e ecossistema completo (Ant Design Pro, Charts).", scope: "60+ componentes", repo: "github.com/ant-design/ant-design", componentCount: "60+", tags: ["enterprise", "i18n", "rtl", "alibaba"] },
  { id: "heroui", name: "HeroUI (ex-NextUI)", desc: "Tailwind + React Aria. Leve, bonito, com variantes automáticas.", scope: "50+ componentes", repo: "github.com/heroui-inc/heroui", componentCount: "50+", tags: ["tailwind", "react-aria", "leve", "bonito"] },
  { id: "daisyui", name: "DaisyUI", desc: "Plugin Tailwind com classes semânticas. Zero JS, funciona com qualquer framework.", scope: "50+ componentes", repo: "github.com/saadeghi/daisyui", componentCount: "50+", tags: ["tailwind", "plugin", "classes", "zero-js"] },
];

// ─── UI Elements ─────────────────────────────────────────────────────────────

export const elements: UIElement[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DATA DISPLAY
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "tanstack-table", name: "Data Table (headless)", desc: "Sorting, filtering, pagination, grouping — headless", category: "Data Display", subcategory: "Tables & Grids", lib: "TanStack Table", repo: "github.com/TanStack/table", tags: ["tabela", "sorting", "filtering", "pagination"], preview: "table-rows", code: `import { useReactTable, getCoreRowModel } from '@tanstack/react-table'` },
  { id: "ag-grid", name: "Spreadsheet Grid", desc: "Enterprise grid com editing inline, pivoting, tree data", category: "Data Display", subcategory: "Tables & Grids", lib: "AG Grid", repo: "github.com/ag-grid/ag-grid", tags: ["spreadsheet", "grid", "editing", "enterprise"], preview: "table-rows" },
  { id: "recharts", name: "Chart (Line/Bar/Area/Pie)", desc: "Gráficos declarativos baseados em SVG + D3", category: "Data Display", subcategory: "Charts", lib: "Recharts", repo: "github.com/recharts/recharts", tags: ["gráfico", "chart", "svg", "linha", "barra", "pizza"], preview: "chart-bar" },
  { id: "nivo", name: "Charts Avançados", desc: "Heatmap, treemap, radar, sankey, choropleth — 30+ tipos", category: "Data Display", subcategory: "Charts", lib: "Nivo", repo: "github.com/plouc/nivo", tags: ["heatmap", "radar", "treemap", "sankey", "avançado"], preview: "chart-complex" },
  { id: "echarts", name: "Charts High-Performance", desc: "Milhões de pontos, 3D, geo maps, gauge", category: "Data Display", subcategory: "Charts", lib: "Apache ECharts", repo: "github.com/apache/echarts", tags: ["performance", "milhões", "3d", "geo", "gauge"], preview: "chart-complex" },
  { id: "lightweight-charts", name: "Charts Financeiros", desc: "Candlestick, time series — TradingView engine", category: "Data Display", subcategory: "Charts", lib: "Lightweight Charts", repo: "github.com/nicpottier/tradingview-lightweight-charts", tags: ["candlestick", "financeiro", "trading", "time-series"], preview: "chart-line" },
  { id: "visx", name: "Charts Low-Level", desc: "Primitivos SVG + D3 — controle total sobre rendering", category: "Data Display", subcategory: "Charts", lib: "Visx (Airbnb)", repo: "github.com/airbnb/visx", tags: ["svg", "d3", "custom", "low-level"], preview: "chart-line" },
  { id: "d3-sankey", name: "Sankey / Flow Diagram", desc: "Diagrama de fluxo com nós e links proporcionais", category: "Data Display", subcategory: "Charts", lib: "D3-Sankey", repo: "github.com/d3/d3-sankey", tags: ["sankey", "flow", "d3", "diagrama"], preview: "chart-complex" },
  { id: "nivo-funnel", name: "Funnel Chart", desc: "Funil de conversão com labels e animação", category: "Data Display", subcategory: "Charts", lib: "Nivo Funnel", repo: "nivo.rocks/funnel", tags: ["funnel", "funil", "conversão"], preview: "chart-bar" },
  { id: "react-gauge", name: "Gauge / Speedometer", desc: "Velocímetro com arco, ponteiro e faixas de cor", category: "Data Display", subcategory: "Charts", lib: "react-gauge-component", repo: "github.com/antoniolago/react-gauge-component", tags: ["gauge", "velocímetro", "arco", "ponteiro"], preview: "gauge" },
  { id: "sparkline", name: "Sparkline", desc: "Gráfico inline compacto para mostrar tendência em cards", category: "Data Display", subcategory: "Charts", lib: "Recharts", repo: "recharts.org", tags: ["sparkline", "tendência", "inline", "mini-chart"], preview: "chart-line" },
  { id: "empty-state", name: "Empty State", desc: "Placeholder visual quando não há dados — ícone + mensagem + CTA", category: "Data Display", subcategory: "Indicators", lib: "shadcn/ui (pattern)", repo: "ui.shadcn.com", tags: ["empty", "vazio", "placeholder", "ilustração"], preview: "skeleton" },
  { id: "tremor-kpi", name: "KPI Card / Metric Tile", desc: "Cards de métricas prontos para dashboard", category: "Data Display", subcategory: "Indicators", lib: "Tremor", repo: "github.com/tremorlabs/tremor", tags: ["kpi", "card", "métrica", "dashboard", "tremor"], preview: "kpi-card" },
  { id: "badge", name: "Badge / Tag / Chip", desc: "Labels coloridos para status, categorias, contadores", category: "Data Display", subcategory: "Indicators", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/badge", tags: ["badge", "tag", "chip", "status", "label"], preview: "badge" },
  { id: "avatar", name: "Avatar", desc: "Imagem circular com fallback de iniciais e status dot", category: "Data Display", subcategory: "Indicators", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/avatar", tags: ["avatar", "foto", "perfil", "iniciais"], preview: "badge" },
  { id: "tooltip", name: "Tooltip", desc: "Popup informativo no hover, acessível", category: "Data Display", subcategory: "Overlays", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/tooltip", tags: ["tooltip", "hover", "informação", "acessível"], preview: "tooltip" },
  { id: "popover", name: "Popover", desc: "Floating panel com posicionamento inteligente", category: "Data Display", subcategory: "Overlays", lib: "Floating UI", repo: "github.com/floating-ui/floating-ui", tags: ["popover", "floating", "posicionamento", "overlay"], preview: "tooltip" },
  { id: "react-chrono", name: "Timeline", desc: "Timeline horizontal/vertical com mídia e cards", category: "Data Display", subcategory: "Timeline", lib: "react-chrono", repo: "github.com/prabhuignoto/react-chrono", tags: ["timeline", "cronologia", "eventos", "cards"], preview: "timeline" },
  { id: "novu", name: "Activity Feed / Notifications", desc: "Feed de notificações real-time com inbox", category: "Data Display", subcategory: "Timeline", lib: "Novu", repo: "github.com/novuhq/novu", tags: ["notificações", "feed", "atividade", "inbox"], preview: "timeline" },
  { id: "diff-viewer", name: "Diff Viewer", desc: "Comparação side-by-side de texto/código com highlights", category: "Data Display", subcategory: "Code", lib: "react-diff-viewer-continued", repo: "github.com/aeolun/react-diff-viewer-continued", tags: ["diff", "comparação", "código", "highlight"], preview: "code-block" },
  { id: "shiki", name: "Code Block / Syntax Highlight", desc: "Syntax highlighting com temas VS Code", category: "Data Display", subcategory: "Code", lib: "Shiki", repo: "github.com/shikijs/shiki", tags: ["código", "syntax", "highlight", "vscode"], preview: "code-block" },
  { id: "json-viewer", name: "JSON Viewer", desc: "Visualizador de JSON colapsável com busca", category: "Data Display", subcategory: "Code", lib: "react-json-view", repo: "github.com/mac-s-g/react-json-view", tags: ["json", "viewer", "árvore", "colapsável"], preview: "code-block" },
  { id: "skeleton", name: "Skeleton Loader", desc: "Placeholder animado durante carregamento", category: "Data Display", subcategory: "Loading", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/skeleton", tags: ["skeleton", "loading", "placeholder", "animação"], preview: "skeleton" },
  { id: "progress", name: "Progress Bar / Circle", desc: "Barra ou círculo de progresso com label", category: "Data Display", subcategory: "Loading", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/progress", tags: ["progresso", "barra", "círculo", "loading"], preview: "gauge" },
  { id: "stepper", name: "Step Indicator", desc: "Indicador de etapas com números, ícones e status", category: "Data Display", subcategory: "Indicators", lib: "shadcn/ui (community)", repo: "ui.shadcn.com", tags: ["steps", "etapas", "indicador", "wizard"], preview: "steps" },

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "sidebar", name: "Sidebar", desc: "Navegação lateral colapsável com groups e badges", category: "Navigation", subcategory: "Primary Nav", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/sidebar", tags: ["sidebar", "navegação", "lateral", "colapsável"], preview: "sidebar" },
  { id: "navbar", name: "Top Navbar", desc: "Barra de navegação superior com links e menus", category: "Navigation", subcategory: "Primary Nav", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/navigation-menu", tags: ["navbar", "topo", "links", "menu"], preview: "navbar" },
  { id: "breadcrumb", name: "Breadcrumb", desc: "Navegação hierárquica com separadores e links", category: "Navigation", subcategory: "Secondary Nav", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/breadcrumb", tags: ["breadcrumb", "hierarquia", "caminho", "links"], preview: "breadcrumb" },
  { id: "tabs", name: "Tabs", desc: "Abas para alternar conteúdo sem trocar de página", category: "Navigation", subcategory: "Secondary Nav", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/tabs", tags: ["tabs", "abas", "alternar", "conteúdo"], preview: "tabs" },
  { id: "mega-menu", name: "Mega Menu", desc: "Menu expandido com colunas, ícones e descrições", category: "Navigation", subcategory: "Menus", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/navigation-menu", tags: ["mega-menu", "dropdown", "colunas", "navegação"], preview: "dropdown" },
  { id: "dropdown-menu", name: "Dropdown Menu", desc: "Menu contextual com submenus, separadores e shortcuts", category: "Navigation", subcategory: "Menus", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/dropdown-menu", tags: ["dropdown", "menu", "contextual", "submenu"], preview: "dropdown" },
  { id: "context-menu", name: "Context Menu", desc: "Menu de clique direito com ações contextuais", category: "Navigation", subcategory: "Menus", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/context-menu", tags: ["context", "menu", "clique-direito", "ações"], preview: "dropdown" },
  { id: "cmdk", name: "Command Palette", desc: "Busca rápida estilo ⌘K com fuzzy search e atalhos", category: "Navigation", subcategory: "Search", lib: "cmdk", repo: "github.com/pacocoursey/cmdk", tags: ["command", "palette", "busca", "atalhos", "cmdk"], preview: "command" },
  { id: "pagination", name: "Pagination", desc: "Navegação entre páginas com elipsis e jump", category: "Navigation", subcategory: "Secondary Nav", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/pagination", tags: ["paginação", "páginas", "navegação"], preview: "pagination" },
  { id: "tree-view", name: "Tree View", desc: "Árvore colapsável com drag-drop e seleção múltipla", category: "Navigation", subcategory: "Secondary Nav", lib: "react-arborist", repo: "github.com/brimdata/react-arborist", tags: ["árvore", "tree", "hierarquia", "colapsável"], preview: "tree" },
  { id: "accordion", name: "Accordion", desc: "Seções colapsáveis com animação", category: "Navigation", subcategory: "Secondary Nav", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/accordion", tags: ["accordion", "colapsável", "seções", "FAQ"], preview: "accordion" },
  { id: "vaul-drawer", name: "Drawer", desc: "Painel deslizante de baixo (mobile) ou lateral", category: "Navigation", subcategory: "Overlays", lib: "Vaul", repo: "github.com/emilkowalski/vaul", tags: ["drawer", "painel", "mobile", "deslizante"], preview: "drawer" },
  { id: "back-to-top", name: "Back to Top", desc: "Botão flutuante para voltar ao topo — scroll suave", category: "Navigation", subcategory: "Utilities", lib: "Implementação nativa", repo: "developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo", tags: ["topo", "scroll", "botão", "flutuante"], preview: "button" },
  { id: "search-bar", name: "Search Bar", desc: "Campo de busca com ícone, clear e sugestões", category: "Navigation", subcategory: "Search", lib: "cmdk", repo: "github.com/pacocoursey/cmdk", tags: ["busca", "search", "campo", "sugestões"], preview: "command" },

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMS & INPUT
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "react-hook-form", name: "Form Management", desc: "Gerenciamento de formulários com validação Zod", category: "Forms & Input", subcategory: "Form Logic", lib: "React Hook Form + Zod", repo: "github.com/react-hook-form/react-hook-form", tags: ["form", "validação", "zod", "hook"], preview: "form" },
  { id: "input", name: "Text Input / Textarea", desc: "Campo de texto com label, placeholder e error state", category: "Forms & Input", subcategory: "Text", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/input", tags: ["input", "texto", "textarea", "campo"], preview: "input" },
  { id: "select", name: "Select", desc: "Dropdown de seleção única com busca", category: "Forms & Input", subcategory: "Selection", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/select", tags: ["select", "dropdown", "seleção", "opções"], preview: "select" },
  { id: "multi-select", name: "Multi-Select / Combobox", desc: "Seleção múltipla com busca e chips", category: "Forms & Input", subcategory: "Selection", lib: "cmdk + Radix", repo: "github.com/pacocoursey/cmdk", tags: ["multi-select", "combobox", "chips", "busca"], preview: "select" },
  { id: "downshift", name: "Autocomplete", desc: "Autocomplete headless com fuzzy matching", category: "Forms & Input", subcategory: "Selection", lib: "Downshift", repo: "github.com/downshift-js/downshift", tags: ["autocomplete", "fuzzy", "headless", "sugestões"], preview: "select" },
  { id: "date-picker", name: "Date Picker", desc: "Seletor de data com calendário popup", category: "Forms & Input", subcategory: "Date & Time", lib: "react-day-picker", repo: "github.com/gpbl/react-day-picker", tags: ["data", "calendário", "picker", "date"], preview: "calendar" },
  { id: "date-range", name: "Date Range Picker", desc: "Seletor de intervalo de datas", category: "Forms & Input", subcategory: "Date & Time", lib: "react-day-picker", repo: "github.com/gpbl/react-day-picker", tags: ["data", "intervalo", "range", "período"], preview: "calendar" },
  { id: "time-picker", name: "Time Picker", desc: "Seletor de horário com input ou dial", category: "Forms & Input", subcategory: "Date & Time", lib: "react-time-picker", repo: "github.com/wojtekmaj/react-time-picker", tags: ["hora", "tempo", "picker", "horário"], preview: "input" },
  { id: "color-picker", name: "Color Picker", desc: "Seletor de cor com hex, RGB e presets", category: "Forms & Input", subcategory: "Specialized", lib: "react-colorful", repo: "github.com/omgovich/react-colorful", tags: ["cor", "color", "picker", "hex", "rgb"], preview: "color" },
  { id: "file-upload", name: "File Upload", desc: "Upload com drag-and-drop zone e preview", category: "Forms & Input", subcategory: "File", lib: "react-dropzone", repo: "github.com/react-dropzone/react-dropzone", tags: ["upload", "arquivo", "drag-drop", "zona"], preview: "upload" },
  { id: "filepond", name: "Advanced File Upload", desc: "Upload com progress, image preview, validation", category: "Forms & Input", subcategory: "File", lib: "Filepond", repo: "github.com/pqina/react-filepond", tags: ["upload", "progress", "preview", "validação"], preview: "upload" },
  { id: "slider", name: "Slider / Range", desc: "Controle deslizante com valores mín/máx e steps", category: "Forms & Input", subcategory: "Controls", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/slider", tags: ["slider", "range", "deslizante", "controle"], preview: "slider" },
  { id: "switch", name: "Toggle / Switch", desc: "Interruptor on/off com label", category: "Forms & Input", subcategory: "Controls", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/switch", tags: ["toggle", "switch", "on-off", "interruptor"], preview: "toggle" },
  { id: "checkbox", name: "Checkbox", desc: "Caixa de seleção com indeterminate state", category: "Forms & Input", subcategory: "Controls", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/checkbox", tags: ["checkbox", "seleção", "marcação"], preview: "toggle" },
  { id: "radio", name: "Radio Button", desc: "Grupo de opções mutuamente exclusivas", category: "Forms & Input", subcategory: "Controls", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/radio-group", tags: ["radio", "opções", "exclusivo", "grupo"], preview: "toggle" },
  { id: "rating", name: "Rating Stars", desc: "Avaliação com estrelas, hover e half-star", category: "Forms & Input", subcategory: "Specialized", lib: "react-rating", repo: "github.com/smastrom/react-rating", tags: ["rating", "estrelas", "avaliação", "nota"], preview: "rating" },
  { id: "tiptap", name: "Rich Text Editor", desc: "Editor WYSIWYG extensível com toolbar customizável", category: "Forms & Input", subcategory: "Editors", lib: "Tiptap", repo: "github.com/ueberdosis/tiptap", tags: ["editor", "wysiwyg", "rich-text", "toolbar"], preview: "editor" },
  { id: "blocknote", name: "Block Editor (Notion-style)", desc: "Editor baseado em blocos drag-and-drop", category: "Forms & Input", subcategory: "Editors", lib: "BlockNote", repo: "github.com/TypeCellOS/BlockNote", tags: ["blocos", "notion", "editor", "drag-drop"], preview: "editor" },
  { id: "milkdown", name: "Markdown Editor", desc: "Editor markdown WYSIWYG com plugins", category: "Forms & Input", subcategory: "Editors", lib: "Milkdown", repo: "github.com/Milkdown/milkdown", tags: ["markdown", "editor", "wysiwyg", "plugins"], preview: "editor" },
  { id: "monaco", name: "Code Editor", desc: "Editor de código VS Code — syntax, autocomplete, diff", category: "Forms & Input", subcategory: "Editors", lib: "Monaco Editor", repo: "github.com/microsoft/monaco-editor", tags: ["código", "editor", "vscode", "syntax"], preview: "code-block" },
  { id: "emblor", name: "Tag Input", desc: "Input com tags removíveis e autocomplete", category: "Forms & Input", subcategory: "Specialized", lib: "emblor", repo: "github.com/JaleelB/emblor", tags: ["tags", "input", "removível", "autocomplete"], preview: "input" },
  { id: "input-otp", name: "PIN / OTP Input", desc: "Input de código de verificação com auto-focus", category: "Forms & Input", subcategory: "Specialized", lib: "input-otp", repo: "github.com/guilhermerodz/input-otp", tags: ["otp", "pin", "verificação", "código"], preview: "otp" },
  { id: "signature-pad", name: "Signature Pad", desc: "Captura de assinatura com canvas", category: "Forms & Input", subcategory: "Specialized", lib: "react-signature-canvas", repo: "github.com/agilgur5/react-signature-canvas", tags: ["assinatura", "canvas", "desenho", "captura"], preview: "signature" },
  { id: "currency-input", name: "Currency Input", desc: "Input de moeda com máscara e locale", category: "Forms & Input", subcategory: "Specialized", lib: "react-currency-input-field", repo: "github.com/cchanxzy/react-currency-input-field", tags: ["moeda", "currency", "máscara", "formatação"], preview: "input" },
  { id: "phone-input", name: "Phone Input", desc: "Input de telefone com flag do país e validação", category: "Forms & Input", subcategory: "Specialized", lib: "react-phone-number-input", repo: "github.com/catamphetamine/react-phone-number-input", tags: ["telefone", "phone", "país", "flag"], preview: "input" },
  { id: "imask", name: "Mask Input", desc: "Input com máscara dinâmica (CPF, CNPJ, data, etc.)", category: "Forms & Input", subcategory: "Specialized", lib: "IMask", repo: "github.com/uNmAnNeR/imaskjs", tags: ["máscara", "cpf", "cnpj", "formatação"], preview: "input" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "button", name: "Button / Button Group", desc: "Botão com variantes, loading state e ícones", category: "Actions", subcategory: "Buttons", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/button", tags: ["botão", "button", "ação", "grupo"], preview: "button" },
  { id: "icon-button", name: "Icon Button / FAB", desc: "Botão circular com ícone, floating action button", category: "Actions", subcategory: "Buttons", lib: "shadcn/ui + Lucide", repo: "github.com/lucide-icons/lucide", tags: ["ícone", "fab", "circular", "floating"], preview: "button" },
  { id: "copy-to-clipboard", name: "Copy to Clipboard", desc: "Botão de copiar com feedback visual", category: "Actions", subcategory: "Utilities", lib: "react-copy-to-clipboard", repo: "github.com/nkbt/react-copy-to-clipboard", tags: ["copiar", "clipboard", "feedback"], preview: "button" },
  { id: "dropdown-action", name: "Dropdown Button", desc: "Botão com menu de ações expandível", category: "Actions", subcategory: "Buttons", lib: "Radix UI", repo: "radix-ui.com", tags: ["dropdown", "ações", "menu", "botão"], preview: "dropdown" },

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDBACK
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "sonner", name: "Toast / Snackbar", desc: "Notificação temporária com ações e stack", category: "Feedback", subcategory: "Notifications", lib: "Sonner", repo: "github.com/emilkowalski/sonner", tags: ["toast", "notificação", "snackbar", "sonner"], preview: "toast" },
  { id: "alert", name: "Alert Banner", desc: "Banner inline com ícone, tipo e ação", category: "Feedback", subcategory: "Notifications", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/alert", tags: ["alert", "banner", "aviso", "inline"], preview: "alert" },
  { id: "dialog", name: "Modal / Dialog", desc: "Diálogo modal com overlay, focus trap e ESC", category: "Feedback", subcategory: "Dialogs", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/dialog", tags: ["modal", "dialog", "overlay", "popup"], preview: "modal" },
  { id: "alert-dialog", name: "Confirmation Dialog", desc: "Diálogo de confirmação com ação destrutiva", category: "Feedback", subcategory: "Dialogs", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/alert-dialog", tags: ["confirmação", "destrutivo", "dialog", "ação"], preview: "modal" },
  { id: "spinner", name: "Loading Spinner", desc: "Indicadores de carregamento animados", category: "Feedback", subcategory: "Loading", lib: "react-spinners", repo: "github.com/davidhu2000/react-spinners", tags: ["spinner", "loading", "carregamento", "animação"], preview: "spinner" },

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "card", name: "Card / Panel", desc: "Container com header, content e footer", category: "Layout", subcategory: "Containers", lib: "shadcn/ui", repo: "ui.shadcn.com/docs/components/card", tags: ["card", "painel", "container", "borda"], preview: "card" },
  { id: "collapsible", name: "Collapsible Section", desc: "Seção expandível com animação", category: "Layout", subcategory: "Containers", lib: "Radix UI", repo: "radix-ui.com/primitives/docs/components/collapsible", tags: ["colapsável", "expandir", "seção", "animação"], preview: "accordion" },
  { id: "resizable-panels", name: "Resizable Panels", desc: "Painéis redimensionáveis com handles", category: "Layout", subcategory: "Split", lib: "react-resizable-panels", repo: "github.com/bvaughn/react-resizable-panels", tags: ["redimensionar", "split", "painéis", "handles"], preview: "split" },
  { id: "kanban-layout", name: "Kanban Board", desc: "Board com colunas drag-and-drop", category: "Layout", subcategory: "Boards", lib: "@hello-pangea/dnd", repo: "github.com/hello-pangea/dnd", tags: ["kanban", "board", "colunas", "drag-drop"], preview: "kanban" },
  { id: "gantt", name: "Gantt Chart", desc: "Gráfico de Gantt com dependências e milestones", category: "Layout", subcategory: "Planning", lib: "gantt-task-react", repo: "github.com/MaTeMaTuK/gantt-task-react", tags: ["gantt", "projeto", "timeline", "milestones"], preview: "gantt" },
  { id: "gantt-pro", name: "Gantt (Production)", desc: "Gantt enterprise com zoom, export e resource view", category: "Layout", subcategory: "Planning", lib: "SVAR React Gantt", repo: "github.com/svar-widgets/react-gantt", tags: ["gantt", "enterprise", "zoom", "recursos"], preview: "gantt" },
  { id: "fullcalendar", name: "Calendar View", desc: "Calendário month/week/day com eventos drag-drop", category: "Layout", subcategory: "Planning", lib: "FullCalendar", repo: "github.com/fullcalendar/fullcalendar", tags: ["calendário", "eventos", "semana", "mês", "dia"], preview: "calendar" },
  { id: "fortune-sheet", name: "Spreadsheet Editável", desc: "Planilha in-browser estilo Google Sheets", category: "Layout", subcategory: "Tables", lib: "Fortune Sheet", repo: "github.com/ruilisi/fortune-sheet", tags: ["planilha", "spreadsheet", "sheets", "editável"], preview: "table-rows" },
  { id: "react-grid-layout", name: "Dashboard Grid", desc: "Grid drag-and-drop para widgets de dashboard", category: "Layout", subcategory: "Grids", lib: "react-grid-layout", repo: "github.com/react-grid-layout/react-grid-layout", tags: ["grid", "dashboard", "widgets", "drag-drop"], preview: "grid" },
  { id: "masonry", name: "Masonry Layout", desc: "Grid com itens de alturas variáveis (Pinterest-style)", category: "Layout", subcategory: "Grids", lib: "react-masonry-css", repo: "github.com/paulcollett/react-masonry-css", tags: ["masonry", "pinterest", "grid", "variável"], preview: "grid" },

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERS & SEARCH
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "faceted-filter", name: "Faceted Filter Bar", desc: "Barra de filtros com facets e contadores", category: "Filters & Search", subcategory: "Filters", lib: "TanStack Table", repo: "github.com/TanStack/table", tags: ["filtros", "facets", "contadores", "barra"], preview: "filter" },
  { id: "filter-chips", name: "Filter Chips", desc: "Tags togglable para filtros visuais", category: "Filters & Search", subcategory: "Filters", lib: "shadcn/ui Badge", repo: "ui.shadcn.com", tags: ["chips", "toggle", "filtros", "tags"], preview: "filter" },
  { id: "sort-control", name: "Sort / Column Toggle", desc: "Controles de ordenação e visibilidade de colunas", category: "Filters & Search", subcategory: "Controls", lib: "TanStack Table", repo: "github.com/TanStack/table", tags: ["ordenação", "colunas", "toggle", "sort"], preview: "filter" },
  { id: "global-search", name: "Global Search / Command", desc: "Busca global com ⌘K shortcut", category: "Filters & Search", subcategory: "Search", lib: "cmdk", repo: "github.com/pacocoursey/cmdk", tags: ["busca", "global", "command", "atalho"], preview: "command" },

  // ═══════════════════════════════════════════════════════════════════════════
  // LISTS
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "dnd-list", name: "Sortable / Draggable List", desc: "Lista reordenável com drag-and-drop", category: "Lists", subcategory: "Interactive", lib: "dnd-kit", repo: "github.com/clauderic/dnd-kit", tags: ["sortable", "draggable", "lista", "reordenar"], preview: "list" },
  { id: "virtual-list", name: "Virtualized List", desc: "Lista com milhares de itens sem DOM bloat", category: "Lists", subcategory: "Performance", lib: "TanStack Virtual", repo: "github.com/TanStack/virtual", tags: ["virtual", "performance", "lista", "scroll"], preview: "list" },
  { id: "transfer-list", name: "Transfer List", desc: "Mover itens entre duas listas", category: "Lists", subcategory: "Interactive", lib: "Mantine", repo: "mantine.dev", tags: ["transfer", "mover", "listas", "dupla"], preview: "list" },
  { id: "master-detail", name: "Master-Detail", desc: "Lista com painel de detalhes lateral", category: "Lists", subcategory: "Pattern", lib: "TanStack Table + Panel", repo: "github.com/TanStack/table", tags: ["master", "detail", "painel", "lateral"], preview: "split" },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "lightbox", name: "Image Gallery / Lightbox", desc: "Galeria com zoom, fullscreen e navegação", category: "Media", subcategory: "Images", lib: "yet-another-react-lightbox", repo: "github.com/igordanchenko/yet-another-react-lightbox", tags: ["galeria", "lightbox", "zoom", "imagem"], preview: "gallery" },
  { id: "carousel", name: "Carousel", desc: "Carrossel touch-friendly com auto-play e dots", category: "Media", subcategory: "Slides", lib: "Embla Carousel", repo: "github.com/davidjerleke/embla-carousel", tags: ["carrossel", "slides", "touch", "auto-play"], preview: "carousel" },
  { id: "video-player", name: "Video Player", desc: "Player com controles, fullscreen e streaming", category: "Media", subcategory: "Video", lib: "React Player", repo: "github.com/cookpete/react-player", tags: ["vídeo", "player", "controles", "streaming"], preview: "player" },
  { id: "audio-player", name: "Audio Player", desc: "Player de áudio com waveform e progress bar", category: "Media", subcategory: "Audio", lib: "react-h5-audio-player", repo: "github.com/lhz516/react-h5-audio-player", tags: ["áudio", "player", "waveform", "música"], preview: "player" },
  { id: "image-crop", name: "Image Cropper", desc: "Crop de imagem com zoom, rotate e aspect ratio", category: "Media", subcategory: "Images", lib: "react-easy-crop", repo: "github.com/ValentinH/react-easy-crop", tags: ["crop", "imagem", "cortar", "zoom", "rotate"], preview: "gallery" },
  { id: "compare-slider", name: "Before/After Slider", desc: "Comparação visual com slider deslizante", category: "Media", subcategory: "Images", lib: "react-compare-slider", repo: "github.com/nerdyman/react-compare-slider", tags: ["comparação", "antes-depois", "slider", "visual"], preview: "slider" },
  { id: "leaflet", name: "Map (Leaflet)", desc: "Mapa interativo com markers, layers e popups", category: "Media", subcategory: "Maps", lib: "React Leaflet", repo: "github.com/PaulLeCam/react-leaflet", tags: ["mapa", "markers", "leaflet", "geo"], preview: "map" },
  { id: "google-maps", name: "Map (Google)", desc: "Google Maps com markers, directions e places", category: "Media", subcategory: "Maps", lib: "@vis.gl/react-google-maps", repo: "github.com/visgl/react-google-maps", tags: ["google", "mapa", "directions", "places"], preview: "map" },
  { id: "deckgl", name: "Map (3D / Deck.gl)", desc: "Visualização geoespacial 3D com layers WebGL", category: "Media", subcategory: "Maps", lib: "Deck.gl", repo: "github.com/visgl/deck.gl", tags: ["3d", "geo", "webgl", "deck", "layers"], preview: "map" },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNICATION
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "chat-ui", name: "Chat UI", desc: "Interface de chat com bolhas, typing indicator e input", category: "Communication", subcategory: "Messaging", lib: "chatscope", repo: "github.com/chatscope/chat-ui-kit-react", tags: ["chat", "mensagens", "bolhas", "conversação"], preview: "chat" },
  { id: "comment-section", name: "Comment Section", desc: "Seção de comentários com threads e replies", category: "Communication", subcategory: "Messaging", lib: "Tiptap", repo: "github.com/ueberdosis/tiptap", tags: ["comentários", "threads", "replies", "discussão"], preview: "chat" },
  { id: "mention", name: "Mention (@user)", desc: "Menção de usuários com autocomplete em texto", category: "Communication", subcategory: "Input", lib: "Tiptap Mention", repo: "tiptap.dev/docs/editor/extensions/nodes/mention", tags: ["mention", "usuário", "autocomplete", "tag"], preview: "input" },
  { id: "emoji-picker", name: "Emoji / Reaction Picker", desc: "Seletor de emojis com busca e categorias", category: "Communication", subcategory: "Input", lib: "emoji-mart", repo: "github.com/missive/emoji-mart", tags: ["emoji", "reação", "picker", "seletor"], preview: "emoji" },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH & ONBOARDING
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "login-form", name: "Login / Registration Form", desc: "Formulário de login com validação e social auth", category: "Auth & Onboarding", subcategory: "Auth", lib: "shadcn/ui + RHF + Zod", repo: "ui.shadcn.com", tags: ["login", "registro", "autenticação", "social"], preview: "form" },
  { id: "otp-auth", name: "OTP / Two-Factor", desc: "Input de código OTP com auto-advance e resend", category: "Auth & Onboarding", subcategory: "Auth", lib: "input-otp", repo: "github.com/guilhermerodz/input-otp", tags: ["otp", "2fa", "verificação", "código"], preview: "otp" },
  { id: "shepherd", name: "Feature Tour / Onboarding", desc: "Tour guiado com steps, highlights e tooltips", category: "Auth & Onboarding", subcategory: "Onboarding", lib: "Shepherd.js", repo: "github.com/shepherd-pro/shepherd", tags: ["tour", "onboarding", "guia", "highlight"], preview: "steps" },
  { id: "reactour", name: "Onboarding Steps (React)", desc: "Tour de onboarding React com mask e highlights", category: "Auth & Onboarding", subcategory: "Onboarding", lib: "Reactour", repo: "github.com/elrumordelaluz/reactour", tags: ["tour", "react", "mask", "highlight"], preview: "steps" },
  { id: "cookie-consent", name: "Cookie / Consent Banner", desc: "Banner de consentimento LGPD/GDPR", category: "Auth & Onboarding", subcategory: "Legal", lib: "react-cookie-consent", repo: "github.com/Mastermindzh/react-cookie-consent", tags: ["cookie", "lgpd", "gdpr", "consentimento"], preview: "alert" },

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARDS
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "dashboard-grid", name: "Dashboard Grid (Widgets)", desc: "Grid drag-drop de widgets redimensionáveis", category: "Dashboards", subcategory: "Layout", lib: "react-grid-layout", repo: "github.com/react-grid-layout/react-grid-layout", tags: ["dashboard", "grid", "widgets", "redimensionar"], preview: "grid" },
  { id: "tremor-dashboard", name: "Dashboard Components", desc: "KPIs, charts, tables — prontos para dashboard", category: "Dashboards", subcategory: "Components", lib: "Tremor", repo: "github.com/tremorlabs/tremor", tags: ["dashboard", "kpi", "tremor", "componentes"], preview: "kpi-card" },
  { id: "pivot-table", name: "Pivot Table", desc: "Tabela pivô com drag-drop de dimensões", category: "Dashboards", subcategory: "Analysis", lib: "react-pivottable", repo: "github.com/plotly/react-pivottable", tags: ["pivô", "tabela", "análise", "dimensões"], preview: "table-rows" },
  { id: "waterfall-chart", name: "Waterfall Chart", desc: "Gráfico waterfall para análise financeira", category: "Dashboards", subcategory: "Charts", lib: "Recharts", repo: "recharts.org", tags: ["waterfall", "financeiro", "cascata", "análise"], preview: "chart-bar" },
  { id: "scatter-chart", name: "Scatter / Bubble Chart", desc: "Dispersão com bolhas de tamanho variável", category: "Dashboards", subcategory: "Charts", lib: "Nivo", repo: "nivo.rocks/scatterplot", tags: ["scatter", "dispersão", "bolha", "correlação"], preview: "chart-complex" },
  { id: "cohort-table", name: "Cohort Table", desc: "Tabela de coorte com heatmap de retenção", category: "Dashboards", subcategory: "Analysis", lib: "TanStack Table + heatmap", repo: "github.com/TanStack/table", tags: ["coorte", "retenção", "heatmap", "análise"], preview: "table-rows" },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW & MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "react-flow", name: "Flow / Node Editor", desc: "Editor visual de fluxos com nós e conexões", category: "Workflow", subcategory: "Editors", lib: "React Flow", repo: "github.com/xyflow/xyflow", tags: ["flow", "nós", "editor", "visual", "conexões"], preview: "flow" },
  { id: "audit-log", name: "Audit Log / History", desc: "Log de auditoria com timeline e filtros", category: "Workflow", subcategory: "Tracking", lib: "react-chrono", repo: "github.com/prabhuignoto/react-chrono", tags: ["auditoria", "log", "histórico", "timeline"], preview: "timeline" },
  { id: "permission-matrix", name: "Role / Permission Matrix", desc: "Matriz de permissões com checkboxes por role", category: "Workflow", subcategory: "Management", lib: "TanStack Table", repo: "github.com/TanStack/table", tags: ["permissões", "roles", "matriz", "acesso"], preview: "table-rows" },
  { id: "approval-flow", name: "Approval Flow Visual", desc: "Visualização de fluxo de aprovação com steps", category: "Workflow", subcategory: "Editors", lib: "React Flow", repo: "reactflow.dev", tags: ["aprovação", "fluxo", "steps", "visual"], preview: "flow" },
  { id: "cron-editor", name: "Cron Expression Editor", desc: "Editor visual de expressões cron", category: "Workflow", subcategory: "Management", lib: "react-cron-generator", repo: "github.com/sojinantony01/react-cron-generator", tags: ["cron", "agendamento", "expressão", "editor"], preview: "input" },

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAG & DROP
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "dnd-kit", name: "DnD Kit (Generic)", desc: "Drag-drop genérico para listas, grids e trees", category: "Drag & Drop", subcategory: "Generic", lib: "dnd-kit", repo: "github.com/clauderic/dnd-kit", tags: ["drag-drop", "genérico", "listas", "grids"], preview: "dnd" },
  { id: "pragmatic-dnd", name: "Pragmatic DnD (Atlassian)", desc: "Drag-drop otimizado para kanban e boards", category: "Drag & Drop", subcategory: "Boards", lib: "pragmatic-drag-and-drop", repo: "github.com/atlassian/pragmatic-drag-and-drop", tags: ["atlassian", "kanban", "board", "otimizado"], preview: "dnd" },
  { id: "hello-pangea", name: "Hello Pangea DnD", desc: "Fork do react-beautiful-dnd — listas simples", category: "Drag & Drop", subcategory: "Lists", lib: "@hello-pangea/dnd", repo: "github.com/hello-pangea/dnd", tags: ["lista", "simples", "fork", "beautiful-dnd"], preview: "dnd" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATION
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "motion", name: "Motion (ex-Framer Motion)", desc: "Animações declarativas para React — layout, gestures, exit", category: "Animation", subcategory: "Core", lib: "Motion", repo: "github.com/motiondivision/motion", tags: ["animação", "motion", "framer", "declarativa"], preview: "animation" },
  { id: "gsap", name: "GSAP", desc: "Timeline animations, scroll triggers, morphing", category: "Animation", subcategory: "Advanced", lib: "GSAP", repo: "github.com/greensock/GSAP", tags: ["gsap", "timeline", "scroll", "avançada"], preview: "animation" },
  { id: "react-spring", name: "React Spring", desc: "Animações physics-based com spring dynamics", category: "Animation", subcategory: "Core", lib: "React Spring", repo: "github.com/pmndrs/react-spring", tags: ["spring", "física", "dynamics", "animação"], preview: "animation" },
  { id: "auto-animate", name: "AutoAnimate", desc: "Animações automáticas em listas — zero config", category: "Animation", subcategory: "Utility", lib: "AutoAnimate", repo: "github.com/formkit/auto-animate", tags: ["auto", "zero-config", "listas", "automático"], preview: "animation" },
  { id: "lottie", name: "Lottie Animations", desc: "Animações vetoriais After Effects no browser", category: "Animation", subcategory: "Assets", lib: "lottie-react", repo: "github.com/Gamote/lottie-react", tags: ["lottie", "after-effects", "vetorial", "svg"], preview: "animation" },
  { id: "magic-ui", name: "Magic UI", desc: "Componentes animados copy-paste para hero sections", category: "Animation", subcategory: "Components", lib: "Magic UI", repo: "github.com/magicuidesign/magicui", tags: ["magic", "hero", "copy-paste", "animados"], preview: "animation" },
  { id: "aceternity", name: "Aceternity UI", desc: "Hero sections com efeitos visuais avançados", category: "Animation", subcategory: "Components", lib: "Aceternity UI", repo: "github.com/aceternity/aceternity-ui", tags: ["aceternity", "hero", "efeitos", "avançados"], preview: "animation" },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3D & VISUAL
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "r3f", name: "3D in React", desc: "Three.js em React com JSX — scenes, meshes, lights", category: "3D & Visual", subcategory: "Core", lib: "React Three Fiber", repo: "github.com/pmndrs/react-three-fiber", tags: ["3d", "three.js", "react", "jsx", "webgl"], preview: "3d" },
  { id: "drei", name: "3D Helpers", desc: "Helpers prontos — orbit controls, text, environment", category: "3D & Visual", subcategory: "Utilities", lib: "Drei", repo: "github.com/pmndrs/drei", tags: ["3d", "helpers", "controls", "environment"], preview: "3d" },
  { id: "globe", name: "3D Globe", desc: "Globo interativo com pontos, arcos e labels", category: "3D & Visual", subcategory: "Components", lib: "react-globe.gl", repo: "github.com/vasturiano/react-globe.gl", tags: ["globo", "3d", "pontos", "arcos", "mundo"], preview: "3d" },
  { id: "particles", name: "Particles", desc: "Partículas animadas — confetti, snow, fireflies", category: "3D & Visual", subcategory: "Effects", lib: "tsParticles", repo: "github.com/tsparticles/tsparticles", tags: ["partículas", "confetti", "efeitos", "animação"], preview: "3d" },
  { id: "custom-shaders", name: "Custom Shaders (GLSL)", desc: "Shaders customizados com shaderMaterial — gradientes, distorção, noise, glow", category: "3D & Visual", subcategory: "Advanced", lib: "Drei shaderMaterial", repo: "github.com/pmndrs/drei", tags: ["shader", "glsl", "webgl", "custom", "material"], preview: "3d" },
  { id: "scroll-3d", name: "Scroll-Triggered 3D", desc: "Cenas 3D reativas ao scroll — parallax, reveal, animação por viewport", category: "3D & Visual", subcategory: "Interaction", lib: "Drei ScrollControls + GSAP", repo: "github.com/pmndrs/drei", tags: ["scroll", "3d", "parallax", "viewport", "interação"], preview: "3d" },
  { id: "postprocessing", name: "WebGL Post-Processing", desc: "Efeitos de pós-processamento — bloom, glitch, depth of field, vignette", category: "3D & Visual", subcategory: "Effects", lib: "@react-three/postprocessing", repo: "github.com/pmndrs/react-postprocessing", tags: ["bloom", "glitch", "dof", "efeitos", "pós-processamento"], preview: "3d" },
  { id: "gltf-loader", name: "3D Model Loading", desc: "Carregamento de modelos GLTF/GLB com animações e compressão Draco", category: "3D & Visual", subcategory: "Assets", lib: "Drei useGLTF", repo: "github.com/pmndrs/drei", tags: ["gltf", "glb", "modelo", "3d", "draco", "animação"], preview: "3d" },
  { id: "r3f-perf", name: "3D Performance Monitor", desc: "FPS counter, GPU stats, draw calls — debug de performance WebGL", category: "3D & Visual", subcategory: "Debug", lib: "r3f-perf", repo: "github.com/utsuboco/r3f-perf", tags: ["performance", "fps", "gpu", "debug", "stats"], preview: "3d" },

  // ═══════════════════════════════════════════════════════════════════════════
  // E-COMMERCE
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "pricing-table", name: "Pricing Table", desc: "Tabela de planos com features e CTA", category: "E-Commerce", subcategory: "Pricing", lib: "shadcn/ui", repo: "ui.shadcn.com", tags: ["pricing", "planos", "preços", "tabela"], preview: "pricing" },
  { id: "feature-matrix", name: "Feature Comparison Matrix", desc: "Matriz de features com checkmarks por plano", category: "E-Commerce", subcategory: "Pricing", lib: "TanStack Table", repo: "github.com/TanStack/table", tags: ["features", "comparação", "matriz", "planos"], preview: "table-rows" },
  { id: "quantity-selector", name: "Quantity Selector", desc: "Seletor +/- com input numérico", category: "E-Commerce", subcategory: "Controls", lib: "shadcn/ui", repo: "ui.shadcn.com", tags: ["quantidade", "seletor", "incremento", "número"], preview: "input" },
  { id: "stripe-elements", name: "Payment Form", desc: "Formulário de pagamento Stripe com card input", category: "E-Commerce", subcategory: "Payment", lib: "Stripe Elements", repo: "github.com/stripe/react-stripe-js", tags: ["pagamento", "stripe", "cartão", "checkout"], preview: "form" },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTATION
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "tocbot", name: "Table of Contents", desc: "Sumário auto-gerado com scroll-spy", category: "Documentation", subcategory: "Navigation", lib: "tocbot", repo: "github.com/tscanlin/tocbot", tags: ["sumário", "toc", "scroll-spy", "navegação"], preview: "toc" },
  { id: "callout", name: "Callout Box", desc: "Box de destaque com ícone e variantes (info, warning, tip)", category: "Documentation", subcategory: "Content", lib: "shadcn/ui Alert", repo: "ui.shadcn.com", tags: ["callout", "destaque", "info", "warning", "tip"], preview: "alert" },
  { id: "faq-accordion", name: "FAQ Accordion", desc: "Perguntas frequentes com expand/collapse", category: "Documentation", subcategory: "Content", lib: "Radix UI Accordion", repo: "radix-ui.com", tags: ["faq", "perguntas", "accordion", "respostas"], preview: "accordion" },
  { id: "kbar", name: "Keyboard Shortcuts Display", desc: "Painel de atalhos de teclado com busca", category: "Documentation", subcategory: "Utilities", lib: "kbar", repo: "github.com/timc1/kbar", tags: ["atalhos", "teclado", "shortcuts", "painel"], preview: "command" },
];
