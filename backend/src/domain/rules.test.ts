import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlatformFeeCents,
  canTransitionOrder,
  isBeforeCutoff,
  isValidCpf,
} from './rules.ts';

describe('backend domain rules', () => {
  it('validates CPF', () => {
    assert.equal(isValidCpf('529.982.247-25'), true);
    assert.equal(isValidCpf('111.111.111-11'), false);
  });

  it('calculates fee in cents and rejects invalid inputs', () => {
    assert.equal(calculatePlatformFeeCents(10000, 10), 1000);
    assert.throws(() => calculatePlatformFeeCents(-100, 10), /Invalid pricing input/);
    assert.throws(() => calculatePlatformFeeCents(1000, 120), /Invalid pricing input/);
  });

  it('checks cutoff window accurately', () => {
    const now = new Date('2026-01-01T10:00:00Z');
    assert.equal(
      isBeforeCutoff(now, new Date('2026-01-03T10:00:00Z'), 48),
      true
    );
    assert.equal(
      isBeforeCutoff(now, new Date('2026-01-02T10:00:00Z'), 48),
      false
    );
  });

  it('allows only sequential order status transitions', () => {
    assert.equal(canTransitionOrder('pending_payment', 'confirmed'), true);
    assert.equal(canTransitionOrder('confirmed', 'preparing'), true);
    assert.equal(canTransitionOrder('preparing', 'in_transit'), true);
    assert.equal(canTransitionOrder('in_transit', 'delivered'), true);
    assert.equal(canTransitionOrder('delivered', 'preparing'), false);
    assert.equal(canTransitionOrder('confirmed', 'delivered'), false);
  });
});
