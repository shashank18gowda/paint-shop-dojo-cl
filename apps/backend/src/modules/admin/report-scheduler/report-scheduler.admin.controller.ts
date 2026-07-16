import { Controller, Get, Param, ParseEnumPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse, ApiParam } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';
import { ReportSchedulerService } from './report-scheduler.service';
import { EmailDispatchHistoryService } from './email-dispatch-history.service';
import { EmailDispatchHistoryQueryDto } from './dto/email-dispatch-history-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/report-scheduler')
export class ReportSchedulerAdminController {
  constructor(
    private scheduler: ReportSchedulerService,
    private dispatchHistory: EmailDispatchHistoryService,
  ) {}

  @Post('trigger/:type')
  @ApiParam({ name: 'type', enum: ReportType })
  @ApiOperation({ summary: 'Manually trigger a scheduled report dispatch (DAILY | WEEKLY | MONTHLY) — useful for testing' })
  trigger(@Param('type', new ParseEnumPipe(ReportType)) type: ReportType) {
    return this.scheduler.dispatchReport(type);
  }

  @Get('history')
  @ApiOperation({ summary: 'List email dispatch history for scheduled reports' })
  history(@Query() query: EmailDispatchHistoryQueryDto) {
    return this.dispatchHistory.findAll(query);
  }
}
