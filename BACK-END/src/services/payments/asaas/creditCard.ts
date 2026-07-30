export async function createAsaasCreditCardLink(amount: number, description: string, token: string, expirationDate: Date) {
  const response = await fetch('https://api.asaas.com/v3/paymentLinks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': token
    },
    body: JSON.stringify({
      name: description,
      billingType: 'CREDIT_CARD',
      chargeType: 'DETACHED',
      value: amount,
      dueDateLimitDays: 1
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Erro Asaas Cartão Link:", data);
    throw new Error("Falha ao gerar link de Cartão no Asaas");
  }

  return {
    paymentId: data.id,
    checkoutUrl: data.url
  };
}
