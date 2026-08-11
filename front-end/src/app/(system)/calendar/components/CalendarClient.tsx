"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { getBackendUrl } from "@/lib/api";
import { Appointment } from "../types/calendar.types";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08h–18h
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const FULL_DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function getWeekDays(base: Date) {
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthDays(base: Date) {
  const firstDay = new Date(base.getFullYear(), base.getMonth(), 1);
  const startOffset = firstDay.getDay(); 
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);
  
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  const endOffset = 6 - lastDay.getDay();
  const totalDays = startOffset + lastDay.getDate() + endOffset;
  const numCells = totalDays <= 35 ? 35 : 42;
  
  return Array.from({ length: numCells }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });
}

const statusStyle: Record<string, { bg: string; color: string; border: string; label: string }> = {
  PAGO:      { bg: "var(--success-bg)", color: "var(--success)", border: "color-mix(in srgb, var(--success) 30%, transparent)", label: "Pago" },
  PENDENTE:  { bg: "var(--warning-bg)", color: "var(--warning)", border: "color-mix(in srgb, var(--warning) 30%, transparent)", label: "Pendente" },
  CANCELADO: { bg: "var(--muted)", color: "var(--muted-foreground)", border: "var(--border)", label: "Bloqueado" },
};

interface Props {
  tenantId: string;
  token: string;
  initialAppointments: Appointment[];
  initialMode: string;
}

export function CalendarClient({ tenantId, token, initialAppointments, initialMode }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [baseDate, setBaseDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [loading, setLoading] = useState(false);

  const [schedulingMode, setSchedulingMode] = useState(initialMode || "GERAL");
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>("ALL");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("ALL");

  const [showNewApptModal, setShowNewApptModal] = useState(false);

  const fetchAgenda = useCallback(async (isInitial = false) => {
    if (isInitial && initialAppointments.length > 0) return; // Skip fetch if we just mounted and have SSR data
    
    setLoading(true);
    try {
      let startStr = "";
      let endStr = "";
      
      if (view === "month") {
        const days = getMonthDays(baseDate);
        startStr = days[0].toISOString();
        endStr = days[days.length - 1].toISOString();
      } else if (view === "week") {
        const days = getWeekDays(baseDate);
        startStr = days[0].toISOString();
        endStr = days[days.length - 1].toISOString();
      } else {
        startStr = baseDate.toISOString();
        const end = new Date(baseDate);
        end.setDate(end.getDate() + 1);
        endStr = end.toISOString();
      }

      const res = await fetch(getBackendUrl(`/api/tenants/${tenantId}/agenda?start=${startStr}&end=${endStr}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
        if (data.schedulingMode) setSchedulingMode(data.schedulingMode);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [tenantId, baseDate, view, token, initialAppointments]);

  const loadResources = useCallback(async () => {
    if (!tenantId) return;
    try {
      const headers = { 'tenant-id': tenantId, Authorization: `Bearer ${token}` };
      const [profRes, roomRes] = await Promise.all([
        fetch(getBackendUrl('/api/settings/professionals'), { headers }),
        fetch(getBackendUrl('/api/settings/rooms'), { headers })
      ]);
      const pData = await profRes.json();
      const rData = await roomRes.json();
      if (pData.success) setProfessionals(pData.data);
      if (rData.success) setRooms(rData.data);
    } catch (e) { }
  }, [tenantId, token]);

  // Initial load effect
  useEffect(() => { 
    loadResources();
  }, [loadResources]);

  // Fetch data when date/view changes
  useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  const prevRange = () => { 
    const d = new Date(baseDate); 
    if (view === "month") d.setMonth(d.getMonth() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setBaseDate(d); 
  };
  
  const nextRange = () => { 
    const d = new Date(baseDate); 
    if (view === "month") d.setMonth(d.getMonth() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setBaseDate(d); 
  };

  const filteredAppointments = appointments.filter(a => {
    if (schedulingMode === 'PROFISSIONAL' && selectedProfId !== 'ALL') {
      return (a as any).professionalId === selectedProfId;
    }
    if (schedulingMode === 'CONSULTORIO' && selectedRoomId !== 'ALL') {
      return (a as any).roomId === selectedRoomId;
    }
    return true;
  });

  const getSlot = (day: Date, hour: number): Appointment | null => {
    return filteredAppointments.find((a) => {
      const d = new Date(a.date);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate() &&
        d.getHours() === hour
      );
    }) ?? null;
  };

  const fmtRange = () => {
    if (view === "month") {
      const m = baseDate.toLocaleString("pt-BR", { month: "long" });
      return `${m.charAt(0).toUpperCase() + m.slice(1)} de ${baseDate.getFullYear()}`;
    }
    if (view === "day") {
      return `${baseDate.getDate()} de ${baseDate.toLocaleString("pt-BR", { month: "long" })}`;
    }
    const days = getWeekDays(baseDate);
    const start = days[0];
    const end = days[5];
    return `${start.getDate()} ${start.toLocaleString("pt-BR", { month: "short" })} — ${end.getDate()} ${end.toLocaleString("pt-BR", { month: "short" })}`;
  };

  const monthDays = getMonthDays(baseDate);
  const numRows = monthDays.length / 7;

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-4 overflow-hidden">
      {showNewApptModal && (
        <NewAppointmentModal 
          tenantId={tenantId} 
          onClose={() => setShowNewApptModal(false)}
          onSuccess={() => {
            setShowNewApptModal(false);
            fetchAgenda();
          }}
        />
      )}

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Empresa</p>
          <div className="flex items-center gap-4">
            <h1 className="font-display font-extrabold text-3xl text-foreground">Agenda</h1>
            
            {schedulingMode === 'PROFISSIONAL' && (
              <select
                className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm text-muted-foreground"
                value={selectedProfId}
                onChange={e => setSelectedProfId(e.target.value)}
              >
                <option value="ALL">Todos os Profissionais</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}

            {schedulingMode === 'CONSULTORIO' && (
              <select
                className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm text-muted-foreground"
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
              >
                <option value="ALL">Todas as Salas</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewApptModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
            Novo agendamento
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex rounded-xl p-1 gap-1 bg-muted border border-border">
          {["Mês", "Semana", "Dia"].map((v) => {
            const mapped = v === "Mês" ? "month" : v === "Semana" ? "week" : "day";
            return (
              <button
                key={v}
                onClick={() => setView(mapped as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === mapped
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={prevRange}
            className="w-8 h-8 border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm text-foreground min-w-[160px] text-center">{fmtRange()}</span>
          <button
            onClick={nextRange}
            className="w-8 h-8 border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-muted-foreground hidden sm:flex">
          {Object.entries(statusStyle).slice(0, 2).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: v.bg, border: `1px solid ${v.border}` }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center">
            <div className="px-4 py-2 bg-card border border-border rounded-xl shadow-sm text-sm font-medium">Carregando...</div>
          </div>
        )}
        
        {view === "month" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="grid grid-cols-7 shrink-0 border-b border-border bg-muted">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={d}
                  className={`text-center py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ${i > 0 ? 'border-l border-border' : ''}`}
                >
                  {d}
                </div>
              ))}
            </div>

            <div
              className="flex-1 grid grid-cols-7"
              style={{ gridTemplateRows: `repeat(${numRows}, 1fr)` }}
            >
              {monthDays.map((day, i) => {
                const isCurrentMonth = day.getMonth() === baseDate.getMonth();
                const today = new Date();
                const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
                
                const dayApps = filteredAppointments.filter(a => {
                  const d = new Date(a.date);
                  return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
                });

                return (
                  <div 
                    key={i} 
                    onClick={() => { setBaseDate(day); setView("day"); }}
                    className={`p-1.5 cursor-pointer hover:bg-muted/50 transition-all flex flex-col gap-0.5 border-b border-r border-border overflow-hidden ${
                      !isCurrentMonth ? 'opacity-35' : ''
                    } ${isToday ? 'ring-2 ring-inset ring-primary/40 bg-primary/[0.03]' : ''}`}
                  >
                    <div 
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${
                        isToday ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden flex-1 min-h-0">
                      {dayApps.slice(0, 2).map(a => {
                        const st = statusStyle[a.status] || statusStyle.PENDENTE;
                        return (
                          <div
                            key={a.id}
                            className="text-[9px] px-1.5 py-0.5 rounded truncate font-medium shrink-0"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {a.clientName || "Cliente"}
                          </div>
                        )
                      })}
                      {dayApps.length > 2 && (
                        <div className="text-[9px] text-muted-foreground font-medium pl-1 shrink-0">
                          +{dayApps.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(view === "week" || view === "day") && (() => {
          const gridDays = view === "week" ? getWeekDays(baseDate) : [baseDate];
          const cols = view === "week" ? 6 : 1;

          return (
            <div className="bg-card border border-border rounded-2xl overflow-y-auto h-full">
              <div className="grid sticky top-0 z-10 bg-muted border-b border-border" style={{ gridTemplateColumns: `64px repeat(${cols}, 1fr)` }}>
                <div />
                {gridDays.map((d) => {
                  const today = new Date();
                  const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                  return (
                    <div key={d.toISOString()} className="text-center py-3 border-l border-border">
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {view === "day" ? FULL_DAY_LABELS[d.getDay()] : DAY_LABELS[d.getDay()]}
                      </div>
                      <div className={`font-display font-extrabold text-xl leading-tight ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {HOURS.map((hour) => (
                <div key={hour} className="grid border-b border-border" style={{ gridTemplateColumns: `64px repeat(${cols}, 1fr)`, minHeight: 60 }}>
                  <div className="flex items-start justify-end pr-3 pt-2 text-muted-foreground">
                    <span className="font-mono-custom text-[10px]">{String(hour).padStart(2, "0")}h</span>
                  </div>
                  {gridDays.map((day) => {
                    const slot = getSlot(day, hour);
                    const st = slot ? statusStyle[slot.status] ?? statusStyle.PENDENTE : null;
                    return (
                      <div key={day.toISOString()} className="border-l border-border p-1">
                        {slot && st && (
                          <div
                            style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                            className="h-full rounded-lg p-1.5 cursor-pointer hover:opacity-80 transition-opacity text-[11px] font-semibold leading-tight flex flex-col gap-0.5"
                          >
                            <span className="font-mono-custom text-[9px] opacity-70">
                              {new Date(slot.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="truncate">{slot.clientName || "Cliente"}</span>
                            {slot.serviceName && <span className="text-[9px] opacity-70 truncate">{slot.serviceName}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  );
}
