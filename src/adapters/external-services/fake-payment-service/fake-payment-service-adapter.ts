import QRCode from 'qrcode'
import { PaymentServiceAdapter } from '../../gateways/payment-service-adapter'
import { OrderEntity } from '../../../core/entities/order'

export class FakePaymentServiceAdapter implements PaymentServiceAdapter{

  public async create(order: OrderEntity): Promise<string> {
    const valueBrl = order.total.toLocaleString('pr-BR', {
      style: 'currency',
      currency: 'BRL'
    })
    return await QRCode.toDataURL(valueBrl)
  }
}