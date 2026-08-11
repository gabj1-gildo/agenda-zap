import { Board, STAGES } from "../types/funil";

export function FunilDistribution({ board, total }: { board: Board, total: number }) {
  if (total === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Distribuição do Funil</h3>
        <span className="text-xs text-muted-foreground"><strong className="text-foreground">{total}</strong> leads no total</span>
      </div>
      
      {/* Segmented Bar */}
      <div className="h-2 w-full rounded-full flex overflow-hidden gap-0.5">
        {STAGES.map(stage => {
          const count = board[stage.key]?.length || 0;
          if (count === 0) return null;
          const percentage = (count / total) * 100;
          return (
            <div 
              key={stage.key}
              style={{ width: `${percentage}%`, backgroundColor: stage.color }}
              className="h-full"
              title={`${stage.title}: ${count} (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        {STAGES.map(stage => {
          const count = board[stage.key]?.length || 0;
          return (
            <div key={stage.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }}></span>
              {stage.title} <strong className="text-foreground ml-0.5">{count}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
