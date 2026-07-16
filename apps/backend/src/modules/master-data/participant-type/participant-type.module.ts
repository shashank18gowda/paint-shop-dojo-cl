import { Module } from '@nestjs/common';
import { ParticipantTypeController } from './participant-type.controller';
import { ParticipantTypeAdminController } from './participant-type.admin.controller';
import { ParticipantTypeService } from './participant-type.service';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  controllers: [ParticipantTypeController, ParticipantTypeAdminController],
  providers: [ParticipantTypeService, RolesGuard],
})
export class ParticipantTypeModule {}
