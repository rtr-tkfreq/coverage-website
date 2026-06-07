import { describe, expect, it } from 'vitest';

import { FormatBpsPipe } from './format-bps-pipe';

describe('FormatBpsPipe', () => {
  const pipe = new FormatBpsPipe();

  it('returns empty string for nullish input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('rounds to no decimals at/above 10', () => {
    expect(pipe.transform(50.4)).toBe((50).toLocaleString());
  });

  it('uses one decimal between 1 and 10', () => {
    expect(pipe.transform(5.25)).toBe((5.3).toLocaleString());
  });

  it('uses two decimals below 1', () => {
    expect(pipe.transform(0.123)).toBe((0.12).toLocaleString());
  });
});
