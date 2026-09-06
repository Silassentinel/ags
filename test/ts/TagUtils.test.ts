/**
 * Tests for tagUtils.ts — allow-listing of recipe tag values before they
 * become a URL/filesystem path segment in src/pages/tags/[tag].astro.
 *
 * Regression coverage for:
 *  - RT-2026-07-30-02: a tag value of `../../../../PWNED-TRAVERSAL` crashed
 *    the Astro build (`Missing parameter: tag`).
 *  - The related finding (`burgers"` becoming a literal committed path):
 *    broken YAML in recipe frontmatter produced a tag containing a stray
 *    quote character, which was written to disk as a directory literally
 *    named `burgers"`.
 */

import { isValidTagSlug, filterValidTags } from '../../src/scripts/ContentBuilder/Tags/tagUtils';

describe('tagUtils allow-listing', () => {
  test('rejects path traversal tag values (RT-2026-07-30-02 repro)', () => {
    expect(isValidTagSlug('../../../../PWNED-TRAVERSAL')).toBe(false);
  });

  test('rejects tags containing stray quote characters (burgers" repro)', () => {
    expect(isValidTagSlug('burgers"')).toBe(false);
  });

  test('rejects other filesystem/URL-unsafe characters', () => {
    expect(isValidTagSlug('<script>')).toBe(false);
    expect(isValidTagSlug('a/b')).toBe(false);
    expect(isValidTagSlug('a\\b')).toBe(false);
    expect(isValidTagSlug('')).toBe(false);
  });

  test('accepts every tag currently used in production content', () => {
    // Sampled from the real, currently-published tag set (see
    // ../silassentinel.github.io/tags/) to make sure the allow-list does not
    // regress any existing tag page.
    const realTags = [
      'Autumn', 'bacon', 'Bacon', 'BBQ', 'Dry Rub', 'Apple Cider',
      'Bell Pepper', 'Butternut Squash', 'Comfort Food', '30-Minutes',
      'Cherry Tomatoes', 'Sweet Potato', 'burgers',
    ];
    for (const tag of realTags) {
      expect(isValidTagSlug(tag)).toBe(true);
    }
  });

  test('filterValidTags drops unsafe tags while keeping safe ones', () => {
    const input = ['Savory', '../../../../PWNED-TRAVERSAL', 'burgers"', 'Dry Rub'];
    expect(filterValidTags(input)).toEqual(['Savory', 'Dry Rub']);
  });
});
