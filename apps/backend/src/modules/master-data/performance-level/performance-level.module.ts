import { Module } from '@nestjs/common';
import { PerformanceLevelAdminController } from './performance-level.admin.controller';
import { PerformanceLevelService } from './performance-level.service';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  controllers: [PerformanceLevelAdminController],
  providers: [PerformanceLevelService, RolesGuard],
})
export class PerformanceLevelModule {}
