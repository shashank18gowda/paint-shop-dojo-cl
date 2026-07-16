import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TranslationInputDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  @IsNotEmpty()
  languageCode!: string;

  @ApiProperty({ example: 'What is the optimal viscosity range?' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}
