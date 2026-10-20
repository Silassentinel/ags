/**
 * The ascii.rest pieces each season draws its backdrop from, and the random
 * pick. The names are typed against the allow-list in
 * src/components/Background/pieces.ts, so a piece that is not bundled
 * cannot end up in a pool (astro check fails).
 */

import type { BackdropName } from '../../../../components/Background/pieces';
import type { Season } from './seasons';

export const POOLS = {
  lente: ['cherry-blossom', 'rain', 'fern', 'butterfly', 'pond-ripples'],
  zomer: ['fireflies', 'sea-swell', 'starfield', 'sunrise', 'wind'],
  herfst: ['wind', 'rain', 'flow-field', 'lightning', 'ruled-mountains'],
  winter: ['snowfall', 'starfield', 'aurora', 'contour-map', 'moon-phases'],
} as const satisfies Record<Season, readonly BackdropName[]>;

/** One entry of `pool`, chosen with `random` (a function returning [0, 1), Math.random by default). */
export function pick<T>(pool: readonly T[], random: () => number = Math.random): T {
  if (pool.length === 0) throw new Error('pick: the pool is empty');
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
  return pool[index];
}

/** A random piece from the season's pool. */
export function pickBackdrop(season: Season, random: () => number = Math.random): BackdropName {
  return pick(POOLS[season], random);
}
