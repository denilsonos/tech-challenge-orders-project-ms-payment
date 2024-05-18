import { PaymentDAO } from '../../../base/dao/payment'
import { PaymentStatus } from '../../../core/entities/enums/payment-status'

export interface PaymentRepository {
  save(payment: PaymentDAO): Promise<PaymentDAO>
  getById(paymentId: number): Promise<PaymentDAO | null>
  update(paymentId: number, params: { status: PaymentStatus }): Promise<void>
}
