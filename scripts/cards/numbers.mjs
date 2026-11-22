import { esc, extruded, fitted, fmtDayYear, fmtRange, nf, shell, speedLines, text } from "../theme.mjs";

function stats({ github }) {
  const { longest } = github.streaks;
  const { totals, recent, busiest, bestMonth } = github;
  const monthLabel = new Date(`${bestMonth.key}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return [
    [nf.format(longest.length), "longest streak", fmtRange(longest.start, longest.end)],
    [nf.format(totals.contributions), "contributions", `since ${github.since}`],
    [nf.format(recent.activeDays), "active days", "last 12 months"],
    [nf.format(recent.perActiveDay), "per active day", "last 12 months"],
    [nf.format(bestMonth.count), "best month", monthLabel],
    [nf.format(busiest.count), "busiest day", fmtDayYear(busiest.date)],
  ];
}

function streak(t, { github }, { x, y, big, mid, small }) {
  const digits = String(github.streaks.current.length).length;
  const size = digits <= 2 ? big : digits === 3 ? mid : small;
  return extruded("dela", String(github.streaks.current.length), { x, y, size, fill: t.gold }, { color: t.accent, outline: t.ink, depth: Math.round(size / 18), stroke: Math.max(4, Math.round(size / 28)) });
}

function cell(t, [value, label, sub], { x, y, maxW, numSize }) {
  return `${fitted(value, numSize, maxW, { x, y, fill: t.fg }).svg}
  ${text(x, y + 28, esc(label), { size: 15.5, weight: 700, fill: t.fg })}
  ${text(x, y + 48, esc(sub), { size: 14, fill: t.mid })}`;
}

function wide(t, data) {
  const W = 810, H = 292, COL = 156, GRID_X = 346;
  const { current } = data.github.streaks;
  const cells = stats(data)
    .map((s, i) => cell(t, s, { x: GRID_X + (i % 3) * COL, y: i < 3 ? 112 : 216, maxW: COL - 38, numSize: 36 }))
    .join("\n  ");
  const numeral = streak(t, data, { x: 28, y: 214, big: 168, mid: 118, small: 88 });

  const body = `
  <clipPath id="left"><rect x="0" y="0" width="318" height="${H}"/></clipPath>
  <g clip-path="url(#left)">${speedLines(150, 150, { fill: t.accent, opacity: 0.32, count: 64, inner: 90, outer: 420, seed: 3 })}</g>
  <rect x="28" y="30" width="146" height="30" fill="${t.gold}" stroke="${t.ink}" stroke-width="2.5"/>
  ${text(101, 50, "DAY STREAK", { size: 14, fill: "#05061a", weight: 800, anchor: "middle", spacing: "0.14em" })}
  ${numeral.svg}
  ${text(30, 254, current.length ? esc(fmtRange(current.start, current.end)) : "no active streak", { size: 15.5, fill: t.mid })}
  <rect x="318" y="0" width="14" height="${H}" fill="url(#hatch)"/>
  ${cells}`;
  return shell({ w: W, h: H, t, title: "Contribution streaks and totals", body });
}

function narrow(t, data) {
  const W = 370, COL = 163, ROW = 102;
  const { current } = data.github.streaks;
  const top = 316;
  const cells = stats(data)
    .map((s, i) => cell(t, s, { x: 24 + (i % 2) * COL, y: top + Math.floor(i / 2) * ROW, maxW: COL - 22, numSize: 32 }))
    .join("\n  ");
  const H = top + 2 * ROW + 66;
  const numeral = streak(t, data, { x: 24, y: 196, big: 150, mid: 108, small: 80 });

  const body = `
  ${speedLines(120, 130, { fill: t.accent, opacity: 0.32, count: 56, inner: 80, outer: 420, seed: 3 })}
  <rect x="24" y="26" width="146" height="30" fill="${t.gold}" stroke="${t.ink}" stroke-width="2.5"/>
  ${text(97, 46, "DAY STREAK", { size: 14, fill: "#05061a", weight: 800, anchor: "middle", spacing: "0.14em" })}
  ${numeral.svg}
  ${text(26, 232, current.length ? esc(fmtRange(current.start, current.end)) : "no active streak", { size: 15.5, fill: t.mid })}
  <rect x="24" y="258" width="${W - 48}" height="10" fill="url(#hatch)"/>
  ${cells}`;
  return shell({ w: W, h: H, t, title: "Contribution streaks and totals", body });
}

export const numbers = (t, data, mode) => (mode === "narrow" ? narrow(t, data) : wide(t, data));
