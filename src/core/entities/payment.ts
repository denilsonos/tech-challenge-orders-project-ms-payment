import { OrderEntity } from './order'

export class PaymentEntity {
  public id?: number

  public qrCode!: Buffer

  public value!: number

  public status!: string

  public createdAt!: Date

  public updatedAt!: Date

  public order?: OrderEntity

  constructor(
    qrCode: Buffer,
    value: number,
    status: string,
    order?: OrderEntity,
    id?: number
  ) {
    this.qrCode = qrCode
    this.value = value
    this.status = status
    this.order = order
    this.id = id
  }
}
