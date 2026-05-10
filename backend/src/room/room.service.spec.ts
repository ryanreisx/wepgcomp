import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomRepository } from './room.repository';
import { EventEditionService } from '../event-edition/event-edition.service';

const mockRoom = {
  id: 'room-1',
  eventEditionId: 'edition-1',
  name: 'Sala A',
  description: 'Sala principal',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEdition = {
  id: 'edition-1',
  name: 'WEPGCOMP 2025',
};

const mockRepository = {
  create: jest.fn(),
  findByEdition: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
};

const mockEventEditionService = {
  findById: jest.fn(),
};

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: RoomRepository, useValue: mockRepository },
        { provide: EventEditionService, useValue: mockEventEditionService },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      eventEditionId: 'edition-1',
      name: 'Sala A',
      description: 'Sala principal',
    };

    it('should create a room when edition exists', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.create.mockResolvedValue(mockRoom);

      const result = await service.create(createDto);

      expect(result).toEqual(mockRoom);
      expect(mockEventEditionService.findById).toHaveBeenCalledWith(
        'edition-1',
      );
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw NotFoundException when edition does not exist', async () => {
      mockEventEditionService.findById.mockRejectedValue(
        new NotFoundException('Event edition not found'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should create a room without description', async () => {
      const dtoWithoutDesc = {
        eventEditionId: 'edition-1',
        name: 'Sala B',
      };
      const roomWithoutDesc = {
        ...mockRoom,
        id: 'room-2',
        name: 'Sala B',
        description: null,
      };
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.create.mockResolvedValue(roomWithoutDesc);

      const result = await service.create(dtoWithoutDesc);

      expect(result.description).toBeNull();
    });
  });

  describe('findByEdition', () => {
    it('should return rooms for a given edition', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue([mockRoom]);

      const result = await service.findByEdition('edition-1');

      expect(result).toHaveLength(1);
      expect(mockRepository.findByEdition).toHaveBeenCalledWith('edition-1');
    });

    it('should return empty array when edition has no rooms', async () => {
      mockEventEditionService.findById.mockResolvedValue(mockEdition);
      mockRepository.findByEdition.mockResolvedValue([]);

      const result = await service.findByEdition('edition-1');

      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException when edition does not exist', async () => {
      mockEventEditionService.findById.mockRejectedValue(
        new NotFoundException('Event edition not found'),
      );

      await expect(service.findByEdition('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete room when found', async () => {
      mockRepository.findById.mockResolvedValue(mockRoom);
      mockRepository.delete.mockResolvedValue(mockRoom);

      const result = await service.remove('room-1');

      expect(result).toEqual(mockRoom);
      expect(mockRepository.delete).toHaveBeenCalledWith('room-1');
    });

    it('should throw NotFoundException when room not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
