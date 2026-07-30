import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cpf = searchParams.get('cpf');

    if (!cpf) {
      return NextResponse.json({ success: false, error: 'CPF é obrigatório' }, { status: 400 });
    }

    const rawCpf = cpf.replace(/\D/g, '');
    if (rawCpf.length !== 11) {
      return NextResponse.json({ success: false, error: 'CPF inválido (tamanho incorreto)' }, { status: 400 });
    }

    const apiKey = process.env.APICPF_KEY;
    if (!apiKey || apiKey === 'sua_chave_aqui') {
      console.warn('APICPF_KEY não configurada corretamente. Ignorando validação externa.');
      // Fallback para apenas validar o tamanho se a chave não estiver configurada no ambiente local/dev
      return NextResponse.json({ success: true, message: 'Validado localmente (sem API Key)' });
    }

    // A URL informada na documentação do plano: https://apicpf.com/api/consulta?cpf=XXX
    const apiUrl = `https://apicpf.com/api/consulta?cpf=${rawCpf}`;
    
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 404) {
      return NextResponse.json({ success: false, error: 'CPF não encontrado na Receita Federal' }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Erro ao consultar CPF na Receita' }, { status: res.status });
    }

    const data = await res.json();
    
    // O apicpf.com retorna os dados do CPF se ele existir. 
    // Se der 200 OK, a API confirma a existência.
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Erro na validação do CPF:', error);
    return NextResponse.json({ success: false, error: 'Erro interno na validação de CPF' }, { status: 500 });
  }
}
