import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsOptional, IsBoolean } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: '商品 ID' })
  @IsInt()
  @IsPositive()
  goods_id!: number;

  @ApiProperty({ description: '档位 ID' })
  @IsInt()
  @IsPositive()
  tier_id!: number;

  @ApiProperty({ description: '是否同意协议', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  agree_protocol?: boolean;
}

export class RenewOrderDto {
  @ApiProperty({ description: '被续费的原订单 ID' })
  @IsInt()
  @IsPositive()
  parent_order_id!: number;

  @ApiProperty({ description: '可选:升档 tier_id', required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  tier_id?: number;
}
