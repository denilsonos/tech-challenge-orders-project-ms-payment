import { OrderRepository } from '../gateways/repositories/order-repository'
import { OrderDAO } from '../../base/dao/order'
import axios from 'axios'

const { ORDER_MS_HOST } = process.env

export class RemoteOrderRepositoryImpl implements OrderRepository {
  async getById(orderId: number): Promise<OrderDAO | null> {
    const { data: { order } } = await axios.get(`${ORDER_MS_HOST}/ms-orders/api/v1/orders/${orderId}`)

    return order
  }
  
  async update(orderId: number, status: string): Promise<void> {
    await axios.patch(`${ORDER_MS_HOST}/ms-orders/api/v1/orders/${orderId}`, {
      status
    })
  }
}
