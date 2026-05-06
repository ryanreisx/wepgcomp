import { Module } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { CertificateRepository } from './certificate.repository';

@Module({
  controllers: [CertificateController],
  providers: [CertificateService, CertificateRepository],
  exports: [CertificateService],
})
export class CertificateModule {}
