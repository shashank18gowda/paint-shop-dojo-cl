import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateParticipantAdminDto {
  @ApiPropertyOptional({ example: 'TKM-001234' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @ApiPropertyOptional({ example: 'Rajan Kumar' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  designationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  participantTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lineId?: string;

    @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  plantId?: string;
}
