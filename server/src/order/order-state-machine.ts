import { Injectable } from '@nestjs/common';

/**
 * 订单 8 态状态机
 *  - pending_payment  → paying | closed
 *  - paying           → active | pending_payment(失败) | closed
 *  - active           → expiring_soon | refunded | closed
 *  - expiring_soon    → active(规则调整) | expired | renewed | refunded | closed
 *  - renewing         → active(续费成功) | refunded | closed
 *  - expired          → (终态, 可重启 = 创建新订单)
 *  - refunded         → (终态)
 *  - closed           → (终态)
 */

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAYING: 'paying',
  ACTIVE: 'active',
  EXPIRING_SOON: 'expiring_soon',
  RENEWING: 'renewing',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  CLOSED: 'closed',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

const TERMINAL_STATES = new Set<OrderStatus>([
  ORDER_STATUS.EXPIRED,
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.CLOSED,
]);

// allowed transitions
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paying', 'closed'],
  paying: ['active', 'pending_payment', 'closed'],
  active: ['expiring_soon', 'renewing', 'refunded', 'closed'],
  expiring_soon: ['active', 'expired', 'renewing', 'refunded', 'closed'],
  renewing: ['active', 'refunded', 'closed'],
  expired: [],
  refunded: [],
  closed: [],
};

@Injectable()
export class OrderStateMachine {
  isTerminal(status: OrderStatus): boolean {
    return TERMINAL_STATES.has(status);
  }

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    if (this.isTerminal(from)) return false;
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`非法状态迁移: ${from} -> ${to}`);
    }
  }
}
