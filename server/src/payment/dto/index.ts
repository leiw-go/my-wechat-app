import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString } from 'class-validator';

export class UnifiedOrderDto {
  @ApiProperty({ description: '订单 ID' })
  @IsInt()
  @IsPositive()
  order_id!: number;

  @ApiProperty({ description: '微信 openid' })
  @IsString()
  openid!: string;
}
