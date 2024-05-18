
export interface PaymentServiceAdapter {
  create(order: any): Promise<string>
}