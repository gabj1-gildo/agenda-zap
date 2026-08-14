"use client";

import { useState, useEffect } from "react";
import { useClients } from "../hooks/useClients";
import { getBackendUrl } from "@/lib/api";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ClientsHeader } from "./ClientsHeader";
import { ClientsTable } from "./ClientsTable";
import { ClientFormModal } from "./ClientFormModal";
import { ClientSubsModal } from "./ClientSubsModal";

interface ClientsWrapperProps {
  tenantId: string;
  token: string;
}

export function ClientsWrapper({ tenantId, token }: ClientsWrapperProps) {
  const { clients, isLoading, mutate } = useClients(tenantId);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  const [isSubsModalOpen, setIsSubsModalOpen] = useState(false);
  const [subsClient, setSubsClient] = useState<any>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch plans once
    fetch(getBackendUrl(`/api/tenant-plans?tenantId=${tenantId}`), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setAvailablePlans(data.data);
      })
      .catch(err => console.error("Error fetching plans:", err));
  }, [tenantId, token]);

  const searchLower = searchTerm.toLowerCase().trim();
  const normalizedSearch = searchLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredClients = clients.filter((c: any) => {
    const name = (c.name || "").toLowerCase();
    const normalizedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const phone = String(c.phone || "").toLowerCase();
    
    return normalizedName.includes(normalizedSearch) || phone.includes(searchLower);
  });

  const openNewModal = () => {
    setEditingClient(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setIsFormModalOpen(true);
  };

  const openSubsModal = (client: any) => {
    setSubsClient(client);
    setIsSubsModalOpen(true);
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
        mutate();
      } else {
        toast.error(data.error || "Erro ao excluir.");
      }
    } catch (e) {
      toast.error("Erro na conexão.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8 pb-10 mt-8">
      <ClientsHeader 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onOpenNewModal={openNewModal} 
      />

      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <ClientsTable 
          clients={filteredClients}
          isLoading={isLoading}
          onOpenSubsModal={openSubsModal}
          onOpenEditModal={openEditModal}
          onDeleteClient={(id) => setDeleteId(id)}
        />
      </div>

      <ClientFormModal 
        isOpen={isFormModalOpen} 
        onOpenChange={setIsFormModalOpen} 
        client={editingClient} 
        tenantId={tenantId} 
        token={token}
        onSuccess={() => mutate()}
      />

      <ClientSubsModal 
        isOpen={isSubsModalOpen} 
        onOpenChange={setIsSubsModalOpen} 
        client={subsClient} 
        tenantId={tenantId} 
        token={token} 
        availablePlans={availablePlans}
      />

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
