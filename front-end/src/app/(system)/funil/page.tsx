"use client";

import React, { useState, useMemo, CSSProperties } from "react";
import { useTheme } from "next-themes";
import styles from "./Funil.module.css";
import { 
  Search, Bell, SlidersHorizontal, Plus, ChevronRight, Moon, Sun, Filter, Contact, MessageSquare, Megaphone, CheckCircle2, Zap, CreditCard, CalendarDays
} from "lucide-react";

type StageKey = 'espera' | 'ia' | 'humano' | 'pagamento' | 'finalizado' | 'perdido';

interface Stage {
  key: StageKey;
  title: string;
  sub: string;
  color: string;
  rgb: string;
  light: string;
}

const STAGES: Stage[] = [
  { key: 'espera', title: 'Espera', sub: 'Aguardando primeiro contato', color: '#f5a524', rgb: '245,165,36', light: '#ffd98f' },
  { key: 'ia', title: 'Atendimento IA', sub: 'Em atendimento com IA', color: '#8b5cf6', rgb: '139,92,246', light: '#d3c4ff' },
  { key: 'humano', title: 'Atend. Humano', sub: 'Atendimento com atendente', color: '#3b82f6', rgb: '59,130,246', light: '#bcd8ff' },
  { key: 'pagamento', title: 'Aguard. Pagto', sub: 'Aguardando pagamento', color: '#14b8a6', rgb: '20,184,166', light: '#8ff0e2' },
  { key: 'finalizado', title: 'Finalizado', sub: 'Negócios concluídos', color: '#22c55e', rgb: '34,197,94', light: '#a6f0c0' },
  { key: 'perdido', title: 'Perdido', sub: 'Negócios não concluídos', color: '#f43f5e', rgb: '244,63,94', light: '#ffb8c4' },
];

interface LeadCard {
  id: string;
  name: string;
  phone: string;
  time?: string;
  status?: 'online' | 'typing';
  agent?: string;
  value?: number;
  reason?: string;
}

const initialBoard: Record<StageKey, LeadCard[]> = {
  espera: [
    { id: 'c1', name: '.', phone: '+55 (41) 9626-4555', time: 'há 2h' },
    { id: 'c2', name: 'Luiz Eduardo', phone: '+55 (38) 9269-5410', time: 'há 4h' },
    { id: 'c3', name: 'GKL Systems', phone: '+55 (38) 9805-1939', time: 'há 6h' },
    { id: 'c4', name: 'teste 123', phone: '+55 (38) 9 9104-6845', time: 'há 1d' },
  ],
  ia: [
    { id: 'c5', name: 'Kauan', phone: '+55 (38) 9898-2897', status: 'online' },
    { id: 'c6', name: 'Gildo', phone: '+55 (38) 9104-6845', status: 'typing' },
    { id: 'c7', name: 'Júnior (Brasil Terra)', phone: '+55 (38) 9738-1090', status: 'online' },
  ],
  humano: [
    { id: 'c8', name: 'Maria Santos', phone: '+55 (38) 9123-4567', agent: 'Lucas', time: 'há 5m' },
    { id: 'c9', name: 'João Silva', phone: '+55 (38) 9999-8888', agent: 'Ana', time: 'há 12m' },
  ],
  pagamento: [
    { id: 'c10', name: 'Empresa ABC', phone: '+55 (38) 9555-7777', value: 450, time: 'há 30m' },
    { id: 'c11', name: 'Construtora XYZ', phone: '+55 (38) 9444-6666', value: 1200, time: 'há 1h' },
  ],
  finalizado: [
    { id: 'f1', name: 'Finalizado 1', phone: '', value: 1200 }, 
    { id: 'f2', name: 'Finalizado 2', phone: '', value: 900 }, 
    { id: 'f3', name: 'Finalizado 3', phone: '', value: 1500 }, 
    { id: 'f4', name: 'Finalizado 4', phone: '', value: 800 },
    { id: 'f5', name: 'Finalizado 5', phone: '', value: 2000 }, 
    { id: 'f6', name: 'Finalizado 6', phone: '', value: 1100 }, 
    { id: 'f7', name: 'Finalizado 7', phone: '', value: 1700 }, 
    { id: 'f8', name: 'Finalizado 8', phone: '', value: 1600 },
  ],
  perdido: [
    { id: 'p1', name: 'Cliente não respondeu', phone: '+55 (38) 9000-0000', reason: 'sem interesse', time: 'há 2d' },
  ]
};

function currency(n: number) { 
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }); 
}

function initials(name?: string) {
  const clean = (name || '').replace(/[().]/g, '').trim();
  if (!clean) return '•';
  const parts = clean.split(' ').filter(Boolean);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export default function FunilPage() {
  const { theme, setTheme } = useTheme();
  const [board, setBoard] = useState(initialBoard);
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<StageKey | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<StageKey | null>(null);
  
  const [badgeCounters, setBadgeCounters] = useState<Record<StageKey, number>>({
    espera: 0, ia: 0, humano: 0, pagamento: 0, finalizado: 0, perdido: 0
  });

  const totalCards = useMemo(() => {
    let t = 0;
    for (const key of Object.keys(board)) {
      t += board[key as StageKey].length;
    }
    return t;
  }, [board]);

  const stats = useMemo(() => {
    const conv = totalCards ? Math.round((board.finalizado.length / totalCards) * 1000) / 10 : 0;
    const atend = board.ia.length + board.humano.length;
    const fat = board.pagamento.reduce((a, b) => a + (b.value || 0), 0) + 
                board.finalizado.reduce((a, b) => a + (b.value || 0), 0);
    return { conv, atend, fat };
  }, [board, totalCards]);

  const filteredBoard = useMemo(() => {
    if (!search.trim()) return board;
    const q = search.toLowerCase();
    const result = { ...board };
    for (const key of Object.keys(result) as StageKey[]) {
      result[key] = result[key].filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.includes(q) ||
        (c.agent && c.agent.toLowerCase().includes(q))
      );
    }
    return result;
  }, [board, search]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleDragStart = (id: string, from: StageKey, e: React.DragEvent) => {
    setDraggedId(id);
    setDraggedFrom(from);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (e.target instanceof HTMLElement) e.target.classList.add(styles.dragging);
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) e.target.classList.remove(styles.dragging);
    setDraggedId(null);
    setDraggedFrom(null);
    setHoveredColumn(null);
  };

  const handleDragOver = (stageKey: StageKey, e: React.DragEvent) => {
    e.preventDefault();
    if (hoveredColumn !== stageKey) setHoveredColumn(stageKey);
  };

  const handleDragLeave = () => {
    setHoveredColumn(null);
  };

  const handleDrop = (stageKey: StageKey, e: React.DragEvent) => {
    e.preventDefault();
    setHoveredColumn(null);
    if (!draggedId || !draggedFrom || draggedFrom === stageKey) return;
    
    setBoard(prev => {
      const idx = prev[draggedFrom].findIndex(c => c.id === draggedId);
      if (idx === -1) return prev;
      
      const newBoard = { ...prev };
      const [card] = newBoard[draggedFrom].splice(idx, 1);
      newBoard[stageKey] = [...newBoard[stageKey], card];
      return newBoard;
    });

    setBadgeCounters(prev => ({
      ...prev,
      [stageKey]: prev[stageKey] + 1
    }));
  };

  const renderCard = (stage: Stage, item: LeadCard, idx: number) => {
    const isBareName = item.name === '.';
    const title = isBareName ? item.phone : item.name;
    const sub = isBareName ? 'Contato via WhatsApp' : item.phone;

    return (
      <div 
        key={item.id} 
        className={styles.card} 
        draggable 
        tabIndex={0}
        style={{ animationDelay: `${idx * 40}ms` }}
        onDragStart={(e) => handleDragStart(item.id, stage.key, e)}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.cardHead}>
          <div className={styles.avatar}>{initials(title)}</div>
          <div className={styles.cardInfo}>
            <div className={styles.cardName}>{title}</div>
            <div className={styles.cardSub}>{sub}</div>
          </div>
          {stage.key === 'ia' && (
            <span className={styles.iaChip}>
              <Zap style={{ width: 8, height: 8 }} fill="currentColor" />
              IA
            </span>
          )}
          {stage.key === 'espera' && item.time && (
            <span className={styles.cardTime}>{item.time}</span>
          )}
        </div>
        
        {stage.key === 'ia' && (
          item.status === 'online' ? (
            <div className={styles.cardMeta}>
              <span className={styles.statusLive}>
                <span className={styles.ring}></span>Online
              </span>
            </div>
          ) : (
            <div className={styles.cardMeta}>
              <span className={styles.statusTyping}>
                Digitando
                <span className={styles.typingDots}><span></span><span></span><span></span></span>
              </span>
            </div>
          )
        )}

        {stage.key === 'humano' && (
          <div className={styles.cardMeta}>
            <span className={styles.agentChip}>
              <span className={styles.aAv}>{initials(item.agent)}</span>
              <span>{item.agent}</span>
            </span>
            <span className={styles.cardTime}>{item.time}</span>
          </div>
        )}

        {stage.key === 'pagamento' && (
          <div className={styles.cardMeta}>
            <span className={styles.valueTag}>{currency(item.value || 0)}</span>
            <span className={styles.cardTime}>{item.time}</span>
          </div>
        )}

        {stage.key === 'perdido' && (
          <div className={styles.cardMeta}>
            <span className={styles.reasonTag}>{item.reason}</span>
            <span className={styles.cardTime}>{item.time}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.content}>
      <div className={styles.topbar}>
        <div className={styles.topbarTitle}>
          <div className={styles.icon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 20, height: 20, color: '#fff'}}>
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
            </svg>
          </div>
          <div>
            <h1>Funil de Vendas</h1>
            <p>Acompanhe seus clientes e aumente suas conversões com IA.</p>
          </div>
        </div>
        <div className={styles.topbarRight}>
          <div className={styles.tbSearch}>
            <Search className={styles.iconSearch} />
            <input 
              type="text" 
              placeholder="Buscar clientes, conversas…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className={styles.kbd}>⌘K</span>
          </div>
          <div className={styles.iconBtn}>
            <Bell />
            <span className={styles.dot}></span>
          </div>
          <div className={styles.iconBtn}>
            <SlidersHorizontal />
          </div>
          <button className={styles.iconBtn} onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <div className={styles.userChip}>
            <div className={styles.av}>GA</div>
            <div>
              <div className={styles.name}>Gildo Alves</div>
              <div className={styles.role}>Super Admin</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <div className={styles.ic} style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z"/></svg>
          </div>
          <div>
            <div className={styles.label}>Total no funil</div>
            <div className={styles.value}>{totalCards}</div>
            <div className={styles.delta}>+12% este mês</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.ic} style={{ background: 'rgba(34,197,94,.14)', color: '#22c55e' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
          </div>
          <div>
            <div className={styles.label}>Conversão geral</div>
            <div className={styles.value}>{stats.conv}%</div>
            <div className={styles.delta}>+8.3% este mês</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.ic} style={{ background: 'rgba(59,130,246,.14)', color: '#3b82f6' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div className={styles.label}>Em atendimento</div>
            <div className={styles.value}>{stats.atend}</div>
            <div className={styles.delta}>+3 ativos agora</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.ic} style={{ background: 'rgba(245,165,36,.14)', color: 'var(--amber)' }}>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <div className={styles.label}>Faturamento</div>
            <div className={styles.value}>{currency(stats.fat)}</div>
            <div className={styles.delta}>+18% este mês</div>
          </div>
        </div>

        <div className={styles.statActions}>
          <button className={styles.btn}><SlidersHorizontal />Filtros</button>
          <button className={styles.btn}><CalendarDays />Este mês</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`}><Plus />Novo Cliente</button>
        </div>
      </div>

      <div className={styles.flowbarShell}>
        <div className={styles.flowbarTop}>
          <span className={styles.label}>Distribuição do funil</span>
          <span className={styles.total}><b>{totalCards}</b> leads no total</span>
        </div>
        <div className={styles.flowbar}>
          {STAGES.map((s) => {
            const count = board[s.key].length;
            return (
              <div 
                key={s.key} 
                className={styles.seg} 
                style={{ background: s.color, flexGrow: count > 0 ? count : 0.001 }}
              />
            );
          })}
        </div>
        <div className={styles.flowLegend}>
          {STAGES.map((s) => (
            <div key={s.key} className={styles.item}>
              <span className={styles.dot} style={{ background: s.color }}></span>
              {s.title}
              <b>{board[s.key].length}</b>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.board}>
        {STAGES.map((stage, i) => {
          const items = filteredBoard[stage.key];
          
          return (
            <React.Fragment key={stage.key}>
              {i > 0 && (
                <div 
                  className={styles.connector}
                  style={{ '--seg-a': STAGES[i-1].color, '--seg-b': stage.color } as CSSProperties}
                >
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
                onDragOver={(e) => handleDragOver(stage.key, e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(stage.key, e)}
              >
                <div className={styles.colHead}>
                  <div className={styles.colTitle}>
                    <div className={styles.t}><span>{stage.title.toUpperCase()}</span></div>
                    <div className={styles.sub}>{stage.sub}</div>
                  </div>
                  <div key={`${stage.key}-${badgeCounters[stage.key]}`} className={`${styles.badge} ${styles.pulse}`}>
                    {items.length}
                  </div>
                </div>
                
                <div className={styles.colBody}>
                  {stage.key === 'finalizado' ? (
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
                      <p>{items.length} negócios concluídos este mês</p>
                      <div className={styles.delta}>{currency(items.reduce((a, b) => a + (b.value || 0), 0))} em receita</div>
                      <div className={styles.avatarStack}>
                        <span className={styles.as}>LU</span>
                        <span className={styles.as}>AN</span>
                        <span className={styles.as}>KA</span>
                        <span className={`${styles.as} ${styles.more}`}>+5</span>
                      </div>
                    </div>
                  ) : items.length === 0 ? (
                    <div className={styles.empty}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{width: 20, height: 20, opacity: 0.5}}><path d="M12 3v18M3 12h18"/></svg>
                      <p>Nenhum lead por aqui. Arraste um card para cá.</p>
                    </div>
                  ) : (
                    items.map((item, idx) => renderCard(stage, item, idx))
                  )}
                </div>
                
                <div className={styles.colFoot}>
                  <button>Ver todos ({items.length}) <ChevronRight /></button>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
