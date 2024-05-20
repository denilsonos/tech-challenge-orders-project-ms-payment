process.env.ORDER_MS_HOST = 'http://localhost:3000';
import axios from 'axios';
import { RemoteOrderRepositoryImpl } from './remote-order-repository';
import { OrderDAO } from '../../base/dao/order';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RemoteOrderRepositoryImpl', () => {
  let repository: RemoteOrderRepositoryImpl;

  beforeEach(() => {
    repository = new RemoteOrderRepositoryImpl();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockOrderDAO: OrderDAO = {
    id: 1,
    clientId: 1,
    status: 'Pending',
    total: 100.00,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: []
  };

  describe('getById', () => {
    it('should get an order by ID', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { order: mockOrderDAO }
      });

      const result = await repository.getById(1);
      expect(result).toEqual(mockOrderDAO);
      expect(mockedAxios.get).toHaveBeenCalledWith(`http://localhost:3000/ms-orders/api/v1/orders/1`);
    });

    it('should return null if order is not found', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { order: null }
      });

      const result = await repository.getById(1);
      expect(result).toBeNull();
      expect(mockedAxios.get).toHaveBeenCalledWith(`http://localhost:3000/ms-orders/api/v1/orders/1`);
    });
  });

  describe('update', () => {
    it('should update an order status', async () => {
      mockedAxios.patch.mockResolvedValue({});

      await repository.update(1, 'Completed');
      expect(mockedAxios.patch).toHaveBeenCalledWith(`http://localhost:3000/ms-orders/api/v1/orders/1`, { status: 'Completed' });
    });
  });
});
