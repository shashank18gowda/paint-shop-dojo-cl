import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GameService } from './game.service';
import {
  StartRunDto,
  StartBatchRunDto,
  SubmitAnswerDto,
  SubmitBatchDto,
} from './dto/game.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentParticipant } from '../../common/decorators/current-participant.decorator';

@ApiTags('game')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private service: GameService) {}

  @Get('eligibility')
  @ApiOperation({ summary: 'Check if the current participant can start a new game run' })
  getEligibility(@CurrentParticipant() p: { id: string }) {
    return this.service.getEligibility(p.id);
  }

  @Get('flows/:code')
  @ApiOperation({
    summary: 'Get a game flow with its processes and judgement bands',
  })
  getFlow(@Param('code') code: string) {
    return this.service.getFlow(code);
  }

  @Get('flows/:code/models')
  @ApiOperation({
    summary: 'List selectable car models for a flow (model-choice screen)',
  })
  getModels(@Param('code') code: string) {
    return this.service.getModels(code);
  }

  @Get('models/:code/colours')
  @ApiOperation({
    summary: 'List colours a car model is available in (colour-choice screen)',
  })
  getModelColours(@Param('code') code: string) {
    return this.service.getModelColours(code);
  }

  @Post('runs/start')
  @ApiOperation({
    summary: 'Start a game run for a chosen car model; get the first question',
  })
  startRun(@CurrentParticipant() p: { id: string }, @Body() dto: StartRunDto) {
    return this.service.startRun(
      p.id,
      dto.carModelCode,
      dto.languageCode,
      dto.carColourCode,
    );
  }

  @Post('runs/:id/answer')
  @ApiOperation({
    summary:
      'Submit an answer click; returns a hint (wrong) or next step (correct)',
  })
  submitAnswer(
    @Param('id') id: string,
    @CurrentParticipant() p: { id: string },
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.service.submitAnswer(
      id,
      p.id,
      dto.questionId,
      dto.chosenProcessId,
    );
  }

  @Get('runs/:id')
  @ApiOperation({
    summary: 'Get a run with its steps and answer events (result page)',
  })
  getRun(@Param('id') id: string, @CurrentParticipant() p: { id: string }) {
    return this.service.getRun(id, p.id);
  }

  // ── Batch play (quiz-style: all questions up front, one submit at the end) ──

  @Post('runs/start-batch')
  @ApiOperation({
    summary:
      'Start a game run and get ALL questions up front (play locally, submit at the end). ' +
      "Response includes every active language's text per question/option/hint for " +
      'in-session language switching.',
  })
  startBatchRun(
    @CurrentParticipant() p: { id: string },
    @Body() dto: StartBatchRunDto,
  ) {
    return this.service.startBatchRun(p.id, dto.carModelCode, dto.languageCode);
  }

  @Post('runs/:id/submit')
  @ApiOperation({
    summary: 'Submit all answers for a run at once and get the result',
  })
  submitBatch(
    @Param('id') id: string,
    @CurrentParticipant() p: { id: string },
    @Body() dto: SubmitBatchDto,
  ) {
    return this.service.submitBatch(id, p.id, dto.steps, dto.carColourId);
  }
}