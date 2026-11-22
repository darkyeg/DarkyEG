import { esc, extruded, glyphs, shell, speedLines, starPoints, tag, text } from "../theme.mjs";

const TAGLINE = "I fix the small things that annoy me.";
const FALLBACK_LANGS = ["Rust", "Go", "TypeScript", "Nix"];

/** A gold star with a hard purple extrusion, ringed by halftone and impact lines. */
function emblem(t, { x, y, r }) {
  return `
  <circle cx="${x}" cy="${y}" r="${r * 1.45}" fill="url(#tone)"/>
  <circle cx="${x}" cy="${y}" r="${r * 1.22}" fill="none" stroke="${t.fg}" stroke-width="2.5" stroke-dasharray="3 9" stroke-linecap="round"/>
  <polygon points="${starPoints(x + r * 0.09, y + r * 0.09, r)}" fill="${t.accent}" stroke="${t.ink}" stroke-width="5" stroke-linejoin="round"/>
  <polygon points="${starPoints(x, y, r)}" fill="${t.gold}" stroke="${t.ink}" stroke-width="5" stroke-linejoin="round"/>
  <polygon points="${starPoints(x, y, r * 0.5, 0.5)}" fill="none" stroke="${t.ink}" stroke-width="2.5" stroke-linejoin="round" opacity=".55"/>`;
}

function tagRow(t, langs, { x, y, maxWidth, size, height }) {
  let cursor = x;
  return langs
    .map((name) => {
      const tg = tag(t, cursor, y, name, { size, height });
      cursor += tg.width + 10;
      return cursor - 10 - x <= maxWidth ? tg.svg : "";
    })
    .join("\n  ");
}

/** The title face, scaled so the word never runs into the emblem. */
function title(t, { x, y, size, maxWidth, depth, stroke }) {
  const probe = glyphs("dela", "Darky", { x, y, size, fill: t.face });
  const fit = probe.width > maxWidth ? size * (maxWidth / probe.width) : size;
  return extruded("dela", "Darky", { x, y, size: fit, fill: t.face }, { color: t.accent, outline: t.ink, depth, stroke });
}

const halo = (t) => `<radialGradient id="halo"><stop offset="0" stop-color="${t.accent}" stop-opacity=".55"/><stop offset=".6" stop-color="${t.accent}" stop-opacity=".12"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>`;

/** The gold caption box. Its text is pinned to `textW`, so the box hugs it in any serif fallback. */
function caption(t, { x, y, h, size, textW, pad }) {
  const w = textW + pad * 2;
  return `<rect x="${x + 4}" y="${y + 4}" width="${w}" height="${h}" fill="${t.ink}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${t.gold}" stroke="${t.ink}" stroke-width="2.5"/>
  ${text(x + pad, y + h / 2 + size * 0.35, esc(TAGLINE), { size, fill: "#05061a", serif: true, italic: true, weight: 700, extra: `textLength="${textW}" lengthAdjust="spacing"` })}`;
}

/** The name above the title, in the display face so it belongs to the same page as "Darky". */
function eyebrow(t, { x, y, size, bar = true }) {
  const gap = bar ? size * 3.2 : 0;
  const name = glyphs("dela", "YOUSSEF KHALIL", { x: x + gap, y, size, fill: t.fg, tracking: size * 0.18 });
  const mark = bar ? `<rect x="${x}" y="${y - size * 0.78}" width="${size * 2.6}" height="${size * 0.78}" fill="${t.gold}" stroke="${t.ink}" stroke-width="1.5"/>\n  ` : "";
  return `${mark}${name.svg}`;
}

function wide(t, langs) {
  // 1000px wide so the banner is scaled less on a 830px column and its small text stays legible.
  const W = 1000, H = 366;
  const E = { x: 790, y: 178, r: 104 };
  const name = title(t, { x: 46, y: 206, size: 132, maxWidth: 590, depth: 8, stroke: 5 });
  const sfx = [..."ゴゴゴゴ"]
    .map((ch, i) => glyphs("dela", ch, { x: 934, y: 60 + i * 46, size: 36, fill: t.gold, extra: `stroke="${t.ink}" stroke-width="2" paint-order="stroke"` }).svg)
    .join("");

  const body = `
  <defs>${halo(t)}</defs>
  <circle cx="${E.x}" cy="${E.y}" r="360" fill="url(#halo)"/>
  ${speedLines(E.x, E.y, { fill: t.accent, opacity: 0.3, count: 70, inner: 150, outer: 1100, seed: 5 })}
  ${speedLines(E.x, E.y, { fill: t.fg, opacity: 0.07, count: 50, inner: 130, outer: 1100, seed: 11 })}
  ${emblem(t, E)}
  ${eyebrow(t, { x: 50, y: 66, size: 19 })}
  ${name.svg}
  ${caption(t, { x: 50, y: 244, h: 46, size: 28, textW: Math.round(TAGLINE.length * 11.4), pad: 22 })}
  ${tagRow(t, langs, { x: 50, y: 308, maxWidth: 600, size: 16, height: 30 })}
  <rect x="0" y="${H - 16}" width="${W}" height="16" fill="url(#check)"/>
  <g class="tremble">${sfx}</g>`;
  return shell({ w: W, h: H, t, title: "Darky (Youssef Khalil): I fix the small things that annoy me", body });
}

function narrow(t, langs) {
  const W = 370, H = 432;
  const E = { x: 292, y: 96, r: 50 };
  const name = title(t, { x: 22, y: 224, size: 100, maxWidth: 322, depth: 6, stroke: 4 });
  const sfx = glyphs("dela", "ゴゴゴゴ", { x: W - 22, y: 396, size: 26, fill: t.gold, anchor: "end", extra: `stroke="${t.ink}" stroke-width="1.6" paint-order="stroke"` });

  const body = `
  <defs>${halo(t)}</defs>
  <circle cx="${E.x}" cy="${E.y}" r="190" fill="url(#halo)"/>
  ${speedLines(E.x, E.y, { fill: t.accent, opacity: 0.3, count: 50, inner: 70, outer: 500, seed: 5 })}
  ${emblem(t, E)}
  ${eyebrow(t, { x: 24, y: 50, size: 12.5, bar: false })}
  ${name.svg}
  ${caption(t, { x: 24, y: 262, h: 40, size: 15.5, textW: Math.round(TAGLINE.length * 6.3), pad: 14 })}
  ${tagRow(t, langs, { x: 24, y: 322, maxWidth: 322, size: 13, height: 26 })}
  <rect x="0" y="${H - 16}" width="${W}" height="16" fill="url(#check)"/>
  <g class="tremble">${sfx.svg}</g>`;
  return shell({ w: W, h: H, t, title: "Darky (Youssef Khalil): I fix the small things that annoy me", body });
}

export function banner(t, { waka }, mode) {
  const langs = waka?.languages.length ? waka.languages.slice(0, 4).map((l) => l.name) : FALLBACK_LANGS;
  return mode === "narrow" ? narrow(t, langs) : wide(t, langs);
}
