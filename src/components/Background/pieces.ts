/*
 * The ascii.rest pieces this site may use as a backdrop.
 *
 * A static allow-list of lazy imports instead of the library's `load[name]`
 * lookup: `load` keeps all 191 pieces reachable, so the build would ship
 * 191 chunks (about 1.2 MB) to the deploy repository. Each entry here
 * becomes one small chunk that is only fetched when that piece plays. The
 * seasonal pools in src/scripts/ui/features/AsciiBackground/pool.ts are
 * typed against these names. To allow another piece, add one line; the
 * key must be the piece's file name on ascii.rest.
 */
import type { Piece } from "ascii.rest";

export const backdrops = {
  "aurora": () => import("ascii.rest/pieces/aurora"),
  "butterfly": () => import("ascii.rest/pieces/butterfly"),
  "cherry-blossom": () => import("ascii.rest/pieces/cherry-blossom"),
  "contour-map": () => import("ascii.rest/pieces/contour-map"),
  "fern": () => import("ascii.rest/pieces/fern"),
  "fireflies": () => import("ascii.rest/pieces/fireflies"),
  "flow-field": () => import("ascii.rest/pieces/flow-field"),
  "lightning": () => import("ascii.rest/pieces/lightning"),
  "moon-phases": () => import("ascii.rest/pieces/moon-phases"),
  "pond-ripples": () => import("ascii.rest/pieces/pond-ripples"),
  "rain": () => import("ascii.rest/pieces/rain"),
  "ruled-mountains": () => import("ascii.rest/pieces/ruled-mountains"),
  "sea-swell": () => import("ascii.rest/pieces/sea-swell"),
  "snowfall": () => import("ascii.rest/pieces/snowfall"),
  "starfield": () => import("ascii.rest/pieces/starfield"),
  "sunrise": () => import("ascii.rest/pieces/sunrise"),
  "wind": () => import("ascii.rest/pieces/wind"),
} satisfies Record<string, () => Promise<Piece>>;

export type BackdropName = keyof typeof backdrops;

export function isBackdrop(name: string): name is BackdropName {
  return Object.hasOwn(backdrops, name);
}
