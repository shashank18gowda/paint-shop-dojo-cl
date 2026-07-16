import { Module } from '@nestjs/common';
import { ReportsModule } from './reports/reports.module';
import { ExportModule } from './export/export.module';
import { QuestionsAdminModule } from './questions/questions.admin.module';
import { ReportRecipientModule } from './report-recipients/report-recipient.module';
import { ReportSchedulerModule } from './report-scheduler/report-scheduler.module';

@Module({
  imports: [ReportsModule, ExportModule, QuestionsAdminModule, ReportRecipientModule, ReportSchedulerModule],
})
export class AdminModule {}
