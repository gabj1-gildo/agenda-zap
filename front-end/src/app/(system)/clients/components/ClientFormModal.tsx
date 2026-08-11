import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";

interface ClientFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: any | null; // null if new
  tenantId: string;
  token: string;
  onSuccess: () => void;
}

export function ClientFormModal({ isOpen, onOpenChange, client, tenantId, token, onSuccess }: ClientFormModalProps) {
  const [formData, setFormData] = useState({ name: "", phone: "", status: "Ativo" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: client?.name || "",
        phone: client?.phone || "",
        status: client?.status || "Ativo",
      });
    }
  }, [isOpen, client]);

  const handleSave = async () => {
    if (!formData.phone) return toast.error("O telefone é obrigatório.");
    setSaving(true);
    try {
      const url = client
        ? getBackendUrl(`/api/dashboard/clients/${client.id}`)
        : getBackendUrl(`/api/dashboard/clients`);
      const method = client ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "tenant-id": tenantId,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(client ? "Cliente atualizado!" : "Cliente cadastrado!");
        onOpenChange(false);
        onSuccess(); // call mutate
      } else {
        toast.error(data.error || "Erro ao salvar cliente.");
      }
    } catch (e) {
      toast.error("Erro na conexão.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              placeholder="Ex: João Silva" 
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone / WhatsApp (Obrigatório)</Label>
            <Input 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, "")})} 
              placeholder="Ex: 5511999999999" 
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={formData.status} 
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
