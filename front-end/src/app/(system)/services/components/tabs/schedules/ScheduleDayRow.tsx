import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function ScheduleDayRow({
  sched,
  idx,
  updateSchedule,
  minsToTime,
  timeToMins
}: {
  sched: any;
  idx: number;
  updateSchedule: (idx: number, field: string, value: any) => void;
  minsToTime: (m: number) => string;
  timeToMins: (t: string) => number;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 border rounded-md bg-card">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 w-32 shrink-0">
          <Checkbox 
            checked={sched.isActive} 
            onCheckedChange={(c) => updateSchedule(idx, 'isActive', !!c)}
          />
          <Label className="font-semibold">{days[sched.dayOfWeek]}</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground text-xs w-14">Abertura</Label>
          <Input 
            type="time" 
            value={sched.startTime || "09:00"} 
            onChange={e => updateSchedule(idx, 'startTime', e.target.value)}
            disabled={!sched.isActive}
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input 
            type="time" 
            value={sched.endTime || "18:00"} 
            onChange={e => updateSchedule(idx, 'endTime', e.target.value)}
            disabled={!sched.isActive}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Label className="text-muted-foreground text-xs">Duração</Label>
          <Input 
            type="time" 
            className="w-[100px]" 
            value={minsToTime(sched.slotDuration)} 
            onChange={e => updateSchedule(idx, 'slotDuration', timeToMins(e.target.value))}
            disabled={!sched.isActive}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pl-0 md:pl-[150px]">
        <Label className="text-muted-foreground text-xs w-12">Pausa</Label>
        <Input 
          type="time" 
          className="w-[100px]"
          value={sched.intervalStartTime || ""} 
          onChange={e => updateSchedule(idx, 'intervalStartTime', e.target.value)}
          disabled={!sched.isActive}
        />
        <span className="text-muted-foreground text-sm">até</span>
        <Input 
          type="time" 
          className="w-[100px]"
          value={sched.intervalEndTime || ""} 
          onChange={e => updateSchedule(idx, 'intervalEndTime', e.target.value)}
          disabled={!sched.isActive}
        />
      </div>
    </div>
  );
}
