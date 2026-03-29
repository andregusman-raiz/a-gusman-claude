"use client";

import { SolutionLayout } from "@/components/solutions/solution-layout";
import { KpiCard } from "@/components/solutions/kpi-card";
import { Users, DollarSign, GraduationCap, TrendingUp, Building2, Clock } from "lucide-react";

export default function DashboardKpiPage() {
  return (
    <SolutionLayout id="dashboard-kpi" title="Metric Cards + Sparklines" source="salarios-platform" category="Data Display">
      <p className="mb-6 text-sm text-muted-foreground">
        Cards de métricas com sparkline, trend badge, status dots e accent colors. Componente 100% composável — cada elemento é opcional.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Headcount Ativo"
          value="2.847"
          icon={Users}
          accent="orange"
          status="ok"
          trend={{ value: "3.2%", positive: true }}
          sparklineData={[2650, 2700, 2720, 2780, 2800, 2830, 2847]}
          subtitle="vs mês anterior"
        />
        <KpiCard
          title="Custo Folha"
          value="R$ 4.250.000"
          icon={DollarSign}
          accent="teal"
          status="warning"
          trend={{ value: "8.1%", positive: false }}
          sparklineData={[3800000, 3900000, 4000000, 4100000, 4180000, 4250000]}
          subtitle="+R$ 318K vs orçamento"
        />
        <KpiCard
          title="Custo por Aluno"
          value="R$ 892"
          icon={GraduationCap}
          accent="default"
          status="ok"
          trend={{ value: "1.5%", positive: true }}
          sparklineData={[920, 915, 908, 900, 895, 892]}
          subtitle="meta: R$ 900"
        />
        <KpiCard
          title="Turnover"
          value="2.4%"
          icon={TrendingUp}
          accent="orange"
          status="ok"
          trend={{ value: "0.8%", positive: true }}
          sparklineData={[4.2, 3.8, 3.5, 3.0, 2.8, 2.4]}
          subtitle="acumulado 12 meses"
        />
        <KpiCard
          title="Unidades"
          value="31"
          icon={Building2}
          accent="teal"
          status="ok"
          sparklineData={[28, 28, 29, 30, 30, 31]}
          subtitle="5 estados"
        />
        <KpiCard
          title="Horas Extras"
          value="1.280h"
          icon={Clock}
          accent="default"
          status="critical"
          trend={{ value: "22%", positive: false }}
          sparklineData={[800, 900, 950, 1050, 1180, 1280]}
          subtitle="acima do limite"
        />
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card/50 p-4">
        <h3 className="text-sm font-medium">Variações demonstradas</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <KpiCard title="Sem valor" value={null} icon={Users} accent="orange" />
          <KpiCard title="Sem trend" value="42" icon={Users} accent="teal" subtitle="apenas subtitle" />
          <KpiCard title="Clicável" value="Ver mais" icon={TrendingUp} accent="default" onClick={() => {}} />
        </div>
      </div>
    </SolutionLayout>
  );
}
