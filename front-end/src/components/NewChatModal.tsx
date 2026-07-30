"use client"

import { useState } from "react"
import { toast } from "sonner"
import { X, Send } from "lucide-react"
import { getBackendUrl } from "@/lib/api";
import { formatPhone } from "@/lib/utils";

type Props = {
  tenantId: string;
  onClose: () => void;
  onSuccess: (newSession: any) => void;
};

const TEMPLATES = [
  { label: "Nenhum (Só criar o chat)", value: "" },
  { label: "Saudação Simples", value: "Olá! Tudo bem? Como posso te ajudar hoje?" },
  { label: "Lembrete de Agendamento", value: "Olá! Passando para lembrar do nosso agendamento. Confirma sua presença?" },
  { label: "Cobrança", value: "Olá! Segue o link para pagamento do seu último serviço." },
];

import { useSession } from "next-auth/react"

export function NewChatModal({ tenantId, onClose, onSuccess }: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    template: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(getBackendUrl('/api/chats/new'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session?.user as any)?.accessToken || ''}`
        },
        body: JSON.stringify({
          tenantId,
          phone: formData.phone.replace(/\D/g, ''),
          name: formData.name,
          initialMessage: formData.template
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(formData.template ? "Conversa iniciada e mensagem enviada!" : "Conversa iniciada!");
        onSuccess(data.data);
      } else {
        toast.error(data.error || "Erro ao iniciar conversa");
      }
    } catch (err) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold font-display">Nova Conversa</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">WhatsApp do Cliente *</label>
            <input 
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="+55 (11) 9 9999-9999"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
              maxLength={21}
            />
            <p className="text-[10px] text-muted-foreground">Coloque o DDD. (Ex: 11999999999)</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">Nome (Opcional)</label>
            <input 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">Mensagem Inicial (Template)</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.template}
              onChange={e => setFormData({...formData, template: e.target.value})}
            >
              {TEMPLATES.map(t => (
                <option key={t.label} value={t.value}>{t.label}</option>
              ))}
            </select>
            {formData.template && (
              <div className="mt-2 p-3 bg-muted rounded-lg border text-xs text-muted-foreground italic">
                "{formData.template}"
              </div>
            )}
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
              disabled={loading || formData.phone.length < 10}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? "Iniciando..." : "Iniciar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
