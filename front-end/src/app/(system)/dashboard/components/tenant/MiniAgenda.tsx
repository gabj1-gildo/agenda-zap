"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { getBackendUrl } from "@/lib/api";
import { Appointment } from "../../../calendar/types/calendar.types";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = [9, 10, 11, 14];

const statusStyle: Record<string, { bg: string; color: string }> = {
  PAGO: { bg: "var(--success-bg)", color: "var(--success)" },
  PENDENTE: { bg: "var(--warning-bg)", color: "var(--warning)" },
  CANCELADO: { bg: "var(--muted)", color: "var(--muted-foreground)" },
};

function getWeekDays(base: Date) {
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function MiniAgenda({ tenantId }: { tenantId: string }) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const days = getWeekDays(new Date());
  const start = days[0].toISOString();
  const end = days[days.length - 1].toISOString();
  const url = `/api/tenants/${tenantId}/agenda?start=${start}&end=${end}`;

  const { data } = useSWR(
    token ? [url, token] : null,
    async ([u, jwt]: [string, string]) => {
      const res = await fetch(getBackendUrl(u), { headers: { Authorization: `Bearer ${jwt}` } });
      const json = await res.json();
      return (json.success ? json.data : []) as Appointment[];
    },
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  const appointments = data ?? [];
  const now = new Date();
  const rangeLabel = `${days[0].getDate()} — ${days[4].getDate()} ${days[4].toLocaleString("pt-BR", { month: "short" })}`;

  const getSlot = (day: Date, hour: number): Appointment | null =>
    appointments.find((a) => {
      const d = new Date(a.date);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate() &&
        d.getHours() === hour
      );
    }) ?? null;

  return (
    <section className="bg-card border rounded-xl shadow-sm overflow-hidden" style={{ borderColor: "var(--line)" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h2 className="section-title">Agenda da semana</h2>
          <p className="section-sub">Visão rápida dos próximos horários</p>
        </div>
        <span className="text-xs font-bold" style={{ color: "var(--muted-text)" }}>{rangeLabel}</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          {/* Cabeçalho dos dias */}
          <div className="grid" style={{ gridTemplateColumns: "64px repeat(5, 1fr)" }}>
            <div />
            {days.map((d) => {
              const isToday =
                d.getDate() === now.getDate() &&
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear();
              return (
                <div
                  key={d.toISOString()}
                  className="px-2 py-2 text-center border-l border-b"
                  style={{ borderColor: "var(--line)", background: "var(--canvas)" }}
                >
                  <span
                    className="block text-[10px] uppercase tracking-wide font-bold"
                    style={{ color: "var(--muted-text)" }}
                  >
                    {DAY_LABELS[d.getDay()]}
                  </span>
                  <b
                    className={`mx-auto mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-sm ${
                      isToday ? "text-white" : ""
                    }`}
                    style={isToday ? { background: "var(--sage)" } : undefined}
                  >
                    {d.getDate()}
                  </b>
                </div>
              );
            })}
          </div>

          {/* Linhas de horário */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid border-b"
              style={{ gridTemplateColumns: "64px repeat(5, 1fr)", minHeight: 52, borderColor: "var(--line)" }}
            >
              <div className="flex items-start justify-end pr-3 pt-2 text-[10px]" style={{ color: "var(--muted-text)" }}>
                {String(hour).padStart(2, "0")}h
              </div>
              {days.map((day) => {
                const slot = getSlot(day, hour);
                const st = slot ? statusStyle[slot.status] ?? statusStyle.PENDENTE : null;
                return (
                  <div key={day.toISOString()} className="border-l p-1" style={{ borderColor: "var(--line)" }}>
                    {slot && st ? (
                      <div
                        className="h-full rounded px-2 py-1 text-[10px] leading-tight font-semibold"
                        style={{ borderLeft: `3px solid ${st.color}`, background: st.bg, color: st.color }}
                      >
                        <span className="block font-bold truncate">{slot.clientName || "Cliente"}</span>
                        {slot.serviceName && <span className="block opacity-70 truncate">{slot.serviceName}</span>}
                      </div>
                    ) : (
                      <span className="text-[10px]" style={{ color: "var(--muted-text)", opacity: 0.55 }}>
                        Livre
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}