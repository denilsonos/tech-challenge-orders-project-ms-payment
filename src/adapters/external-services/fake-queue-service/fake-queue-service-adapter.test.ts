import { OrderDAO } from "../../../base/dao/order";
import { OrderStatus } from "../../../core/entities/enums/order-status";
import { DbConnection } from "../../gateways/db/db-connection";
import { FakeQueue, FakeQueueServiceAdapter } from "./fake-queue-service-adapter";

describe('FakeQueueServiceAdapter', () => {
  let fakeQueueServiceAdapter: FakeQueueServiceAdapter;
  let mockDbConnection: jest.Mocked<DbConnection>;
  let mockOrderDAO: jest.Mocked<OrderDAO>;
  let mockOrderRepository: any;
  let mockQueueRepository: any;

  beforeEach(() => {
    mockDbConnection = {
      getConnection: jest.fn().mockReturnValue({
        getRepository: jest.fn()
      })
    } as any;

    mockOrderDAO = {
      id: 1,
      status: OrderStatus.PendingPayment,
      createdAt: new Date(),
      updatedAt: new Date(),
      clientId: 1,
      total: 100,
      items: []
    } as any;

    mockOrderRepository = {
      update: jest.fn()
    };

    mockQueueRepository = {
      save: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    (mockDbConnection.getConnection().getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity === OrderDAO) return mockOrderRepository;
      if (entity === FakeQueue) return mockQueueRepository;
      return null;
    });

    fakeQueueServiceAdapter = new FakeQueueServiceAdapter(mockDbConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toqueue', () => {
    it('should add an order to the queue and update its status to Received', async () => {
      await fakeQueueServiceAdapter.toqueue(mockOrderDAO);

      expect(mockOrderRepository.update).toHaveBeenCalledWith(mockOrderDAO.id, { status: OrderStatus.Received });
      expect(mockQueueRepository.save).toHaveBeenCalled();
    });

    it('should update the oldest Received order to InPreparation if there are 5 or more Received orders', async () => {
      mockQueueRepository.count.mockResolvedValue(5);
      mockQueueRepository.findOne.mockResolvedValue({
        id: 1,
        status: OrderStatus.Received,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: mockOrderDAO
      });

      await fakeQueueServiceAdapter.toqueue(mockOrderDAO);

      expect(mockQueueRepository.update).toHaveBeenCalledWith(1, { status: OrderStatus.InPreparation });
      expect(mockOrderRepository.update).toHaveBeenCalledWith(mockOrderDAO.id, { status: OrderStatus.InPreparation });
    });

    it('should update the oldest InPreparation order to Ready if there are 2 or more InPreparation orders', async () => {
      mockQueueRepository.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
      mockQueueRepository.findOne.mockResolvedValue({
        id: 1,
        status: OrderStatus.InPreparation,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: mockOrderDAO
      });

      await fakeQueueServiceAdapter.toqueue(mockOrderDAO);

      expect(mockQueueRepository.update).toHaveBeenCalledWith(1, { status: OrderStatus.Ready });
      expect(mockOrderRepository.update).toHaveBeenCalledWith(mockOrderDAO.id, { status: OrderStatus.Ready });
    });
  });

  describe('dequeue', () => {
    it('should remove an order from the queue and delete it', async () => {
      mockQueueRepository.findOne.mockResolvedValue({
        id: 1,
        status: OrderStatus.Ready,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: mockOrderDAO
      });

      await fakeQueueServiceAdapter.dequeue(mockOrderDAO);

      expect(mockQueueRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });
  });
});
