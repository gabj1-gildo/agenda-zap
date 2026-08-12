import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSchedulesSettings } from "../../../hooks/useSchedulesSettings";
import { ScheduleDayRow } from "./ScheduleDayRow";

export function SchedulesTab({ tenantId }: { tenantId: string }) {
  const {
    schedules,
    saving,
    saveSchedules,
    minsToTime,
    timeToMins
  } = useSchedulesSettings(tenantId);

  // We need a local state to allow fast UI updates before hitting save.
  const [localSchedules, setLocalSchedules] = useState<any[]>([]);

  useEffect(() => {
    if (schedules.length > 0) {
      setLocalSchedules(schedules);
    }
  }, [schedules]);

  const updateSchedule = (idx: number, field: string, value: any) => {
    const s = [...localSchedules];
    s[idx][field] = value;
    setLocalSchedules(s);
  };

  const handleSave = () => {
    saveSchedules(localSchedules);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Horários"}</Button>
      </div>
      
      {localSchedules.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="space-y-4">
          {localSchedules.map((sched, idx) => (
            <ScheduleDayRow 
              key={idx}
              sched={sched}
              idx={idx}
              updateSchedule={updateSchedule}
              minsToTime={minsToTime}
              timeToMins={timeToMins}
            />
          ))}
        </div>
      )}
    </div>
  );
}
