---
id: dashboard-kpi
name: Dashboard KPI Card with Sparkline
category: data-display
source: salarios-platform
complexity: low
---

# Dashboard KPI Card

## What it solves
Display key metrics with trend indicators, status dots, and inline sparklines in a compact card.

## Best implementation
`~/Claude/GitHub/salarios-platform/src/components/ui/kpi-card.tsx` (112 lines)

## Key features
- **Sparkline chart** inline via `<Sparkline>` component (color-coordinated)
- **Status indicator** dots: ok (green), warning (yellow), critical (red), pending (gray)
- **Accent bar** at top with CSS variable colors (orange, teal, default)
- **Trend badge** with arrow glyph and percentage (+/- with color)
- **Icon container** with accent color at 9.4% opacity background
- **Null handling**: shows "—" when value is missing
- **Accessible**: role="button" when clickable, keyboard nav, tabIndex

## Props interface
```ts
interface KpiCardProps {
  title: string;
  value?: string | null;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: "orange" | "teal" | "default";
  status?: "ok" | "warning" | "critical" | "pending";
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}
```

## Layout structure
```
┌──────────────────────────────────────┐
│ ━━━━━━ accent bar (0.5px) ━━━━━━━━━ │
│                                      │
│  ● TITLE UPPERCASE          [icon]   │
│  42.350                              │
│  ▃▅▇▆▄▅▇ sparkline                  │
│  ▲ +12.5%  vs mês anterior          │
└──────────────────────────────────────┘
```

## CSS patterns
- Card: `rounded-xl border bg-card p-5 hover:shadow-md`
- Accent bar: `absolute inset-x-0 top-0 h-0.5` with CSS variable
- Icon bg: `${accentColor}18` (hex opacity suffix = 9.4%)
- Trend positive: `bg-green-500/10 text-green-500`
- Trend negative: `bg-red-500/10 text-red-500`

## Dependencies
- lucide-react (icons)
- Custom Sparkline component (SVG-based)
- CSS variables: --raiz-orange, --raiz-teal, --muted-foreground

## Usage example
```tsx
<KpiCard
  title="Custo Folha"
  value="R$ 1.250.000"
  icon={DollarSign}
  accent="orange"
  status="ok"
  trend={{ value: "12.5%", positive: false }}
  sparklineData={[100, 120, 115, 130, 125, 140]}
  subtitle="vs mês anterior"
/>
```
