"use client";

import React, { useState, useMemo, CSSProperties, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import styles from "./Funil.module.css";
import {
  Search, SlidersHorizontal, Plus, ChevronRight, ChevronLeft,
  Filter, Zap, CheckCircle2, X, Loader2, RefreshCw
} from "lucide-react";
import { getBackendUrl } from "@/lib/api";

type StageKey = 'espera' | 'ia' | 'humano' | 'pagamento' | 'finalizado' | 'perdido';
type DBStage = 'espera' | 'atendimento_ia' | 'atendimento_humano' | 'aguardando_pagamento' | 'finalizado' | 'perdido';

interface Stage {
  key: StageKey;
  dbKey: DBStage;
  title: string;
  sub: string;
  color: string;
  rgb: string;
  light: string;
}

const STAGES: Stage[] = [
  { key: 'espera',     dbKey: 'espera',               title: 'Espera',        sub: 'Aguardando primeiro contato',  color: '#f5a524', rgb: '245,165,36',  light: '#ffd98f' },
  { key: 'ia',         dbKey: 'atendimento_ia',        title: 'Atend. IA',     sub: 'Em atendimento com IA',        color: '#8b5cf6', rgb: '139,92,246',  light: '#d3c4ff' },
  { key: 'humano',     dbKey: 'atendimento_humano',    title: 'Atend. Humano', sub: 'Atendimento com atendente',    color: '#3b82f6', rgb: '59,130,246',  light: '#bcd8ff' },
  { key: 'pagamento',  dbKey: 'aguardando_pagamento',  title: 'Aguard. Pagto', sub: 'Aguardando pagamento',         color: '#14b8a6', rgb: '20,184,166',  light: '#8ff0e2' },
  { key: 'finalizado', dbKey: 'finalizado',            title: 'Finalizado',    sub: 'Negócios concluídos',          color: '#22c55e', rgb: '34,197,94',   light: '#a6f0c0' },
  { key: 'perdido',    dbKey: 'perdido',               title: 'Perdido',       sub: 'Negócios não concluídos',      color: '#f43f5e', rgb: '244,63,94',   light: '#ffb8c4' },
];

interface LeadCard {
  id: string;
  name: string;
  phone: string;
  funnelStage: DBStage;
  status?: 'online';
  updatedAt?: string;
}

type Board = Record<StageKey, LeadCard[]>;

const emptyBoard: Board = { espera: [], ia: [], humano: [], pagamento: [], finalizado: [], perdido: [] };

function currency(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function initials(name?: string) {
  const clean = (name || '').replace(/[().]/g, '').trim();
  if (!clean) return '•';
  const parts = clean.split(' ').filter(Boolean);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export default function FunilPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;
  const tenantId = (session as any)?.tenantId;

  const [board, setBoard] = useState<Board>(emptyBoard);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<StageKey | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<StageKey | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Partial<Record<StageKey, boolean>>>({});
  const [showCompletedCards, setShowCompletedCards] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterOnline, setFilterOnline] = useState(false);
  const [filterStages, setFilterStages] = useState<StageKey[]>([]);
  const [showNewLead, setShowNewLead] = useState(false);
  const [stats, setStats] = useState({ total: 0, conversion: 0, inAttendance: 0, finalizados: 0 });

  // New lead form
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadStage, setNewLeadStage] = useState<DBStage>("espera");
  const [savingLead, setSavingLead] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const headers: any = {
        'tenant-id': tenantId,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(getBackendUrl('/api/funil'), { headers });
      const data = await res.json();
      if (data.success) {
        setBoard(data.data.board);
        setStats(data.data.stats);
      } else {
        toast.error('Erro ao carregar funil');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [tenantId, token]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalCards = useMemo(() => Object.values(board).reduce((a, b) => a + b.length, 0), [board]);

  const filteredBoard = useMemo(() => {
    let result = { ...board };
    if (filterOnline) {
      for (const key of Object.keys(result) as StageKey[]) {
        result[key] = result[key].filter(c => c.status === 'online');
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      for (const key of Object.keys(result) as StageKey[]) {
        result[key] = result[key].filter(c =>
          (c.name || '').toLowerCase().includes(q) || c.phone.includes(q)
        );
      }
    }
    return result;
  }, [board, search, filterOnline]);

  const scrollBoard = (dir: 'left' | 'right') => {
    boardRef.current?.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
  };

  const handleDragStart = (id: string, from: StageKey, e: React.DragEvent) => {
    setDraggedId(id);
    setDraggedFrom(from);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.target instanceof HTMLElement) e.target.classList.add(styles.dragging); }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) e.target.classList.remove(styles.dragging);
    setDraggedId(null);
    setDraggedFrom(null);
    setHoveredColumn(null);
  };

  const handleDrop = async (stageKey: StageKey, e: React.DragEvent) => {
    e.preventDefault();
    setHoveredColumn(null);
    if (!draggedId || !draggedFrom || draggedFrom === stageKey) return;

    const stage = STAGES.find(s => s.key === stageKey)!;
    const fromStage = STAGES.find(s => s.key === draggedFrom)!;

    // Optimistic update
    setBoard(prev => {
      const newBoard = { ...prev };
      const idx = newBoard[draggedFrom!].findIndex(c => c.id === draggedId);
      if (idx === -1) return prev;
      const [card] = newBoard[draggedFrom!].splice(idx, 1);
      card.funnelStage = stage.dbKey;
      newBoard[stageKey] = [...newBoard[stageKey], card];
      return { ...newBoard };
    });

    // Persist to backend
    try {
      const res = await fetch(getBackendUrl(`/api/funil/${draggedId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ funnelStage: stage.dbKey })
      });
      if (!res.ok) {
        toast.error('Erro ao mover lead');
        loadData(); // revert
      }
    } catch {
      toast.error('Erro de conexão');
      loadData();
    }
  };

  const handleCreateLead = async () => {
    if (!newLeadPhone.trim()) { toast.error('Telefone é obrigatório'); return; }
    setSavingLead(true);
    try {
      const res = await fetch(getBackendUrl('/api/clients'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': tenantId,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newLeadName || null, phone: newLeadPhone, funnelStage: newLeadStage })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Lead criado!');
        setShowNewLead(false);
        setNewLeadName(""); setNewLeadPhone(""); setNewLeadStage("espera");
        loadData();
      } else {
        toast.error(data.error || 'Erro ao criar lead');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setSavingLead(false);
    }
  };

  const renderCard = (stage: Stage, item: LeadCard, idx: number) => {
    const displayName = item.name === '.' || !item.name ? item.phone : item.name;
    const displaySub = item.name === '.' || !item.name ? 'Contato via WhatsApp' : item.phone;

    return (
      <div
        key={item.id}
        className={styles.card}
        draggable
        tabIndex={0}
        style={{ animationDelay: `${idx * 40}ms`, cursor: 'pointer' }}
        onDragStart={(e) => handleDragStart(item.id, stage.key, e)}
        onDragEnd={handleDragEnd}
        onClick={() => window.location.href = `/chats?clientId=${item.id}`}
      >
        <div className={styles.cardHead}>
          <div className={styles.avatar}>{initials(displayName)}</div>
          <div className={styles.cardInfo}>
            <div className={styles.cardName}>{displayName}</div>
            <div className={styles.cardSub}>{displaySub}</div>
          </div>
          {stage.key === 'ia' && (
            <span className={styles.iaChip}>
              <Zap style={{ width: 8, height: 8 }} fill="currentColor" />IA
            </span>
          )}
          <span className={styles.cardTime}>{timeAgo(item.updatedAt)}</span>
        </div>

        {stage.key === 'ia' && item.status === 'online' && (
          <div className={styles.cardMeta}>
            <span className={styles.statusLive}>
              <span className={styles.ring}></span>Online
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.content} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: 'var(--muted-foreground)' }} />
      </div>
    );
  }

  return (
    <div className={styles.content}>
      {/* New Lead Dialog */}
      {showNewLead && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24, width: 360,
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Novo Lead</h3>
              <button onClick={() => setShowNewLead(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>NOME (opcional)</label>
                <input
                  value={newLeadName}
                  onChange={e => setNewLeadName(e.target.value)}
                  placeholder="Ex: João Silva"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>TELEFONE *</label>
                <input
                  value={newLeadPhone}
                  onChange={e => setNewLeadPhone(e.target.value)}
                  placeholder="+55 (38) 99999-0000"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>ESTÁGIO INICIAL</label>
                <select
                  value={newLeadStage}
                  onChange={e => setNewLeadStage(e.target.value as DBStage)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                >
                  {STAGES.map(s => (
                    <option key={s.dbKey} value={s.dbKey}>{s.title}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateLead}
                disabled={savingLead}
                style={{
                  marginTop: 4, padding: '10px', borderRadius: 10, border: 'none',
                  background: '#3b82f6', color: '#fff', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                {savingLead ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: 14, height: 14 }} />}
                {savingLead ? 'Criando...' : 'Criar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <div className={styles.ic} style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z"/></svg>
          </div>
          <div>
            <div className={styles.label}>Ativos no funil</div>
            <div className={styles.value}>
              {board.espera.length + board.ia.length + board.humano.length + board.pagamento.length}
            </div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.ic} style={{ background: 'rgba(34,197,94,.14)', color: '#22c55e' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
          </div>
          <div>
            <div className={styles.label}>Conversão</div>
            <div className={styles.value}>{stats.conversion}%</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.ic} style={{ background: 'rgba(59,130,246,.14)', color: '#3b82f6' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div>
            <div className={styles.label}>Em atendimento</div>
            <div className={styles.value}>{stats.inAttendance}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.ic} style={{ background: 'rgba(34,197,94,.10)', color: '#16a34a' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className={styles.label}>Finalizados</div>
            <div className={styles.value}>{board.finalizado?.length ?? stats.finalizados}</div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className={styles.statActions}>
        {/* Search */}
        <div className={styles.searchInline}>
          <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar leads…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', flex: 1 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex' }}>
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        {/* Filtros */}
        <div style={{ position: 'relative' }}>
          <button
            className={styles.btn}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            style={filterOnline ? { borderColor: 'var(--violet)', color: 'var(--violet)' } : {}}
          >
            <SlidersHorizontal style={{ width: 14, height: 14 }} />
            Filtros {filterOnline && <span style={{ background: 'var(--violet)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>}
          </button>
          {isFilterOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: 14, zIndex: 20, minWidth: 200,
              boxShadow: '0 8px 24px rgba(0,0,0,.15)'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Status</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', marginBottom: 8 }}>
                <input type="checkbox" checked={filterOnline} onChange={e => setFilterOnline(e.target.checked)} />
                Online agora
              </label>
              <button
                onClick={() => { setFilterOnline(false); setIsFilterOpen(false); }}
                style={{ fontSize: 11, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        <button className={styles.btn} onClick={loadData}>
          <RefreshCw style={{ width: 14, height: 14 }} />
          Atualizar
        </button>

        <button
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', transition: 'background .15s' }}
          onClick={() => setShowNewLead(true)}
          onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
          onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}
        >
          <Plus style={{ width: 14, height: 14 }} />
          Novo Lead
        </button>
      </div>

      {/* Flow Bar */}
      <div className={styles.flowbarShell}>
        <div className={styles.flowbarTop}>
          <span className={styles.label}>Distribuição do funil</span>
          <span className={styles.total}><b>{totalCards}</b> leads no total</span>
        </div>
        <div className={styles.flowbar}>
          {STAGES.map(s => {
            const count = board[s.key].length;
            return (
              <div key={s.key} className={styles.seg} style={{ background: s.color, flexGrow: count > 0 ? count : 0.001 }} />
            );
          })}
        </div>
        <div className={styles.flowLegend}>
          {STAGES.map(s => (
            <div key={s.key} className={styles.item}>
              <span className={styles.dot} style={{ background: s.color }}></span>
              {s.title} <b>{board[s.key].length}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Board */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => scrollBoard('left')} className={styles.scrollArrow} style={{ left: -10 }}>
          <ChevronLeft />
        </button>
        <button onClick={() => scrollBoard('right')} className={styles.scrollArrow} style={{ right: -10 }}>
          <ChevronRight />
        </button>

        <div className={styles.board} ref={boardRef}>
          {STAGES.map((stage, i) => {
            const items = filteredBoard[stage.key];

            return (
              <React.Fragment key={stage.key}>
                {i > 0 && (
                  <div className={styles.connector} style={{ '--seg-a': STAGES[i-1].color, '--seg-b': stage.color } as CSSProperties}>
                    <span className={styles.dot}></span>
                  </div>
                )}

                <div
                  className={`${styles.column} ${hoveredColumn === stage.key ? styles.dragOver : ''}`}
                  style={{
                    '--seg': stage.color,
                    '--seg-soft': `rgba(${stage.rgb},.14)`,
                    '--seg-line': `rgba(${stage.rgb},.45)`,
                    '--seg-light': stage.light
                  } as CSSProperties}
                  onDragOver={e => { e.preventDefault(); if (hoveredColumn !== stage.key) setHoveredColumn(stage.key); }}
                  onDragLeave={() => setHoveredColumn(null)}
                  onDrop={e => handleDrop(stage.key, e)}
                >
                  <div className={styles.colHead}>
                    <div className={styles.colTitle}>
                      <div className={styles.t}><span>{stage.title.toUpperCase()}</span></div>
                      <div className={styles.sub}>{stage.sub}</div>
                    </div>
                    <div className={styles.badge}>{items.length}</div>
                  </div>

                  <div className={styles.colBody}>
                    {stage.key === 'finalizado' && !showCompletedCards ? (
                      <div className={styles.celebrate}>
                        <div className={styles.ringIcon}>
                          <span className={styles.spark} style={{ top: '-2px', left: '4px', animationDelay: '.2s' }}>
                            <Zap fill="currentColor" width={10} height={10} />
                          </span>
                          <span className={styles.spark} style={{ bottom: '0', right: '-4px', animationDelay: '.9s' }}>
                            <Zap fill="currentColor" width={10} height={10} />
                          </span>
                          <div className={styles.check}>
                            <CheckCircle2 width={18} height={18} color="#fff" />
                          </div>
                        </div>
                        <h4>Parabéns!</h4>
                        <p>{items.length} negócios concluídos</p>
                      </div>
                    ) : items.length === 0 ? (
                      <div className={styles.empty}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{width: 20, height: 20, opacity: 0.5}}><path d="M12 3v18M3 12h18"/></svg>
                        <p>Arraste um card para cá.</p>
                      </div>
                    ) : (
                      (expandedColumns[stage.key] ? items : items.slice(0, 5)).map((item, idx) => renderCard(stage, item, idx))
                    )}
                  </div>

                  <div className={styles.colFoot}>
                    {stage.key === 'finalizado' ? (
                      <button onClick={() => setShowCompletedCards(!showCompletedCards)}>
                        {showCompletedCards ? 'Ver painel' : `Ver todos (${items.length})`} <ChevronRight />
                      </button>
                    ) : items.length > 5 ? (
                      <button onClick={() => setExpandedColumns(prev => ({ ...prev, [stage.key]: !prev[stage.key] }))}>
                        {expandedColumns[stage.key] ? 'Mostrar menos' : `Ver todos (${items.length})`} <ChevronRight style={{ transform: expandedColumns[stage.key] ? 'rotate(-90deg)' : 'none' }} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
