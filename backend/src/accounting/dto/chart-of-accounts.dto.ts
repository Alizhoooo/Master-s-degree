import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: '1010' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Касса' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Asset', description: 'Asset | Liability | Equity | Income | Expense' })
  @IsString()
  type: string;

  @ApiProperty({ required: false, example: '1000' })
  @IsOptional()
  @IsString()
  parent?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  vat?: boolean;
}

export class UpdateAccountDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  vat?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
