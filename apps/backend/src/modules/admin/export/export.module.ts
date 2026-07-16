import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ReportsModule } from '../reports/reports.module';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  imports: [ReportsModule],
  controllers: [ExportController],
  providers: [ExportService, RolesGuard],
  exports: [ExportService],
})
export class ExportModule {}
