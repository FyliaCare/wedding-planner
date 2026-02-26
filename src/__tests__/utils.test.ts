// ============================================================
// Utility Functions — Exhaustive Tests
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
  daysUntil,
  generateId,
  percentOf,
  getInitials,
  debounce,
} from '@/utils';

// ============================================================
// cn — Tailwind class merging
// ============================================================
describe('cn (class name merger)', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles undefined and null gracefully', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles empty string', () => {
    expect(cn('')).toBe('');
  });

  it('handles no arguments', () => {
    expect(cn()).toBe('');
  });

  it('handles conditional classes', () => {
    const active = true;
    const disabled = false;
    expect(cn('base', active && 'active', disabled && 'disabled')).toBe('base active');
  });

  it('merges conflicting Tailwind utilities', () => {
    // twMerge should keep the last conflicting class
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});

// ============================================================
// formatCurrency — USD formatting
// ============================================================
describe('formatCurrency', () => {
  it('formats positive integers', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats large numbers with commas', () => {
    expect(formatCurrency(50000)).toBe('$50,000');
    expect(formatCurrency(1234567)).toBe('$1,234,567');
  });

  it('truncates decimal places (no fraction digits)', () => {
    expect(formatCurrency(1234.56)).toBe('$1,235');
    expect(formatCurrency(99.4)).toBe('$99');
  });

  it('formats negative numbers', () => {
    expect(formatCurrency(-500)).toBe('-$500');
  });

  it('formats small amounts', () => {
    expect(formatCurrency(1)).toBe('$1');
    expect(formatCurrency(0.5)).toBe('$1'); // rounds up with maximumFractionDigits: 0
  });
});

// ============================================================
// formatDate — date formatting
// ============================================================
describe('formatDate', () => {
  it('formats ISO string date', () => {
    const result = formatDate('2025-12-25');
    expect(result).toContain('Dec');
    expect(result).toContain('2025');
    expect(result).toContain('25');
  });

  it('formats Date object', () => {
    const result = formatDate(new Date(2025, 0, 1)); // Jan 1, 2025
    expect(result).toContain('Jan');
    expect(result).toContain('2025');
  });

  it('handles invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });

  it('handles empty string', () => {
    expect(formatDate('')).toBe('Invalid date');
  });

  it('formats date with time component', () => {
    const result = formatDate('2025-06-15T14:30:00Z');
    expect(result).toContain('Jun');
    expect(result).toContain('2025');
  });
});

// ============================================================
// formatTime — time formatting
// ============================================================
describe('formatTime', () => {
  it('formats time from ISO string', () => {
    const result = formatTime('2025-01-01T14:30:00');
    expect(result).toMatch(/2:30\s*PM/i);
  });

  it('formats morning time', () => {
    const result = formatTime('2025-01-01T09:15:00');
    expect(result).toMatch(/9:15\s*AM/i);
  });

  it('formats midnight', () => {
    const result = formatTime('2025-01-01T00:00:00');
    expect(result).toMatch(/12:00\s*AM/i);
  });

  it('formats noon', () => {
    const result = formatTime('2025-01-01T12:00:00');
    expect(result).toMatch(/12:00\s*PM/i);
  });

  it('handles invalid time', () => {
    expect(formatTime('not-a-time')).toBe('Invalid time');
  });

  it('handles Date object', () => {
    const d = new Date(2025, 0, 1, 15, 45);
    const result = formatTime(d);
    expect(result).toMatch(/3:45\s*PM/i);
  });
});

// ============================================================
// daysUntil — countdown calculation
// ============================================================
describe('daysUntil', () => {
  it('returns positive days for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const result = daysUntil(future.toISOString().split('T')[0]!);
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });

  it('returns negative days for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const result = daysUntil(past.toISOString().split('T')[0]!);
    expect(result).toBeLessThan(0);
  });

  it('returns 0 or 1 for today', () => {
    const today = new Date().toISOString().split('T')[0]!;
    const result = daysUntil(today);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('handles far future dates', () => {
    const result = daysUntil('2099-12-31');
    expect(result).toBeGreaterThan(365);
  });
});

// ============================================================
// generateId — UUID generation
// ============================================================
describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

// ============================================================
// percentOf — percentage calculation
// ============================================================
describe('percentOf', () => {
  it('calculates basic percentage', () => {
    expect(percentOf(50, 100)).toBe(50);
  });

  it('returns 0 when total is 0', () => {
    expect(percentOf(10, 0)).toBe(0);
  });

  it('returns 100 for full completion', () => {
    expect(percentOf(100, 100)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
  });

  it('handles zero part', () => {
    expect(percentOf(0, 100)).toBe(0);
  });

  it('handles part greater than total', () => {
    expect(percentOf(150, 100)).toBe(150);
  });

  it('handles very small numbers', () => {
    expect(percentOf(1, 1000)).toBe(0);
  });

  it('handles both zeros', () => {
    expect(percentOf(0, 0)).toBe(0);
  });
});

// ============================================================
// getInitials — name to initials
// ============================================================
describe('getInitials', () => {
  it('returns first letters of first two words', () => {
    expect(getInitials('Janet Smith')).toBe('JS');
  });

  it('returns single letter for single name', () => {
    expect(getInitials('Jojo')).toBe('J');
  });

  it('returns ?? for empty string', () => {
    expect(getInitials('')).toBe('??');
  });

  it('returns ?? for whitespace-only string', () => {
    expect(getInitials('   ')).toBe('??');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('handles three+ word names (takes first 2)', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MJ');
  });

  it('handles names with extra spaces', () => {
    expect(getInitials('  Jane   Doe  ')).toBe('JD');
  });

  it('handles special characters in name', () => {
    expect(getInitials("O'Brien Smith")).toBe('OS');
  });
});

// ============================================================
// debounce — delayed execution
// ============================================================
describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced(); // resets
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes arguments to the debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('hello', 42);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('hello', 42);
  });

  it('only calls once for rapid-fire invocations', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    for (let i = 0; i < 50; i++) {
      debounced();
    }

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('can be called again after firing', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();

    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('uses the latest arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');
    debounced('third');

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('third');
  });
});
