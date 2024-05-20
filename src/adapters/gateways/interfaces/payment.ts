import { PaymentDTO } from '../../../base/dto/payment'
export interface Payment {
  create(payment: PaymentDTO): Promise<PaymentDTO>
  confirm(payment: { paymentId: number; orderId: number }): Promise<void>
  recuse(payment: { paymentId: number; orderId: number }): Promise<void>
  getPayment(identifier: any): Promise<PaymentDTO>
}
