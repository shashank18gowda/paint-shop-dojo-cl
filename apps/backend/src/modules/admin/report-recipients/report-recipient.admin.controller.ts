import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import { ReportRecipientService } from './report-recipient.service';
import { CreateReportRecipientDto } from './dto/create-report-recipient.dto';
import { UpdateReportRecipientDto } from './dto/update-report-recipient.dto';
import { UpdateReportAccessDto } from './dto/update-report-access.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/report-recipients')
export class ReportRecipientAdminController {
  constructor(private service: ReportRecipientService) {}

  @Get()
  @ApiOperation({ summary: 'List all report recipients' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report recipient by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a report recipient email' })
  create(@Body() dto: CreateReportRecipientDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a report recipient' })
  update(@Param('id') id: string, @Body() dto: UpdateReportRecipientDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/access')
  @ApiOperation({ summary: 'Update which scheduled report digests (daily/weekly/monthly) a recipient receives' })
  updateAccess(@Param('id') id: string, @Body() dto: UpdateReportAccessDto) {
    return this.service.updateAccess(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a report recipient' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
