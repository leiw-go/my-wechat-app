import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class WxLoginDto {
  @ApiProperty({ description: 'wx.login() 返回的 code' })
  @IsString()
  code!: string;

  @ApiProperty({ description: '可选:加密的手机号数据', required: false })
  @IsString()
  @IsOptional()
  encryptedData?: string;

  @ApiProperty({ description: '可选:加密初始向量', required: false })
  @IsString()
  @IsOptional()
  iv?: string;
}

export class RefreshDto {
  @ApiProperty({ description: 'refresh_token 字符串' })
  @IsString()
  refresh_token!: string;
}
