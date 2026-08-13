import { ExportButton } from "@/components/ExportButton";

interface AppointmentsHeaderProps {
  currentTab: string;
  setCurrentTab: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  tabs: Array<{ key: string; label: string; count: number }>;
  stats: Array<{ label: string; value: number; color: string }>;
  filteredAppointments: any[];
}

export function AppointmentsHeader({
  currentTab, setCurrentTab, searchTerm, setSearchTerm, tabs, stats, filteredAppointments
}: AppointmentsHeaderProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Stat mini cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            style={{ borderColor: "var(--border)" }}
            className="bg-card border rounded-2xl p-4 hover-scale"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {s.label}
            </div>
            <div
              className="stat-value mt-2"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
          className="flex rounded-xl p-1 gap-1"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setCurrentTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentTab === t.key
                  ? "bg-ink text-white shadow-sm"
                  : "text-foreground hover:bg-black/5"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 font-mono-custom text-[10px] opacity-60">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar cliente ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
            className="pl-9 pr-4 py-2 text-sm border rounded-xl w-64 outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
      </div>
    </div>
  );
}
