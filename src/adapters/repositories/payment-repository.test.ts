import { DataSource } from 'typeorm';
import { DbConnection } from '../gateways/db/db-connection';
import { PaymentRepositoryImpl } from './payment-repository';
import { DbConnectionImpl } from '../../frameworks/database/db-connection-impl';
import { PaymentDAO } from '../../base/dao/payment';
import { PaymentStatus } from '../../core/entities/enums/payment-status';

jest.mock('../gateways/db/db-connection');

describe('PaymentRepositoryImpl', () => {
  let mockDbConnection: jest.Mocked<DbConnection>;
  let mockDataSource: jest.Mocked<DataSource>;
  let repository: PaymentRepositoryImpl;

  beforeEach(() => {
    mockDbConnection = new DbConnectionImpl() as jest.Mocked<DbConnection>;
    mockDataSource = {} as jest.Mocked<DataSource>;
    mockDbConnection.getConnection = jest.fn().mockReturnValue(mockDataSource);
    repository = new PaymentRepositoryImpl(mockDbConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockPaymentDAO: PaymentDAO = {
    id: 1,
    qrCode: Buffer.from('test'),
    value: 100.00,
    status: PaymentStatus.Pending,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderId: 1
  } as unknown as PaymentDAO;

  describe('save', () => {
    it('should save a payment', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue(mockPaymentDAO),
      });

      const result = await repository.save(mockPaymentDAO);
      expect(result).toEqual(mockPaymentDAO);
      expect(mockDataSource.getRepository(PaymentDAO).save).toHaveBeenCalledWith(mockPaymentDAO);
    });
  });

  describe('getById', () => {
    it('should get a payment by ID', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockPaymentDAO),
      });

      const result = await repository.getById(1);
      expect(result).toEqual(mockPaymentDAO);
      expect(mockDataSource.getRepository(PaymentDAO).findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null if payment not found', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.getById(1);
      expect(result).toBeNull();
      expect(mockDataSource.getRepository(PaymentDAO).findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('update', () => {
    it('should update a payment status', async () => {
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        update: jest.fn().mockResolvedValue(undefined),
      });

      await repository.update(1, { status: PaymentStatus.Confirmed });
      expect(mockDataSource.getRepository(PaymentDAO).update).toHaveBeenCalledWith({ id: 1 }, { status: PaymentStatus.Confirmed });
    });
  });
});
