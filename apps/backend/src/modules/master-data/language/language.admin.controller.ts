import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import { LanguageService } from './language.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/languages')
export class LanguageAdminController {
  constructor(private service: LanguageService) {}

  @Get()
  @ApiOperation({ summary: 'List all languages (including inactive)' })
  findAll() {
    return this.service.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a language by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a language' })
  create(@Body() dto: CreateLanguageDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a language' })
  update(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a language (sets isActive=false)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
