import { Loader2 } from "lucide-react";

interface Props {
  role?: string;
  userName?: string;
}

export function DashboardSkeleton({ role, userName }: Props) {
  return (
    <div className="animate-pulse space-y-8 mt-4 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="h-4 w-32 bg-muted rounded mb-2"></div>
          <div className="h-10 w-64 bg-muted rounded mb-2"></div>
          <div className="h-4 w-48 bg-muted rounded"></div>
        </div>
        <div className="h-12 w-[280px] bg-muted rounded-2xl"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-[120px] bg-muted rounded-2xl border border-border"></div>
        ))}
      </div>

      <div className="h-[400px] bg-muted rounded-2xl border border-border"></div>
    </div>
  );
}
