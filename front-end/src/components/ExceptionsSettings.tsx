"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash, Edit } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ExceptionsSettings({ tenantId, token }: { tenantId: string; token?: string }) {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: "",
    isClosed: true,
    customStartTime: "09:00",
    customEndTime: "18:00"
  });

  useEffect(() => {
    if (!tenantId) return;
    loadExceptions();
  }, [tenantId]);

  const loadExceptions = async () => {
    try {
      const res = await fetch(getBackendUrl('/api/settings/schedule-exceptions'), {
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setExceptions(data.data);
      } else {
        toast.error("Erro ao carregar exceções");
      }
    } catch (e) {
      toast.error("Erro de conexão ao carregar exceções");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ date: "", isClosed: true, customStartTime: "09:00", customEndTime: "18:00" });
    setShowModal(true);
  };

  const handleOpenEdit = (exc: any) => {
    setEditingId(exc.id);
    setFormData({
      date: exc.date.split('T')[0], // if returned as ISO string, though drizzle date might be 'YYYY-MM-DD'
      isClosed: exc.isClosed,
      customStartTime: exc.customStartTime || "09:00",
      customEndTime: exc.customEndTime || "18:00"
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.date) return toast.error("A data é obrigatória");
    
    if (!formData.isClosed) {
      if (!formData.customStartTime || !formData.customEndTime) {
        return toast.error("Os horários de início e fim são obrigatórios quando não está fechado");
      }
      if (formData.customStartTime >= formData.customEndTime) {
        return toast.error("O horário de início deve ser menor que o horário de fim");
      }
    }

    setSaving(true);
    try {
      const payload = {
        date: formData.date,
        isClosed: formData.isClosed,
        customStartTime: formData.isClosed ? null : formData.customStartTime,
        customEndTime: formData.isClosed ? null : formData.customEndTime,
      };

      if (editingId) {
        const res = await fetch(getBackendUrl('/api/settings/schedule-exceptions'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: editingId, ...payload })
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Exceção atualizada com sucesso");
          setExceptions(exceptions.map(e => e.id === editingId ? data.data : e));
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(getBackendUrl('/api/settings/schedule-exceptions'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Exceção cadastrada com sucesso");
          setExceptions([data.data, ...exceptions]);
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao cadastrar");
        }
      }
    } catch (e) {
      toast.error("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(getBackendUrl(`/api/settings/schedule-exceptions?id=${deleteId}`), {
        method: 'DELETE',
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Exceção excluída");
        setExceptions(exceptions.filter(e => e.id !== deleteId));
      } else {
        toast.error(data.error || "Erro ao excluir");
      }
    } catch (e) {
      toast.error("Erro de conexão ao excluir");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Folgas e Feriados Específicos</h3>
          <p className="text-sm text-muted-foreground">Adicione dias em que você não irá trabalhar ou terá horários diferentes.</p>
        </div>
        <Button onClick={handleOpenNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Exceção
        </Button>
      </div>

      <div className="rounded-md border mt-4">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : exceptions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma exceção cadastrada.
          </div>
        ) : (
          <div className="divide-y">
            {exceptions.map((exc) => (
              <div key={exc.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{new Date(exc.date + "T12:00:00").toLocaleDateString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">
                    {exc.isClosed ? "Fechado" : `Horário Customizado: ${exc.customStartTime} às ${exc.customEndTime}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(exc)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(exc.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Exceção" : "Nova Exceção de Horário"}</DialogTitle>
            <DialogDescription>
              Defina as regras para esta data específica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Fechado o dia todo?</Label>
                <p className="text-xs text-muted-foreground">Marque se não houver atendimento neste dia.</p>
              </div>
              <Switch 
                checked={formData.isClosed} 
                onCheckedChange={(checked) => setFormData({ ...formData, isClosed: checked })} 
              />
            </div>

            {!formData.isClosed && (
              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input 
                    type="time" 
                    value={formData.customStartTime} 
                    onChange={(e) => setFormData({ ...formData, customStartTime: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input 
                    type="time" 
                    value={formData.customEndTime} 
                    onChange={(e) => setFormData({ ...formData, customEndTime: e.target.value })} 
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal 
        open={!!deleteId} 
        onOpenChange={(open) => { if (!open) setDeleteId(null); }} 
        title="Excluir Exceção" 
        description="Tem certeza que deseja remover esta regra de horário? Ela voltará a seguir o horário padrão da semana." 
        onConfirm={confirmDelete} 
      />
    </div>
  );
}
