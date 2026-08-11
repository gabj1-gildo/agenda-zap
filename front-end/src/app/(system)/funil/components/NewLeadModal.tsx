import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGES, DBStage } from "../types/funil";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/api";

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  token: string;
  onSuccess: () => void;
}

export function NewLeadModal({ isOpen, onClose, tenantId, token, onSuccess }: NewLeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<DBStage>("espera");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast.error("Telefone é obrigatório");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl('/api/clients'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: name || null, phone, funnelStage: stage })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Lead criado!");
        setName("");
        setPhone("");
        setStage("espera");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Erro ao criar lead");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>
            Crie um novo lead e defina seu estágio no funil.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input 
              placeholder="Ex: João Silva" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone / WhatsApp</Label>
            <Input 
              placeholder="Ex: 5511999999999" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Estágio no Funil</Label>
            <Select value={stage} onValueChange={(val) => setStage(val as DBStage)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estágio" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map(s => (
                  <SelectItem key={s.dbKey} value={s.dbKey}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">
            {loading ? "Salvando..." : "Salvar Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
