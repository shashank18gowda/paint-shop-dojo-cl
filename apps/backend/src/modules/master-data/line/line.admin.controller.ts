import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import { LineService } from './line.service';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/lines')
export class LineAdminController {
  constructor(private service: LineService) {}

  @Get()
  @ApiOperation({ summary: 'List all production lines (including inactive)' })
  findAll() {
    return this.service.findAllAdmin();
  }

  @Post()
  @ApiOperation({ summary: 'Create a production line' })
  create(@Body() dto: CreateLineDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a production line' })
  update(@Param('id') id: string, @Body() dto: UpdateLineDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a production line (sets isActive=false)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
