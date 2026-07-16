import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ParticipantTypeService } from './participant-type.service';

@ApiTags('participant-types')
@Controller('participant-types')
export class ParticipantTypeController {
  constructor(private service: ParticipantTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all participant types (public)' })
  findAll() {
    return this.service.findAll();
  }
}
