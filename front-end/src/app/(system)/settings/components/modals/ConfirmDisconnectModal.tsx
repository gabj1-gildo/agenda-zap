import { ConfirmModal } from "@/components/ConfirmModal";

interface ConfirmDisconnectModalProps {
  instanceId: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDisconnectModal({ instanceId, onClose, onConfirm }: ConfirmDisconnectModalProps) {
  return (
    <ConfirmModal
      open={!!instanceId}
      onOpenChange={(open) => !open && onClose()}
      title="Remover Conexão WhatsApp"
      description="Tem certeza que deseja remover esta conexão? As mensagens automáticas pararão de ser enviadas para este número."
      onConfirm={onConfirm}
    />
  );
}
