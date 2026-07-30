import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const rescheduleAppointmentTool: FunctionDeclaration = {
  name: "reschedule_appointment",
  description: "Reagenda um agendamento existente do cliente para um novo horário. Use essa função apenas se o cliente confirmar explicitamente a nova data/hora que foi sugerida via check_availability.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      appointmentId: {
        type: SchemaType.STRING,
        description: "O ID do agendamento que o cliente deseja reagendar. Extraia esse ID da lista de agendamentos pendentes."
      },
      newDateIso: {
        type: SchemaType.STRING,
        description: "Nova data e hora do agendamento no formato ISO 8601 (ex: 2026-06-30T14:00:00-03:00)."
      }
    },
    required: ["appointmentId", "newDateIso"]
  }
};
