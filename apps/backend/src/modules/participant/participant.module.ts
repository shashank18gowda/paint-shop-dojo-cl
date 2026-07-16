import { Module } from '@nestjs/common';
import { ParticipantController } from './participant.controller';
import { ParticipantAdminController } from './participant.admin.controller';
import { ParticipantService } from './participant.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [ParticipantController, ParticipantAdminController],
  providers: [ParticipantService, RolesGuard],
  exports: [ParticipantService],
})
export class ParticipantModule {}
