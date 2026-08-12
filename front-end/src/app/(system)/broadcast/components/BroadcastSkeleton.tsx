import { Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";

export function BroadcastSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted"></span>
            <div className="w-20 h-4 bg-muted rounded-full"></div>
          </div>
          <div className="w-64 h-10 bg-muted rounded-xl mb-2"></div>
          <div className="w-96 h-4 bg-muted rounded-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="w-full h-12 bg-muted rounded-xl"></div>
          <Card className="p-6 bg-card border-border/50 shadow-sm rounded-2xl h-[500px]">
             {/* Fake Form inside */}
             <div className="w-32 h-6 bg-muted rounded-md mb-4"></div>
             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="h-24 bg-muted rounded-xl"></div>
                <div className="h-24 bg-muted rounded-xl"></div>
             </div>
             <div className="w-48 h-6 bg-muted rounded-md mb-4"></div>
             <div className="h-40 bg-muted rounded-xl"></div>
          </Card>
        </div>

        {/* Lado Direito Skeleton (Phone) */}
        <div className="hidden lg:block relative">
          <div className="w-40 h-4 bg-muted rounded-md mb-4"></div>
          <div className="w-[320px] h-[640px] bg-muted rounded-[2.5rem] shadow-sm"></div>
        </div>
      </div>
    </div>
  );
}
