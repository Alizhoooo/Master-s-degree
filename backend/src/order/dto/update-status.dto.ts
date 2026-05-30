import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ example: 'Confirmed', description: 'New status' })
  @IsString()
  status: string;
}
