import { Loader2 } from "lucide-react";

export function CalendarSkeleton() {
  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-4 overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="flex shrink-0 items-center justify-between flex-wrap gap-4 mt-2">
        <div>
          <div className="h-4 w-16 bg-muted rounded mb-2"></div>
          <div className="h-9 w-32 bg-muted rounded"></div>
        </div>
        <div className="h-10 w-36 bg-muted rounded-xl"></div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="shrink-0 bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="h-8 w-40 bg-muted rounded-lg"></div>
        <div className="h-8 w-48 bg-muted rounded-lg"></div>
        <div className="h-4 w-24 bg-muted rounded-lg hidden sm:block"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="flex-1 min-h-[400px] bg-muted rounded-2xl border border-border flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium text-sm">Carregando calendário...</span>
        </div>
      </div>
    </div>
  );
}
