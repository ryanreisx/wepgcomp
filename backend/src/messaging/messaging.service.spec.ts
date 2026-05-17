import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { MessagingService } from './messaging.service';

describe('MessagingService', () => {
  let service: MessagingService;

  const mockClientProxy = {
    emit: jest.fn(),
    connect: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: 'EMAIL_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should emit data to the correct queue pattern', async () => {
      mockClientProxy.emit.mockReturnValue(of(undefined));

      await service.publish('email-send', { to: 'test@example.com' });

      expect(mockClientProxy.emit).toHaveBeenCalledWith('email-send', {
        to: 'test@example.com',
      });
    });

    it('should publish to different queues correctly', async () => {
      mockClientProxy.emit.mockReturnValue(of(undefined));

      await service.publish('email-error', { error: 'Failed to send' });

      expect(mockClientProxy.emit).toHaveBeenCalledWith('email-error', {
        error: 'Failed to send',
      });
    });

    it('should propagate errors from the client', async () => {
      mockClientProxy.emit.mockReturnValue(
        throwError(() => new Error('Connection refused')),
      );

      await expect(
        service.publish('email-send', { to: 'test@example.com' }),
      ).rejects.toThrow('Connection refused');
    });

    it('should call emit exactly once per publish', async () => {
      mockClientProxy.emit.mockReturnValue(of(undefined));

      await service.publish('email-send', { data: 'test' });

      expect(mockClientProxy.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle complex data payloads', async () => {
      mockClientProxy.emit.mockReturnValue(of(undefined));
      const payload = {
        email: 'user@ufba.br',
        name: 'Test User',
        token: 'abc-123',
        type: 'password-reset',
      };

      await service.publish('email-send', payload);

      expect(mockClientProxy.emit).toHaveBeenCalledWith(
        'email-send',
        payload,
      );
    });

    it('should emit to email-rate-limit queue', async () => {
      mockClientProxy.emit.mockReturnValue(of(undefined));

      await service.publish('email-rate-limit', { count: 100 });

      expect(mockClientProxy.emit).toHaveBeenCalledWith('email-rate-limit', {
        count: 100,
      });
    });

    it('should resolve without returning data', async () => {
      mockClientProxy.emit.mockReturnValue(of(undefined));

      const result = await service.publish('email-send', { to: 'a@b.com' });

      expect(result).toBeUndefined();
    });
  });
});
