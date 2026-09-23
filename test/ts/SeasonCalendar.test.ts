/**
 * Tests for seasonCalendar.ts — the Dutch produce -> recipe tag mapping that
 * links src/pages/seizoenskalender.astro entries to /tags/<tag> pages, and
 * the reverse lookup shown on src/pages/tags/[tag].astro.
 */
import {
  SEASON_MONTHS,
  PRODUCE_TAGS,
  linkedTagForProduce,
  seasonMonthsForTag,
} from '../../src/scripts/ContentBuilder/Season/seasonCalendar';
import { isValidTagSlug } from '../../src/scripts/ContentBuilder/Tags/tagUtils';

const allProduce = [...new Set(SEASON_MONTHS.flatMap(m => [...m.groenten, ...m.fruit]))];

describe('seasonCalendar', () => {
  test('has twelve months', () => {
    expect(SEASON_MONTHS).toHaveLength(12);
  });

  test('every calendar entry has a tag mapping', () => {
    const unmapped = allProduce.filter(p => !(PRODUCE_TAGS[p]?.length > 0));
    expect(unmapped).toEqual([]);
  });

  test('every mapped tag passes the /tags/<tag> allow-list', () => {
    const invalid = Object.values(PRODUCE_TAGS).flat().filter(tag => !isValidTagSlug(tag));
    expect(invalid).toEqual([]);
  });

  test('links to the first mapped tag that a recipe uses', () => {
    expect(linkedTagForProduce('pompoen', new Set(['Pumpkin', 'Butternut Squash']))).toBe('Pumpkin');
    expect(linkedTagForProduce('pompoen', new Set(['Butternut Squash']))).toBe('Butternut Squash');
  });

  test('does not link when no recipe uses the ingredient', () => {
    expect(linkedTagForProduce('schorseneer', new Set(['Carrot']))).toBeUndefined();
    expect(linkedTagForProduce('not-in-calendar', new Set(['Carrot']))).toBeUndefined();
  });

  test('returns the months an ingredient tag is in season', () => {
    // rabarber: Maart..Juli in the calendar
    expect(seasonMonthsForTag('Rhubarb')).toEqual([2, 3, 4, 5, 6]);
    expect(seasonMonthsForTag('Carrot')).toHaveLength(12);
  });

  test('returns no months for tags that are not seasonal produce', () => {
    expect(seasonMonthsForTag('BBQ')).toEqual([]);
  });
});
