import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const listServicesTool: FunctionDeclaration = {
  name: "list_services",
  description: "Busca a lista de serviços ativos do estabelecimento, retornando nome, preço (em reais) e duração. Use SEMPRE essa função quando o cliente perguntar sobre serviços ou preços, ou antes de sugerir um serviço.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {}, // Sem parâmetros, busca do tenant logado
  }
};
