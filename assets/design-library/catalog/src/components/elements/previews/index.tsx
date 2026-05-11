"use client";

import dynamic from "next/dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const L = (mod: string, exp: string) => dynamic(() => import(`./${mod}`).then((m: any) => ({ default: m[exp] })), { loading: () => <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">Carregando...</div> });

const PREVIEW_MAP: Record<string, React.ComponentType> = {
  // ── Data Display ──────────────────────────────────────────────────────────
  "tanstack-table": L("data-display", "TanStackTablePreview"),
  "ag-grid": L("data-display", "AgGridPreview"),
  "recharts": L("data-display", "RechartsPreview"),
  "nivo": L("data-display", "RechartsPreview"),
  "echarts": L("data-display", "RechartsPreview"),
  "lightweight-charts": L("data-display", "RechartsPreview"),
  "visx": L("data-display", "RechartsPreview"),
  "nivo-funnel": L("data-display", "RechartsPreview"),
  "react-gauge": L("data-display", "ProgressPreview"),
  "tremor-kpi": L("data-display", "TremorKpiPreview"),
  "badge": L("data-display", "BadgePreview"),
  "avatar": L("data-display", "AvatarPreview"),
  "tooltip": L("data-display", "TooltipPreview"),
  "popover": L("data-display", "TooltipPreview"),
  "react-chrono": L("data-display", "TimelinePreview"),
  "novu": L("data-display", "TimelinePreview"),
  "diff-viewer": L("data-display", "CodeBlockPreview"),
  "shiki": L("data-display", "CodeBlockPreview"),
  "json-viewer": L("data-display", "CodeBlockPreview"),
  "skeleton": L("data-display", "SkeletonPreview"),
  "progress": L("data-display", "ProgressPreview"),
  "stepper": L("data-display", "StepperPreview"),

  // ── Navigation ────────────────────────────────────────────────────────────
  "sidebar": L("navigation", "SidebarPreview"),
  "navbar": L("navigation", "SidebarPreview"),
  "tabs": L("navigation", "TabsPreview"),
  "cmdk": L("navigation", "CommandPalettePreview"),
  "global-search": L("navigation", "CommandPalettePreview"),
  "breadcrumb": L("navigation", "BreadcrumbPreview"),
  "accordion": L("navigation", "AccordionPreview"),
  "faq-accordion": L("navigation", "AccordionPreview"),
  "dropdown-menu": L("navigation", "DropdownMenuPreview"),
  "context-menu": L("navigation", "DropdownMenuPreview"),
  "mega-menu": L("navigation", "DropdownMenuPreview"),
  "dropdown-action": L("navigation", "DropdownMenuPreview"),
  "tree-view": L("navigation", "TreeViewPreview"),
  "vaul-drawer": L("navigation", "DrawerPreview"),
  "pagination": L("navigation", "PaginationPreview"),

  // ── Forms & Input ─────────────────────────────────────────────────────────
  "react-hook-form": L("forms", "InputPreview"),
  "input": L("forms", "InputPreview"),
  "currency-input": L("forms", "InputPreview"),
  "phone-input": L("forms", "InputPreview"),
  "imask": L("forms", "InputPreview"),
  "emblor": L("forms", "InputPreview"),
  "time-picker": L("forms", "InputPreview"),
  "select": L("forms", "SelectPreview"),
  "multi-select": L("forms", "SelectPreview"),
  "downshift": L("forms", "SelectPreview"),
  "date-picker": L("forms", "DatePickerPreview"),
  "date-range": L("forms", "DatePickerPreview"),
  "file-upload": L("forms", "FileUploadPreview"),
  "filepond": L("forms", "FileUploadPreview"),
  "slider": L("forms", "SliderPreview"),
  "switch": L("forms", "TogglePreview"),
  "checkbox": L("forms", "TogglePreview"),
  "radio": L("forms", "TogglePreview"),
  "rating": L("forms", "RatingPreview"),
  "input-otp": L("forms", "OtpPreview"),
  "otp-auth": L("forms", "OtpPreview"),
  "color-picker": L("forms", "ColorPickerPreview"),
  "login-form": L("forms", "InputPreview"),
  "signature-pad": L("forms", "InputPreview"),

  // ── Editors (Forms subcategory) ───────────────────────────────────────────
  "tiptap": L("data-display", "CodeBlockPreview"),
  "blocknote": L("data-display", "CodeBlockPreview"),
  "milkdown": L("data-display", "CodeBlockPreview"),
  "monaco": L("data-display", "CodeBlockPreview"),

  // ── Feedback ──────────────────────────────────────────────────────────────
  "sonner": L("feedback", "ToastPreview"),
  "alert": L("feedback", "AlertPreview"),
  "callout": L("feedback", "AlertPreview"),
  "cookie-consent": L("feedback", "AlertPreview"),
  "dialog": L("feedback", "ModalPreview"),
  "alert-dialog": L("feedback", "ModalPreview"),
  "spinner": L("feedback", "SpinnerPreview"),

  // ── Actions ───────────────────────────────────────────────────────────────
  "button": L("data-display", "BadgePreview"),
  "icon-button": L("data-display", "BadgePreview"),
  "copy-to-clipboard": L("data-display", "BadgePreview"),

  // ── Layout ────────────────────────────────────────────────────────────────
  "card": L("data-display", "TremorKpiPreview"),
  "gantt": L("data-display", "TimelinePreview"),
  "gantt-pro": L("data-display", "TimelinePreview"),
  "fullcalendar": L("forms", "DatePickerPreview"),
  "react-grid-layout": L("data-display", "TremorKpiPreview"),
  "dashboard-grid": L("data-display", "TremorKpiPreview"),

  // ── Lists ─────────────────────────────────────────────────────────────────
  "dnd-list": L("data-display", "TanStackTablePreview"),
  "virtual-list": L("data-display", "TanStackTablePreview"),
  "transfer-list": L("data-display", "TanStackTablePreview"),
  "master-detail": L("data-display", "TanStackTablePreview"),

  // ── Media ─────────────────────────────────────────────────────────────────
  "carousel": L("data-display", "SkeletonPreview"),
  "lightbox": L("data-display", "SkeletonPreview"),
  "video-player": L("data-display", "ProgressPreview"),
  "audio-player": L("data-display", "ProgressPreview"),

  // ── Communication ─────────────────────────────────────────────────────────
  "chat-ui": L("navigation", "SidebarPreview"),
  "mention": L("forms", "SelectPreview"),
  "emoji-picker": L("data-display", "BadgePreview"),

  // ── Workflow ───────────────────────────────────────────────────────────────
  "react-flow": L("data-display", "TimelinePreview"),
  "audit-log": L("data-display", "TimelinePreview"),
  "approval-flow": L("data-display", "StepperPreview"),
  "cron-editor": L("forms", "InputPreview"),
  "permission-matrix": L("data-display", "TanStackTablePreview"),

  // ── Dashboards ────────────────────────────────────────────────────────────
  "tremor-dashboard": L("data-display", "TremorKpiPreview"),
  "pivot-table": L("data-display", "AgGridPreview"),
  "waterfall-chart": L("data-display", "RechartsPreview"),
  "scatter-chart": L("data-display", "RechartsPreview"),
  "cohort-table": L("data-display", "AgGridPreview"),

  // ── Auth & Onboarding ─────────────────────────────────────────────────────
  "shepherd": L("data-display", "StepperPreview"),
  "reactour": L("data-display", "StepperPreview"),

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  "dnd-kit": L("data-display", "TanStackTablePreview"),
  "pragmatic-dnd": L("data-display", "TanStackTablePreview"),
  "hello-pangea": L("data-display", "TanStackTablePreview"),

  // ── Animation ─────────────────────────────────────────────────────────────
  "motion": L("feedback", "SpinnerPreview"),
  "gsap": L("feedback", "SpinnerPreview"),
  "react-spring": L("feedback", "SpinnerPreview"),
  "auto-animate": L("feedback", "SpinnerPreview"),
  "lottie": L("feedback", "SpinnerPreview"),
  "magic-ui": L("feedback", "SpinnerPreview"),
  "aceternity": L("feedback", "SpinnerPreview"),

  // ── E-Commerce ────────────────────────────────────────────────────────────
  "pricing-table": L("data-display", "TremorKpiPreview"),
  "feature-matrix": L("data-display", "AgGridPreview"),
  "stripe-elements": L("forms", "InputPreview"),
  "quantity-selector": L("forms", "SliderPreview"),

  // ── Documentation ─────────────────────────────────────────────────────────
  "tocbot": L("navigation", "AccordionPreview"),
  "kbar": L("navigation", "CommandPalettePreview"),

  // ── 3D ────────────────────────────────────────────────────────────────────
  "r3f": L("feedback", "SpinnerPreview"),
  "drei": L("feedback", "SpinnerPreview"),
  "globe": L("feedback", "SpinnerPreview"),
  "particles": L("feedback", "SpinnerPreview"),
};

export function ElementInteractivePreview({ id }: { id: string }) {
  const Preview = PREVIEW_MAP[id];
  if (!Preview) return null;
  return <Preview />;
}

export function hasInteractivePreview(id: string): boolean {
  return id in PREVIEW_MAP;
}
