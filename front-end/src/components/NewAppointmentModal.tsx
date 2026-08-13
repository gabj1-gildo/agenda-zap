"use client"

import { useState } from "react"
import { toast } from "sonner"
import { X } from "lucide-react"
import { getBackendUrl } from "@/lib/api";
import { formatPhone } from "@/lib/utils";
import { useSession } from "next-auth/react";

type Props = {
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function NewAppointmentModal({ tenantId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    date: '',
    time: '',
    serviceName: '',
    price: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const datetime = new Date(`${formData.date}T${formData.time}:00`);
      
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }

      const res = await fetch(getBackendUrl('/api/dashboard/appointments'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenantId,
          clientName: formData.clientName,
          clientPhone: formData.clientPhone.replace(/\D/g, ''),
          date: datetime.toISOString(),
          serviceName: formData.serviceName,
          price: parseFloat(formData.price || "0")
        })
      });

      if (res.ok) {
        toast.success("Agendamento criado com sucesso!");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar agendamento");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold font-display">Novo Agendamento</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">Nome do Cliente</label>
            <input 
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ex: João Silva"
              value={formData.clientName}
              onChange={e => setFormData({...formData, clientName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">WhatsApp / Telefone</label>
            <input 
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="+55 (11) 9 9999-9999"
              value={formData.clientPhone}
              onChange={e => setFormData({...formData, clientPhone: formatPhone(e.target.value)})}
              maxLength={21}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">Data</label>
              <input 
                required
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Horário</label>
              <input 
                required
                type="time"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">Serviço</label>
            <input 
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ex: Corte de Cabelo"
              value={formData.serviceName}
              onChange={e => setFormData({...formData, serviceName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">Valor (R$)</label>
            <input 
              required
              type="number"
              step="0.01"
              min="0"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="0.00"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Criar Agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
