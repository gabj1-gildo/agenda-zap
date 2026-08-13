"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Download, FileText, Loader2, Calendar as CalendarIcon, Filter, DollarSign, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function ReportsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date Filters
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

  // Additional Filters
  const [serviceId, setServiceId] = useState<string>("ALL");
  const [professionalId, setProfessionalId] = useState<string>("ALL");
  const [clientId, setClientId] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");

  // Options
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const tenantId = (session as any)?.tenantId || (session?.user as any)?.tenantId;
  const token = (session as any)?.token || (session?.user as any)?.accessToken;

  // Load Filter Options
  useEffect(() => {
    if (!tenantId || !token) return;

    const headers = { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` };

    Promise.all([
      fetch(getBackendUrl(`/api/services?tenantId=${tenantId}`), { headers }).then(res => res.json()),
      fetch(getBackendUrl(`/api/professionals?tenantId=${tenantId}`), { headers }).then(res => res.json()),
      fetch(getBackendUrl(`/api/clients?tenantId=${tenantId}`), { headers }).then(res => res.json())
    ]).then(([svcs, profs, clis]) => {
      if (svcs.success) setServices(svcs.data || []);
      if (profs.success) setProfessionals(profs.data || []);
      if (clis.success) setClients(clis.data || []);
    }).catch(console.error);
  }, [tenantId, token]);

  // Load Report Data
  useEffect(() => {
    if (!tenantId || !token) return;

    setLoading(true);
    let url = `/api/reports?tenantId=${tenantId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    if (serviceId !== 'ALL') url += `&serviceId=${serviceId}`;
    if (professionalId !== 'ALL') url += `&professionalId=${professionalId}`;
    if (clientId !== 'ALL') url += `&clientId=${clientId}`;
    if (status !== 'ALL') url += `&status=${status}`;

    fetch(getBackendUrl(url), {
      headers: {
        'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.data);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [tenantId, token, startDate, endDate, serviceId, professionalId, clientId, status]);

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
    link.setAttribute("download", `relatorio_${format(startDate, 'yyyyMMdd')}_a_${format(endDate, 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const role = (session?.user as any)?.role;
  if (!session || (role !== 'SUPERADMIN' && role !== 'ADMIN')) {
    return <div className="p-8 text-center text-muted-foreground">Acesso negado. Apenas gerentes ou donos podem ver relatórios.</div>;
  }

  // Calculate Financial Summaries
  const totalRevenue = data.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const totalPaid = data.filter(d => d.status === 'PAGO').reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const totalPending = data.filter(d => d.status === 'PENDENTE').reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-500" />
            Gerenciamento de Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">Gere relatórios detalhados de agendamentos e faturamento.</p>
        </div>
        <Button onClick={downloadCSV} disabled={data.length === 0 || loading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card className="p-6 bg-card border rounded-2xl shadow-sm">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="flex items-center gap-2 lg:col-span-3">
            <Popover>
              {/* @ts-expect-error */}
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal rounded-xl", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Data inicial</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-sm">até</span>
            <Popover>
              {/* @ts-expect-error */}
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal rounded-xl", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Data final</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={(d) => { if (d) { const newEnd = new Date(d); newEnd.setHours(23, 59, 59, 999); setEndDate(newEnd); } }} />
              </PopoverContent>
            </Popover>
          </div>

          <select
            className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="ALL">Todos os Serviços</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
          >
            <option value="ALL">Todos os Profissionais</option>
            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select
            className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="ALL">Todos os Clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary outline-none"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">Todos os Status</option>
            <option value="PAGO">Pago</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="AGENDADO">Agendado</option>
          </select>
        </div>
      </Card>

      <Tabs defaultValue="agendamentos" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-2 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="agendamentos" className="rounded-lg gap-2"><CalendarDays className="w-4 h-4" /> Agendamentos</TabsTrigger>
          <TabsTrigger value="financeiro" className="rounded-lg gap-2"><DollarSign className="w-4 h-4" /> Financeiro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="agendamentos" className="mt-6">
          <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Data / Hora</th>
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold">Serviço / Prof.</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                        Buscando dados...
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        Nenhum atendimento encontrado neste período com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
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
                            item.status === 'PAGO' ? 'bg-emerald-500/10 text-emerald-600' :
                            item.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-red-500/10 text-red-600'
                          )}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-emerald-500/10 border-emerald-500/20 shadow-sm">
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Faturamento Pago</h4>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid)}
              </p>
            </Card>
            <Card className="p-6 bg-amber-500/10 border-amber-500/20 shadow-sm">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Pagamentos Pendentes</h4>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPending)}
              </p>
            </Card>
            <Card className="p-6 bg-blue-500/10 border-blue-500/20 shadow-sm">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Total Geral (Projetado)</h4>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
              </p>
            </Card>
          </div>

          <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Data</th>
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold">Serviço</th>
                    <th className="px-6 py-4 font-semibold">Status Pagto</th>
                    <th className="px-6 py-4 font-semibold text-right">Valor Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
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
                        Nenhum faturamento encontrado neste período.
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-foreground">{item.clientName || 'Desconhecido'}</td>
                        <td className="px-6 py-4 text-foreground">{item.serviceName}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider", 
                            item.status === 'PAGO' ? 'bg-emerald-500/10 text-emerald-600' :
                            item.status === 'PENDENTE' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-red-500/10 text-red-600'
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
