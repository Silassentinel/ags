/**
 * Basic allow-list for recipe tag values before they are turned into a
 * filesystem/URL path segment (see src/pages/tags/[tag].astro getStaticPaths).
 *
 * Recipe frontmatter comes from the external, untrusted Silassentinel/Recipes
 * repository (see .security/findings.md RT-2026-07-30-01). A malformed tag
 * value can become a literal path segment at build time — e.g. a broken YAML
 * entry produced the tag `burgers"`, which was committed to the build output
 * as a literal directory named `burgers"`, and a tag value like
 * `../../../../PWNED-TRAVERSAL` crashes the Astro build entirely
 * (RT-2026-07-30-02).
 *
 * The allow-list below was calibrated against every tag already in
 * production use (letters, digits, spaces, hyphens, underscores) so
 * legitimate multi-word tags such as "Light course" or "Dry Rub" keep
 * working, while path traversal sequences and stray quote/control
 * characters are rejected.
 */
const SAFE_TAG_PATTERN = /^[A-Za-z0-9 _-]+$/;

/**
 * Returns true if `tag` is safe to use as a URL/filesystem path segment.
 */
export function isValidTagSlug(tag: string): boolean {
  return typeof tag === 'string' && tag.trim().length > 0 && SAFE_TAG_PATTERN.test(tag);
}

/**
 * Filters a list of tags down to only those safe to use as path segments,
 * dropping (not transforming) anything that fails the allow-list so that
 * unsafe values never reach getStaticPaths().
 */
export function filterValidTags(tags: string[]): string[] {
  return tags.filter(isValidTagSlug);
}
