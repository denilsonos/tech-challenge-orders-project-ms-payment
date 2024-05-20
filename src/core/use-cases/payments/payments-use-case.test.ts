import { defineFeature, loadFeature } from 'jest-cucumber';
import { PaymentRepository } from '../../../adapters/gateways/repositories/payment-repository';
import { OrderRepository } from '../../../adapters/gateways/repositories/order-repository';
import { QueueServiceAdapter } from '../../../adapters/gateways/queue-service-adapter';
import { PaymentServiceAdapter } from '../../../adapters/gateways/payment-service-adapter';
import { PaymentDAO } from '../../../base/dao/payment';
import { PaymentDTO } from '../../../base/dto/payment';
import { OrderDTO } from '../../../base/dto/order';
import { PaymentStatus } from '../../entities/enums/payment-status';
import { OrderStatus } from '../../entities/enums/order-status';
import { PaymentsCaseImpl } from './payments-use-case';
import { PaymentEntity } from '../../entities/payment';

jest.mock('typeorm', () => {
  return {
    Entity: () => jest.fn(),
    PrimaryGeneratedColumn: () => jest.fn(),
    Column: () => jest.fn(),
    CreateDateColumn: () => jest.fn(),
    UpdateDateColumn: () => jest.fn(),
    ManyToMany: () => jest.fn(),
    JoinTable: () => jest.fn(),
    OneToOne: () => jest.fn(),
    JoinColumn: () => jest.fn(),
  }
});

const confirmFeature = loadFeature('src/core/use-cases/payments/features/confirm-payment.feature');
const recuseFeature = loadFeature('src/core/use-cases/payments/features/recuse-payment.feature');
const createFeature = loadFeature('src/core/use-cases/payments/features/create-payment.feature');
const getFeature = loadFeature('src/core/use-cases/payments/features/get-payment.feature');

describe('PaymentsCaseImpl', () => {
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockQueueService: jest.Mocked<QueueServiceAdapter>;
  let mockPaymentService: jest.Mocked<PaymentServiceAdapter>;
  let sut: PaymentsCaseImpl;

  const createMockPaymentRepository = (): jest.Mocked<PaymentRepository> => ({
    update: jest.fn(),
    save: jest.fn(),
    getById: jest.fn(),
  });

  const createMockOrderRepository = (): jest.Mocked<OrderRepository> => ({
    update: jest.fn(),
    getById: jest.fn(),
  });

  const createMockQueueService = (): jest.Mocked<QueueServiceAdapter> => ({
    toqueue: jest.fn(),
    dequeue: jest.fn(),
  });

  const createMockPaymentService = (): jest.Mocked<PaymentServiceAdapter> => ({
    create: jest.fn(),
  });

  const mockOrder = new OrderDTO(
    OrderStatus.Created,
    789,
    new Date(),
    new Date(),
    [],
    456,
    100,
  );

  const mockPayment = new PaymentDTO(
    Buffer.from('mockedQrCodeImage'),
    100,
    PaymentStatus.Pending,
    new Date(),
    new Date(),
    mockOrder,
    123,
  );

  const mockPaymentDAO = {
    id: 123,
    qrCode: Buffer.from('mockedImageData'),
    value: 100,
    status: 'PendingPayment',
    createdAt: new Date(),
    updatedAt: new Date(),
    orderId: 456,
    daoToEntity: jest.fn().mockReturnValue(new PaymentEntity(
      Buffer.from('mockedImageData'),
      100,
      'PendingPayment',
      undefined,
      1
    )),
    transformQRCodeToBuffer: jest.fn(),
    transformBufferToQRCodeData: jest.fn()
  } as unknown as PaymentDAO;


  beforeEach(() => {
    mockPaymentRepository = createMockPaymentRepository();
    mockOrderRepository = createMockOrderRepository();
    mockQueueService = createMockQueueService();
    mockPaymentService = createMockPaymentService();
    sut = new PaymentsCaseImpl(mockPaymentRepository, mockOrderRepository, mockQueueService, mockPaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('confirmOrderPayment', () => {
    defineFeature(confirmFeature, (test) => {
      test('Successfully confirm a payment for an order', ({ given, when, then }) => {
        given('an existing payment with id 123 and an existing order with id 456', async () => {
          mockPaymentRepository.update.mockResolvedValue(undefined);
        });

        when('the confirmOrderPayment method is called with { "paymentId": 123, "orderId": 456 }', async () => {
          await sut.confirmOrderPayment(mockPayment, mockOrder);
        });

        then('the payment status is updated to "Confirmed"', async () => {
          expect(mockPaymentRepository.update).toHaveBeenCalledWith(123, { status: PaymentStatus.Confirmed });
        });
      });
    });
  });

  describe('recuseOrderPayment', () => {
    defineFeature(recuseFeature, (test) => {
      test('Successfully recuse a payment for an order', ({ given, when, then }) => {
        given('an existing payment with id 123 and an existing order with id 456', async () => {
          mockPaymentRepository.update.mockResolvedValue(undefined);
        });

        when('the recuseOrderPayment method is called with { "paymentId": 123, "orderId": 456 }', async () => {
          await sut.recuseOrderPayment(mockPayment, mockOrder);
        });

        then('the payment status is updated to "Recused"', async () => {
          expect(mockPaymentRepository.update).toHaveBeenCalledWith(123, { status: PaymentStatus.Recused });
        });
      });
    });
  });

  describe('createOrderPayment', () => {
    defineFeature(createFeature, (test) => {
      test('Successfully create a payment for an order', ({ given, when, then }) => {
        given('an existing order with id 456 and status "Created"', async () => {
          mockPaymentService.create.mockResolvedValue('mockedQrCodeImage');
          mockOrderRepository.update.mockResolvedValue(undefined);
          mockPaymentRepository.save.mockResolvedValue(mockPaymentDAO)
          mockPaymentRepository.getById.mockResolvedValue(mockPaymentDAO)
        });

        when('the createOrderPayment method is called with { "orderId": 456 }', async () => {
          await sut.createOrderPayment(mockOrder);
        });

        then('a new payment is created and the order status is updated to "PendingPayment"', async () => {
          expect(mockOrderRepository.update).toHaveBeenCalledWith(456, OrderStatus.PendingPayment);
          expect(mockPaymentRepository.save).toHaveBeenCalled();
          expect(mockPaymentRepository.getById).toHaveBeenCalled();
        });
      });
    });
  });

  describe('getById', () => {
    defineFeature(getFeature, (test) => {
      test('Retrieve an existing payment by ID', ({ given, when, then }) => {
        given('an existing payment with id 123', async () => {
          mockPaymentRepository.getById.mockResolvedValue(mockPaymentDAO);
        });

        when('the getById method is called with { "paymentId": 123 }', async () => {
          await sut.getById(123);
        });

        then('the payment details are returned', async () => {
          expect(mockPaymentRepository.getById).toHaveBeenCalledTimes(1);
          expect(mockPaymentRepository.getById).toHaveBeenCalledWith(123);
        });
      });
    });
  });

});
