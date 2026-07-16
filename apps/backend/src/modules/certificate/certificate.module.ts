import { Module } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { CertificateAdminController } from './certificate.admin.controller';
import { CertificateService } from './certificate.service';

@Module({
  controllers: [CertificateController, CertificateAdminController],
  providers: [CertificateService],
  exports: [CertificateService],
})
export class CertificateModule {}
