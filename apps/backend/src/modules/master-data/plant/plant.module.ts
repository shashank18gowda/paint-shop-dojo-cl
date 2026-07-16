import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PlantService } from './plant.service';
import { PlantController } from './plant.controller';
import { PlantAdminController } from './plant.admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PlantController, PlantAdminController],
  providers: [PlantService],
  exports: [PlantService],
})
export class PlantModule {}
