import { Module } from '@nestjs/common';
import { ReportRecipientAdminController } from './report-recipient.admin.controller';
import { ReportRecipientService } from './report-recipient.service';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  controllers: [ReportRecipientAdminController],
  providers: [ReportRecipientService, RolesGuard],
})
export class ReportRecipientModule {}
