import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare module 'express' {
  interface Request {
    requestId: string;
  }
}

/** 为每个请求注入 request_id, 用于日志追踪 */
export function RequestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.header('x-request-id') || req.header('x-trace-id');
  const requestId = incomingId || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
