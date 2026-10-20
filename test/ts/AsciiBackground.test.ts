/**
 * Tests for the ASCII backdrop's season and pool logic
 * (src/scripts/ui/features/AsciiBackground/).
 */

import { monthIn, seasonFor, seasonForMonth, SEASON_TIME_ZONE } from '../../src/scripts/ui/features/AsciiBackground/seasons';
import { POOLS, pick, pickBackdrop } from '../../src/scripts/ui/features/AsciiBackground/pool';

describe('seasons', () => {
  test('every month maps to its meteorological season', () => {
    expect([1, 2, 12].map(seasonForMonth)).toEqual(['winter', 'winter', 'winter']);
    expect([3, 4, 5].map(seasonForMonth)).toEqual(['lente', 'lente', 'lente']);
    expect([6, 7, 8].map(seasonForMonth)).toEqual(['zomer', 'zomer', 'zomer']);
    expect([9, 10, 11].map(seasonForMonth)).toEqual(['herfst', 'herfst', 'herfst']);
  });

  test('the season is decided on the date in Belgium', () => {
    expect(SEASON_TIME_ZONE).toBe('Europe/Brussels');
    // 23:30 UTC on 28 February is already 00:30 on 1 March in Brussels (CET)
    const lateFebruaryUtc = new Date('2026-02-28T23:30:00Z');
    expect(monthIn(lateFebruaryUtc, 'UTC')).toBe(2);
    expect(monthIn(lateFebruaryUtc)).toBe(3);
    expect(seasonFor(lateFebruaryUtc)).toBe('lente');
    // ... and 22:30 UTC on 31 August is 00:30 on 1 September in Brussels (CEST)
    expect(seasonFor(new Date('2026-08-31T22:30:00Z'))).toBe('herfst');
  });

  test('seasonFor defaults to now', () => {
    expect(['lente', 'zomer', 'herfst', 'winter']).toContain(seasonFor());
  });
});

describe('pools', () => {
  test('every season has a non-empty pool without duplicates', () => {
    for (const pool of Object.values(POOLS)) {
      expect(pool.length).toBeGreaterThan(0);
      expect(new Set(pool).size).toBe(pool.length);
    }
    expect(Object.keys(POOLS).sort()).toEqual(['herfst', 'lente', 'winter', 'zomer']);
  });

  test('pick reaches every entry of a pool and never falls off its ends', () => {
    const pool = ['a', 'b', 'c'] as const;
    expect(pick(pool, () => 0)).toBe('a');
    expect(pick(pool, () => 0.34)).toBe('b');
    expect(pick(pool, () => 0.99)).toBe('c');
    expect(pick(pool, () => 1)).toBe('c'); // a random() that returns 1 would otherwise index past the end
    expect(pick(pool, () => -0.5)).toBe('a');
    expect(() => pick([], () => 0)).toThrow();
  });

  test('pickBackdrop only returns pieces from that season', () => {
    for (const [season, pool] of Object.entries(POOLS)) {
      for (let i = 0; i < 50; i++) {
        expect(pool).toContain(pickBackdrop(season as keyof typeof POOLS));
      }
    }
  });

  test('pickBackdrop is uniform enough to show every piece of the pool', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) seen.add(pickBackdrop('winter'));
    expect([...seen].sort()).toEqual([...POOLS.winter].sort());
  });
});
