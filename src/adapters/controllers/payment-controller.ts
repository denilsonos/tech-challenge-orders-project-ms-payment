import { z } from 'zod'
import { BadRequestException } from '../../core/entities/exceptions'
import { OrderStatus } from '../../core/entities/enums/order-status'
import { Payment } from '../gateways/interfaces/payment'
import { PaymentDTO } from '../../base/dto/payment'
import { PaymentPresenter } from '../presenters/payment'
import { PaymentStatus } from '../../core/entities/enums/payment-status'
import { PaymentRepository } from '../gateways/repositories/payment-repository'
import { PaymentRepositoryImpl } from '../repositories/payment-repository'
import { QueueServiceAdapter } from '../gateways/queue-service-adapter'
import { FakeQueueServiceAdapter } from '../external-services/fake-queue-service/fake-queue-service-adapter'
import { OrderRepository } from '../gateways/repositories/order-repository'
import { PaymentServiceAdapter } from '../gateways/payment-service-adapter'
import { FakePaymentServiceAdapter } from '../external-services/fake-payment-service/fake-payment-service-adapter'
import { PaymentEntity } from '../../core/entities/payment'
import { OrderEntity } from '../../core/entities/order'
import { OrderPresenter } from '../presenters/order'
import { DbConnection } from '../gateways/db/db-connection'
import { PaymentsUseCase } from '../gateways/use-cases/payments-use-case'
import { OrderUseCase } from '../gateways/use-cases/order-use-case'
import { PaymentsCaseImpl } from '../../core/use-cases/payments/payments-use-case'
import { OrderUseCaseImpl } from '../../core/use-cases/orders/order-use-case'
import { RemoteOrderRepositoryImpl } from '../repositories/remote-order-repository'

export class PaymentController implements Payment {
  private orderRepository: OrderRepository
  private paymentService: PaymentServiceAdapter
  private paymentRepository: PaymentRepository
  private queueService: QueueServiceAdapter
  private paymentsUseCase: PaymentsUseCase
  private orderUseCase: OrderUseCase
  
  constructor(readonly database: DbConnection) {    
    this.orderRepository = new RemoteOrderRepositoryImpl()
    this.paymentRepository = new PaymentRepositoryImpl(database)
    this.queueService = new FakeQueueServiceAdapter(database)
    this.paymentService = new FakePaymentServiceAdapter()
    this.orderUseCase = new OrderUseCaseImpl(this.orderRepository, this.queueService)
    this.paymentsUseCase = new PaymentsCaseImpl(this.paymentRepository, this.orderRepository, this.queueService, this.paymentService)
  }

  async create(bodyParams: unknown): Promise<PaymentDTO> {
    const schema = z.object({
      orderId: z.number(),
    })
    const result = schema.safeParse(bodyParams)
    if (!result.success) {
      throw new BadRequestException('Validation error!', result.error.issues)
    }

    const { orderId } = result.data
    const order = await this.orderUseCase.getById(orderId)

    if (!order) {
      throw new BadRequestException(`Order identifier ${orderId} is invalid!`)
    }
    
    if (order.status !== OrderStatus.Created) {
      throw new BadRequestException(`Order already has a pending payment!!`)
    }

    const payment = await this.paymentsUseCase.createOrderPayment(OrderPresenter.EntityToDto(order))
    
    return PaymentPresenter.EntityToDto(payment)
  }

  async confirm(bodyParams: unknown): Promise<void> {
    const schema = z.object({
      paymentId: z.number(),
      orderId: z.number(),
    })
    const result = schema.safeParse(bodyParams)

    if (!result.success) {
      throw new BadRequestException('Validation error!', result.error.issues)
    }

    const { paymentId, orderId } = result.data

    const [payment, order] = await this.validatePaymentAndOrder(
      paymentId,
      orderId,
    )

    const paymentDTO = PaymentPresenter.EntityToDto(payment)
    const orderDTO = OrderPresenter.EntityToDto(order)
  
    await this.paymentsUseCase.confirmOrderPayment(paymentDTO, orderDTO)
    await this.orderUseCase.update(orderDTO.id, OrderStatus.Received)
  }

  async recuse(bodyParams: unknown): Promise<void> {
    const schema = z.object({
      paymentId: z.number(),
      orderId: z.number(),
    })
    const result = schema.safeParse(bodyParams)

    if (!result.success) {
      throw new BadRequestException('Validation error!', result.error.issues)
    }

    const { paymentId, orderId } = result.data

    const [payment, order] = await this.validatePaymentAndOrder(
      paymentId,
      orderId,
    )

    const paymentDTO = PaymentPresenter.EntityToDto(payment)
    const orderDTO = OrderPresenter.EntityToDto(order)
  
    await this.paymentsUseCase.recuseOrderPayment(paymentDTO, orderDTO)
  }

  async getOrder(bodyParams: unknown): Promise<PaymentDTO> {
    const schema = z.object({
      id: z.number(),
    })
    const result = schema.safeParse(bodyParams)

    if (!result.success) {
      throw new BadRequestException('Validation error!', result.error.issues)
    }

    const { id: paymentId } = result.data
    
    const payment = await this.paymentsUseCase.getById(paymentId)
    if (!payment) {
      throw new BadRequestException('Payment not found!')
    }

    return PaymentPresenter.EntityToDto(payment)
  }

  private async validatePaymentAndOrder(
    paymentId: number,
    orderId: number,
  ): Promise<[PaymentEntity, OrderEntity]> {
    return await Promise.all([
      this.validatePayment(paymentId),
      this.validateOrder(orderId),
    ])
  }

  private async validatePayment(paymentId: number): Promise<PaymentEntity> {
    
    const payment = await this.paymentsUseCase.getById(paymentId)
    if (!payment) {
      throw new BadRequestException(
        `Payment identifier ${paymentId} is invalid!`,
      )
    }
    if (payment.status === PaymentStatus.Confirmed) {
      throw new BadRequestException(`Payment has already been made!`)
    }
    return payment
  }

  private async validateOrder(orderId: number): Promise<OrderEntity> {
    const order = await this.orderUseCase.getById(orderId)
    if (!order) {
      throw new BadRequestException(`Order identifier ${orderId} is invalid!`)
    }
    if (order.status !== OrderStatus.PendingPayment) {
      throw new BadRequestException(`Order does not have a pending payment!`)
    }
    return order
  }
}
