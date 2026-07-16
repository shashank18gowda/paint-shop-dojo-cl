import { Module } from '@nestjs/common';
import { LineController } from './line.controller';
import { LineAdminController } from './line.admin.controller';
import { LineService } from './line.service';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  controllers: [LineController, LineAdminController],
  providers: [LineService, RolesGuard],
})
export class LineModule {}
