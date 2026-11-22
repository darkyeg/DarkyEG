import { esc, shell, text } from "../theme.mjs";

/** A clickable link chip (the page wraps the image in a link).  Dark/light only. */
export function chip(t, label) {
  const textW = Math.round(label.length * 10.6), w = textW + 70, h = 40;
  const body = `
  <rect x="4" y="4" width="${w}" height="${h}" fill="${t.accent}"/>
  <rect x="0" y="0" width="${w}" height="${h}" fill="${t.gold}" stroke="${t.ink}" stroke-width="2.5"/>
  ${text(20, 26, esc(label), { size: 17, fill: "#05061a", weight: 800, extra: `textLength="${textW}" lengthAdjust="spacing"` })}
  <polygon transform="translate(${w - 34} 12)" points="0,7 14,7 14,2 24,10 14,18 14,13 0,13" fill="#05061a"/>`;
  // Outer size: the shell adds its own gutter; the shadow needs 4px, so widen the canvas.
  return shell({ w: w + 4, h: h + 4, t, title: label, body, panel: false });
}
