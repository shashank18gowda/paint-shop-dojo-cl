import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import { PerformanceLevelService } from './performance-level.service';
import { CreatePerformanceLevelDto } from './dto/create-performance-level.dto';
import { UpdatePerformanceLevelDto } from './dto/update-performance-level.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/performance-levels')
export class PerformanceLevelAdminController {
  constructor(private service: PerformanceLevelService) {}

  @Get()
  @ApiOperation({ summary: 'List performance bands' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a performance band' })
  create(@Body() dto: CreatePerformanceLevelDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a performance band' })
  update(@Param('id') id: string, @Body() dto: UpdatePerformanceLevelDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a performance band' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
