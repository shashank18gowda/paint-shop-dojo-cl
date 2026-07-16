import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LineService } from './line.service';

@ApiTags('lines')
@Controller('lines')
export class LineController {
  constructor(private service: LineService) {}

  @Get()
  @ApiOperation({ summary: 'Get all production lines (public)' })
  findAll() {
    return this.service.findAll();
  }
}
