import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToMany } from 'typeorm'
import { ItemDAO } from './item'
import { PaymentDAO } from './payment'
import { FakeQueue } from '../../adapters/external-services/fake-queue-service/fake-queue-service-adapter'
import { OrderEntity } from '../../core/entities/order'

export class OrderDAO {
  
  public id?: number

  
  public status!: string

  
  public clientId: number | undefined

  
  public total!: number

  
  public createdAt!: Date;

  
  public updatedAt!: Date;

  
  public items?: ItemDAO[]
  
  public queue?: FakeQueue

  constructor() { }

  static daoToEntity(orderDao: OrderDAO): OrderEntity {
    const itemsOrder = ItemDAO.daosToEntities(orderDao?.items!)

    return new OrderEntity(orderDao.status, orderDao.clientId, orderDao.total,
       orderDao.createdAt, orderDao.updatedAt, itemsOrder, orderDao.id!);       
  }

  static daosToEntities(orderDaos: OrderDAO[]): OrderEntity[] {

    const listEntities: OrderEntity[] = [];

    orderDaos.forEach(orderDAO => {
      listEntities.push(OrderDAO.daoToEntity(orderDAO))
    });

    return listEntities;
  }

}