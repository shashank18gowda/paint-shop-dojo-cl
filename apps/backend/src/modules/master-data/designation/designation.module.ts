import { Module } from '@nestjs/common';
import { DesignationController } from './designation.controller';
import { DesignationAdminController } from './designation.admin.controller'
import { DesignationService } from './designation.service';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  controllers: [DesignationController, DesignationAdminController],
  providers: [DesignationService, RolesGuard],
})
export class DesignationModule {}
