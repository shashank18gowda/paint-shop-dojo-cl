import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [LeaderboardModule],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
