import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { QueueServiceAdapter } from "../../gateways/queue-service-adapter";

export class AwsSqsAdapter implements QueueServiceAdapter {
  private readonly client: SQSClient;

  constructor() {
    this.client = new SQSClient({ region: process.env.AWS_REGION })
  }

  async toqueue(order: any): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: process.env.ORDER_QUEUE_FIFO_URL,
      MessageBody: JSON.stringify({ orderId: order}),
      MessageGroupId: this.getDailyMessageGroupId()
    });
    await this.client.send(command);
  }

  dequeue(order: any): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private getDailyMessageGroupId(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

}
