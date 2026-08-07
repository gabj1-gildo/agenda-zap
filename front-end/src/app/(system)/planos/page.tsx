"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Edit2, Plus, Search } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function PlanosPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session as any)?.tenantId;

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", type: "RECURRING", durationDays: "", price: "", maxInstallments: "1", interestAbsorption: "BUYER" });
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(getBackendUrl(`/api/tenant-plans?tenantId=${tenantId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (e) {
      toast.error("Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && tenantId) {
      fetchPlans();
    }
  }, [token, tenantId]);

  const openNewModal = () => {
    setEditingPlan(null);
    setFormData({ name: "", description: "", type: "RECURRING", durationDays: "", price: "", maxInstallments: "1", interestAbsorption: "BUYER" });
    setIsModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    setFormData({ 
      name: plan.name || "", 
      description: plan.description || "", 
      type: plan.type || "RECURRING", 
      durationDays: plan.durationDays?.toString() || "", 
      price: plan.price?.toString() || "",
      maxInstallments: plan.maxInstallments?.toString() || "1",
      interestAbsorption: plan.interestAbsorption || "BUYER"
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) return toast.error("Nome e Preço são obrigatórios.");
    setSaving(true);
    try {
      const url = editingPlan
        ? getBackendUrl(`/api/tenant-plans/${editingPlan.id}`)
        : getBackendUrl(`/api/tenant-plans`);
      const method = editingPlan ? "PUT" : "POST";

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
        toast.success(editingPlan ? "Plano atualizado!" : "Plano cadastrado!");
        setIsModalOpen(false);
        fetchPlans();
      } else {
        toast.error(data.error || "Erro ao salvar plano.");
      }
    } catch (e) {
      toast.error("Erro na conexão.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(getBackendUrl(`/api/tenant-plans/${deleteId}`), {
        method: "DELETE",
        headers: {
          "tenant-id": tenantId,
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Plano excluído.");
        fetchPlans();
      } else {
        toast.error(data.error || "Erro ao excluir.");
      }
    } catch (e) {
      toast.error("Erro na conexão.");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredPlans = plans.filter(p => 
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Planos e Assinaturas</h1>
          <p className="text-muted-foreground mt-1">Crie planos para vender aos seus clientes via IA.</p>
        </div>
        <Button onClick={openNewModal}><Plus className="w-4 h-4 mr-2"/> Novo Plano</Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-2 max-w-sm">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar plano..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Duração (Dias)</TableHead>
                <TableHead>Preço (R$)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              ) : filteredPlans.length > 0 ? (
                filteredPlans.map((plan: any) => (
                  <TableRow key={plan.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-primary">
                      {plan.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.type === 'RECURRING' ? 'Recorrente' : 'Produto/Venda Única'}</Badge>
                    </TableCell>
                    <TableCell>{plan.durationDays || "-"}</TableCell>
                    <TableCell>R$ {Number(plan.price).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openEditModal(plan)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => setDeleteId(plan.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum plano encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Plano</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Ex: Assinatura Mensal VIP" 
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (Opcional)</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="Ex: Acesso a todos os serviços" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="RECURRING">Recorrente (Assinatura)</option>
                  <option value="SINGLE">Venda Única (Produto)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Duração em Dias</Label>
                <Input 
                  type="number"
                  value={formData.durationDays} 
                  onChange={(e) => setFormData({...formData, durationDays: e.target.value})} 
                  placeholder="Ex: 30" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input 
                type="number" step="0.01"
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                placeholder="0.00" 
              />
            </div>
            {formData.type === "SINGLE" && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-2">
                <div className="space-y-2">
                  <Label>Parcelamento Máx.</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.maxInstallments} 
                    onChange={(e) => setFormData({...formData, maxInstallments: e.target.value})}
                  >
                    <option value="1">À vista (1x)</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                    <option value="4">4x</option>
                    <option value="5">5x</option>
                    <option value="6">6x</option>
                    <option value="10">10x</option>
                    <option value="12">12x</option>
                  </select>
                </div>
                {formData.maxInstallments !== "1" && (
                  <div className="space-y-2">
                    <Label>Juros do Parcelamento</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={formData.interestAbsorption} 
                      onChange={(e) => setFormData({...formData, interestAbsorption: e.target.value})}
                    >
                      <option value="BUYER">Cliente Paga (Repassado)</option>
                      <option value="SELLER">Lojista Absorve (Sem Juros)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Plano"
        description="Tem certeza que deseja excluir este plano? Clientes vinculados a ele não perderão o acesso imediatamente, mas ele não será mais oferecido."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
