import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString, ArrayMinSize, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class EntryLineDto {
  @ApiProperty({ example: 1, description: 'Account ID' })
  @IsInt()
  @Type(() => Number)
  accountId: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Type(() => Number)
  debit: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Type(() => Number)
  credit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEntryDto {
  @ApiProperty({ example: '2026-05-31' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'OP-2026-0001' })
  @IsString()
  number: string;

  @ApiProperty({ type: [EntryLineDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => EntryLineDto)
  lines: EntryLineDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  period?: string;
}

export class TurnoverQueryDto {
  @ApiProperty({ example: '2026-01' })
  @IsString()
  periodFrom: string;

  @ApiProperty({ example: '2026-12' })
  @IsString()
  periodTo: string;
}

export class TrialBalanceQueryDto {
  @ApiProperty({ example: '2026-05' })
  @IsString()
  period: string;
}
