import { extruded, shell } from "../theme.mjs";

/** The "to be continued" arrow, drawn as a plain block arrow. */
const arrow = (t, x, y, s = 1) =>
  `<polygon transform="translate(${x} ${y}) scale(${s})" points="0,12 30,12 30,2 54,19 30,36 30,26 0,26" fill="${t.gold}" stroke="${t.ink}" stroke-width="${(2.5 / s).toFixed(2)}" stroke-linejoin="round"/>`;

export function footer(t, _data, mode) {
  const narrow = mode === "narrow";
  const head = extruded("dela", "TO BE CONTINUED", { x: narrow ? 70 : 76, y: narrow ? 28 : 32, size: narrow ? 17 : 22, fill: t.face }, { color: t.accent, outline: t.ink, depth: narrow ? 2 : 3, stroke: narrow ? 2.5 : 3 });
  const body = `${arrow(t, narrow ? 4 : 6, 6, narrow ? 0.9 : 1)}
  ${head.svg}`;
  return shell({ w: narrow ? 370 : 810, h: 52, t, title: "To be continued", body, panel: false });
}
