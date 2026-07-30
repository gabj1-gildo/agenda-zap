import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const cancelAppointmentTool: FunctionDeclaration = {
  name: "cancel_appointment",
  description: "Cancela um agendamento existente do cliente. Use essa função apenas se o cliente confirmar explicitamente que deseja cancelar o agendamento.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      appointmentId: {
        type: SchemaType.STRING,
        description: "O ID do agendamento que o cliente deseja cancelar. Você deve extrair esse ID da lista de agendamentos pendentes fornecida no contexto."
      }
    },
    required: ["appointmentId"]
  }
};
