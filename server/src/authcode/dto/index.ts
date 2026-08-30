import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class ResendDto {
  @ApiProperty({ description: '订单 ID' })
  @IsInt()
  @IsPositive()
  order_id!: number;
}
