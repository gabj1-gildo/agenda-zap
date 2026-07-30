import { env } from '@/config/env';

function mapToOpenAIType(type: any) {
  const strType = String(type).toUpperCase();
  if (strType === 'STRING') return 'string';
  if (strType === 'INTEGER' || strType === 'NUMBER') return 'number';
  if (strType === 'BOOLEAN') return 'boolean';
  if (strType === 'OBJECT') return 'object';
  if (strType === 'ARRAY') return 'array';
  return 'string';
}

export function convertGeminiToolsToOpenAI(geminiTools: any[]) {
  const openaiTools: any[] = [];
  
  for (const group of geminiTools) {
    if (!group.functionDeclarations) continue;
    
    for (const tool of group.functionDeclarations) {
      const properties: any = {};
      if (tool.parameters?.properties) {
        for (const [key, prop] of Object.entries(tool.parameters.properties)) {
          properties[key] = {
            type: mapToOpenAIType((prop as any).type),
            description: (prop as any).description
          };
        }
      }
      
      openaiTools.push({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: properties,
            required: tool.parameters?.required || []
          }
        }
      });
    }
  }
  
  return openaiTools;
}

export async function fetchOpenAICompatibleChat(
  provider: 'groq' | 'deepseek',
  model: string,
  messages: any[], // { role, content, name, tool_calls, tool_call_id }
  tools: any[]
) {
  let apiKey = '';
  let baseURL = '';
  
  if (provider === 'groq') {
    apiKey = env.GROQ_API_KEY || '';
    baseURL = 'https://api.groq.com/openai/v1/chat/completions';
  } else if (provider === 'deepseek') {
    apiKey = env.DEEPSEEK_API_KEY || '';
    baseURL = 'https://api.deepseek.com/chat/completions';
  }

  if (!apiKey) {
    throw new Error(`A chave de API para o provedor ${provider} não está configurada no backend (.env).`);
  }

  const payload: any = {
    model: model,
    messages: messages,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const res = await fetch(baseURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro na API do provedor ${provider}: ${errText}`);
  }

  return await res.json();
}
