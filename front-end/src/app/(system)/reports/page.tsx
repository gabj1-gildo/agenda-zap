"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Download, FileText, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });

  const tenantId = (session as any)?.tenantId || (session?.user as any)?.tenantId;
  const token = (session as any)?.token || (session?.user as any)?.accessToken;

  useEffect(() => {
    if (!tenantId || !token) return;

    setLoading(true);
    fetch(getBackendUrl(`/api/reports?tenantId=${tenantId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`), {
      headers: {
        'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setData(d.data);
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [tenantId, token, startDate, endDate]);

  const downloadCSV = () => {
    if (data.length === 0) return;

    const headers = ["Data", "Hora", "Cliente", "Telefone", "Serviço", "Profissional", "Consultório", "Status", "Valor"];
    
    const rows = data.map(item => {
      const d = new Date(item.date);
      return [
        d.toLocaleDateString('pt-BR'),
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        `"${item.clientName || ''}"`,
        `"${item.clientPhone || ''}"`,
        `"${item.serviceName || ''}"`,
        `"${item.professionalName || 'Padrão'}"`,
        `"${item.roomName || 'Geral'}"`,
        item.status,
        item.price
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_agendamentos_${format(startDate, 'yyyyMMdd')}_a_${format(endDate, 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const role = (session?.user as any)?.role;
  if (!session || (role !== 'SUPERADMIN' && role !== 'ADMIN')) {
    return <div className="p-8 text-center text-muted-foreground">Acesso negado. Apenas gerentes ou donos podem ver relatórios.</div>;
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-4xl text-foreground flex items-center gap-3">
            <FileText className="w-10 h-10 text-emerald-500" /> Relatórios
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl">
            Acompanhe o faturamento, liste atendimentos e exporte os dados da sua clínica para análise avançada no Excel.
          </p>
        </div>

        <Button onClick={downloadCSV} disabled={data.length === 0 || loading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
          <Download className="w-4 h-4 mr-2" />
          Baixar CSV
        </Button>
      </div>

      <div className="bg-card border rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Popover>
            {/* @ts-expect-error */}
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal rounded-xl",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Data inicial</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => d && setStartDate(d)}
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">até</span>

          <Popover>
            {/* @ts-expect-error */}
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal rounded-xl",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Data final</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => {
                  if (d) {
                    const newEnd = new Date(d);
                    newEnd.setHours(23, 59, 59, 999);
                    setEndDate(newEnd);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="bg-card border rounded-3xl overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Data / Hora</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Serviço / Profissional</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                    Buscando dados...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhum atendimento encontrado neste período.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                      <div className="text-muted-foreground text-xs">{new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{item.clientName || 'Desconhecido'}</div>
                      <div className="text-muted-foreground text-xs">{item.clientPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{item.serviceName}</div>
                      <div className="text-muted-foreground text-xs">
                        {item.professionalName ? `Com ${item.professionalName}` : 'Sem prof. definido'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider", 
                        item.status === 'PAGO' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        item.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        'bg-red-500/10 text-red-600 dark:text-red-400'
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
