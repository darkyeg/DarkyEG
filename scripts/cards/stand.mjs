import { esc, extruded, nf, shell, text } from "../theme.mjs";

const RANKS = ["E", "D", "C", "B", "A"];
// Lower bounds for D, C, B, A. A value under the first bound is rank E.
const rank = (value, [d, c, b, a]) => (value >= a ? 4 : value >= b ? 3 : value >= c ? 2 : value >= d ? 1 : 0);

/**
 * The six "stand parameters", each ranked E to A from a real number. The thresholds are
 * fixed (not relative to anyone), so a rank only moves when the number does.
 */
export function standStats({ github, waka }) {
  const years = github.yearly;
  const thisYear = years.at(-1)?.count ?? 0;
  const lastYear = years.at(-2)?.count ?? 0;
  const growth = lastYear ? thisYear / lastYear : thisYear ? 2 : 0;
  const activeShare = Math.round((github.recent.activeDays / 365) * 100);
  return [
    { name: "Power", level: rank(github.totals.contributions, [1000, 3000, 8000, 15000]), note: `${nf.format(github.totals.contributions)} contributions` },
    { name: "Speed", level: rank(github.recent.perActiveDay, [5, 15, 30, 50]), note: `${nf.format(github.recent.perActiveDay)} per active day` },
    { name: "Range", level: waka ? rank(waka.languageCount, [3, 5, 7, 10]) : 0, note: waka ? `${nf.format(waka.languageCount)} languages over 10h` : "languages" },
    { name: "Durability", level: rank(github.streaks.longest.length, [10, 25, 50, 100]), note: `${nf.format(github.streaks.longest.length)}-day best streak` },
    { name: "Precision", level: rank(activeShare, [20, 40, 60, 80]), note: `active ${activeShare}% of days` },
    { name: "Potential", level: rank(growth, [0.5, 0.9, 1.1, 1.5]), note: lastYear ? `${growth.toFixed(1)}x last year` : "new this year" },
  ];
}

const angle = (i) => -Math.PI / 2 + (i * Math.PI) / 3;
const pt = (cx, cy, r, i) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
const poly = (points) => points.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");

/** The hexagon chart: rings E..A, spokes, the filled shape and a letter at every corner. */
function hexagon(t, stats, { cx, cy, R }) {
  const ring = (frac) => poly(stats.map((_, i) => pt(cx, cy, R * frac, i)));
  const rings = [1, 2, 3, 4].map((k) => `<polygon points="${ring(k / 5 + 0.0)}" fill="none" stroke="${t.mid}" stroke-width="1" stroke-dasharray="2 4" opacity=".7"/>`).join("");
  const spokes = stats.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(cx, cy, R, i)[0].toFixed(1)}" y2="${pt(cx, cy, R, i)[1].toFixed(1)}" stroke="${t.mid}" stroke-width="1" opacity=".7"/>`).join("");
  const shape = poly(stats.map((s, i) => pt(cx, cy, R * (s.level + 1) / 5, i)));
  const dots = stats.map((s, i) => { const [x, y] = pt(cx, cy, R * (s.level + 1) / 5, i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${t.gold}" stroke="${t.ink}" stroke-width="2"/>`; }).join("");
  const labels = stats.map((s, i) => {
    const [x, y] = pt(cx, cy, R + 22, i);
    const side = Math.abs(Math.cos(angle(i))) < 0.2 ? "middle" : Math.cos(angle(i)) > 0 ? "start" : "end";
    const dy = Math.sin(angle(i)) < -0.5 ? -8 : Math.sin(angle(i)) > 0.5 ? 12 : 4;
    return text(x.toFixed(1), (y + dy).toFixed(1), s.name.toUpperCase(), { size: 13.5, fill: t.fg, weight: 800, anchor: side, spacing: "0.08em" });
  }).join("\n  ");
  return `<polygon points="${ring(1)}" fill="${t.panel}" stroke="${t.fg}" stroke-width="3" stroke-linejoin="round"/>
  ${rings}${spokes}
  <polygon class="pop" points="${shape}" fill="${t.accent}" fill-opacity=".85" stroke="${t.ink}" stroke-width="3" stroke-linejoin="round"/>
  ${dots}
  ${labels}`;
}

function entry(t, s, { x, y, size = 40 }) {
  const letter = extruded("dela", RANKS[s.level], { x, y, size, fill: t.gold }, { color: t.accent, outline: t.ink, depth: 3, stroke: 3 });
  return `${letter.svg}
  ${text(x + size + 18, y - 14, s.name, { size: 16.5, weight: 800, fill: t.fg })}
  ${text(x + size + 18, y + 6, esc(s.note), { size: 14.5, fill: t.mid })}`;
}

function label(t, x, y) {
  return `<rect x="${x}" y="${y}" width="154" height="30" fill="${t.gold}" stroke="${t.ink}" stroke-width="2.5"/>
  ${text(x + 77, y + 20.5, "STAND STATS", { size: 14, fill: "#05061a", weight: 800, anchor: "middle", spacing: "0.14em" })}`;
}

function wide(t, data) {
  const W = 810, H = 356, LIST = 436, ROW = 46, TOP = 44;
  const stats = standStats(data);
  const rows = stats
    .map((s, i) => {
      const y = TOP + i * ROW;
      const letter = extruded("dela", RANKS[s.level], { x: LIST, y: y + 34, size: 34, fill: t.gold }, { color: t.accent, outline: t.ink, depth: 3, stroke: 3 });
      return `${letter.svg}
  ${text(LIST + 56, y + 28, s.name, { size: 17.5, weight: 800, fill: t.fg })}
  ${text(W - 28, y + 28, esc(s.note), { size: 15, fill: t.mid, anchor: "end" })}
  ${i < stats.length - 1 ? `<rect x="${LIST}" y="${y + ROW - 4}" width="${W - 28 - LIST}" height="1" fill="${t.faint}"/>` : ""}`;
    })
    .join("\n  ");
  const body = `
  <rect x="396" y="0" width="12" height="${H}" fill="url(#hatch)"/>
  ${label(t, 28, 28)}
  ${hexagon(t, stats, { cx: 222, cy: 186, R: 88 })}
  ${text(28, H - 16, "Ranks come from my own numbers. For fun.", { size: 13.5, fill: t.mid })}
  ${rows}`;
  return shell({ w: W, h: H, t, title: "Stand stats: six ranks from E to A, derived from my numbers", body });
}

function narrow(t, data) {
  const W = 370, ROW = 58;
  const stats = standStats(data);
  const top = 306;
  const cells = stats.map((s, i) => entry(t, s, { x: 28, y: top + 30 + i * ROW, size: 36 })).join("\n  ");
  const H = top + stats.length * ROW + 40;
  const body = `
  ${label(t, 24, 24)}
  ${hexagon(t, stats, { cx: 190, cy: 188, R: 72 })}
  ${cells}
  ${text(24, H - 16, "Ranks come from my own numbers. For fun.", { size: 13.5, fill: t.mid })}`;
  return shell({ w: W, h: H, t, title: "Stand stats: six ranks from E to A, derived from my numbers", body });
}

export const stand = (t, data, mode) => (mode === "narrow" ? narrow(t, data) : wide(t, data));
