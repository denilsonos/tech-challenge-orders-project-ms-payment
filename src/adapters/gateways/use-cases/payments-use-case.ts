import { OrderDTO } from "../../../base/dto/order";
import { PaymentDTO } from "../../../base/dto/payment";
import { PaymentEntity } from "../../../core/entities/payment";

export interface PaymentsUseCase {
    confirmOrderPayment(payment: PaymentDTO, order: OrderDTO): Promise<void>
    recuseOrderPayment(payment: PaymentDTO, order: OrderDTO): Promise<void>
    createOrderPayment(order: OrderDTO): Promise<PaymentEntity>
    getById(paymentId: number): Promise<PaymentEntity | undefined>
  }