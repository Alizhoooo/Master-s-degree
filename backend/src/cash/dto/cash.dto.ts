import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCashRegisterDto {
  @ApiProperty({ example: 'Главная касса (KZT)' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'KZT' })
  @IsString()
  currency: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  balance?: number;
}

export class UpdateCashRegisterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCashOrderDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  registerId: number;

  @ApiProperty({ example: 'Income', enum: ['Income', 'Expense'] })
  @IsIn(['Income', 'Expense'])
  type: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'Покупатель ТОО "ABC"' })
  @IsString()
  counterparty: string;

  @ApiProperty({ example: 'Оплата по счету №123' })
  @IsString()
  basis: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentId?: string;
}
