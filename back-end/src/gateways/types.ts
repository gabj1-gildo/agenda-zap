export interface PaymentResult {
  paymentId: string;
  qrCode: string; // Copia e cola
  qrCodeBase64?: string; // Imagem
}
