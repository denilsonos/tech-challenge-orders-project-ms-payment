import QRCode from 'qrcode';
import { FakePaymentServiceAdapter } from './fake-payment-service-adapter';
import { OrderEntity } from '../../../core/entities/order';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

describe('FakePaymentServiceAdapter', () => {
  let paymentServiceAdapter: FakePaymentServiceAdapter;
  let mockOrder: OrderEntity;

  beforeEach(() => {
    paymentServiceAdapter = new FakePaymentServiceAdapter();
    mockOrder = new OrderEntity(
      'Pending',
      123,
      100.0,
      new Date(),
      new Date(),
      [],
      1,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a QR code for the order total in BRL', async () => {
    const qrCodeData = 'mockQRCodeData';
    (QRCode.toDataURL as jest.Mock).mockResolvedValue(qrCodeData);

    const result = await paymentServiceAdapter.create(mockOrder);

    expect(QRCode.toDataURL).toHaveBeenCalledTimes(1);
    expect(QRCode.toDataURL).toHaveBeenCalledWith('R$ 100,00');
    expect(result).toBe(qrCodeData);
  });

  it('should handle different order totals correctly', async () => {
    const qrCodeData = 'mockQRCodeData';
    (QRCode.toDataURL as jest.Mock).mockResolvedValue(qrCodeData);

    mockOrder.total = 2500.45;
    const result = await paymentServiceAdapter.create(mockOrder);

    expect(QRCode.toDataURL).toHaveBeenCalledWith('R$ 2.500,45');
    expect(result).toBe(qrCodeData);
  });
});
