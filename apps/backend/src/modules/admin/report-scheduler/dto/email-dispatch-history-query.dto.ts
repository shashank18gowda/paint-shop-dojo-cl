import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportType, EmailDispatchStatus } from '@prisma/client';

export class EmailDispatchHistoryQueryDto {
  @IsOptional() @IsString() recipientId?: string;
  @IsOptional() @IsEnum(ReportType) reportType?: ReportType;
  @IsOptional() @IsEnum(EmailDispatchStatus) status?: EmailDispatchStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
