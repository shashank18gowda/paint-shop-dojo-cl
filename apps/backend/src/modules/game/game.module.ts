import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [LeaderboardModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
