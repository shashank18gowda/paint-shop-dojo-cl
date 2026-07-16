import {
  IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString,
  Max, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TranslationInputDto } from './translation-input.dto';
import { OptionInputDto } from './option-input.dto';

export const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'] as const;

export class CreateQuestionDto {
  @ApiProperty({ enum: QUESTION_TYPES })
  @IsIn(QUESTION_TYPES)
  type!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({ minimum: 5 })
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

  @ApiProperty({ type: [TranslationInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationInputDto)
  translations!: TranslationInputDto[];

  @ApiProperty({ type: [OptionInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionInputDto)
  options!: OptionInputDto[];
}
