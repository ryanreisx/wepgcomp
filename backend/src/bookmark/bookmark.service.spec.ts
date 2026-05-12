import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { BookmarkRepository } from './bookmark.repository';

const mockPresentation = {
  id: 'pres-1',
  submissionId: 'sub-1',
  presentationBlockId: 'block-1',
  positionWithinBlock: 1,
  status: 'ToPresent',
  publicAverageScore: null,
  evaluatorsAverageScore: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPresentationWithSubmission = {
  ...mockPresentation,
  submission: {
    id: 'sub-1',
    title: 'A Study on AI',
    mainAuthor: { id: 'user-1', name: 'Alice Silva' },
  },
};

const mockRepository = {
  findPresentationById: jest.fn(),
  isBookmarked: jest.fn(),
  addBookmark: jest.fn(),
  removeBookmark: jest.fn(),
  findByUser: jest.fn(),
};

describe('BookmarkService', () => {
  let service: BookmarkService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarkService,
        { provide: BookmarkRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<BookmarkService>(BookmarkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('add', () => {
    it('should bookmark a valid presentation', async () => {
      mockRepository.findPresentationById.mockResolvedValue(mockPresentation);
      mockRepository.addBookmark.mockResolvedValue(mockPresentation);

      const result = await service.add('user-1', 'pres-1');

      expect(result).toEqual(mockPresentation);
      expect(mockRepository.addBookmark).toHaveBeenCalledWith(
        'user-1',
        'pres-1',
      );
    });

    it('should be idempotent — bookmarking twice does not error', async () => {
      mockRepository.findPresentationById.mockResolvedValue(mockPresentation);
      mockRepository.addBookmark.mockResolvedValue(mockPresentation);

      const result = await service.add('user-1', 'pres-1');

      expect(result).toEqual(mockPresentation);
    });

    it('should throw NotFoundException when presentation does not exist', async () => {
      mockRepository.findPresentationById.mockResolvedValue(null);

      await expect(service.add('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.addBookmark).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an existing bookmark', async () => {
      mockRepository.findPresentationById.mockResolvedValue(mockPresentation);
      mockRepository.removeBookmark.mockResolvedValue(undefined);

      await expect(service.remove('user-1', 'pres-1')).resolves.toBeUndefined();
      expect(mockRepository.removeBookmark).toHaveBeenCalledWith(
        'user-1',
        'pres-1',
      );
    });

    it('should be idempotent — removing nonexistent bookmark does not error', async () => {
      mockRepository.findPresentationById.mockResolvedValue(mockPresentation);
      mockRepository.removeBookmark.mockResolvedValue(undefined);

      await expect(service.remove('user-1', 'pres-1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when presentation does not exist', async () => {
      mockRepository.findPresentationById.mockResolvedValue(null);

      await expect(service.remove('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.removeBookmark).not.toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should return bookmarked presentations for a user', async () => {
      mockRepository.findByUser.mockResolvedValue([
        mockPresentationWithSubmission,
      ]);

      const result = await service.findByUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPresentationWithSubmission);
      expect(mockRepository.findByUser).toHaveBeenCalledWith('user-1');
    });

    it('should return empty array when user has no bookmarks', async () => {
      mockRepository.findByUser.mockResolvedValue([]);

      const result = await service.findByUser('user-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('isBookmarked', () => {
    it('should return true when presentation is bookmarked', async () => {
      mockRepository.isBookmarked.mockResolvedValue(true);

      const result = await service.isBookmarked('user-1', 'pres-1');

      expect(result).toBe(true);
      expect(mockRepository.isBookmarked).toHaveBeenCalledWith(
        'user-1',
        'pres-1',
      );
    });

    it('should return false when presentation is not bookmarked', async () => {
      mockRepository.isBookmarked.mockResolvedValue(false);

      const result = await service.isBookmarked('user-1', 'pres-1');

      expect(result).toBe(false);
    });
  });
});
