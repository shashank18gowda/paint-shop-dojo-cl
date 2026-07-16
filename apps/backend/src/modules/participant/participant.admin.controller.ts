import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { ParticipantService } from './participant.service';
import { CreateParticipantAdminDto } from './dto/create-participant-admin.dto';
import { UpdateParticipantAdminDto } from './dto/update-participant-admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DEFAULT_PAGE_SIZE } from '../../config/constants';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/participants')
export class ParticipantAdminController {
  constructor(private service: ParticipantService) {}

  @Get()
  @ApiOperation({ summary: 'List all participants with optional filters (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'designationId', required: false, type: String })
  @ApiQuery({ name: 'lineId', required: false, type: String })
  @ApiQuery({ name: 'participantTypeId', required: false, type: String })
  @ApiQuery({ name: 'plantId', required: false, type: String })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = DEFAULT_PAGE_SIZE,
    @Query('search') search?: string,
    @Query('designationId') designationId?: string,
    @Query('lineId') lineId?: string,
    @Query('participantTypeId') participantTypeId?: string,
    @Query('plantId') plantId?: string,
  ) {
    return this.service.findAllAdmin(+page, +limit, search, designationId, lineId, participantTypeId, plantId,);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a participant by id' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get participant performance stats by id' })
  async getStats(@Param('id') id: string) {
    await this.service.findById(id);
    return this.service.getStats(id);
  }

  @Get(':id/attempts/:attemptId/review')
  @ApiOperation({ summary: 'Get detailed quiz attempt review for a participant (admin)' })
  @ApiQuery({ name: 'lang', required: false, example: 'en' })
  getAttemptReview(
    @Param('attemptId') attemptId: string,
    @Query('lang') lang = 'en',
  ) {
    return this.service.getAttemptReviewAdmin(attemptId, lang);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get participant quiz session history (admin)' })
  async getHistory(@Param('id') id: string) {
    await this.service.findById(id);
    return this.service.getSessionHistory(id);
  }

  @Get(':id/certificates')
  @ApiOperation({ summary: 'Get participant certificates (admin)' })
  async getCertificates(@Param('id') id: string) {
    await this.service.findById(id);
    return this.service.getCertificates(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a participant (admin)' })
  create(@Body() dto: CreateParticipantAdminDto) {
    return this.service.createAdmin(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a participant (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateParticipantAdminDto) {
    return this.service.updateAdmin(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a participant (admin)' })
  remove(@Param('id') id: string) {
    return this.service.removeAdmin(id);
  }
}
