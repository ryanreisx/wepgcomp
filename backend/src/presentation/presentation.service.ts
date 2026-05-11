import { Injectable, NotFoundException } from '@nestjs/common';
import { Evaluation, Presentation } from '@prisma/client';
import {
  PresentationRepository,
  PresentationWithSubmission,
} from './presentation.repository';
import { PresentationBlockService } from './presentation-block.service';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';

export interface RankingEntry {
  submissionId: string;
  title: string;
  authorName: string;
  averageScore: number;
}

@Injectable()
export class PresentationService {
  constructor(
    private readonly repository: PresentationRepository,
    private readonly presentationBlockService: PresentationBlockService,
  ) {}

  async create(dto: CreatePresentationDto): Promise<Presentation> {
    const submissionExists = await this.repository.submissionExists(
      dto.submissionId,
    );
    if (!submissionExists) {
      throw new NotFoundException('Submission not found');
    }

    await this.presentationBlockService.findById(dto.presentationBlockId);

    const existing = await this.repository.findBySubmission(dto.submissionId);
    if (existing) {
      await this.repository.delete(existing.id);
    }

    return this.repository.create(dto);
  }

  async findByEdition(
    eventEditionId: string,
  ): Promise<PresentationWithSubmission[]> {
    return this.repository.findByEdition(eventEditionId);
  }

  async findById(id: string): Promise<Presentation> {
    const presentation = await this.repository.findById(id);
    if (!presentation) {
      throw new NotFoundException('Presentation not found');
    }
    return presentation;
  }

  async update(id: string, dto: UpdatePresentationDto): Promise<Presentation> {
    await this.findById(id);

    if (dto.presentationBlockId) {
      await this.presentationBlockService.findById(dto.presentationBlockId);
    }

    return this.repository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async getRanking(
    eventEditionId: string,
    type: 'public' | 'panelists' | 'all',
  ): Promise<RankingEntry[]> {
    const presentations =
      await this.repository.findByEditionWithEvaluations(eventEditionId);

    const ranking: RankingEntry[] = [];

    for (const pres of presentations) {
      const panelistUserIds = new Set(
        pres.presentationBlock.panelists.map((p) => p.userId),
      );

      const publicEvals = this.filterEvaluations(
        pres.submission.evaluations,
        panelistUserIds,
        'public',
      );
      const panelistEvals = this.filterEvaluations(
        pres.submission.evaluations,
        panelistUserIds,
        'panelists',
      );

      const publicScore = this.calculateNotaFinal(publicEvals);
      const evaluatorsScore = this.calculateNotaFinal(panelistEvals);

      await this.repository.updateScores(pres.id, publicScore, evaluatorsScore);

      const selectedEvals = this.filterEvaluations(
        pres.submission.evaluations,
        panelistUserIds,
        type,
      );
      const averageScore = this.calculateNotaFinal(selectedEvals);

      ranking.push({
        submissionId: pres.submissionId,
        title: pres.submission.title,
        authorName: pres.submission.mainAuthor.name,
        averageScore,
      });
    }

    ranking.sort((a, b) => b.averageScore - a.averageScore);
    return ranking;
  }

  private filterEvaluations(
    evaluations: Evaluation[],
    panelistUserIds: Set<string>,
    type: 'public' | 'panelists' | 'all',
  ): Evaluation[] {
    if (type === 'all') return evaluations;
    if (type === 'panelists') {
      return evaluations.filter(
        (e) => e.userId != null && panelistUserIds.has(e.userId),
      );
    }
    return evaluations.filter(
      (e) => e.userId == null || !panelistUserIds.has(e.userId),
    );
  }

  private calculateNotaFinal(evaluations: Evaluation[]): number {
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, e) => acc + e.score, 0);
    const avg = sum / evaluations.length;
    return (avg + evaluations.length) / 2;
  }
}
