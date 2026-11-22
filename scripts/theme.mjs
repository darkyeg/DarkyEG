// Shared look for every card: black-and-white manga ink with one blood-red accent.
// Dark mode is the "negative" page (bone ink on black); light mode is paper.
import { readFileSync } from "node:fs";

export const themes = {
  dark: {
    bg: "#080a1c", panel: "#0e1130", fg: "#f4f1e6", mid: "#c3c4e2", faint: "#222650",
    accent: "#8a63ff", gold: "#f6c418", ink: "#000000", paper: "#f4f1e6", face: "#f4f1e6", kanji: "#f6c418",
    ramp: ["#1b1e47", "#3a2f94", "#5b3fd6", "#8a63ff", "#f6c418"],
  },
  light: {
    bg: "#efe8d6", panel: "#f6f0e0", fg: "#0a0c2a", mid: "#34355a", faint: "#d8d0bb",
    accent: "#4a2cb8", gold: "#f0b400", ink: "#0a0c2a", paper: "#f6f0e0", face: "#f0b400", kanji: "#4a2cb8",
    ramp: ["#ddd5c0", "#cbbdf2", "#a98ae8", "#6a43d8", "#25126e"],
  },
};

export const SANS = `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
export const MONO = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`;
export const SERIF = `ui-serif, Georgia, Cambria, 'Times New Roman', serif`;

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const nf = new Intl.NumberFormat("en-US");

/** 922, 5.7k, 11k, 1.2M: short counts for tight columns. */
export const compact = (n) => {
  const [div, unit] = n >= 999_500 ? [1e6, "M"] : n >= 1e3 ? [1e3, "k"] : [1, ""];
  const v = n / div;
  return `${unit ? v.toFixed(v >= 10 ? 0 : 1).replace(/\.0$/, "") : v}${unit}`;
};

const dateFmt = (opts) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });
const parse = (iso) => new Date(`${iso}T00:00:00Z`);
export const fmtDay = (iso) => dateFmt({ month: "short", day: "numeric" }).format(parse(iso));
export const fmtDayYear = (iso) => dateFmt({ month: "short", day: "numeric", year: "numeric" }).format(parse(iso));
export const fmtRange = (start, end) =>
  start.slice(0, 4) === end.slice(0, 4) ? `${fmtDay(start)} – ${fmtDayYear(end)}` : `${fmtDayYear(start)} – ${fmtDayYear(end)}`;

export const hours = (seconds) => `${nf.format(Math.round(seconds / 3600))}h`;

/** Greedy word wrap into at most `maxLines` lines, ellipsising what does not fit. */
export function wrap(text, maxChars, maxLines) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && `${line} ${word}`.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[ .,;:]+$/, "")}…`;
  return kept;
}

// ---- outlined display type -------------------------------------------------
// Pirata One (gothic) and Dela Gothic One (heavy, with kana/kanji), both SIL OFL.
// Outlines are baked into brand/glyphs.json so every viewer renders identical letters.
const FONTS = JSON.parse(readFileSync(new URL("./brand/glyphs.json", import.meta.url), "utf8"));

/** Returns { svg, width } for `str` set in the outlined font at `size` px, baseline at (x, y). */
export function glyphs(font, str, { x, y, size, fill, anchor = "start", tracking = 0, extra = "" }) {
  const f = FONTS[font];
  const scale = size / f.upm;
  let cursor = 0;
  const parts = [];
  for (const ch of str) {
    const g = f.glyphs[ch];
    if (!g) {
      cursor += f.upm * 0.3 + tracking / scale;
      continue;
    }
    if (g.d) parts.push(`<path transform="translate(${cursor.toFixed(0)} 0)" d="${g.d}"/>`);
    cursor += g.adv + tracking / scale;
  }
  const width = cursor * scale;
  const startX = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  return {
    width,
    svg: `<g transform="translate(${startX.toFixed(1)} ${y}) scale(${scale.toFixed(4)} ${(-scale).toFixed(4)})" fill="${fill}"${extra ? ` ${extra}` : ""}>${parts.join("")}</g>`,
  };
}

/** Same as `glyphs` but with a hard offset shadow, the manga "sticker" look. */
export function inked(font, str, opts, shadowFill, offset = 4) {
  const shadow = glyphs(font, str, { ...opts, x: opts.x + offset, y: opts.y + offset, fill: shadowFill });
  const main = glyphs(font, str, opts);
  return { width: main.width, svg: `${shadow.svg}${main.svg}` };
}

/**
 * Chunky 3D title: `depth` stacked copies walk down-right in `color`, then the face on top,
 * every layer outlined in `outline`. The JoJo logo look.
 */
export function extruded(font, str, opts, { color, outline, depth = 6, stroke = 3 }) {
  const style = (fill) => ({ ...opts, fill, extra: `stroke="${outline}" stroke-width="${stroke}" stroke-linejoin="round" paint-order="stroke"` });
  const layers = [];
  for (let k = depth; k >= 1; k--) layers.push(glyphs(font, str, { ...style(color), x: opts.x + k * 0.9, y: opts.y + k * 0.9 }).svg);
  const face = glyphs(font, str, style(opts.fill));
  return { width: face.width, svg: `${layers.join("")}${face.svg}` };
}

/** Five-point star polygon points, point up. */
export function starPoints(cx, cy, r, inner = 0.42) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * inner : r;
    return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

// ---- panels ------------------------------------------------------------------
/** The panel outline, inset by half the border so strokes stay inside. */
export function panelPoints(w, h, inset = 1.5) {
  return [[inset, inset], [w - inset, inset], [w - inset, h - inset], [inset, h - inset]].map((p) => p.join(",")).join(" ");
}

/** Gutter around every card, so stacked images never touch regardless of the page CSS. */
export const GUTTER = 10;

/**
 * Wraps card content in the SVG shell. `w`/`h` are the card's own size; the canvas adds
 * a transparent gutter. Base styles are always the *final* state, keyframes only define
 * the start, so reduced-motion and non-animating viewers see a finished card.
 */
export function shell({ w, h, t, title, body, css = "", panel = true }) {
  const W = w + GUTTER * 2, H = h + GUTTER * 2;
  const pts = panelPoints(w, h);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <defs>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${t.fg}" stroke-width="1.3" opacity=".5"/></pattern>
    <pattern id="stripe" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="6" height="12" fill="${t.gold}"/><rect x="6" width="6" height="12" fill="${t.ink}"/></pattern>
    <pattern id="check" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${t.accent}"/><rect x="8" y="8" width="8" height="8" fill="${t.accent}"/><rect x="8" width="8" height="8" fill="${t.ink}"/><rect y="8" width="8" height="8" fill="${t.ink}"/></pattern>
    <pattern id="hatchAccent" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${t.accent}" stroke-width="1.6"/></pattern>
    <pattern id="tone" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.05" fill="${t.mid}" opacity=".45"/></pattern>
    <clipPath id="panel"><polygon points="${pts}"/></clipPath>
    <style>
      .grow{transform-box:fill-box;transform-origin:left center;animation:growx .8s cubic-bezier(.2,.8,.2,1) backwards}
      .rise{transform-box:fill-box;transform-origin:center bottom;animation:growy .7s cubic-bezier(.2,.8,.2,1) backwards}
      .pop{transform-box:fill-box;transform-origin:center;animation:pop .45s ease-out backwards}
      .tremble{animation:tremble .22s steps(1) infinite}
      @keyframes growx{from{transform:scaleX(0)}}
      @keyframes growy{from{transform:scaleY(0)}}
      @keyframes pop{from{opacity:0;transform:scale(.3)}}
      @keyframes tremble{0%{transform:translate(0,0)}25%{transform:translate(1.4px,-1px)}50%{transform:translate(-1px,1.2px)}75%{transform:translate(-1.4px,-.8px)}}
      ${css}
      @media (prefers-reduced-motion:reduce){*{animation:none!important}}
    </style>
  </defs>
  <g transform="translate(${GUTTER} ${GUTTER})">
    ${panel ? `<polygon points="${pts}" transform="translate(5 5)" fill="${t.accent}"/>
    <polygon points="${pts}" fill="${t.panel}"/>` : ""}
    <g${panel ? ' clip-path="url(#panel)"' : ""}>
    ${body}
    </g>
    ${panel ? `<polygon points="${pts}" fill="none" stroke="${t.fg}" stroke-width="3" stroke-linejoin="miter"/>` : ""}
  </g>
</svg>
`;
}

export const text = (x, y, content, { size = 13, fill, weight = 400, anchor = "start", mono = false, serif = false, italic = false, spacing = "", extra = "" }) =>
  `<text x="${x}" y="${y}" font-family="${mono ? MONO : serif ? SERIF : SANS}" font-size="${size}" font-weight="${weight}"${italic ? ' font-style="italic"' : ""} fill="${fill}" text-anchor="${anchor}"${spacing ? ` letter-spacing="${spacing}"` : ""}${extra ? ` ${extra}` : ""}>${content}</text>`;

/** Lines radiating from a focal point, the manga "impact" background. */
export function speedLines(cx, cy, { count = 70, inner = 60, outer = 900, fill, opacity = 0.14, seed = 7 }) {
  const rand = (n) => {
    const v = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const rays = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand(i) * 0.05;
    const half = 0.004 + rand(i + 99) * 0.012;
    const r0 = inner + rand(i + 5) * inner;
    const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    rays.push(`${p(r0, angle - half / 3)} ${p(outer, angle - half)} ${p(outer, angle + half)} ${p(r0, angle + half / 3)}`);
  }
  return `<g fill="${fill}" opacity="${opacity}">${rays.map((pts) => `<polygon points="${pts}"/>`).join("")}</g>`;
}

/** Layouts: the wide card, and a narrow one that replaces it on small screens or when zoomed in. */
export const LAYOUT = { wide: { card: 810 }, narrow: { card: 370 } };
/** `<picture>` switches to the narrow cards at this viewport width (CSS px). */
export const NARROW_BREAKPOINT = 640;

/** A bordered caption/tag label; returns its svg and width so rows can flow. */
export function tag(t, x, y, label, { size = 12, height = 24 } = {}) {
  // Round capitals run wider than the rest, so short labels like "GO" are not squeezed.
  const em = [...label.toUpperCase()].reduce((n, ch) => n + ("GOQMWDCNUH#".includes(ch) ? 0.86 : ch === "I" ? 0.5 : 0.74), 0);
  const textW = Math.round(em * size);
  const width = textW + Math.round(size * 1.8);
  return {
    width,
    // The text is pinned to its estimated width so any fallback font fits the box.
    svg: `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${t.fg}" stroke-width="1.8"/>${text(x + width / 2, y + height / 2 + size * 0.36, esc(label.toUpperCase()), { size, fill: t.fg, weight: 800, anchor: "middle", spacing: "0.06em", extra: `textLength="${textW}" lengthAdjust="spacing"` })}`,
  };
}

/** Sets heavy numerals so they never outgrow `maxWidth`. */
export function fitted(str, size, maxWidth, opts) {
  const first = glyphs("dela", str, { ...opts, size });
  return first.width <= maxWidth ? first : glyphs("dela", str, { ...opts, size: size * (maxWidth / first.width) });
}

/** Vertical bar chart. Labels the tallest bar with its value so the scale is readable. */
export function barChart(t, { x, width, title, items, top, maxH, labelSize = 13, valueLabel = (v) => nf.format(v) }) {
  const peak = Math.max(...items.map((i) => i.value), 1);
  const slot = width / items.length;
  const barW = Math.min(slot - 6, 30);
  const base = top + 42 + maxH;
  const bars = items
    .map((item, i) => {
      const h = Math.max((item.value / peak) * maxH, item.value ? 3 : 1.5);
      const bx = x + i * slot + (slot - barW) / 2;
      const isPeak = item.value === peak;
      // The peak label is centred on its bar, then kept inside the chart so a long number never clips.
      const label = valueLabel(item.value);
      const half = label.length * 4.1;
      const lx = Math.min(Math.max(bx + barW / 2, x + half), x + width - half);
      const value = isPeak ? text(lx.toFixed(1), (base - h - 6).toFixed(1), label, { size: 13, fill: t.fg, mono: true, weight: 700, anchor: "middle" }) : "";
      return `<g class="rise" style="animation-delay:${(i * 0.05).toFixed(2)}s"><rect x="${bx.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${isPeak ? t.accent : "url(#hatchAccent)"}" stroke="${t.accent}" stroke-width="1.5"><title>${item.label}: ${nf.format(item.value)}</title></rect></g>${value}
  ${text((bx + barW / 2).toFixed(1), base + 4 + labelSize, item.label, { size: labelSize, fill: t.mid, anchor: "middle" })}`;
    })
    .join("\n  ");
  return { svg: `${text(x, top + 4, title, { size: 15, weight: 700, fill: t.fg })}\n  ${bars}`, bottom: base + 8 + labelSize };
}
