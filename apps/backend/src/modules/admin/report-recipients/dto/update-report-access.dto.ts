import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReportAccessDto {
  @ApiPropertyOptional({ description: 'Enable/disable the daily report digest for this recipient' })
  @IsOptional()
  @IsBoolean()
  daily?: boolean;

  @ApiPropertyOptional({ description: 'Enable/disable the weekly report digest for this recipient' })
  @IsOptional()
  @IsBoolean()
  weekly?: boolean;

  @ApiPropertyOptional({ description: 'Enable/disable the monthly report digest for this recipient' })
  @IsOptional()
  @IsBoolean()
  monthly?: boolean;
}
