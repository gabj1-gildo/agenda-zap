"use client";

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function ExportButton({ data }: { data: any[] }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("Nenhum dado para exportar");
      return;
    }

    const headers = ["Data e Hora", "Cliente", "Serviço", "Valor", "Status"];
    const csvContent = [
      headers.join(";"),
      ...data.map(apt => {
        const date = apt.date ? new Date(apt.date).toLocaleString('pt-BR') : '-';
        const client = apt.client?.name || 'Desconhecido';
        const service = apt.serviceName || apt.service || '-';
        const price = apt.price || '0.00';
        const status = apt.status || '-';
        return `"${date}";"${client}";"${service}";"${price}";"${status}"`;
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `agendamentos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
      <Download className="w-4 h-4" /> Exportar CSV
    </Button>
  );
}
