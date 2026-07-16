import { IsString, IsNotEmpty, IsOptional, IsBoolean, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlantDto {
  @ApiProperty({ example: 'P001' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  code: string;

  @ApiProperty({ example: 'Main Manufacturing Plant' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({ example: 'Bangalore, India', required: false })
  @IsString()
  @IsOptional()
  @Length(0, 200)
  location?: string;

  @ApiProperty({ example: 'Primary production facility', required: false })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  sortOrder?: number;
}
