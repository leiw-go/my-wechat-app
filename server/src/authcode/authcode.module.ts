import { Module } from '@nestjs/common';
import { AuthCodeController } from './authcode.controller';
import { AuthCodeService } from './auth-code.service';

@Module({
  controllers: [AuthCodeController],
  providers: [AuthCodeService],
  exports: [AuthCodeService],
})
export class AuthCodeModule {}
