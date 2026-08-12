import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ExceptionFormModal({
  showModal,
  setShowModal,
  editingId,
  formData,
  setFormData,
  handleSave,
  saving
}: {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  handleSave: () => void;
  saving: boolean;
}) {
  return (
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
  );
}
