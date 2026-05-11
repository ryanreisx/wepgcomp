import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface CertificateData {
  participantName: string;
  editionName: string;
  eventStartDate: Date;
  eventEndDate: Date;
  participationType: 'presenter' | 'panelist';
  submissionTitle?: string;
  panelistBlocks?: string[];
  awards?: string[];
  issueDate: Date;
}

@Injectable()
export class CertificateGenerator {
  async generate(data: CertificateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc: PDFKit.PDFDocument = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .fontSize(12)
        .text('Universidade Federal da Bahia', { align: 'center' });
      doc.text('Instituto de Computação', { align: 'center' });
      doc.text('Programa de Pós-Graduação em Ciência da Computação', {
        align: 'center',
      });

      doc.moveDown(2);
      doc.fontSize(24).text('CERTIFICADO', { align: 'center' });

      doc.moveDown(2);
      doc.fontSize(14);

      const startDateStr = data.eventStartDate.toLocaleDateString('pt-BR');
      const endDateStr = data.eventEndDate.toLocaleDateString('pt-BR');

      if (data.participationType === 'presenter') {
        doc.text(
          `Certificamos que ${data.participantName} participou como apresentador(a) ` +
            `no ${data.editionName}, realizado de ${startDateStr} a ${endDateStr}, ` +
            `com o trabalho intitulado "${data.submissionTitle}".`,
          { align: 'center' },
        );
      } else {
        const blocksText =
          data.panelistBlocks && data.panelistBlocks.length > 0
            ? ` nas mesas: ${data.panelistBlocks.join(', ')}`
            : '';
        doc.text(
          `Certificamos que ${data.participantName} participou como avaliador(a) ` +
            `no ${data.editionName}, realizado de ${startDateStr} a ${endDateStr}${blocksText}.`,
          { align: 'center' },
        );
      }

      if (data.awards && data.awards.length > 0) {
        doc.moveDown();
        doc.fontSize(12);
        for (const award of data.awards) {
          doc.text(`Premiação: ${award}`, { align: 'center' });
        }
      }

      doc.moveDown(3);
      doc.fontSize(10);
      doc.text(
        `Data de emissão: ${data.issueDate.toLocaleDateString('pt-BR')}`,
        { align: 'center' },
      );

      doc.moveDown(2);
      doc.text('_____________________________', { align: 'center' });
      doc.text('Diretor(a) do IC-UFBA', { align: 'center' });

      doc.moveDown();
      doc.text('_____________________________', { align: 'center' });
      doc.text('Coordenador(a) do PGCOMP', { align: 'center' });

      doc.moveDown();
      doc.text('_____________________________', { align: 'center' });
      doc.text('Coordenador(a) do WEPGCOMP', { align: 'center' });

      doc.end();
    });
  }
}
