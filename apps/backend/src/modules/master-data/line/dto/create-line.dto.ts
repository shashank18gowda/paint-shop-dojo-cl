import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLineDto {
  @ApiProperty({ example: 'TOP_COAT' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'Top Coat Line' })
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
