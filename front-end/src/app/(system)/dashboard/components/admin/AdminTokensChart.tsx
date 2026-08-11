"use client";

import { Activity, Database } from "lucide-react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { AdminMetrics } from "../../types/dashboard.types";

interface Props {
  adminMetrics: AdminMetrics | null;
}

export function AdminTokensChart({ adminMetrics }: Props) {
  return (
    <div style={{ borderColor: "var(--border)" }} className="bg-card border rounded-2xl p-6 hover-scale">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-display font-extrabold text-lg text-foreground">Consumo de Tokens por Empresa</h2>
      </div>
      
      {adminMetrics?.chartData && adminMetrics.chartData.length > 0 ? (
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adminMetrics.chartData}>
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} dx={-10} />
              <Tooltip 
                cursor={{fill: 'var(--muted)', opacity: 0.4}} 
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              <Bar name="Tokens" dataKey="tokens" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[200px] w-full flex flex-col items-center justify-center text-muted-foreground text-sm">
          <Database className="w-8 h-8 mb-2 opacity-20" />
          Nenhum dado de token registrado ainda.
        </div>
      )}
    </div>
  );
}
