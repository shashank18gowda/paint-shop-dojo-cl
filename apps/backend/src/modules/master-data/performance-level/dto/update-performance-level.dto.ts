import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePerformanceLevelDto {
  @ApiPropertyOptional({ example: 'Expert' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minScore?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @ApiPropertyOptional({ example: '#f59e0b' })
  @IsOptional()
  @IsString()
  color?: string;
}
