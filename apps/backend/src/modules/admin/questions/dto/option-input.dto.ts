import { IsArray, IsBoolean, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TranslationInputDto } from './translation-input.dto';

export class OptionInputDto {
  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ type: [TranslationInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationInputDto)
  translations!: TranslationInputDto[];
}
