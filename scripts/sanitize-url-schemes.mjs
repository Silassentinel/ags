/**
 * Rehype-style plugin (Sätteri's `hastPlugins` extension point — see
 * `astro.config.mjs`'s `markdown.processor`) that allow-lists the URL scheme
 * on every rendered `<a href>` / `<img src>` in recipe markdown fetched from
 * the untrusted external `Silassentinel/Recipes` repository.
 *
 * WHY THIS LIVES HERE INSTEAD OF SCANNING MARKDOWN SOURCE
 * ---------------------------------------------------------
 * An earlier version of this control (`sanitizeMarkdownUrls()` in
 * scripts/preserve-build.js, removed by this change) regex-matched markdown
 * *source* to find link/image destinations and validate their scheme before
 * the file was ever parsed. That is structurally the wrong layer: it has to
 * reimplement CommonMark's escape/entity/reference-resolution rules to know
 * what URL a browser will eventually receive, and any disagreement with the
 * real parser (`@astrojs/markdown-satteri`) is a bypass. Confirmed bypasses
 * of the regex approach (see .security/findings.md RT-2026-09-06-04):
 * backslash-escaped colons (`javascript\:alert(1)`, unescaped by the real
 * parser after the regex ran), an uppercase-`X` hex character reference
 * (`&#X6A;`, which the regex's hex-decoder missed but the real parser
 * decodes), and link reference definitions nested inside blockquotes/list
 * items (CommonMark's reference map is document-wide regardless of
 * container nesting, but the regex's line-anchor missed them). The same
 * regex was also a quadratic-time build DoS (RT-2026-09-06-05).
 *
 * This plugin instead walks the already-parsed HAST (HTML AST), *after*
 * Sätteri has resolved every escape/entity/reference itself, and checks the
 * exact string that will end up in the `href`/`src` attribute — the same
 * string a browser would parse when the link is clicked/the image is
 * loaded. There is no source-level parsing left to disagree with, which
 * structurally eliminates the bypass classes above (and removes the
 * vulnerable regex, fixing the DoS as a side effect).
 *
 * Scheme detection uses the real WHATWG URL parser (Node's built-in `URL`,
 * the same parsing algorithm a browser uses to resolve a link/image
 * destination) rather than a hand-rolled regex, so obfuscation tricks that
 * only a full URL parser resolves correctly (IDNA, percent-encoding, etc.)
 * can't reopen the same class of bug at this new layer either.
 */

/** URL schemes that are safe to leave as a live, clickable/loadable
 * href/src. A destination with no scheme (a bare relative path, e.g.
 * `./image.png`, or a same-page fragment, e.g. `#section`) resolves against
 * {@link RESOLUTION_BASE} and inherits its `http:` scheme, so it is
 * considered safe too, matching prior behaviour. */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

// Only used so a scheme-less/relative destination resolves instead of
// throwing; the domain itself is never used for anything, and its own
// scheme (http:) is in the allow-list so relative links stay safe.
const RESOLUTION_BASE = 'http://sanitizer.invalid/';

/** Inert placeholder a blocked destination is replaced with. Matches the
 * convention used by the removed markdown-source sanitizer. */
export const BLOCKED_URL_PLACEHOLDER = '#blocked-by-sanitizer';

/**
 * @param {unknown} value A `href`/`src` attribute value already resolved by
 * the markdown parser (all escapes/entities/references applied).
 * @returns {boolean} true if the value is safe to leave as a live
 * href/src.
 */
export function isSafeElementUrl(value) {
  if (typeof value !== 'string') {
    return true;
  }
  let parsed;
  try {
    parsed = new URL(value, RESOLUTION_BASE);
  } catch {
    // Not parseable as a URL even against a permissive base — fail closed.
    return false;
  }
  return ALLOWED_PROTOCOLS.has(parsed.protocol);
}

/**
 * Factory for the Sätteri `hastPlugins` entry (see
 * node_modules/satteri/dist/plugin.d.ts — a factory is called once per
 * document compile so no state leaks between recipes). Neutralises the
 * `href`/`src` of any `<a>`/`<img>` element whose destination fails
 * {@link isSafeElementUrl}.
 * @returns {{name: string, element: {filter: string[], visit: Function}}}
 */
export function createUrlSchemeSanitizerPlugin() {
  return {
    name: 'sanitize-url-schemes',
    element: {
      filter: ['a', 'img'],
      visit(node, ctx) {
        const attribute = node.tagName === 'img' ? 'src' : 'href';
        const value = node.properties && node.properties[attribute];
        if (typeof value !== 'string') {
          return;
        }
        if (!isSafeElementUrl(value)) {
          ctx.setProperty(node, attribute, BLOCKED_URL_PLACEHOLDER);
        }
      },
    },
  };
}
