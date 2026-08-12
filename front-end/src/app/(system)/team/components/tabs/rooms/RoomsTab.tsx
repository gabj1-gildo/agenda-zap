import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash, Edit } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRoomsSettings } from "../../../hooks/useRoomsSettings";

export function RoomsTab({ tenantId }: { tenantId: string }) {
  const {
    rooms,
    loading,
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
  } = useRoomsSettings(tenantId);

  if (loading) return <div className="text-center p-4 text-muted-foreground">Carregando salas...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Consultórios e Salas</h3>
          <p className="text-sm text-muted-foreground">Gerencie os espaços físicos onde ocorrem os agendamentos.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Sala
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma sala cadastrada.
            </div>
          ) : (
            <div className="divide-y">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{room.name}</span>
                      {!room.isActive && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span>Capacidade: {room.capacity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(room)}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(room.id)}>
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Sala" : "Nova Sala"}</DialogTitle>
            <DialogDescription>Defina o nome do ambiente de atendimento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Sala/Consultório</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Consultório 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidade</Label>
              <Input 
                type="number"
                min="1"
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Ex: 1"
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
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
        title="Excluir Sala"
        description="Tem certeza que deseja excluir esta sala? Pode afetar agendamentos atrelados a ela."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
