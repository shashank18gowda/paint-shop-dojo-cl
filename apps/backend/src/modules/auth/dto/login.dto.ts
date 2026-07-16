import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'EMP001', description: 'Employee code printed on badge' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  employeeCode: string;
}
