import { DataSource } from 'typeorm';
import { DbConnection } from '../gateways/db/db-connection';
import { OrderRepositoryImpl } from './order-repository';
import { DbConnectionImpl } from '../../frameworks/database/db-connection-impl';
import { OrderDAO } from '../../base/dao/order';
import { OrderStatus } from '../../core/entities/enums/order-status';

jest.mock('../gateways/db/db-connection');

describe('OrderRepositoryImpl', () => {
  let mockDbConnection: jest.Mocked<DbConnection>;
  let mockDataSource: jest.Mocked<DataSource>;
  let repository: OrderRepositoryImpl;

  beforeEach(() => {
    mockDbConnection = new DbConnectionImpl() as jest.Mocked<DbConnection>;
    mockDataSource = {} as jest.Mocked<DataSource>;
    mockDbConnection.getConnection = jest.fn().mockReturnValue(mockDataSource);
    repository = new OrderRepositoryImpl(mockDbConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockOrderDAO: OrderDAO = {
    id: 1,
    status: OrderStatus.Received,
    clientId: 1,
    total: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: []
  };

  describe('save', () => {
    it('should save an order', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue(mockOrderDAO),
      });

      const result = await repository.save(mockOrderDAO);
      expect(result).toEqual(mockOrderDAO);
      expect(mockDataSource.getRepository(OrderDAO).save).toHaveBeenCalledWith(mockOrderDAO);
    });
  });

  describe('getById', () => {
    it('should get an order by ID', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockOrderDAO),
      });

      const result = await repository.getById(1);
      expect(result).toEqual(mockOrderDAO);
      expect(mockDataSource.getRepository(OrderDAO).findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['items'] });
    });

    it('should return null if order not found', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.getById(1);
      expect(result).toBeNull();
      expect(mockDataSource.getRepository(OrderDAO).findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['items'] });
    });
  });

  describe('findByParams', () => {
    it('should find orders by parameters', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([mockOrderDAO]),
      });

      const result = await repository.findByParams(1, OrderStatus.Received);
      expect(result).toEqual([mockOrderDAO]);
      expect(mockDataSource.getRepository(OrderDAO).find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        where: { clientId: 1, status: OrderStatus.Received },
        relations: ['items'],
      });
    });
  });

  describe('getAll', () => {
    it('should get all orders with specific status', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          addOrderBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockOrderDAO]),
        }),
      });

      const result = await repository.getAll();
      expect(result).toEqual([mockOrderDAO]);
    });
  });

  describe('update', () => {
    it('should update an order status', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        update: jest.fn().mockResolvedValue(undefined),
      });

      await repository.update(1, OrderStatus.Ready);
      expect(mockDataSource.getRepository(OrderDAO).update).toHaveBeenCalledWith(1, { status: OrderStatus.Ready });
    });
  });
});