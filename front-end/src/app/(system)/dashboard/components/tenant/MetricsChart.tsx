"use client";

import { Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { DashboardMetrics } from "../../types/dashboard.types";

interface Props {
  metrics: DashboardMetrics;
  role?: string;
}

export function MetricsChart({ metrics, role }: Props) {
  return (
    <div style={{ borderColor: "var(--line)" }} className="bg-card border rounded-xl p-5">
      <div className="mb-5">
        <h2 className="section-title">Agendamentos no período</h2>
        <p className="section-sub">Evolução de faturamento e atendimentos</p>
      </div>
      
      {metrics.chartData && metrics.chartData.length > 0 ? (
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={10}>
            <BarChart data={metrics.chartData}>
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              {role !== "ATTENDANT" && <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} dx={-10} />}
              <YAxis yAxisId="right" orientation={role !== "ATTENDANT" ? "left" : "right"} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dx={role !== "ATTENDANT" ? -10 : 10} />
              <Tooltip 
                cursor={false}
                shared={false}
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              {role !== "ATTENDANT" && <Bar yAxisId="left" name="Faturamento (R$)" dataKey="faturamento" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={50} />}
              <Bar yAxisId="right" name="Qtd. Atendimentos" dataKey="atendimentos" fill="var(--chart-2)" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[200px] w-full flex flex-col items-center justify-center text-muted-foreground text-sm">
          <Activity className="w-8 h-8 mb-2 opacity-20" />
          Nenhum dado registrado neste período.
        </div>
      )}
    </div>
  );
}
