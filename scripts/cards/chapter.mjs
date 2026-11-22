import { esc, extruded, glyphs, shell, text } from "../theme.mjs";

/** Manga part heading: 第N部 in gold, the title as chunky 3D type, and a hazard stripe. */
export function chapter(t, { number, kanji, title }, mode) {
  const narrow = mode === "narrow";
  const W = narrow ? 370 : 810, H = narrow ? 64 : 74;
  const y = narrow ? 44 : 53;
  const k = glyphs("dela", `第${kanji}部`, { x: 22, y, size: narrow ? 20 : 28, fill: t.kanji });
  const heading = extruded("dela", title, { x: 22 + k.width + (narrow ? 14 : 20), y, size: narrow ? 30 : 40, fill: t.face }, { color: t.accent, outline: t.ink, depth: narrow ? 3 : 4, stroke: narrow ? 3 : 4 });
  const label = narrow ? "" : text(W - 28, 28, `PART ${String(number).padStart(2, "0")}`, { size: 14, fill: t.fg, weight: 800, anchor: "end", spacing: "0.2em" });
  const barW = narrow ? 60 : 170;

  const body = `
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#tone)"/>
  ${k.svg}
  ${heading.svg}
  ${label}
  <rect x="${W - 28 - barW}" y="${y - 12}" width="${barW}" height="14" fill="url(#stripe)" stroke="${t.ink}" stroke-width="2"/>`;

  return shell({ w: W, h: H, t, title: `Part ${number}: ${esc(title)}`, body });
}
