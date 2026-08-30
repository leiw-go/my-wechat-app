import { Module, Global } from '@nestjs/common';
import { KmsService, EnvKmsProvider } from './kms.service';

@Global()
@Module({
  providers: [
    {
      provide: KmsService,
      useFactory: () => {
        // dev/staging: env 临时密钥; prod: 替换为 aliyun/tencent KMS
        return new KmsService(new EnvKmsProvider());
      },
    },
  ],
  exports: [KmsService],
})
export class KmsModule {}
