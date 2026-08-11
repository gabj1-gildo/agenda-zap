"use client";

import { useState } from "react";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Edit2, Plus, Search, BookMarked } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import Link from "next/link";

interface ClientsClientProps {
  tenantId: string;
  token: string;
  initialClients: any[];
  availablePlans: any[];
}

export function ClientsClient({ tenantId, token, initialClients, availablePlans }: ClientsClientProps) {
  const [clients, setClients] = useState<any[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", status: "Ativo" });
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [isSubsModalOpen, setIsSubsModalOpen] = useState(false);
  const [selectedClientForSubs, setSelectedClientForSubs] = useState<any>(null);
  const [clientSubs, setClientSubs] = useState<any[]>([]);
  const [selectedPlanToAssign, setSelectedPlanToAssign] = useState("");
  const [assigningPlan, setAssigningPlan] = useState(false);

  // Background fetch to ensure list is updated if needed
  const fetchClients = async () => {
    try {
      const res = await fetch(getBackendUrl(`/api/dashboard/clients?tenantId=${tenantId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (e) {
      toast.error("Erro ao recarregar clientes.");
    }
  };

  const openSubsModal = async (client: any) => {
    setSelectedClientForSubs(client);
    setIsSubsModalOpen(true);
    try {
      const res = await fetch(getBackendUrl(`/api/dashboard/clients/${client.id}/subscriptions`), {
        headers: { "tenant-id": tenantId, Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setClientSubs(data.data);
      }
    } catch (e) {
      toast.error("Erro ao carregar assinaturas.");
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedPlanToAssign) return toast.error("Selecione um plano.");
    setAssigningPlan(true);
    try {
      const res = await fetch(getBackendUrl(`/api/dashboard/clients/${selectedClientForSubs.id}/subscriptions`), {
        method: "POST",
        headers: { "Content-Type": "application/json", "tenant-id": tenantId, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: selectedPlanToAssign })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Plano vinculado com sucesso!");
        openSubsModal(selectedClientForSubs); // Reload subs
        setSelectedPlanToAssign("");
      } else {
        toast.error(data.error || "Erro ao vincular plano.");
      }
    } catch (e) {
      toast.error("Erro na conexão.");
    } finally {
      setAssigningPlan(false);
    }
  };

  const openNewModal = () => {
    setEditingClient(null);
    setFormData({ name: "", phone: "", status: "Ativo" });
    setIsModalOpen(true);
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setFormData({ name: client.name || "", phone: client.phone || "", status: client.status || "Ativo" });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.phone) return toast.error("O telefone é obrigatório.");
    setSaving(true);
    try {
      const url = editingClient
        ? getBackendUrl(`/api/dashboard/clients/${editingClient.id}`)
        : getBackendUrl(`/api/dashboard/clients`);
      const method = editingClient ? "PUT" : "POST";

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
        toast.success(editingClient ? "Cliente atualizado!" : "Cliente cadastrado!");
        setIsModalOpen(false);
        fetchClients();
      } else {
        toast.error(data.error || "Erro ao salvar cliente.");
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
      const res = await fetch(getBackendUrl(`/api/dashboard/clients/${deleteId}`), {
        method: "DELETE",
        headers: {
          "tenant-id": tenantId,
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cliente excluído.");
        fetchClients();
      } else {
        toast.error(data.error || "Erro ao excluir.");
      }
    } catch (e) {
      toast.error("Erro na conexão.");
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateString));
  };

  const filteredClients = clients.filter(c => 
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone || "").includes(searchTerm)
  );

  return (
    <div className="space-y-8 pb-10 mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie a base de clientes do seu estabelecimento.</p>
        </div>
        <Button onClick={openNewModal}><Plus className="w-4 h-4 mr-2"/> Novo Cliente</Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-2 max-w-sm">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou telefone..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone / WhatsApp</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client: any) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-primary">
                      <Link href={`/clients/${client.id}`} className="hover:underline">
                        {client.name || "Sem nome"}
                      </Link>
                    </TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={client.status === "Ativo" ? "bg-green-600" : "bg-gray-500"}>
                        {client.status || "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openSubsModal(client)} title="Ver Assinaturas">
                        <BookMarked className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => openEditModal(client)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => setDeleteId(client.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
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
            <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
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
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubsModalOpen} onOpenChange={setIsSubsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinaturas de {selectedClientForSubs?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Assinaturas Vigentes</Label>
              {clientSubs.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Início</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientSubs.map(sub => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.plan?.name}</TableCell>
                          <TableCell>
                            <Badge className={sub.status === "ACTIVE" ? "bg-green-600" : "bg-gray-500"}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(sub.startDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-4 rounded-md text-center">Nenhuma assinatura ativa encontrada para este cliente.</p>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Vincular a um Novo Plano (Manual)</Label>
              <div className="flex gap-2">
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={selectedPlanToAssign} 
                  onChange={(e) => setSelectedPlanToAssign(e.target.value)}
                >
                  <option value="">Selecione um plano...</option>
                  {availablePlans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} - R$ {Number(plan.price).toFixed(2)}</option>
                  ))}
                </select>
                <Button onClick={handleAssignPlan} disabled={assigningPlan || !selectedPlanToAssign}>
                  {assigningPlan ? "Vinculando..." : "Vincular"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSubsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? O histórico de chats também será apagado."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
