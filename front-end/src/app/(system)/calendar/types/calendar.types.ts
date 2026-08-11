export type Appointment = {
  id: string;
  date: string;
  status: "PAGO" | "PENDENTE" | "CANCELADO";
  serviceName: string | null;
  clientName: string | null;
  price?: string;
};
