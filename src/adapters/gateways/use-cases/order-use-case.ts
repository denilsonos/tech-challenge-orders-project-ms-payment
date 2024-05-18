import { OrderEntity } from "../../../core/entities/order";

export interface OrderUseCase {
    getById(orderId: number): Promise<OrderEntity | null>
    update(orderId: number, status: string): Promise<void>
}