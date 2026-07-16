import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  Query, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse, ApiQuery,
} from '@nestjs/swagger';
import { QuestionsAdminService } from './questions.admin.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/questions')
export class QuestionsAdminController {
  constructor(private service: QuestionsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'List questions with filters and pagination' })
  @ApiQuery({ name: 'page',       required: false, type: Number })
  @ApiQuery({ name: 'limit',      required: false, type: Number })
  @ApiQuery({ name: 'search',     required: false, type: String })
  @ApiQuery({ name: 'type',       required: false, type: String })
  @ApiQuery({ name: 'difficulty', required: false, type: Number })
  @ApiQuery({ name: 'isActive',   required: false, type: String })
  @ApiQuery({ name: 'langCode',   required: false, type: String })
  findAll(
    @Query('page')       page       = 1,
    @Query('limit')      limit      = 20,
    @Query('search')     search?: string,
    @Query('type')       type?: string,
    @Query('difficulty') difficulty?: string,
    @Query('isActive')   isActive?: string,
    @Query('langCode')   langCode?: string,
  ) {
    return this.service.findAll(
      +page,
      +limit,
      search,
      type,
      difficulty ? +difficulty : undefined,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      langCode,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by id (full detail with translations)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a question with options and translations' })
  create(@Body() dto: CreateQuestionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update question (replaces translations and options if provided)' })
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete question (deactivates; keeps historical answers intact)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
