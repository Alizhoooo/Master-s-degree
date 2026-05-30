import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsArray, ArrayMinSize, Min, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 1, description: 'Customer ID' })
  @IsInt()
  customerId: number;

  @ApiProperty({ type: [OrderItemDto], description: 'Order items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'г. Алматы, ул. Абая, д. 10', description: 'Delivery address' })
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ example: '2026-06-05T00:00:00Z', description: 'Order deadline' })
  @IsString()
  deadline: string;

  @ApiProperty({ required: false, description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
