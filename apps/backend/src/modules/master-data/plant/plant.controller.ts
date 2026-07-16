import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlantService } from './plant.service';

@ApiTags('plants')
@Controller('plants')
export class PlantController {
  constructor(private service: PlantService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active plants (public)' })
  findAll() {
    return this.service.findAll();
  }
}
