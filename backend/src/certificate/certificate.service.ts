import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Certificate } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { CertificateRepository } from './certificate.repository';
import { CertificateGenerator, CertificateData } from './certificate-generator';
import { EventEditionService } from '../event-edition/event-edition.service';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class CertificateService {
  private readonly uploadDir: string;

  constructor(
    private readonly repository: CertificateRepository,
    private readonly eventEditionService: EventEditionService,
    private readonly certificateGenerator: CertificateGenerator,
    private readonly messagingService: MessagingService,
    configService: ConfigService,
  ) {
    this.uploadDir = configService.get<string>('UPLOAD_DIR', 'uploads');
  }

  async generateAll(eventEditionId: string): Promise<Certificate[]> {
    const edition = await this.eventEditionService.findById(eventEditionId);

    await this.repository.deleteByEdition(eventEditionId);

    const participants = await this.repository.getParticipants(eventEditionId);
    const presentations =
      await this.repository.getPresentationsWithScores(eventEditionId);
    const awardedPanelists =
      await this.repository.getAwardedPanelists(eventEditionId);

    const awardedUserIds = new Set(awardedPanelists.map((a) => a.userId));

    const presenterSubmissionMap = new Map<
      string,
      {
        title: string;
        publicScore: number | null;
        evaluatorsScore: number | null;
      }
    >();
    const panelistBlockMap = new Map<string, string[]>();

    for (const pres of presentations) {
      presenterSubmissionMap.set(pres.submission.mainAuthor.id, {
        title: pres.submission.title,
        publicScore: pres.publicAverageScore,
        evaluatorsScore: pres.evaluatorsAverageScore,
      });

      for (const panelist of pres.presentationBlock.panelists) {
        const blocks = panelistBlockMap.get(panelist.userId) || [];
        const blockTitle =
          (pres.presentationBlock as { title?: string | null }).title ||
          `Bloco ${pres.presentationBlock.id.slice(0, 8)}`;
        blocks.push(blockTitle);
        panelistBlockMap.set(panelist.userId, blocks);
      }
    }

    const certDir = path.join(this.uploadDir, 'certificates', eventEditionId);
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    const certificates: Certificate[] = [];
    const issueDate = new Date();

    for (const participant of participants) {
      const submissionInfo = presenterSubmissionMap.get(participant.id);
      const isPresenter = !!submissionInfo;
      const isPanelist = panelistBlockMap.has(participant.id);

      const awards: string[] = [];
      if (isPresenter && awardedUserIds.has(participant.id)) {
        const ranking = this.findRankingPosition(presentations, participant.id);
        if (ranking.isTopPublic) {
          awards.push('Escolha do Público');
        }
        if (ranking.isTopEvaluators) {
          awards.push('Escolha dos Avaliadores');
        }
        if (awards.length === 0) {
          awards.push('Avaliador Premiado');
        }
      }

      const participationType: 'presenter' | 'panelist' = isPresenter
        ? 'presenter'
        : 'panelist';

      const certData: CertificateData = {
        participantName: participant.name,
        editionName: edition.name,
        eventStartDate: edition.startDate,
        eventEndDate: edition.endDate,
        participationType,
        submissionTitle: isPresenter ? submissionInfo?.title : undefined,
        panelistBlocks: isPanelist
          ? panelistBlockMap.get(participant.id)
          : undefined,
        awards: awards.length > 0 ? awards : undefined,
        issueDate,
      };

      const pdfBuffer = await this.certificateGenerator.generate(certData);

      const filePath = path.join(
        'certificates',
        eventEditionId,
        `${participant.id}.pdf`,
      );
      const fullPath = path.join(this.uploadDir, filePath);
      fs.writeFileSync(fullPath, pdfBuffer);

      const certificate = await this.repository.create({
        eventEditionId,
        userId: participant.id,
        filePath,
      });

      await this.messagingService.publish('certificate-email', {
        certificateId: certificate.id,
        userId: participant.id,
        email: participant.email,
      });

      certificates.push(certificate);
    }

    return certificates;
  }

  async findMy(userId: string): Promise<Certificate[]> {
    return this.repository.findByUser(userId);
  }

  async download(
    id: string,
    userId: string,
    userLevel: string,
  ): Promise<Certificate> {
    const certificate = await this.repository.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const isOwner = certificate.userId === userId;
    const isAdmin = userLevel === 'Admin' || userLevel === 'Superadmin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to download this certificate',
      );
    }

    return certificate;
  }

  private findRankingPosition(
    presentations: Array<{
      submission: { mainAuthor: { id: string } };
      publicAverageScore: number | null;
      evaluatorsAverageScore: number | null;
    }>,
    userId: string,
  ) {
    const sorted = [...presentations].filter(
      (p) => p.publicAverageScore != null,
    );

    const publicSorted = [...sorted].sort(
      (a, b) => (b.publicAverageScore ?? 0) - (a.publicAverageScore ?? 0),
    );
    const evaluatorsSorted = [...sorted].sort(
      (a, b) =>
        (b.evaluatorsAverageScore ?? 0) - (a.evaluatorsAverageScore ?? 0),
    );

    const isTopPublic =
      publicSorted.length > 0 &&
      publicSorted[0].submission.mainAuthor.id === userId;
    const isTopEvaluators =
      evaluatorsSorted.length > 0 &&
      evaluatorsSorted[0].submission.mainAuthor.id === userId;

    return { isTopPublic, isTopEvaluators };
  }
}
