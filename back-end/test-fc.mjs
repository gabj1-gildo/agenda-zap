import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "SUA_API_KEY_AQUI");
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [{
    functionDeclarations: [{
      name: "create_appointment",
      description: "Creates an appointment",
      parameters: {
        type: "OBJECT",
        properties: { serviceName: { type: "STRING" }, dateIso: { type: "STRING" }, price: { type: "STRING" } },
        required: ["serviceName", "dateIso", "price"]
      }
    }]
  }]
});
model.generateContent("Eu confirmo o agendamento de corte no dia 10 de marco as 14h por 65.").then(res => {
  console.log(JSON.stringify(res.response, null, 2));
}).catch(console.error);
