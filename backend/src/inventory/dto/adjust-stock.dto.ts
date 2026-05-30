import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 1, description: 'User ID performing adjustment' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: -5, description: 'Change amount (negative for decrease)' })
  @IsInt()
  change: number;

  @ApiProperty({ example: 'Stock count correction', description: 'Reason for adjustment' })
  @IsString()
  reason: string;
}
