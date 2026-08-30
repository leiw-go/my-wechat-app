import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 统一错误响应:
 *  - 1000-1999 系统错误
 *  - 2000-2999 鉴权错误
 *  - 3000-3999 业务校验
 *  - 4000-4999 业务错误
 *    4001 商品已下架 / 4002 档位不可用 / 4003 订单已支付
 *    4004 订单已关闭 / 4005 订单已退款 / 4006 授权码已失效
 *    4007 续费不允许
 *  - 5000-5999 支付错误
 *    5001 微信统一下单失败 / 5002 回调验签失败 / 5003 回调重复
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 1000;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const body = res as { code?: number; message?: string | string[] };
        if (typeof body.code === 'number') code = body.code;
        if (typeof body.message === 'string') message = body.message;
        else if (Array.isArray(body.message)) message = body.message.join('; ');
      } else if (typeof res === 'string') {
        message = res;
      }

      // 映射常见 HTTP 状态到业务错误码
      if (code === 1000) {
        if (httpStatus === 401) code = 2000;
        else if (httpStatus === 403) code = 2001;
        else if (httpStatus === 404) code = 3000;
        else if (httpStatus === 400) code = 3001;
        else if (httpStatus === 429) code = 1002;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
    }

    // 不泄漏内部实现细节给前端
    if (code === 1000 && httpStatus >= 500) {
      message = '服务暂不可用,请稍后重试';
    }

    response.status(httpStatus).json({
      code,
      message,
      request_id: request.requestId || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }
}
