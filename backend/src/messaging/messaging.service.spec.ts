import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';

describe('MessagingService', () => {
  let service: MessagingService;
  const mockChannel = {
    assertQueue: jest.fn().mockResolvedValue(undefined),
    sendToQueue: jest.fn().mockReturnValue(true),
    ack: jest.fn(),
  };

  const mockConnection = {
    createChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const mockAmqplib = {
    connect: jest.fn().mockResolvedValue(mockConnection),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('amqp://localhost:5672'),
          },
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (service as any).amqplib = mockAmqplib;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should connect to RabbitMQ using CLOUDAMQP_URL', async () => {
      await service.publish('email-send', { to: 'test@example.com' });

      expect(mockAmqplib.connect).toHaveBeenCalledWith('amqp://localhost:5672');
    });

    it('should assert the queue before sending', async () => {
      await service.publish('email-send', { to: 'test@example.com' });

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('email-send', {
        durable: true,
      });
    });

    it('should send the serialized data to the correct queue', async () => {
      const data = { to: 'test@example.com', subject: 'Welcome' };

      await service.publish('email-send', data);

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'email-send',
        Buffer.from(JSON.stringify(data)),
        { persistent: true },
      );
    });

    it('should close the connection after publishing', async () => {
      await service.publish('email-send', { to: 'test@example.com' });

      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should publish to different queues correctly', async () => {
      await service.publish('email-error', { error: 'Failed to send' });

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('email-error', {
        durable: true,
      });
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'email-error',
        Buffer.from(JSON.stringify({ error: 'Failed to send' })),
        { persistent: true },
      );
    });

    it('should close connection even if sendToQueue fails', async () => {
      mockChannel.sendToQueue.mockImplementationOnce(() => {
        throw new Error('Queue full');
      });

      await expect(
        service.publish('email-send', { to: 'test@example.com' }),
      ).rejects.toThrow('Queue full');

      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
