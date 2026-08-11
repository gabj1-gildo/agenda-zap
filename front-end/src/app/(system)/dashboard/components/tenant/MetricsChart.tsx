"use client";

import { Activity, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { DashboardMetrics } from "../../types/dashboard.types";

interface Props {
  metrics: DashboardMetrics;
  role?: string;
}

export function MetricsChart({ metrics, role }: Props) {
  return (
    <div style={{ borderColor: "var(--border)" }} className="bg-card border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-display font-extrabold text-lg text-foreground">Evolução no Período</h2>
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
              {role !== "ATTENDANT" && <Bar yAxisId="left" name="Faturamento (R$)" dataKey="faturamento" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />}
              <Bar yAxisId="right" name="Qtd. Atendimentos" dataKey="atendimentos" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50} />
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
