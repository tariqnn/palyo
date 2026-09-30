import { privateDemoEnabled } from "./demo";

export interface PaymentProvider {
  charge(input:{amountFils:number;currency:"JOD";idempotencyKey:string}):Promise<{status:"PAID"|"FAILED";reference:string}>;
  refund(input:{reference:string;amountFils:number;idempotencyKey:string}):Promise<{status:"REFUNDED"|"FAILED"}>;
}
export const mockPayment:PaymentProvider={
  async charge(input){return {status:"PAID",reference:`mock_${input.idempotencyKey}`};},
  async refund(){return {status:"REFUNDED"};},
};
export function paymentProvider():PaymentProvider {
  if(process.env.PAYMENT_PROVIDER&&process.env.PAYMENT_PROVIDER!=="mock") throw new Error("Payment provider is not configured.");
  if(process.env.NODE_ENV==="production"&&!privateDemoEnabled()) throw new Error("Paid bookings need a payment provider. Mock payments are available only in a private Vercel Preview demo.");
  return mockPayment;
}
