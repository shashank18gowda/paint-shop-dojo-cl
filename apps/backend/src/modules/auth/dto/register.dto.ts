import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'EMP001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  employeeCode: string;

  @ApiProperty()
  @IsUUID()
  participantTypeId: string;

  @ApiProperty()
  @IsUUID()
  designationId: string;

  @ApiProperty()
  @IsUUID()
  lineId: string;

  @ApiProperty()
  @IsUUID()
  plantId: string;
}
