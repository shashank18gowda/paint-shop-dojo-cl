import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SessionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by designation ID' })
  @IsOptional()
  @IsString()
  designationId?: string;

  @ApiPropertyOptional({ enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'FAILED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'ISO date string — sessions started on or after' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date string — sessions started on or before' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
