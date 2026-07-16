import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartRunDto {
  @ApiProperty({ example: 'HYCROSS', description: 'Chosen car model code' })
  @IsString()
  carModelCode: string;

  @ApiPropertyOptional({
    example: 'MICA',
    description: 'Chosen colour code (must be available for the model)',
  })
  @IsOptional()
  @IsString()
  carColourCode?: string;

  @ApiPropertyOptional({ example: 'EN' })
  @IsOptional()
  @IsString()
  languageCode?: string;
}

export class SubmitAnswerDto {
  @ApiProperty({
    description: 'The question being answered (the current screen)',
  })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'The process the user clicked as their answer' })
  @IsString()
  chosenProcessId: string;
}

// ── Batch (quiz-style, submit-all-at-the-end) play ──────────────────────────

export class StartBatchRunDto {
  @ApiProperty({ example: 'HYCROSS', description: 'Chosen car model code' })
  @IsString()
  carModelCode: string;

  @ApiPropertyOptional({
    example: 'KN',
    description:
      "Initial language for the session. The response includes every active language's " +
      'text, so the client can switch language mid-session without calling the API again.',
  })
  @IsOptional()
  @IsString()
  languageCode?: string;
}

export class BatchAnswerEventDto {
  @ApiProperty({ description: 'The process the user clicked for this attempt' })
  @IsString()
  chosenProcessId: string;

  @ApiProperty({ example: 1, description: '1-based order of this click within the step' })
  @IsInt()
  @Min(1)
  attemptNo: number;

  @ApiPropertyOptional({
    description:
      'Client-reported correctness for this click. Accepted but ignored — the server ' +
      "independently recomputes it from the model's sequence.",
  })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}

export class BatchStepDto {
  @ApiProperty({
    description: 'The question being answered (one of the served questions)',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    type: [BatchAnswerEventDto],
    description:
      'Every process the user clicked for this question, in the order clicked ' +
      '(wrong guesses first, correct one last, if it was ever answered correctly). ' +
      'A first-try-correct answer is a 1-element array. Empty if the trainee left ' +
      'the question unanswered (skipped) — it is graded as wrong with 0 points.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchAnswerEventDto)
  answers: BatchAnswerEventDto[];

  @ApiPropertyOptional({
    description:
      'Client-reported correctness for the step overall. Accepted but ignored — ' +
      'recomputed server-side from the last click in `answers`.',
  })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({
    description:
      'Client-reported wrong-attempt count. Accepted but ignored — recomputed server-side.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  wrongAttempts?: number;

  @ApiPropertyOptional({
    description:
      "Client-reported points. Accepted but ignored — recomputed server-side from the flow's scoring rules.",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pointsAwarded?: number;

  @ApiPropertyOptional({ example: 12, description: 'Time on this step, seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeTaken?: number;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Number of hints the trainee opened while answering this question. Batch play ' +
      "serves all of a question's hints up front, so there is no server-side signal for " +
      "hint views — this is trusted from the client and deducted via the flow's " +
      'penaltyPerHint when computing pointsAwarded.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  hintUsed?: number;
}

export class SubmitBatchDto {
  @ApiProperty({
    type: [BatchStepDto],
    description:
      'All steps for the run, submitted together at the end. isCorrect/wrongAttempts/' +
      "pointsAwarded (per step and per click) and score are all recomputed server-side " +
      "from the model's actual sequence — any values sent for them are accepted but ignored.",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchStepDto)
  steps: BatchStepDto[];

  @ApiPropertyOptional({
    description: 'Client-reported total score. Accepted but ignored — recomputed server-side.',
  })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({
    example: 'cbd63421-af39-49e6-adce-736d9eb3ba7e',
    description:
      'Colour chosen mid-flow client-side (e.g. at the Base Coat step) — the colour id ' +
      '(from GET /models/:code/colours), reported once here. Must be available for ' +
      "this run's car model.",
  })
  @IsOptional()
  @IsString()
  carColourId?: string;
}
