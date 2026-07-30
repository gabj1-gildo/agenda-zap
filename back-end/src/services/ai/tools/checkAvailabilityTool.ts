import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const checkAvailabilityTool: FunctionDeclaration = {
  name: "check_availability",
  description: "Consulta os horários livres para um determinado serviço em uma data específica. Sempre use isso antes de sugerir ou confirmar horários com o cliente.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      serviceId: {
        type: SchemaType.STRING,
        description: "O ID do serviço (que você obteve ao chamar list_services)."
      },
      dateIso: {
        type: SchemaType.STRING,
        description: "Data para consultar a disponibilidade, no formato YYYY-MM-DD (ex: 2026-06-30)."
      },
      preferredProfessionalId: {
        type: SchemaType.STRING,
        description: "Opcional. ID do profissional preferido, se o cliente informou. Ajuda a filtrar a disponibilidade."
      },
      preferredRoomId: {
        type: SchemaType.STRING,
        description: "Opcional. ID do consultório/sala preferida."
      }
    },
    required: ["serviceId", "dateIso"]
  }
};
