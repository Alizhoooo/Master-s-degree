import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'Halyk Bank основной' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'KZ12345...' })
  @IsString()
  accountNo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bik?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ required: false, default: 'KZT' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  balance?: number;
}

export class UpdateBankAccountDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() bik?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() bankName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateBankOrderDto {
  @ApiProperty() @Type(() => Number) accountId: number;
  @ApiProperty({ example: 'In', enum: ['In', 'Out'] })
  @IsIn(['In', 'Out'])
  type: string;
  @ApiProperty() @IsNumber() @Type(() => Number) amount: number;
  @ApiProperty() @IsString() counterparty: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() counterpartyInn?: string;
  @ApiProperty() @IsString() purpose: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() documentId?: string;
}
