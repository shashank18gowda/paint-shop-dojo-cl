import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/designations')
export class DesignationAdminController {
  constructor(private service: DesignationService) {}

  @Get()
  @ApiOperation({ summary: 'List all designations (including inactive)' })
  findAll() {
    return this.service.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a designation by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a designation' })
  create(@Body() dto: CreateDesignationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a designation' })
  update(@Param('id') id: string, @Body() dto: UpdateDesignationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a designation (sets isActive=false)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
