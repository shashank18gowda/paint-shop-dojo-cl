import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateParticipantTypeDto {
  @ApiProperty({ example: 'EMPLOYEE' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'Employee' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
