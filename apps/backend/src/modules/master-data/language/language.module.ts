import { Module } from '@nestjs/common';
import { LanguageController } from './language.controller';
import { LanguageAdminController } from './language.admin.controller';
import { LanguageService } from './language.service';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Module({
  controllers: [LanguageController, LanguageAdminController],
  providers: [LanguageService, RolesGuard],
})
export class LanguageModule {}
