import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Submission, UserLevel } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SubmissionRepository } from './submission.repository';
import { EventEditionService } from '../event-edition/event-edition.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

@Injectable()
export class SubmissionService {
  private readonly uploadDir: string;

  constructor(
    private readonly repository: SubmissionRepository,
    private readonly eventEditionService: EventEditionService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
  }

  async create(
    dto: CreateSubmissionDto,
    mainAuthorId: string,
    file: Express.Multer.File,
  ): Promise<Submission> {
    const edition = await this.eventEditionService.findById(dto.eventEditionId);
    if (new Date() > edition.submissionDeadline) {
      throw new BadRequestException('Submission deadline has passed');
    }

    const advisorExists = await this.repository.userExists(dto.advisorId);
    if (!advisorExists) {
      throw new NotFoundException('Advisor not found');
    }

    const id = randomUUID();
    const relativePath = `submissions/${id}/paper.pdf`;
    await this.saveFile(id, file);

    return this.repository.create({
      id,
      ...dto,
      mainAuthorId,
      pdfFile: relativePath,
    });
  }

  async findAll(eventEditionId?: string): Promise<Submission[]> {
    return this.repository.findAll(eventEditionId);
  }

  async findById(id: string): Promise<Submission> {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async findByAuthor(mainAuthorId: string): Promise<Submission[]> {
    return this.repository.findByAuthor(mainAuthorId);
  }

  async update(
    id: string,
    dto: UpdateSubmissionDto,
    callerId: string,
    callerLevel: UserLevel,
    file?: Express.Multer.File,
  ): Promise<Submission> {
    const submission = await this.findById(id);

    const isAdmin =
      callerLevel === UserLevel.Admin || callerLevel === UserLevel.Superadmin;
    if (!isAdmin && submission.mainAuthorId !== callerId) {
      throw new ForbiddenException(
        'Only the author or an admin can update this submission',
      );
    }

    if (dto.advisorId) {
      const advisorExists = await this.repository.userExists(dto.advisorId);
      if (!advisorExists) {
        throw new NotFoundException('Advisor not found');
      }
    }

    const updateData: Record<string, unknown> = { ...dto };

    if (file) {
      const relativePath = `submissions/${id}/paper.pdf`;
      await this.saveFile(id, file);
      updateData.pdfFile = relativePath;
    }

    return this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  private async saveFile(
    submissionId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const dir = path.join(this.uploadDir, 'submissions', submissionId);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, 'paper.pdf');
    await fs.writeFile(filePath, file.buffer);
  }
}
