import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QUIZ_DEFAULT_QUESTION_COUNT, QUIZ_MAX_QUESTION_COUNT, QUIZ_MIN_QUESTION_COUNT } from '../../../config/constants';

export class StartSessionDto {
  @ApiPropertyOptional({ example: 'EN', description: 'Language code for questions' })
  @IsOptional()
  @IsString()
  language?: string = 'EN';

  @ApiPropertyOptional({ example: QUIZ_DEFAULT_QUESTION_COUNT, description: 'Number of questions to fetch' })
  @IsOptional()
  @IsInt()
  @Min(QUIZ_MIN_QUESTION_COUNT)
  @Max(QUIZ_MAX_QUESTION_COUNT)
  questionCount?: number = QUIZ_DEFAULT_QUESTION_COUNT;
}
