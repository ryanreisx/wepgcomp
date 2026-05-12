import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { ContactService } from './contact.service';
import { EventEditionService } from '../event-edition/event-edition.service';
import { MessagingService } from '../messaging/messaging.service';
import { PrismaService } from '../prisma/prisma.service';

const mockEdition = {
  id: 'edition-1',
  name: 'WEPGCOMP 2025',
  isActive: true,
};

const mockCoordinator = {
  id: 'cm-1',
  eventEditionId: 'edition-1',
  userId: 'user-coord',
  level: 'Coordinator',
  role: 'OrganizingCommittee',
  user: { id: 'user-coord', email: 'coordinator@ufba.br' },
};

const mockEventEditionService = {
  findActive: jest.fn(),
};

const mockPrisma = {
  committeeMember: {
    findFirst: jest.fn(),
  },
};

const mockMessagingService = {
  publish: jest.fn(),
};

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: EventEditionService, useValue: mockEventEditionService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MessagingService, useValue: mockMessagingService },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    const dto = {
      name: 'João Silva',
      email: 'joao@example.com',
      message: 'Gostaria de mais informações sobre o evento.',
    };

    it('should publish message to queue and return success', async () => {
      mockEventEditionService.findActive.mockResolvedValue(mockEdition);
      mockPrisma.committeeMember.findFirst.mockResolvedValue(mockCoordinator);
      mockMessagingService.publish.mockResolvedValue(undefined);

      const result = await service.send(dto);

      expect(result).toEqual({
        message: 'Mensagem enviada com sucesso',
      });
      expect(mockMessagingService.publish).toHaveBeenCalledWith('email-send', {
        to: 'coordinator@ufba.br',
        from: 'joao@example.com',
        subject: 'Contato via portal — João Silva',
        body: 'Gostaria de mais informações sobre o evento.',
        replyTo: 'joao@example.com',
      });
    });

    it('should throw ServiceUnavailableException when no active edition', async () => {
      mockEventEditionService.findActive.mockRejectedValue(
        new Error('No active event edition found'),
      );

      await expect(service.send(dto)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(mockMessagingService.publish).not.toHaveBeenCalled();
    });

    it('should throw ServiceUnavailableException when no coordinator assigned', async () => {
      mockEventEditionService.findActive.mockResolvedValue(mockEdition);
      mockPrisma.committeeMember.findFirst.mockResolvedValue(null);

      await expect(service.send(dto)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(mockMessagingService.publish).not.toHaveBeenCalled();
    });
  });
});
