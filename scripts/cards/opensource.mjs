import { compact, esc, extruded, glyphs, nf, shell, starPoints, text } from "../theme.mjs";

const MAX_ROWS = 7;

const star = (t, cx, cy) => `<polygon points="${starPoints(cx, cy, 7, 0.45)}" fill="${t.gold}" stroke="${t.fg}" stroke-width="1" stroke-linejoin="round"/>`;

function label(t, x, y) {
  return `<rect x="${x}" y="${y}" width="150" height="30" fill="${t.gold}" stroke="${t.ink}" stroke-width="2.5"/>
  ${text(x + 75, y + 20.5, "OPEN SOURCE", { size: 14, fill: "#05061a", weight: 800, anchor: "middle", spacing: "0.14em" })}`;
}

/** The big count, scaled down when it would outgrow `maxW` (the extrusion adds a few px). */
function numeral(t, n, { x, y, size, maxW }) {
  const str = nf.format(n);
  const probe = glyphs("dela", str, { x, y, size, fill: t.gold }).width;
  const fit = probe + size / 6 > maxW ? size * ((maxW - size / 6) / probe) : size;
  return extruded("dela", str, { x, y, size: fit, fill: t.gold }, { color: t.accent, outline: t.ink, depth: Math.round(fit / 18), stroke: Math.max(4, Math.round(fit / 28)) }).svg;
}

function wide(t, { merged, repos }) {
  const W = 810, LIST = 300, ROW = 44, TOP = 30;
  const shown = repos.slice(0, MAX_ROWS);
  const H = Math.max(TOP + shown.length * ROW + 24, 250);
  const rows = shown
    .map((r, i) => {
      const y = TOP + i * ROW;
      return `${text(LIST, y + 28, esc(r.name), { size: 17, weight: 800, fill: t.fg })}
  ${star(t, W - 168, y + 22)}${text(W - 154, y + 28, compact(r.stars), { size: 15, fill: t.mid })}
  ${text(W - 28, y + 28, `${r.merged} merged`, { size: 15, fill: t.mid, anchor: "end" })}
  ${i < shown.length - 1 ? `<rect x="${LIST}" y="${y + ROW - 6}" width="${W - 28 - LIST}" height="1" fill="${t.faint}"/>` : ""}`;
    })
    .join("\n  ");
  const body = `
  <rect x="${LIST - 26}" y="0" width="12" height="${H}" fill="url(#hatch)"/>
  ${label(t, 28, 28)}
  ${numeral(t, merged, { x: 28, y: 138, size: 84, maxW: LIST - 26 - 14 - 28 })}
  ${text(30, 172, "pull requests merged into", { size: 15.5, fill: t.mid })}
  ${text(30, 194, "other people's projects", { size: 15.5, fill: t.mid })}
  ${rows}`;
  return shell({ w: W, h: H, t, title: `${merged} merged pull requests in other open source projects`, body });
}

function narrow(t, { merged, repos }) {
  const W = 370, ROW = 58;
  const shown = repos.slice(0, MAX_ROWS);
  const top = 214;
  const H = top + shown.length * ROW + 20;
  const rows = shown
    .map((r, i) => {
      const y = top + i * ROW;
      return `${text(26, y + 20, esc(r.name), { size: 16.5, weight: 800, fill: t.fg })}
  ${star(t, 32, y + 40)}${text(46, y + 45, compact(r.stars), { size: 14.5, fill: t.mid })}
  ${text(W - 26, y + 45, `${r.merged} merged`, { size: 14.5, fill: t.mid, anchor: "end" })}
  ${i < shown.length - 1 ? `<rect x="26" y="${y + ROW - 4}" width="${W - 52}" height="1" fill="${t.faint}"/>` : ""}`;
    })
    .join("\n  ");
  const body = `
  ${label(t, 24, 24)}
  ${numeral(t, merged, { x: 26, y: 118, size: 72, maxW: W - 52 })}
  ${text(26, 152, "pull requests merged into", { size: 15.5, fill: t.mid })}
  ${text(26, 174, "other people's projects", { size: 15.5, fill: t.mid })}
  <rect x="24" y="190" width="${W - 48}" height="8" fill="url(#hatch)"/>
  ${rows}`;
  return shell({ w: W, h: H, t, title: `${merged} merged pull requests in other open source projects`, body });
}

export const opensource = (t, { github }, mode) => (mode === "narrow" ? narrow(t, github.openSource) : wide(t, github.openSource));
