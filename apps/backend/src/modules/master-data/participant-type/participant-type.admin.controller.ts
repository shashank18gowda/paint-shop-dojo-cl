import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import { ParticipantTypeService } from './participant-type.service';
import { CreateParticipantTypeDto } from './dto/create-participant-type.dto';
import { UpdateParticipantTypeDto } from './dto/update-participant-type.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/participant-types')
export class ParticipantTypeAdminController {
  constructor(private service: ParticipantTypeService) {}

  @Get()
  @ApiOperation({ summary: 'List all participant types (including inactive)' })
  findAll() {
    return this.service.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a participant type by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a participant type' })
  create(@Body() dto: CreateParticipantTypeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a participant type' })
  update(@Param('id') id: string, @Body() dto: UpdateParticipantTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a participant type (sets isActive=false)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
