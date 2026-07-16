import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePerformanceLevelDto {
  @ApiProperty({ example: 'EXPERT' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'Expert' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 90 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minScore!: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxScore!: number;

  @ApiProperty({ example: '#f59e0b', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}
