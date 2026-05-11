"use client";

import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";
import type { LucideIcon } from "lucide-react";

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

const STATUS_COLORS: Record<NonNullable<KpiCardProps["status"]>, string> = {
  ok: "bg-green-500",
  warning: "bg-yellow-500",
  critical: "bg-red-500",
  pending: "bg-muted-foreground/40",
};

export function KpiCard({
  title, value, subtitle, icon: Icon, trend, accent = "default",
  status, sparklineData, onClick, className,
}: KpiCardProps) {
  const accentColor =
    accent === "orange" ? "#f97316" : accent === "teal" ? "#14b8a6" : "#a1a1aa";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:border-orange-500/30",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 opacity-60" style={{ background: accentColor }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {status && (
              <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", STATUS_COLORS[status])} />
            )}
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          </div>
          <p className="mt-1.5 text-2xl font-semibold leading-none tracking-tight">
            {value ?? <span className="text-muted-foreground/40">—</span>}
          </p>
          {sparklineData && sparklineData.length >= 2 && (
            <div className="mt-2">
              <Sparkline data={sparklineData} color={accentColor} width={100} height={20} />
            </div>
          )}
          {(subtitle || trend) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium",
                  trend.positive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {trend.positive ? "▲" : "▼"} {trend.value}
                </span>
              )}
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          )}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${accentColor}18` }}
        >
          <Icon className="h-5 w-5" style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );
}
