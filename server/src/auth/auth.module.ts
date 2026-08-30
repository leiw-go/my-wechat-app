import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { WxCode2SessionService } from './wx-code2session.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_SECRET,
        signOptions: { expiresIn: parseInt(process.env.JWT_ACCESS_TTL || '7200', 10) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, WxCode2SessionService],
  exports: [AuthService],
})
export class AuthModule {}
