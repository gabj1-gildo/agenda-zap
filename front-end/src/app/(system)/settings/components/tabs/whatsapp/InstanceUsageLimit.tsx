import { Badge } from "@/components/ui/badge";

interface InstanceUsageLimitProps {
  usedInstances: number;
  maxInstances: number;
}

export function InstanceUsageLimit({ usedInstances, maxInstances }: InstanceUsageLimitProps) {
  const limitReached = usedInstances >= maxInstances;
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold">Uso de Instâncias</span>
      <div className="flex flex-col items-end gap-1">
        <Badge variant={limitReached ? "destructive" : "outline"} className="text-xs">
          {usedInstances}/{maxInstances} instâncias
        </Badge>
        <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 999 }}>
          <div style={{ 
            width: `${Math.min((usedInstances / maxInstances) * 100, 100)}%`, 
            height: '100%', 
            background: limitReached ? '#ef4444' : '#f5a524', 
            borderRadius: 999, transition: 'width .3s' 
          }} />
        </div>
      </div>
    </div>
  );
}
