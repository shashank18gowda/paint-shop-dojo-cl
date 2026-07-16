import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentParticipant } from '../../common/decorators/current-participant.decorator';
import { QUIZ_DEFAULT_QUESTION_COUNT } from '../../config/constants';

@ApiTags('quiz')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quiz')
export class QuizController {
  constructor(private service: QuizService) {}

  @Get('questions')
  @ApiOperation({ summary: 'Get randomized questions for a quiz session' })
  @ApiQuery({ name: 'lang', required: false, example: 'EN' })
  @ApiQuery({ name: 'count', required: false, example: QUIZ_DEFAULT_QUESTION_COUNT })
  getQuestions(
    @Query('lang') lang = 'EN',
    @Query('count') count = QUIZ_DEFAULT_QUESTION_COUNT,
  ) {
    return this.service.getQuestions(lang, +count);
  }

  @Get('eligibility')
  @ApiOperation({ summary: 'Check if the current participant can start a new quiz' })
  getEligibility(@CurrentParticipant() p: { id: string }) {
    return this.service.getEligibility(p.id);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Start a new quiz session' })
  startSession(
    @CurrentParticipant() p: { id: string },
    @Body() dto: StartSessionDto,
  ) {
    return this.service.startSession(p.id, dto);
  }

  @Post('sessions/:id/submit')
  @ApiOperation({ summary: 'Submit all answers and get result' })
  submitAnswers(
    @Param('id') id: string,
    @CurrentParticipant() p: { id: string },
    @Body() dto: SubmitAnswersDto,
  ) {
    return this.service.submitAnswers(id, p.id, dto);
  }

  @Post('sessions/:id/abandon')
  @ApiOperation({ summary: 'Record partial answers and mark the session abandoned (exit beacon)' })
  abandonSession(
    @Param('id') id: string,
    @CurrentParticipant() p: { id: string },
    @Body() dto: SubmitAnswersDto,
  ) {
    return this.service.abandonSession(id, p.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get my quiz attempt history' })
  @ApiQuery({ name: 'sort', required: false, enum: ['recent', 'best'], example: 'recent' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getMyHistory(
    @CurrentParticipant() p: { id: string },
    @Query('sort') sort = 'recent',
    @Query('limit') limit = 20,
  ) {
    return this.service.getMyHistory(p.id, sort, +limit);
  }

  @Get('attempts/:attemptId/review')
  @ApiOperation({ summary: 'Get detailed per-question review for an attempt' })
  @ApiQuery({ name: 'lang', required: false, example: 'EN' })
  getAttemptReview(
    @Param('attemptId') attemptId: string,
    @CurrentParticipant() p: { id: string },
    @Query('lang') lang = 'EN',
  ) {
    return this.service.getAttemptReview(attemptId, p.id, lang);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session result' })
  getResult(@Param('id') id: string, @CurrentParticipant() p: { id: string }) {
    return this.service.getSessionResult(id, p.id);
  }
}
