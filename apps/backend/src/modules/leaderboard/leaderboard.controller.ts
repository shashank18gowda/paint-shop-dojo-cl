import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardType, LeaderboardSource } from '@prisma/client';
import { LEADERBOARD_DEFAULT_LIMIT } from '../../config/constants';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private service: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get leaderboard (public)' })
  @ApiQuery({ name: 'type', enum: ['GLOBAL', 'DAILY', 'WEEKLY', 'MONTHLY'], required: false })
  @ApiQuery({ name: 'limit', required: false, example: LEADERBOARD_DEFAULT_LIMIT })
  @ApiQuery({ name: 'designationId', required: false, type: String })
  @ApiQuery({ name: 'lineId', required: false, type: String })
  @ApiQuery({ name: 'plantId', required: false, type: String })
  @ApiQuery({ name: 'source', enum: ['QUIZ', 'GAME'], required: false })
  getLeaderboard(
    @Query('type') type: LeaderboardType = 'GLOBAL',
    @Query('limit') limit = LEADERBOARD_DEFAULT_LIMIT,
    @Query('designationId') designationId?: string,
    @Query('lineId') lineId?: string,
    @Query('plantId') plantId?: string,
    @Query('source') source: LeaderboardSource = 'QUIZ',
  ) {
    return this.service.getLeaderboard(type, +limit, designationId, lineId, plantId, source);
  }
}
