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

export function ServiceFormModal({
  showModal,
  setShowModal,
  editingId,
  formData,
  setFormData,
  formatCurrency,
  timeToMins,
  minsToTime,
  handleSave,
  saving
}: {
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  formatCurrency: (val: string) => string;
  timeToMins: (val: string) => number;
  minsToTime: (val: number) => string;
  handleSave: () => void;
  saving: boolean;
}) {
  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          <DialogDescription>Preencha os detalhes do serviço abaixo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Serviço</Label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Corte de Cabelo"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Input 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Descreva detalhes do serviço para a IA usar como referência"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
                <Input 
                  className="pl-8"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: formatCurrency(e.target.value) })}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duração</Label>
              <Input 
                type="time"
                value={minsToTime(Number(formData.durationMinutes))}
                onChange={e => setFormData({ ...formData, durationMinutes: timeToMins(e.target.value).toString() })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>Serviço Ativo</Label>
              <p className="text-xs text-muted-foreground">Serviços inativos não são oferecidos pela IA.</p>
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
  );
}
