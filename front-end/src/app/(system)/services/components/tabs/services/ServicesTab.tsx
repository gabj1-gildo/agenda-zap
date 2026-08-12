import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useServicesSettings } from "../../../hooks/useServicesSettings";
import { ServicesList } from "./ServicesList";
import { ServiceFormModal } from "./ServiceFormModal";

export function ServicesTab({ tenantId }: { tenantId: string }) {
  const {
    services,
    saving,
    showModal,
    setShowModal,
    editingId,
    deleteId,
    setDeleteId,
    formData,
    setFormData,
    formatCurrency,
    minsToTime,
    timeToMins,
    handleOpenNew,
    handleOpenEdit,
    handleSave,
    confirmDelete
  } = useServicesSettings(tenantId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Serviços Cadastrados</h3>
          <p className="text-sm text-muted-foreground">Gerencie os serviços e preços que a IA poderá agendar.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Serviço
        </Button>
      </div>

      <ServicesList 
        services={services} 
        minsToTime={minsToTime} 
        handleOpenEdit={handleOpenEdit} 
        setDeleteId={setDeleteId} 
      />

      <ServiceFormModal 
        showModal={showModal}
        setShowModal={setShowModal}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        formatCurrency={formatCurrency}
        timeToMins={timeToMins}
        minsToTime={minsToTime}
        handleSave={handleSave}
        saving={saving}
      />

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Serviço"
        description="Tem certeza que deseja excluir este serviço? A ação não pode ser desfeita."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
