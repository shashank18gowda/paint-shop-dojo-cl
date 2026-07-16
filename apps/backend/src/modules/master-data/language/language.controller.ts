import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LanguageService } from './language.service';

@ApiTags('languages')
@Controller('languages')
export class LanguageController {
  constructor(private service: LanguageService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available languages (public)' })
  findAll() {
    return this.service.findAll();
  }
}
