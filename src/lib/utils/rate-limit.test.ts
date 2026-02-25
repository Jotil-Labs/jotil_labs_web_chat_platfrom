import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkVisitorRateLimit,
  checkClientMonthlyLimit,
} from './rate-limit';

describe('checkVisitorRateLimit', () => {
  beforeEach(() => {
    // Reset rate limit state by advancing time past window
    vi.useFakeTimers();
    vi.advanceTimersByTime(120_000);
    vi.useRealTimers();
  });

  it('allows up to 20 requests', () => {
    const ip = `test-ip-${Date.now()}`;
    for (let i = 0; i < 20; i++) {
      const result = checkVisitorRateLimit(ip);
      expect(result.allowed).toBe(true);
    }
  });

  it('rejects the 21st request', () => {
    const ip = `test-ip-reject-${Date.now()}`;
    for (let i = 0; i < 20; i++) {
      checkVisitorRateLimit(ip);
    }
    const result = checkVisitorRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('allows requests from different IPs independently', () => {
    const ip1 = `ip1-${Date.now()}`;
    const ip2 = `ip2-${Date.now()}`;
    for (let i = 0; i < 20; i++) {
      checkVisitorRateLimit(ip1);
    }
    const result = checkVisitorRateLimit(ip2);
    expect(result.allowed).toBe(true);
  });
});

describe('checkClientMonthlyLimit', () => {
  it('allows when under limit', () => {
    expect(checkClientMonthlyLimit(100, 2000)).toBe(true);
  });

  it('allows at 0 usage', () => {
    expect(checkClientMonthlyLimit(0, 2000)).toBe(true);
  });

  it('rejects when at limit', () => {
    expect(checkClientMonthlyLimit(2000, 2000)).toBe(false);
  });

  it('rejects when over limit', () => {
    expect(checkClientMonthlyLimit(2001, 2000)).toBe(false);
  });
});
