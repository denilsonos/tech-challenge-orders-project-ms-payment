import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { OrderDAO } from './order'
import { PaymentEntity } from '../../core/entities/payment'

@Entity('payment')
export class PaymentDAO {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  public id?: number

  @Column({ type: 'longblob', name: 'qrCode' })
  public qrCode!: Buffer

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'value',
    default: 0,
  })
  public value!: number

  @Column({ type: 'varchar', name: 'status' })
  public status!: string

  @CreateDateColumn({ type: 'datetime', name: 'createdAt' })
  public createdAt!: Date

  @UpdateDateColumn({ type: 'datetime', name: 'updatedAt' })
  public updatedAt!: Date

  @Column({ type: 'int', name: 'orderId'})
  public orderId!: number

  // @OneToOne(() => OrderDAO, (order: any) => order.payment)
  // @JoinColumn({ name: "orderId" })
  // public order!: OrderDAO

  public daoToEntity(): PaymentEntity {
    const paymentDTO = new PaymentEntity(
      this.qrCode,
      this.value,
      this.status,
    )
    return paymentDTO
  }

  private transformQRCodeToBuffer(data: string): Buffer {
    const base64 = data.split(',')[1]
    return Buffer.from(base64, 'base64')
  }

  private transformBufferToQRCodeData(buffer: Buffer): string {
    return `data:image/png;base64,${buffer.toString('base64')}`
  }
}
