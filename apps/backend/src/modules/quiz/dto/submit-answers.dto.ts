import { IsArray, IsString, IsInt, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ example: 'question-uuid' })
  @IsString()
  questionId: string;

  @ApiProperty({ example: 'option-uuid' })
  @IsString()
  optionId: string;

  @ApiPropertyOptional({ example: 12, description: 'Time taken in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeTaken?: number;
}

export class SubmitAnswersDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiPropertyOptional({ example: 10, description: 'Total questions in the quiz session (for accurate percentage on partial submissions)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalQuestions?: number;
}
