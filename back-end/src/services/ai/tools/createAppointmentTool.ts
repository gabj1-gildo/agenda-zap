import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const createAppointmentTool: FunctionDeclaration = {
  name: "create_appointment",
  description: "Cria um agendamento para o cliente e gera a cobrança no formato escolhido. Use essa função APENAS quando o cliente confirmar a data/hora sugeridas e o método de pagamento.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      serviceId: {
        type: SchemaType.STRING,
        description: "O ID do serviço que o cliente quer agendar."
      },
      dateIso: {
        type: SchemaType.STRING,
        description: "Data e hora do agendamento no formato ISO 8601 (ex: 2026-06-30T14:00:00-03:00)."
      },
      paymentMethod: {
        type: SchemaType.STRING,
        description: "Forma de pagamento escolhida pelo cliente (PIX, CREDIT_CARD ou BOLETO)."
      },
      professionalId: {
        type: SchemaType.STRING,
        description: "Opcional. O ID do profissional escolhido pelo cliente (necessário se a resposta do check_availability incluiu profissionais)."
      },
      roomId: {
        type: SchemaType.STRING,
        description: "Opcional. O ID do consultório/sala escolhida."
      }
    },
    required: ["serviceId", "dateIso", "paymentMethod"]
  }
};
