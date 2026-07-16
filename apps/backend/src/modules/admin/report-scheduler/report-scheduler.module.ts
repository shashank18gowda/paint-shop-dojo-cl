import { Module } from '@nestjs/common';
import { ReportSchedulerAdminController } from './report-scheduler.admin.controller';
import { ReportSchedulerService } from './report-scheduler.service';
import { EmailDispatchHistoryService } from './email-dispatch-history.service';
import { ReportsModule } from '../reports/reports.module';
import { ExportModule } from '../export/export.module';
import { EmailModule } from '../../email/email.module';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  imports: [ReportsModule, ExportModule, EmailModule],
  controllers: [ReportSchedulerAdminController],
  providers: [ReportSchedulerService, EmailDispatchHistoryService, RolesGuard],
  exports: [ReportSchedulerService],
})
export class ReportSchedulerModule {}
