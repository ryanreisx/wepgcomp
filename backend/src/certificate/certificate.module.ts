import { Module } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { CertificateRepository } from './certificate.repository';
import { CertificateGenerator } from './certificate-generator';
import { EventEditionModule } from '../event-edition/event-edition.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [EventEditionModule, MessagingModule],
  controllers: [CertificateController],
  providers: [CertificateService, CertificateRepository, CertificateGenerator],
  exports: [CertificateService],
})
export class CertificateModule {}
