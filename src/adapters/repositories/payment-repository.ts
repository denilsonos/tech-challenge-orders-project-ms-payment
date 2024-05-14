import { PaymentRepository } from '../gateways/repositories/payment-repository'
import { PaymentStatus } from '../../core/entities/enums/payment-status'
import { PaymentDAO } from '../../base/dao/payment'
import { DbConnection } from '../gateways/db/db-connection'
export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(private readonly database: DbConnection) { }

  async save(payment: PaymentDAO): Promise<PaymentDAO | any> {
    const repository = this.database.getConnection().getRepository(PaymentDAO)
    return await repository.save(payment)
  }

  async getById(paymentId: number): Promise<PaymentDAO | null> {
    const repository = this.database.getConnection().getRepository(PaymentDAO)
    return await repository.findOne({
      where: { id: paymentId },
      relations: ['order', 'order.items'],
    })
  }

  async update(
    paymentId: number,
    params: { status: PaymentStatus },
  ): Promise<void> {
    const repository = this.database.getConnection().getRepository(PaymentDAO)
    await repository.update({ "id": paymentId }, params)

  }
}
