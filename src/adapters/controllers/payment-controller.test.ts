
import { defineFeature, loadFeature } from 'jest-cucumber';
import { PaymentController } from './payment-controller';
import { OrderRepository } from '../gateways/repositories/order-repository';
import { PaymentServiceAdapter } from '../gateways/payment-service-adapter';
import { PaymentRepository } from '../gateways/repositories/payment-repository';
import { QueueServiceAdapter } from '../gateways/queue-service-adapter';
import { PaymentsUseCase } from '../gateways/use-cases/payments-use-case';
import { OrderUseCase } from '../gateways/use-cases/order-use-case';
import { OrderStatus } from '../../core/entities/enums/order-status';
import { BadRequestException } from '../../core/entities/exceptions';
import { OrderEntity } from '../../core/entities/order';
import { PaymentEntity } from '../../core/entities/payment';
import { OrderPresenter } from '../presenters/order';
import { DbConnection } from '../gateways/db/db-connection';
import { PaymentPresenter } from '../presenters/payment';
import { PaymentStatus } from '../../core/entities/enums/payment-status';

const createFeature = loadFeature('src/adapters/controllers/features/create-payment.feature');
const confirmFeature = loadFeature('src/adapters/controllers/features/confirm-payment.feature');
const recuseFeature = loadFeature('src/adapters/controllers/features/recuse-payment.feature');
const getFeature = loadFeature('src/adapters/controllers/features/get-payment.feature');

describe('PaymentController', () => {
  let mockDbConnection: jest.Mocked<DbConnection>;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockQueueService: jest.Mocked<QueueServiceAdapter>;
  let mockPaymentService: jest.Mocked<PaymentServiceAdapter>;
  let mockOrderUseCase: jest.Mocked<OrderUseCase>;
  let mockPaymentsUseCase: jest.Mocked<PaymentsUseCase>;
  let sut: PaymentController;

  const createMockDbConnection = (): jest.Mocked<DbConnection> => ({
    getConnection: jest.fn(),
  });

  const createMockOrderRepository = (): jest.Mocked<OrderRepository> => ({
    getById: jest.fn(),
    update: jest.fn(),
  });

  const createMockPaymentRepository = (): jest.Mocked<PaymentRepository> => ({
    save: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
  })

  const createMockQueueService = (): jest.Mocked<QueueServiceAdapter> => ({
    toqueue: jest.fn(),
    dequeue: jest.fn(),
  });

  const createMockPaymentService = (): jest.Mocked<PaymentServiceAdapter> => ({
    create: jest.fn()
  });

  const createMockOrderUseCase = (orderRepository: OrderRepository, queueService: QueueServiceAdapter): jest.Mocked<OrderUseCase> => ({
    getById: jest.fn(),
    update: jest.fn(),
  });

  const createMockPaymentsUseCase = (
    paymentRepository: PaymentRepository,
    orderRepository: OrderRepository,
    queueService: QueueServiceAdapter,
    paymentService: PaymentServiceAdapter
  ): jest.Mocked<PaymentsUseCase> => ({
    confirmOrderPayment: jest.fn(),
    recuseOrderPayment: jest.fn(),
    createOrderPayment: jest.fn(),
    getById: jest.fn(),
  });

  const mockPaymentEntity: PaymentEntity = {
    id: 321,
    qrCode: Buffer.from('mockedQRCode'),
    value: 100,
    status: 'Pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockOrderEntity: OrderEntity = {
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ],
    payment: mockPaymentEntity
  };

  beforeEach(() => {
    mockDbConnection = createMockDbConnection();
    mockOrderRepository = createMockOrderRepository();
    mockPaymentRepository = createMockPaymentRepository();
    mockQueueService = createMockQueueService();
    mockPaymentService = createMockPaymentService();
    mockOrderUseCase = createMockOrderUseCase(mockOrderRepository, mockQueueService);
    mockPaymentsUseCase = createMockPaymentsUseCase(
      mockPaymentRepository,
      mockOrderRepository,
      mockQueueService,
      mockPaymentService
    );

    sut = new PaymentController(mockDbConnection);
    sut['orderRepository'] = mockOrderRepository;
    sut['paymentRepository'] = mockPaymentRepository;
    sut['queueService'] = mockQueueService;
    sut['paymentService'] = mockPaymentService;
    sut['orderUseCase'] = mockOrderUseCase;
    sut['paymentsUseCase'] = mockPaymentsUseCase;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });


  describe('create', () => {
    defineFeature(createFeature, (test) => {
      test('Successfully create payment for a valid order', ({ given, when, then }) => {
        given('an existing order with id 123', async () => {
          const order = mockOrderEntity
          order.id = 123
          order.status = OrderStatus.Created
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
        });

        when('the create method is called with { "orderId": 123 }', async () => {
          mockPaymentsUseCase.createOrderPayment = jest.fn().mockResolvedValue(mockPaymentEntity)
          await sut.create({ orderId: 123 });
        });

        then('a payment for order 123 is successfully created', async () => {
          expect(mockPaymentsUseCase.createOrderPayment).toHaveBeenCalledWith(OrderPresenter.EntityToDto(mockOrderEntity));
        });
      });

      test('Attempt to create payment for an invalid order', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an order with id 456 does not exist', async () => {
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(undefined);
        });

        when('the create method is called with { "orderId": 456 }', async () => {
          sut.create({ orderId: 456 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Order identifier 456 is invalid!" is thrown', async () => {
          expect(mockPaymentsUseCase.createOrderPayment).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Order identifier 456 is invalid!');
        });
      });

      test('Attempt to create payment for an order with status other than Created', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an existing order with id 789 with status Shipped', async () => {
          const order = mockOrderEntity
          order.status = OrderStatus.PendingPayment
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
        });

        when('the create method is called with { "orderId": 789 }', async () => {
          sut.create({ orderId: 789 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Order already has a pending payment!" is thrown', async () => {
          expect(mockPaymentsUseCase.createOrderPayment).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Order already has a pending payment!');
        });
      });

      test('Attempt to create payment with invalid payload', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an invalid payload { "orderId": "invalid" }', async () => {
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(undefined);
        });

        when('the create method is called', async () => {
          sut.create({ orderId: 'invalid' }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Validation error!" is thrown', async () => {
          expect(mockPaymentsUseCase.createOrderPayment).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Validation error!');
        });
      });
    });
  });

  describe('confirm', () => {
    defineFeature(confirmFeature, (test) => {
      test('Successfully confirm payment for an order', ({ given, when, then }) => {
        given('an existing payment with id 123 and an existing order with id 456', async () => {
          const payment = mockPaymentEntity
          const order = mockOrderEntity
          payment.id = 123
          order.id = 456
          order.status = OrderStatus.PendingPayment
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(payment);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the confirm method is called with { "paymentId": 123, "orderId": 456 }', async () => {
          await sut.confirm({ paymentId: 123, orderId: 456 });
        });

        then('the payment for order 456 is confirmed and the order status is set to Received', async () => {
          const payment = PaymentPresenter.EntityToDto(mockPaymentEntity)
          const order = OrderPresenter.EntityToDto(mockOrderEntity)
          payment.id = 123
          order.id = 456
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledWith(payment, order);
          expect(mockOrderUseCase.update).toHaveBeenCalledWith(order.id, OrderStatus.Received);
        });
      });

      test('Attempt to confirm payment with invalid payment payload', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an invalid payload { "paymentId": "invalid", "orderId": 987 }', async () => {
          const order = mockOrderEntity
          order.id = 987
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(undefined);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the confirm method is called', async () => {
          sut.confirm({ paymentId: 'invalid', orderId: 987 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Validation error!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Validation error!')
        });
      });

      test('Attempt to confirm payment for a non-existent payment', ({ given, when, then }) => {
        let exception: BadRequestException
        given('a non-existent payment with id 789 and an existing order with id 456', async () => {
          const order = mockOrderEntity
          order.id = 456
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(undefined);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the confirm method is called with { "paymentId": 789, "orderId": 456 }', async () => {
          sut.confirm({ paymentId: 789, orderId: 456 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Payment identifier 789 is invalid!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Payment identifier 789 is invalid!')
        });
      });

      test('Attempt to confirm payment for a payment that has already been made', ({ given, when, then }) => {
        let exception: BadRequestException
        given('a payment with id 123 that has already been confirmed and an existing order with id 456', async () => {
          const payment = mockPaymentEntity
          const order = mockOrderEntity
          payment.id = 123
          payment.status = PaymentStatus.Confirmed
          order.id = 456
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(payment);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the confirm method is called with { "paymentId": 123, "orderId": 456 }', async () => {
          sut.confirm({ paymentId: 123, orderId: 456 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Payment has already been made!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Payment has already been made!')
        });
      });

      test('Attempt to confirm payment for a non-existent order', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an existing payment with id 123 and a non-existent order with id 987', async () => {
          const payment = mockPaymentEntity
          payment.id = 123
          payment.status = PaymentStatus.Pending
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(payment);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(null);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the confirm method is called with { "paymentId": 123, "orderId": 987 }', async () => {
          sut.confirm({ paymentId: 123, orderId: 987 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Order identifier 987 is invalid!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Order identifier 987 is invalid!')
        });
      });

      test('Attempt to confirm payment for an order that does not have a pending payment', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an existing payment with id 123 and an order with id 456 that does not have a pending payment', async () => {
          const payment = mockPaymentEntity
          payment.id = 123
          payment.status = PaymentStatus.Pending
          const order = mockOrderEntity
          order.id = 456
          order.status = OrderStatus.Finished
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(payment);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the confirm method is called with { "paymentId": 123, "orderId": 456 }', async () => {
          sut.confirm({ paymentId: 123, orderId: 456 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Order does not have a pending payment!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Order does not have a pending payment!')
        });
      });
    });
  });

  describe('recuse', () => {
    defineFeature(recuseFeature, (test) => {
      test('Successfully recuse payment for an order', ({ given, when, then }) => {
        given('an existing payment with id 123 and an existing order with id 456', async () => {
          const payment = mockPaymentEntity
          const order = mockOrderEntity
          payment.id = 123
          order.id = 456
          order.status = OrderStatus.PendingPayment
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(payment);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.recuseOrderPayment = jest.fn();
        });

        when('the recuse method is called with { "paymentId": 123, "orderId": 456 }', async () => {
          await sut.recuse({ paymentId: 123, orderId: 456 });
        });

        then('the payment for order 456 is recused and the order status is set to Recused', async () => {
          const payment = PaymentPresenter.EntityToDto(mockPaymentEntity)
          const order = OrderPresenter.EntityToDto(mockOrderEntity)
          payment.id = 123
          order.id = 456
          expect(mockPaymentsUseCase.recuseOrderPayment).toHaveBeenCalledWith(payment, order);
        });
      });

      test('Attempt to recuse payment with invalid payment payload', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an invalid payload { "paymentId": "invalid", "orderId": 987 }', async () => {
          const order = mockOrderEntity
          order.id = 987
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(undefined);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the recuse method is called', async () => {
          sut.recuse({ paymentId: 'invalid', orderId: 987 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Validation error!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Validation error!')
        });
      });

      test('Attempt to recuse payment for a non-existent payment', ({ given, when, then }) => {
        let exception: BadRequestException
        given('a non-existent payment with id 789 and an existing order with id 456', async () => {
          const order = mockOrderEntity
          order.id = 456
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(undefined);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the recuse method is called with { "paymentId": 789, "orderId": 456 }', async () => {
          sut.recuse({ paymentId: 789, orderId: 456 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Payment identifier 789 is invalid!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Payment identifier 789 is invalid!')
        });
      });

      test('Attempt to recuse payment for a payment that has already been made', ({ given, when, then }) => {
        let exception: BadRequestException
        given('a payment with id 123 that has already been confirmed and an existing order with id 456', async () => {
          const payment = mockPaymentEntity
          const order = mockOrderEntity
          payment.id = 123
          payment.status = PaymentStatus.Confirmed
          order.id = 456
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(payment);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the recuse method is called with { "paymentId": 123, "orderId": 456 }', async () => {
          sut.recuse({ paymentId: 123, orderId: 456 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Payment has already been made!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Payment has already been made!')
        });
      });

      test('Attempt to recuse payment for a non-existent order', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an existing payment with id 123 and a non-existent order with id 987', async () => {
          const payment = mockPaymentEntity
          payment.id = 123
          payment.status = PaymentStatus.Pending
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(payment);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(null);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the recuse method is called with { "paymentId": 123, "orderId": 987 }', async () => {
          sut.recuse({ paymentId: 123, orderId: 987 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Order identifier 987 is invalid!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Order identifier 987 is invalid!')
        });
      });

      test('Attempt to recuse payment for an order that does not have a pending payment', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an existing payment with id 123 and an order with id 456 that does not have a pending payment', async () => {
          const payment = mockPaymentEntity
          payment.id = 123
          payment.status = PaymentStatus.Pending
          const order = mockOrderEntity
          order.id = 456
          order.status = OrderStatus.Finished
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(payment);
          mockOrderUseCase.getById = jest.fn().mockResolvedValue(order);
          mockPaymentsUseCase.confirmOrderPayment = jest.fn();
          mockOrderUseCase.update = jest.fn();
        });

        when('the recuse method is called with { "paymentId": 123, "orderId": 456 }', async () => {
          sut.recuse({ paymentId: 123, orderId: 456 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Order does not have a pending payment!" is thrown', async () => {
          expect(mockPaymentsUseCase.confirmOrderPayment).toHaveBeenCalledTimes(0);
          expect(mockOrderUseCase.update).toHaveBeenCalledTimes(0);
          expect(exception.message).toEqual('Order does not have a pending payment!')
        });
      });
    });
  });

  describe('get', () => {
    defineFeature(getFeature, (test) => {
      test('Successfully retrieve payment details', ({ given, when, then }) => {
        given('an existing payment with id 123', async () => {
          const payment = mockPaymentEntity
          payment.id = 123
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(payment);
        });

        when('the getPayment method is called with { "id": 123 }', async () => {
          await sut.getPayment({ id: 123 });
        });

        then('the details of payment 123 are returned', async () => {
          const payment = mockPaymentEntity
          payment.id = 123
          expect(mockPaymentsUseCase.getById).toHaveBeenCalledWith(payment.id);
        });
      });

      test('Attempt to retrieve payment details with invalid parameters', ({ given, when, then }) => {
        let exception: BadRequestException
        given('an invalid paymentId', async () => {
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(null);
        });

        when('the getPayment method is called with { "id": "invalid" }', async () => {
          sut.getPayment({ id: 'invalid' }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Validation error!" is thrown', async () => {
          expect(exception.message).toEqual('Validation error!');
        });
      });

      test('Attempt to retrieve details for a non-existent payment', ({ given, when, then }) => {
        let exception: BadRequestException
        given('a non-existent payment with id 456', async () => {
          mockPaymentsUseCase.getById = jest.fn().mockResolvedValue(null);
        });

        when('the getPayment method is called with { "id": 456 }', async () => {
          sut.getPayment({ id: 456 }).then().catch((e) => exception = e)
        });

        then('a BadRequestException with message "Payment not found!" is thrown', async () => {
          expect(exception.message).toEqual('Payment not found!');
        });
      });
    });
  });
});