import { OrderDAO } from '../../../base/dao/order'

export interface OrderRepository {
  getById(orderId: number): Promise<OrderDAO | null>
  update(orderId: number, status: string): Promise<void>
}
