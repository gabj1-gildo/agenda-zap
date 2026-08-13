"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getBackendUrl } from "@/lib/api";
import { History } from "lucide-react";

export function AppointmentActions({
  appointmentId,
  tenantId,
  token
}: {
  appointmentId: string;
  tenantId: string;
  token: string;
}) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl(`/api/dashboard/appointments/${appointmentId}/logs?tenantId=${tenantId}`), {
        headers: { 'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchLogs();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        title="Ver Histórico"
      >
        <History className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum log encontrado para este agendamento.</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {logs.map(log => (
                <div key={log.id} className="flex flex-col gap-1 text-sm border-b pb-3 border-border">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-foreground">Ação: {log.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Autor: <span className="font-medium">{log.actionByName}</span>
                  </div>
                  {log.details && (
                    <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-x-auto text-foreground font-mono-custom">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
