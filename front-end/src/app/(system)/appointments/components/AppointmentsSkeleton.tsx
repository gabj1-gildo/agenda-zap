export function AppointmentsSkeleton() {
  return (
    <div className="space-y-8 mt-4">
      <div className="flex justify-end">
        <div className="h-9 w-32 bg-muted rounded-xl animate-pulse"></div>
      </div>

      {/* Stat mini cards - Fake */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Válido" },
          { label: "Aguardando" },
          { label: "Confirmados" },
          { label: "Cancelados" },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-card border rounded-2xl p-4 border-border"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-2 h-8 w-12 bg-muted animate-pulse rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex rounded-xl p-1 gap-1 bg-muted border border-border">
          {["Todos", "Aguardando Pagto", "Confirmados", "Cancelados"].map((t, i) => (
            <div key={i} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${i === 0 ? "bg-ink text-transparent animate-pulse" : "text-transparent animate-pulse"}`}>
              {t}
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="h-9 w-64 bg-card border border-border rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted">
                {["Data e Hora", "Cliente", "Serviço", "Valor", "Status", "Ações"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-5 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-border animate-pulse">
                  <td className="px-5 py-4"><div className="h-4 w-24 bg-muted rounded"></div></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-muted"></div><div className="h-4 w-32 bg-muted rounded"></div></div></td>
                  <td className="px-5 py-4"><div className="h-4 w-40 bg-muted rounded"></div></td>
                  <td className="px-5 py-4"><div className="h-4 w-16 bg-muted rounded"></div></td>
                  <td className="px-5 py-4"><div className="h-6 w-24 bg-muted rounded-full"></div></td>
                  <td className="px-5 py-4"><div className="h-8 w-8 bg-muted rounded-lg"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
