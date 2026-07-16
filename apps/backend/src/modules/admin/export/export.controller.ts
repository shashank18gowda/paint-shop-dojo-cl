import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ParticipantRankingsFilterDto } from '../reports/dto/participant-rankings-filter.dto';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/export')
export class ExportController {
  constructor(private service: ExportService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Export sessions as CSV' })
  async exportSessions(
    @Query('designationId') designationId?: string,
    @Query('plantId') plantId?: string,
    @Query('lineId') lineId?: string,
    @Query('status') status?: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.service.exportSessions({
      designationId,
      plantId,
      lineId,
      status,
      period,
      from,
      to,
    });
    res!.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sessions-${Date.now()}.csv"`,
    });
    res!.send(csv);
  }

  @Get('reports-overview')
  @ApiOperation({ summary: 'Export the reports overview (KPIs, performance breakdowns, top performers, hardest questions) as a multi-sheet Excel workbook' })
  async exportReportOverview(
    @Query('designation') designation?: string,
    @Query('plant') plant?: string,
    @Query('line') line?: string,
    @Query('days') days?: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.service.exportReportOverview({
      designation,
      plant,
      line,
      days: days ? +days : undefined,
      period,
      from,
      to,
    });
    res!.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="report-overview-${Date.now()}.xlsx"`,
    });
    res!.send(buffer);
  }

  @Get('participant-rankings')
  @ApiOperation({ summary: 'Export participant rankings as CSV' })
  async exportParticipantRankings(@Query() filters: ParticipantRankingsFilterDto, @Res() res?: Response) {
    const csv = await this.service.exportParticipantRankings({
      search: filters.search,
      designationId: filters.designationId,
      lineId: filters.lineId,
      plantId: filters.plantId,
      performanceLevelCode: filters.performanceLevelCode,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    });
    res!.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="participant-rankings-${Date.now()}.csv"`,
    });
    res!.send(csv);
  }
}
