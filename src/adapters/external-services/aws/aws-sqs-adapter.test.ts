import { SQSClient } from "@aws-sdk/client-sqs";
import { AwsSqsAdapter } from "./aws-sqs-adapter";


jest.mock("@aws-sdk/client-sqs");

describe('AwsSqsAdapter', () => {
  let sut: AwsSqsAdapter;
  let sendMessageMock: jest.Mock;

  beforeEach(() => {
    process.env.ORDER_QUEUE_FIFO_URL = "https://.../OrderQueue.fifo"
    sendMessageMock = jest.fn();
    SQSClient.prototype.send = sendMessageMock;
    sut = new AwsSqsAdapter();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should send message to SQS queue with correct parameters', async () => {
    const mockMessageId = 'mockMessageId';
    sendMessageMock.mockResolvedValue({ MessageId: mockMessageId });

    await sut.toqueue(123);
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });
  test('should handle errors from SQS client', async () => {
    sendMessageMock.mockRejectedValue(new Error('SQS Error'));

    const order = { id: '123' };
    await expect(sut.toqueue(order)).rejects.toThrow('SQS Error');
  });
});
