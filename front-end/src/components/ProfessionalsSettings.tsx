"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useSession } from "next-auth/react";

export function ProfessionalsSettings({ tenantId }: { tenantId: string }) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [maxProfessionals, setMaxProfessionals] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    userId: "",
    serviceIds: [] as string[],
    isActive: true
  });

  useEffect(() => {
    if (!tenantId) return;
    loadAllData();
  }, [tenantId]);

  const loadAllData = async () => {
    try {
      const hdrs = { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
      const [profRes, svcRes, teamRes, tenantRes] = await Promise.all([
        fetch(getBackendUrl('/api/settings/professionals'), { headers: hdrs }),
        fetch(getBackendUrl('/api/settings/services'), { headers: hdrs }),
        fetch(getBackendUrl('/api/settings/team'), { headers: hdrs }),
        fetch(getBackendUrl('/api/settings/tenant'), { headers: hdrs })
      ]);
      const profData = await profRes.json();
      const svcData = await svcRes.json();
      const teamData = await teamRes.json();
      const tenantData = await tenantRes.json();
      
      if (profData.success) setProfessionals(profData.data);
      if (svcData.success) setServices(svcData.data);
      if (teamData.success) setTeam(teamData.data);
      if (tenantData.success) setMaxProfessionals(tenantData.data?.maxUsers ?? 5);
    } catch (e) {
      toast.error("Erro de conexão ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", userId: "", serviceIds: [], isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (prof: any) => {
    setEditingId(prof.id);
    setFormData({
      name: prof.name,
      description: prof.description || "",
      userId: prof.userId || "",
      serviceIds: prof.serviceIds || [],
      isActive: prof.isActive
    });
    setShowModal(true);
  };

  const handleServiceToggle = (svcId: string) => {
    setFormData(prev => {
      const isSelected = prev.serviceIds.includes(svcId);
      return {
        ...prev,
        serviceIds: isSelected 
          ? prev.serviceIds.filter(id => id !== svcId)
          : [...prev.serviceIds, svcId]
      };
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        userId: formData.userId || null,
        serviceIds: formData.serviceIds,
        isActive: formData.isActive
      };

      if (editingId) {
        const res = await fetch(getBackendUrl(`/api/settings/professionals/${editingId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Profissional atualizado com sucesso");
          setProfessionals(professionals.map(p => p.id === editingId ? data.data : p));
          setShowModal(false);
        } else {
          toast.error(data.error || "Erro ao atualizar");
        }
      } else {
        const res = await fetch(getBackendUrl('/api/settings/professionals'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Profissional cadastrado com sucesso");
          setProfessionals([data.data, ...professionals]);
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
      const res = await fetch(getBackendUrl(`/api/settings/professionals/${deleteId}`), {
        method: 'DELETE',
        headers: { 'tenant-id': tenantId, ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profissional excluído");
        setProfessionals(professionals.filter(p => p.id !== deleteId));
      } else {
        toast.error(data.error || "Erro ao excluir");
      }
    } catch (e) {
      toast.error("Erro de conexão ao excluir");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <div className="text-center p-4 text-muted-foreground">Carregando profissionais...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Profissionais</h3>
          <p className="text-sm text-muted-foreground">Cadastre sua equipe, associe aos serviços que prestam e configure a agenda individual.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              professionals.length >= maxProfessionals ? 'border-red-300 text-red-600 bg-red-50' : 'border-border text-muted-foreground'
            }`}>
              {professionals.length}/{maxProfessionals} profissionais
            </span>
            <Button onClick={handleOpenNew} className="gap-2" disabled={professionals.length >= maxProfessionals}>
              <Plus className="w-4 h-4" /> {professionals.length >= maxProfessionals ? 'Limite atingido' : 'Novo Profissional'}
            </Button>
          </div>
          <div style={{ width: 100, height: 4, background: 'var(--border)', borderRadius: 999 }}>
            <div style={{ 
              width: `${Math.min((professionals.length / maxProfessionals) * 100, 100)}%`, 
              height: '100%', 
              background: professionals.length >= maxProfessionals ? '#ef4444' : '#f5a524', 
              borderRadius: 999, transition: 'width .3s' 
            }} />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {professionals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum profissional cadastrado.
            </div>
          ) : (
            <div className="divide-y">
              {professionals.map((prof) => {
                const profServices = services.filter(s => (prof.serviceIds || []).includes(s.id));
                return (
                  <div key={prof.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{prof.name}</span>
                        {!prof.isActive && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                        {prof.userId && <Badge variant="outline" className="text-xs border-primary text-primary">Conta Vinculada</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {profServices.length > 0 
                          ? profServices.map(s => s.name).join(', ') 
                          : "Nenhum serviço associado"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(prof)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(prof.id)}>
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
            <DialogDescription>Preencha os detalhes e associe os serviços atendidos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Profissional</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Dr. João Silva"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição / Especialidade</Label>
              <Input 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Especialista em..."
              />
            </div>

            <div className="space-y-2">
              <Label>Vincular Conta de Usuário (Opcional)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.userId}
                onChange={e => setFormData({ ...formData, userId: e.target.value })}
              >
                <option value="">Nenhuma</option>
                {team.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Isso permite que o profissional faça login e gerencie seus próprios agendamentos.</p>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <Label>Serviços Realizados</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                {services.length === 0 && <p className="text-xs text-muted-foreground col-span-2">Nenhum serviço cadastrado na aba Serviços.</p>}
                {services.map(svc => (
                  <label key={svc.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-input text-primary focus:ring-primary"
                      checked={formData.serviceIds.includes(svc.id)}
                      onChange={() => handleServiceToggle(svc.id)}
                    />
                    <span className="text-sm">{svc.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label>Ativo</Label>
              </div>
              <Switch 
                checked={formData.isActive}
                onCheckedChange={c => setFormData({ ...formData, isActive: c })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Profissional"
        description="Tem certeza que deseja excluir este profissional? Pode afetar agendamentos atrelados a ele."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
