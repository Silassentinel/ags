/*
 * The ascii.rest pieces this site may use as a backdrop.
 *
 * A static allow-list instead of the library's `load[name]` lookup: `load`
 * keeps all 191 pieces reachable, so the build would ship 191 lazy chunks
 * (about 1.2 MB) to the deploy repository. With static imports only the
 * pieces listed here are bundled. Add a line to allow another piece; the
 * name must be the piece's file name on ascii.rest.
 */
import type { Piece } from "ascii.rest";
import * as contourMap from "ascii.rest/pieces/contour-map";
import * as flowField from "ascii.rest/pieces/flow-field";
import * as matrixRain from "ascii.rest/pieces/matrix-rain";
import * as nightCoast from "ascii.rest/pieces/night-coast";
import * as rain from "ascii.rest/pieces/rain";
import * as snowfall from "ascii.rest/pieces/snowfall";
import * as starfield from "ascii.rest/pieces/starfield";

export const backdrops = {
  "contour-map": contourMap,
  "flow-field": flowField,
  "matrix-rain": matrixRain,
  "night-coast": nightCoast,
  rain,
  snowfall,
  starfield,
} satisfies Record<string, Piece>;

export type BackdropName = keyof typeof backdrops;

export function isBackdrop(name: string): name is BackdropName {
  return Object.hasOwn(backdrops, name);
}
