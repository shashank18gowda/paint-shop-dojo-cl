import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@tkm.co.in' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'change-me' })
  @IsString()
  @MinLength(8)
  password!: string;
}
