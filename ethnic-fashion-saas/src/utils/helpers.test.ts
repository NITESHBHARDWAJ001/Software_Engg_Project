import { describe, expect, it } from 'vitest';
import {
  calculatePercentageChange,
  classNames,
  formatPercentage,
  truncateText,
} from './helpers';

describe('helpers', () => {
  it('calculatePercentageChange handles normal percentage deltas', () => {
    expect(calculatePercentageChange(120, 100)).toBe(20);
    expect(calculatePercentageChange(80, 100)).toBe(-20);
  });

  it('calculatePercentageChange handles previous=0 edge case', () => {
    expect(calculatePercentageChange(10, 0)).toBe(100);
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });

  it('classNames joins only truthy class names', () => {
    expect(classNames('btn', false, 'active', undefined, null, 'rounded')).toBe(
      'btn active rounded'
    );
  });

  it('formatPercentage formats with requested precision', () => {
    expect(formatPercentage(12.3456)).toBe('12.3%');
    expect(formatPercentage(12.3456, 2)).toBe('12.35%');
  });

  it('truncateText respects max length and adds ellipsis', () => {
    expect(truncateText('short', 10)).toBe('short');
    expect(truncateText('This is a longer text', 7)).toBe('This is...');
  });
});
