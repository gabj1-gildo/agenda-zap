import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useExceptionsSettings } from "../../../hooks/useExceptionsSettings";
import { ExceptionsList } from "./ExceptionsList";
import { ExceptionFormModal } from "./ExceptionFormModal";

export function ExceptionsTab({ tenantId }: { tenantId: string }) {
  const {
    exceptions,
    saving,
    showModal,
    setShowModal,
    editingId,
    deleteId,
    setDeleteId,
    formData,
    setFormData,
    handleOpenNew,
    handleOpenEdit,
    handleSave,
    confirmDelete
  } = useExceptionsSettings(tenantId);

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
        <ExceptionsList 
          exceptions={exceptions} 
          handleOpenEdit={handleOpenEdit} 
          setDeleteId={setDeleteId} 
        />
      </div>

      <ExceptionFormModal 
        showModal={showModal}
        setShowModal={setShowModal}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
        saving={saving}
      />

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
