
import { defineFeature, loadFeature } from 'jest-cucumber';
import { OrderUseCaseImpl } from './order-use-case';
import { OrderDAO } from '../../../base/dao/order';
import { OrderRepository } from '../../../adapters/gateways/repositories/order-repository';
import { QueueServiceAdapter } from '../../../adapters/gateways/queue-service-adapter';
import { NotFoundException } from '../../entities/exceptions';
import { OrderStatus } from '../../entities/enums/order-status';

const getFeature = loadFeature('src/core/use-cases/orders/features/get-order.feature');
const updateFeature = loadFeature('src/core/use-cases/orders/features/update-order.feature');

describe('OrderUseCaseImpl', () => {
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockQueueService: jest.Mocked<QueueServiceAdapter>;
  let sut: OrderUseCaseImpl;

  const createMockOrderRepository = (): jest.Mocked<OrderRepository> => ({
    getById: jest.fn(),
    update: jest.fn(),
  });

  const createMockQueueService = (): jest.Mocked<QueueServiceAdapter> => ({
    toqueue: jest.fn(),
    dequeue: jest.fn(),
  });

  const mockOrder: OrderDAO = {
    id: 123,
    status: 'CREATED',
    clientId: 456,
    total: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 789,
        quantity: 2,
        name: 'Sample Item',
        description: 'Sample Description',
        category: 'Sample Category',
        value: 50,
        image: Buffer.from('mockedImageData'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],
  };

  beforeEach(() => {
    mockOrderRepository = createMockOrderRepository();
    mockQueueService = createMockQueueService();
    sut = new OrderUseCaseImpl(mockOrderRepository, mockQueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('getById', () => {
    defineFeature(getFeature, (test) => {
      test('Successfully retrieve an existing order by ID', ({ given, when, then }) => {
        given('an existing order with id 123', async () => {
          const order = mockOrder
          order.id = 123
          mockOrderRepository.getById = jest.fn().mockResolvedValue(order);
        });

        when('the getById method is called with { "orderId": 123 }', async () => {
          await sut.getById(123);
        });

        then('the order details are returned', async () => {
          expect(mockOrderRepository.getById).toHaveBeenCalledTimes(1);
          expect(mockOrderRepository.getById).toHaveBeenCalledWith(123);
        });
      });

      test('Attempt to retrieve a non-existent order by ID', ({ given, when, then }) => {
        let exception: NotFoundException
        given('a non-existent order with id 456', async () => {
          mockOrderRepository.getById = jest.fn().mockResolvedValue(null);
        });

        when('the getById method is called with { "orderId": 456 }', async () => {
          sut.getById(456).then().catch((e) => exception = e)
        });

        then('a NotFoundException with message "Order not found!" is thrown', async () => {
          expect(exception.message).toEqual('Order not found!');
        });
      });
    });
  });

  describe('update', () => {
    defineFeature(updateFeature, (test) => {
      test('Successfully update the status of an existing order', ({ given, when, then }) => {
        given('an existing order with id 123', async () => {
          const order = mockOrder
          order.id = 123
          mockOrderRepository.update = jest.fn().mockResolvedValue(order);
        });

        when('the update method is called with { "orderId": 123, "status": "Created" }', async () => {
          await sut.update(123, OrderStatus.Created);
        });

        then('the order status is updated to "Created"', async () => {
          expect(mockOrderRepository.update).toHaveBeenCalledTimes(1);
          expect(mockOrderRepository.update).toHaveBeenCalledWith(123, OrderStatus.Created);
        });
      });
    });
  });
});