"use client";

import { useState } from "react";
import { useAppointments } from "../hooks/useAppointments";
import { AppointmentsHeader } from "./AppointmentsHeader";
import { AppointmentsTable } from "./AppointmentsTable";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AppointmentsWrapperProps {
  tenantId: string;
  token: string;
}

export function AppointmentsWrapper({ tenantId, token }: AppointmentsWrapperProps) {
  const { appointments, isLoading, mutate } = useAppointments(tenantId);
  const [currentTab, setCurrentTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchLower = searchTerm.toLowerCase();

  const filtered = appointments.filter((apt: any) => {
    const matchSearch =
      apt.client?.name?.toLowerCase().includes(searchLower) ||
      apt.serviceName?.toLowerCase().includes(searchLower);
    
    if (currentTab === "todos" && apt.status === "CANCELADO") return false;
    if (currentTab === "pendentes" && apt.status !== "PENDENTE") return false;
    if (currentTab === "confirmados" && apt.status !== "PAGO") return false;
    if (currentTab === "cancelados" && apt.status !== "CANCELADO") return false;
    
    return matchSearch;
  });

  const countPending = appointments.filter((a: any) => a.status === "PENDENTE").length;
  const countConfirmed = appointments.filter((a: any) => a.status === "PAGO").length;
  const countCanceled = appointments.filter((a: any) => a.status === "CANCELADO").length;
  const countTodos = appointments.length - countCanceled;

  const tabs = [
    { key: "todos",      label: "Todos",      count: countTodos },
    { key: "pendentes",  label: "Aguardando Pagto",  count: countPending },
    { key: "confirmados",label: "Confirmados",count: countConfirmed },
    { key: "cancelados", label: "Cancelados", count: countCanceled },
  ];

  const stats = [
    { label: "Total Válido",value: countTodos,          color: "var(--foreground)" },
    { label: "Aguardando",  value: countPending,        color: "var(--warning)" },
    { label: "Confirmados", value: countConfirmed,      color: "var(--success)"      },
    { label: "Cancelados",  value: countCanceled,       color: "var(--destructive)"        },
  ];

  return (
    <div className="space-y-8 mt-4">
      <div className="flex justify-between items-center">
        <AppointmentsHeader 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          tabs={tabs}
          stats={stats}
          filteredAppointments={filtered}
        />
        <div className="flex items-center gap-2 mb-6">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <AppointmentsTable 
        appointments={filtered}
        tenantId={tenantId}
        token={token}
        isLoading={isLoading}
      />

      {isModalOpen && (
        <NewAppointmentModal 
          tenantId={tenantId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            mutate();
          }}
        />
      )}
    </div>
  );
}
