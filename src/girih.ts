import svg from "./assets/hero-pattern-D.svg?raw";

/**
 * The hero girih as flat numbers [x1, y1, x2, y2, delayMs] per line, in the 1440x640
 * viewBox of hero-pattern-D.svg. The home page draws them on a canvas (see
 * scripts/girih-canvas.js): animating 1432 SVG paths made the main thread busy on phones.
 */
export const GIRIH_LINES: number[] = [...svg.matchAll(/style="--d:(\d+)ms" d="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)"/g)].flatMap(
  (m) => [+m[2], +m[3], +m[4], +m[5], +m[1]],
);
