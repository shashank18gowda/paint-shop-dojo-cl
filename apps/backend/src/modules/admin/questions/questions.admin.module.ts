import { Module } from '@nestjs/common';
import { QuestionsAdminController } from './questions.admin.controller';
import { QuestionsAdminService } from './questions.admin.service';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  controllers: [QuestionsAdminController],
  providers: [QuestionsAdminService, RolesGuard],
})
export class QuestionsAdminModule {}
