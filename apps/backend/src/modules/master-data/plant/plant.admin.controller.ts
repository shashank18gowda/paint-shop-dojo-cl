import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import { PlantService } from './plant.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/plants')
export class PlantAdminController {
  constructor(private service: PlantService) {}

  @Get()
  @ApiOperation({ summary: 'List all plants (including inactive)' })
  findAll() {
    return this.service.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plant by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a plant' })
  create(@Body() dto: CreatePlantDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plant' })
  update(@Param('id') id: string, @Body() dto: UpdatePlantDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a plant (sets isActive=false)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
