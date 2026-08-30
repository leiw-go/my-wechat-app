import { OrderStateMachine, ORDER_STATUS } from '../src/order/order-state-machine';

describe('OrderStateMachine', () => {
  let sm: OrderStateMachine;

  beforeEach(() => {
    sm = new OrderStateMachine();
  });

  describe('terminal states', () => {
    it('should identify expired/refunded/closed as terminal', () => {
      expect(sm.isTerminal(ORDER_STATUS.EXPIRED)).toBe(true);
      expect(sm.isTerminal(ORDER_STATUS.REFUNDED)).toBe(true);
      expect(sm.isTerminal(ORDER_STATUS.CLOSED)).toBe(true);
    });

    it('should not identify pending_payment/paying/active/etc as terminal', () => {
      expect(sm.isTerminal(ORDER_STATUS.PENDING_PAYMENT)).toBe(false);
      expect(sm.isTerminal(ORDER_STATUS.PAYING)).toBe(false);
      expect(sm.isTerminal(ORDER_STATUS.ACTIVE)).toBe(false);
      expect(sm.isTerminal(ORDER_STATUS.EXPIRING_SOON)).toBe(false);
      expect(sm.isTerminal(ORDER_STATUS.RENEWING)).toBe(false);
    });
  });

  describe('transitions - valid', () => {
    it('pending_payment -> paying', () => {
      expect(sm.canTransition(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYING)).toBe(true);
    });

    it('paying -> active', () => {
      expect(sm.canTransition(ORDER_STATUS.PAYING, ORDER_STATUS.ACTIVE)).toBe(true);
    });

    it('paying -> pending_payment (failure)', () => {
      expect(sm.canTransition(ORDER_STATUS.PAYING, ORDER_STATUS.PENDING_PAYMENT)).toBe(true);
    });

    it('paying -> closed (timeout)', () => {
      expect(sm.canTransition(ORDER_STATUS.PAYING, ORDER_STATUS.CLOSED)).toBe(true);
    });

    it('active -> expiring_soon', () => {
      expect(sm.canTransition(ORDER_STATUS.ACTIVE, ORDER_STATUS.EXPIRING_SOON)).toBe(true);
    });

    it('expiring_soon -> expired', () => {
      expect(sm.canTransition(ORDER_STATUS.EXPIRING_SOON, ORDER_STATUS.EXPIRED)).toBe(true);
    });

    it('active -> renewing', () => {
      expect(sm.canTransition(ORDER_STATUS.ACTIVE, ORDER_STATUS.RENEWING)).toBe(true);
    });

    it('renewing -> active (renew success)', () => {
      expect(sm.canTransition(ORDER_STATUS.RENEWING, ORDER_STATUS.ACTIVE)).toBe(true);
    });

    it('active -> refunded (manual)', () => {
      expect(sm.canTransition(ORDER_STATUS.ACTIVE, ORDER_STATUS.REFUNDED)).toBe(true);
    });

    it('pending_payment -> closed (timeout)', () => {
      expect(sm.canTransition(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CLOSED)).toBe(true);
    });
  });

  describe('transitions - invalid', () => {
    it('expired is terminal - cannot transition', () => {
      expect(sm.canTransition(ORDER_STATUS.EXPIRED, ORDER_STATUS.ACTIVE)).toBe(false);
      expect(sm.canTransition(ORDER_STATUS.EXPIRED, ORDER_STATUS.PENDING_PAYMENT)).toBe(false);
    });

    it('refunded is terminal - cannot transition', () => {
      expect(sm.canTransition(ORDER_STATUS.REFUNDED, ORDER_STATUS.ACTIVE)).toBe(false);
    });

    it('closed is terminal - cannot transition', () => {
      expect(sm.canTransition(ORDER_STATUS.CLOSED, ORDER_STATUS.ACTIVE)).toBe(false);
    });

    it('cannot skip paying -> active directly from pending_payment', () => {
      expect(sm.canTransition(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.ACTIVE)).toBe(false);
    });

    it('cannot jump from active to pending_payment', () => {
      expect(sm.canTransition(ORDER_STATUS.ACTIVE, ORDER_STATUS.PENDING_PAYMENT)).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it('should pass for valid transition', () => {
      expect(() => sm.assertTransition(ORDER_STATUS.PAYING, ORDER_STATUS.ACTIVE)).not.toThrow();
    });

    it('should throw for invalid transition', () => {
      expect(() => sm.assertTransition(ORDER_STATUS.EXPIRED, ORDER_STATUS.ACTIVE)).toThrow();
    });
  });

  describe('all transitions coverage (PRD §5.2)', () => {
    it('should cover all 8 states', () => {
      const states = Object.values(ORDER_STATUS);
      expect(states.length).toBe(8);
      states.forEach((s) => {
        expect(typeof s).toBe('string');
      });
    });
  });
});
