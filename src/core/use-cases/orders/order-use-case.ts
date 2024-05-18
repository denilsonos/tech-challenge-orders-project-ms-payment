import { QueueServiceAdapter } from "../../../adapters/gateways/queue-service-adapter";
import { OrderRepository } from "../../../adapters/gateways/repositories/order-repository";
import { OrderUseCase } from "../../../adapters/gateways/use-cases/order-use-case";
import { ItemPresenter } from "../../../adapters/presenters/item";
import { OrderPresenter } from "../../../adapters/presenters/order";
import { OrderDAO } from "../../../base/dao/order";
import { ItemDTO } from "../../../base/dto/item";
import { OrderDTO } from "../../../base/dto/order";
import { OrderStatus } from "../../entities/enums/order-status";
import { NotFoundException } from "../../entities/exceptions";
import { OrderEntity } from "../../entities/order";

export class OrderUseCaseImpl implements OrderUseCase {

    constructor(private readonly orderRepository: OrderRepository,
        private readonly queueService: QueueServiceAdapter) { }

    async getById(orderId: number): Promise<OrderEntity | null> {
        const order : OrderDAO | null = await this.orderRepository.getById(orderId)
        if(!order?.id) {
            throw new NotFoundException('Order not found!')
        }

        return  OrderDAO.daoToEntity(order)
    }

    async update(orderId: number, status: string): Promise<void> {
        await this.orderRepository.update(orderId, status)
    }
}