import { Module } from '@nestjs/common';
import { LanguageModule } from './language/language.module';
import { LineModule } from './line/line.module';
import { DesignationModule } from './designation/designation.module';
import { ParticipantTypeModule } from './participant-type/participant-type.module';
import { PerformanceLevelModule } from './performance-level/performance-level.module';
import { PlantModule } from './plant/plant.module';

@Module({
  imports: [LanguageModule, LineModule, DesignationModule, ParticipantTypeModule, PerformanceLevelModule, PlantModule],
})
export class MasterDataModule {}
