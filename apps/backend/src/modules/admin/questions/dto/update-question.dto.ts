import {
  IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString,
  Max, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TranslationInputDto } from './translation-input.dto';
import { OptionInputDto } from './option-input.dto';
import { QUESTION_TYPES } from './create-question.dto';

export class UpdateQuestionDto {
  @ApiPropertyOptional({ enum: QUESTION_TYPES })
  @IsOptional()
  @IsIn(QUESTION_TYPES)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(5)
  timeLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ type: [TranslationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationInputDto)
  translations?: TranslationInputDto[];

  @ApiPropertyOptional({ type: [OptionInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionInputDto)
  options?: OptionInputDto[];
}
