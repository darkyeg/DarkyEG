import { esc, extruded, glyphs, shell, speedLines, starPoints, text, wrap } from "../theme.mjs";

/**
 * The one card that is not backed by a public repository: a project in progress.
 * It carries no link and no repository data. The copy comes from the project's own
 * README (its promises), nothing else about it is shown.
 */
export const UPCOMING = {
  name: "arkstone",
  blurb: "A family of tools for building ambitious software, starting with TypeScript.",
  tagline: "The foundation TypeScript never had.",
  pillars: ["Programs that know their shape", "Mistakes caught early", "Plain TypeScript"],
  badge: "NOT PUBLIC YET",
  status: "IN DESIGN",
};

const PLATE = { size: 13.5, height: 30, track: 0.1 };

/**
 * A label plate. The badge (filled) and the status (outlined) share size, weight, height and
 * baseline, so they read as one row. The text is pinned to its estimated width with
 * textLength, so the box fits whichever sans-serif the viewer falls back to.
 */
function plate(t, x, y, label, { filled }) {
  const { size, height, track } = PLATE;
  const textW = Math.round(label.length * size * (0.68 + track));
  const w = textW + 32;
  const ink = filled ? "#05061a" : t.fg;
  const box = filled
    ? `<rect x="${x + 3}" y="${y + 3}" width="${w}" height="${height}" fill="${t.ink}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${height}" fill="${t.gold}" stroke="${t.ink}" stroke-width="2.5"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${height}" fill="none" stroke="${t.fg}" stroke-width="2.5"/>`;
  const label_ = text(x + w / 2, y + height / 2 + size * 0.36, esc(label), {
    size, fill: ink, weight: 800, anchor: "middle", spacing: `${track}em`, extra: `textLength="${textW}" lengthAdjust="spacing"`,
  });
  return { svg: `${box}\n  ${label_}`, width: w };
}

/** A tick drawn as a polygon, centred on (cx, cy). */
const tick = (t, cx, cy) =>
  `<polygon transform="translate(${cx - 9} ${cy - 8})" points="1,9 5,5 8,9 16,0 20,4 8,16" fill="${t.gold}" stroke="${t.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;

/** The banner's star again, so the card reads as the same world. */
function emblem(t, { x, y, r }) {
  return `
  <circle cx="${x}" cy="${y}" r="${r * 1.38}" fill="none" stroke="${t.fg}" stroke-width="2" stroke-dasharray="3 8" stroke-linecap="round"/>
  <polygon points="${starPoints(x + r * 0.09, y + r * 0.09, r)}" fill="${t.accent}" stroke="${t.ink}" stroke-width="4" stroke-linejoin="round"/>
  <polygon points="${starPoints(x, y, r)}" fill="${t.gold}" stroke="${t.ink}" stroke-width="4" stroke-linejoin="round"/>`;
}

function title(t, { x, y, size, maxW, depth }) {
  const base = glyphs("dela", UPCOMING.name, { x, y, size, fill: t.face });
  const s = base.width <= maxW ? size : size * (maxW / base.width);
  return extruded("dela", UPCOMING.name, { x, y, size: s, fill: t.face }, { color: t.accent, outline: t.ink, depth, stroke: 4 });
}

function wide(t) {
  const W = 810, H = 222, L = 36;
  const badge = plate(t, L, 20, UPCOMING.badge, { filled: true });
  const status = plate(t, L + badge.width + 16, 20, UPCOMING.status, { filled: false });
  // Laid out left to right by estimated text width, so a longer pillar pushes the next one.
  let px = L;
  const pillars = UPCOMING.pillars
    .map((p) => {
      const out = `${tick(t, px + 10, 196)}${text(px + 28, 201, esc(p), { size: 15.5, fill: t.fg })}`;
      px += 28 + p.length * 8.2 + 34;
      return out;
    })
    .join("\n  ");
  const body = `
  ${speedLines(704, 98, { fill: t.accent, opacity: 0.3, count: 60, inner: 80, outer: 700, seed: 9 })}
  <rect x="0" y="0" width="14" height="${H}" fill="url(#stripe)"/>
  ${emblem(t, { x: 704, y: 98, r: 54 })}
  ${badge.svg}
  ${status.svg}
  ${title(t, { x: L, y: 112, size: 56, maxW: 460, depth: 5 }).svg}
  ${text(L, 148, esc(UPCOMING.tagline), { size: 22, weight: 800, fill: t.kanji })}
  <rect x="${L}" y="166" width="${W - L - 28}" height="1.5" fill="${t.faint}"/>
  ${pillars}`;
  return shell({ w: W, h: H, t, title: `${UPCOMING.name}, not public yet. ${UPCOMING.tagline} ${UPCOMING.blurb}`, body });
}

function narrow(t) {
  const W = 370, L = 26;
  const lines = wrap(UPCOMING.tagline, 26, 2);
  const badge = plate(t, L, 22, UPCOMING.badge, { filled: true });
  const status = plate(t, L, 64, UPCOMING.status, { filled: false });
  const nameY = 150, tagTop = nameY + 38;
  const pillarsTop = tagTop + lines.length * 26 + 26;
  const H = pillarsTop + UPCOMING.pillars.length * 28 + 22;
  const pillars = UPCOMING.pillars.map((p, i) => `${tick(t, L + 10, pillarsTop + i * 28 - 5)}${text(L + 28, pillarsTop + i * 28, esc(p), { size: 15, fill: t.fg })}`).join("\n  ");
  const body = `
  ${speedLines(300, 60, { fill: t.accent, opacity: 0.3, count: 40, inner: 40, outer: 420, seed: 9 })}
  <rect x="0" y="0" width="9" height="${H}" fill="url(#stripe)"/>
  ${emblem(t, { x: 300, y: 58, r: 28 })}
  ${badge.svg}
  ${status.svg}
  ${title(t, { x: L, y: nameY, size: 44, maxW: W - L - 24, depth: 4 }).svg}
  ${lines.map((l, i) => text(L, tagTop + i * 26, esc(l), { size: 19, weight: 800, fill: t.kanji })).join("\n  ")}
  <rect x="${L}" y="${pillarsTop - 30}" width="${W - L * 2}" height="1.5" fill="${t.faint}"/>
  ${pillars}`;
  return shell({ w: W, h: H, t, title: `${UPCOMING.name}, not public yet. ${UPCOMING.tagline} ${UPCOMING.blurb}`, body });
}

export const upcoming = (t, _data, mode) => (mode === "narrow" ? narrow(t) : wide(t));
