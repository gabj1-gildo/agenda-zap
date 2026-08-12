import React from "react";
import { X, Loader2, Plus } from "lucide-react";
import { DBStage, STAGES } from "../types/funil";

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLeadName: string;
  setNewLeadName: (v: string) => void;
  newLeadPhone: string;
  setNewLeadPhone: (v: string) => void;
  newLeadStage: DBStage;
  setNewLeadStage: (v: DBStage) => void;
  handleCreateLead: () => void;
  savingLead: boolean;
}

export function NewLeadModal({
  isOpen,
  onClose,
  newLeadName,
  setNewLeadName,
  newLeadPhone,
  setNewLeadPhone,
  newLeadStage,
  setNewLeadStage,
  handleCreateLead,
  savingLead
}: NewLeadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[100] flex items-center justify-center">
      <div className="bg-[var(--surface)] rounded-[16px] p-[24px] w-[360px] border border-[var(--border)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between mb-[20px]">
          <h3 className="font-display text-[15px] font-bold m-0 tracking-tight">Novo Lead</h3>
          <button 
            onClick={onClose} 
            className="bg-transparent border-none cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-[16px] h-[16px]" />
          </button>
        </div>
        <div className="flex flex-col gap-[12px]">
          <div>
            <label className="text-[11px] font-semibold text-[var(--muted-foreground)] block mb-[4px] uppercase tracking-wider">NOME (opcional)</label>
            <input
              value={newLeadName}
              onChange={e => setNewLeadName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full p-[8px_12px] rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-[13px] outline-none transition-colors focus:border-[var(--violet-line)] focus:bg-[var(--surface-3)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[var(--muted-foreground)] block mb-[4px] uppercase tracking-wider">TELEFONE *</label>
            <input
              value={newLeadPhone}
              onChange={e => setNewLeadPhone(e.target.value)}
              placeholder="+55 (38) 99999-0000"
              className="w-full p-[8px_12px] rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-[13px] outline-none transition-colors focus:border-[var(--violet-line)] focus:bg-[var(--surface-3)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[var(--muted-foreground)] block mb-[4px] uppercase tracking-wider">ESTÁGIO INICIAL</label>
            <select
              value={newLeadStage}
              onChange={e => setNewLeadStage(e.target.value as DBStage)}
              className="w-full p-[8px_12px] rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-[13px] outline-none transition-colors focus:border-[var(--violet-line)] focus:bg-[var(--surface-3)]"
            >
              {STAGES.map(s => (
                <option key={s.dbKey} value={s.dbKey}>{s.title}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreateLead}
            disabled={savingLead}
            className="mt-[4px] p-[10px] rounded-[10px] border-none bg-[#3b82f6] text-white font-bold text-[13px] cursor-pointer flex items-center justify-center gap-[6px] transition-colors hover:bg-[#2563eb] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {savingLead ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Plus className="w-[14px] h-[14px]" />}
            {savingLead ? 'Criando...' : 'Criar Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
