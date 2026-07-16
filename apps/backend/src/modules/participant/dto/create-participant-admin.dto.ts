import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParticipantAdminDto {
  @ApiProperty({ example: 'TKM-001234' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'Rajan Kumar' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  designationId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  participantTypeId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lineId!: string; 
  
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  plantId!: string;
}
