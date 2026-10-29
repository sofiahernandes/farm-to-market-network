import {
  calculatePlatformFeeCents,
  canTransitionOrder,
  isBeforeCutoff,
  isValidCpf,
} from './rules';

describe('domain rules', () => {
  it('validates CPF', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });
  it('calculates fee in cents', () =>
    expect(calculatePlatformFeeCents(10000, 10)).toBe(1000));
  it('checks cutoff', () => {
    const now = new Date('2026-01-01T10:00:00Z');
    expect(isBeforeCutoff(now, new Date('2026-01-03T10:00:00Z'), 48)).toBe(
      true
    );
  });
  it('allows only next order status', () => {
    expect(canTransitionOrder('confirmed', 'preparing')).toBe(true);
    expect(canTransitionOrder('delivered', 'preparing')).toBe(false);
  });
});
