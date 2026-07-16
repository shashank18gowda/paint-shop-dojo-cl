import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DesignationService } from './designation.service';

@ApiTags('designations')
@Controller('designations')
export class DesignationController {
  constructor(private service: DesignationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active designations (public)' })
  findAll() {
    return this.service.findAll();
  }
}
