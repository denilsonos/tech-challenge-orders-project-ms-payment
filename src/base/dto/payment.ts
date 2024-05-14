import { OrderDTO } from './order'

export class PaymentDTO {
  public id?: number

  public qrCode!: Buffer

  public value!: number

  public status!: string

  public createdAt!: Date

  public updatedAt!: Date

  public order?: OrderDTO

  constructor(
    qrCode: Buffer,
    value: number,
    status: string,
    createdAt: Date,
    updatedAt: Date,
    order?: OrderDTO,
    id?: number,
  ) {
    this.qrCode = qrCode
    this.value = value
    this.status = status
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.order = order
    this.id = id
  }
}
