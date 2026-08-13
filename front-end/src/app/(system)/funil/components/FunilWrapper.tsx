"use client";

import React, { useState, useRef } from "react";
import { StageKey, DBStage, STAGES } from "../types/funil";
import { useFunil } from "../hooks/useFunil";

import { FunilHeader } from "./FunilHeader";
import { FunilBoard } from "./FunilBoard";
import { FunilColumn } from "./FunilColumn";
import { FunilCard } from "./FunilCard";
import { NewLeadModal } from "./NewLeadModal";

interface FunilWrapperProps {
  tenantId: string;
  token: string;
}

export function FunilWrapper({ tenantId, token }: FunilWrapperProps) {
  const { board, stats, isLoading, mutate, moveLeadOptimistic } = useFunil(tenantId);

  const [search, setSearch] = useState('');
  const [filterOnline, setFilterOnline] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ id: string; from: StageKey } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageKey | null>(null);
  const [showCompletedCards, setShowCompletedCards] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadStage, setNewLeadStage] = useState<DBStage>('atendimento_ia');
  const [savingLead, setSavingLead] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (id: string, from: StageKey, e: React.DragEvent) => {
    setDraggedItem({ id, from });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (stageKey: StageKey, e: React.DragEvent) => {
    e.preventDefault();
    if (stageKey !== dragOverStage) setDragOverStage(stageKey);
  };

  const handleDragLeave = (stageKey: StageKey, e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverStage === stageKey) setDragOverStage(null);
  };

  const handleDrop = async (stageKey: StageKey, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedItem || draggedItem.from === stageKey) return;

    const toDbKey = STAGES.find(s => s.key === stageKey)?.dbKey;
    if (!toDbKey) return;
    
    await moveLeadOptimistic(draggedItem.id, draggedItem.from, stageKey, toDbKey);
    setDraggedItem(null);
  };

  const handleScroll = (dir: 'left' | 'right') => {
    if (boardRef.current) {
      const scrollAmount = 300;
      boardRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCreateLead = async () => {
    if (!newLeadPhone) {
      alert("Telefone é obrigatório!");
      return;
    }
    setSavingLead(true);
    try {
      const res = await fetch('/api/funil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          'Authorization': `Bearer ${token}`, 'x-authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newLeadName, phone: newLeadPhone, funnelStage: newLeadStage })
      });
      if (res.ok) {
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadStage('atendimento_ia');
        setIsModalOpen(false);
        mutate();
      } else {
        alert("Erro ao criar lead.");
      }
    } catch (e) {
      alert("Erro ao criar lead.");
    } finally {
      setSavingLead(false);
    }
  };

  const getFilteredItems = (stageKey: StageKey) => {
    let items = board[stageKey] || [];
    if (filterOnline) items = items.filter(it => it.status === 'online');
    if (search) {
      const lowerSearch = search.toLowerCase();
      items = items.filter(it => 
        (it.name && it.name.toLowerCase().includes(lowerSearch)) || 
        it.phone.includes(search)
      );
    }
    return items;
  };

  if (isLoading && Object.values(board).every(arr => arr.length === 0)) {
    return (
      <div className="flex-1 bg-[var(--background)] p-[28px] overflow-hidden flex flex-col items-center justify-center">
        <div className="w-[32px] h-[32px] border-[3px] border-[var(--border)] border-t-[var(--violet)] rounded-full animate-spin"></div>
        <p className="mt-[16px] text-[13px] text-[var(--muted-foreground)]">Carregando funil...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[var(--background)] p-[28px] overflow-hidden flex flex-col font-sans transition-colors duration-300">
      <FunilHeader 
        stats={stats}
        search={search}
        setSearch={setSearch}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        filterOnline={filterOnline}
        setFilterOnline={setFilterOnline}
        onRefresh={() => mutate()}
        onNewLead={() => setIsModalOpen(true)}
      />

      <FunilBoard 
        boardRef={boardRef}
        totalCards={stats.total}
        stages={STAGES}
        onScroll={handleScroll}
      >
        {STAGES.map(stage => {
          const stageItems = getFilteredItems(stage.key);
          return (
            <FunilColumn
              key={stage.key}
              stage={stage}
              isDragOver={dragOverStage === stage.key}
              isExpanded={true}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              count={stageItems.length}
              showCompletedCards={showCompletedCards}
            >
              {stageItems.map(item => (
                <FunilCard 
                  key={item.id}
                  item={item}
                  stageKey={stage.key}
                  stageDbKey={stage.dbKey}
                  onDragStart={handleDragStart}
                />
              ))}
            </FunilColumn>
          );
        })}
      </FunilBoard>

      <NewLeadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newLeadName={newLeadName}
        setNewLeadName={setNewLeadName}
        newLeadPhone={newLeadPhone}
        setNewLeadPhone={setNewLeadPhone}
        newLeadStage={newLeadStage}
        setNewLeadStage={setNewLeadStage}
        handleCreateLead={handleCreateLead}
        savingLead={savingLead}
      />
    </div>
  );
}
