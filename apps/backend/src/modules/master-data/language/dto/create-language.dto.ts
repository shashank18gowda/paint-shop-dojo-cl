import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({ example: 'EN' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'English' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
