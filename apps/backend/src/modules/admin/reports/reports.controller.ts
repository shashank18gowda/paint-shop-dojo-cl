import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { SessionFilterDto } from './dto/session-filter.dto';
import { ParticipantRankingsFilterDto } from './dto/participant-rankings-filter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Full dashboard: KPIs, performance distribution, desg stats, recent activity' })
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get('dashboard/monthly-participants')
  @ApiOperation({ summary: 'Month-wise unique participants who completed tests, with dashboard filters' })
  getDashboardMonthlyParticipants(
    @Query('year') year?: string,
    @Query('designationId') designationId?: string,
    @Query('plantId') plantId?: string,
    @Query('lineId') lineId?: string,
  ) {
    return this.service.getDashboardMonthlyParticipants({
      year: year ? +year : undefined,
      designationId,
      plantId,
      lineId,
    });
  }

  @Get('dashboard/score-breakdown')
  @ApiOperation({ summary: 'Score percentage bucket breakdown, with dashboard filters' })
  getDashboardScoreBreakdown(
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('designationId') designationId?: string,
    @Query('plantId') plantId?: string,
    @Query('lineId') lineId?: string,
  ) {
    return this.service.getDashboardScoreBreakdown({
      period,
      from,
      to,
      designationId,
      plantId,
      lineId,
    });
  }

  @Get('dashboard/designation-score-breakdown')
  @ApiOperation({ summary: 'Designation-wise score bucket breakdown for dashboard reports' })
  getDashboardDesignationScoreBreakdown(
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getDashboardDesignationScoreBreakdown({ period, from, to });
  }

  @Get('dashboard/line-distribution')
  @ApiOperation({ summary: 'Line-wise completed attempt distribution for dashboard reports' })
  getDashboardLineDistribution(
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getDashboardLineDistribution({ period, from, to });
  }

  @Get('dashboard/overview')
  @ApiOperation({
    summary:
      'Combined reports overview: KPIs, performance distribution, designation/plant/line stats, top performers, hardest questions',
  })
  getDashboardOverview(
    @Query('designation') designation?: string,
    @Query('plant') plant?: string,
    @Query('line') line?: string,
    @Query('days') days?: string,
  ) {
    return this.service.getReportOverview({
      designation,
      plant,
      line,
      days: days ? +days : undefined,
    });
  }

  @Get('overview')
  @ApiOperation({ summary: 'Dashboard overview stats' })
  getOverview() {
    return this.service.getOverview();
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Paginated session list with filters' })
  getSessions(@Query() filters: SessionFilterDto) {
    return this.service.getSessions({
      page: filters.page ? +filters.page : undefined,
      limit: filters.limit ? +filters.limit : undefined,
      designationId: filters.designationId,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    });
  }

  @Get('designations')
  @ApiOperation({ summary: 'Designation-level performance stats' })
  getDesignations() {
    return this.service.getDesignationStats();
  }

  @Get('trend')
  @ApiOperation({ summary: 'Daily session pass/fail trend for last N days' })
  getTrend(@Query('days') days?: string) {
    return this.service.getTrend(days ? Math.min(365, Math.max(7, +days)) : 30);
  }

  @Get('top-performers')
  @ApiOperation({ summary: 'Top performers by average score' })
  getTopPerformers(
    @Query('limit') limit?: string,
    @Query('designationName') designationName?: string,
    @Query('plantName') plantName?: string,
    @Query('lineName') lineName?: string,
  ) {
    return this.service.getTopPerformers(limit ? +limit : 5, designationName, plantName, lineName);
  }

  @Get('hardest-questions')
  @ApiOperation({ summary: 'Questions with lowest correct-answer rate' })
  getHardestQuestions(@Query('limit') limit?: string) {
    return this.service.getHardestQuestions(limit ? +limit : 5);
  }

  @Get('lines')
  @ApiOperation({ summary: 'Line-level performance stats' })
  getLines() {
    return this.service.getLineStats();
  }

  @Get('participants/:id')
  @ApiOperation({ summary: 'Participant report detail: ranks, distribution, weak topics, trend' })
  getParticipantReportDetail(@Param('id') id: string) {
    return this.service.getParticipantReportDetail(id);
  }

  @Get('participants')
  @ApiOperation({ summary: 'Participant rankings with filters and pagination' })
  getParticipantRankings(@Query() q: ParticipantRankingsFilterDto) {
    return this.service.getParticipantRankings({
      page: q.page ? +q.page : undefined,
      limit: q.limit ? +q.limit : undefined,
      search: q.search,
      designationId: q.designationId,
      lineId: q.lineId,
      plantId: q.plantId,
      performanceLevelCode: q.performanceLevelCode,
      sortBy: q.sortBy,
      sortDir: q.sortDir,
    });
  }
}
