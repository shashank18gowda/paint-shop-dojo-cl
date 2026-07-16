import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ParticipantRankingsFilterDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() designationId?: string;
  @IsOptional() @IsString() lineId?: string;
  @IsOptional() @IsString() plantId?: string;
  @IsOptional() @IsString() performanceLevelCode?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortDir?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
