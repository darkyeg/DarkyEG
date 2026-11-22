import { esc, fitted, hours, nf, shell, text } from "../theme.mjs";

function duration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function list(t, { x, y, width, title, items, row }) {
  const peak = Math.max(...items.map((i) => i.seconds), 1);
  const heading = { svg: `${text(x, y, esc(title), { size: 19, weight: 800, fill: t.fg })}<rect x="${x}" y="${y + 8}" width="34" height="5" fill="${t.gold}" stroke="${t.ink}" stroke-width="1.2"/>` };
  const rows = items
    .map((item, i) => {
      const ry = y + 36 + i * row;
      const w = Math.max((item.seconds / peak) * width, 4);
      return `${text(x, ry, esc(item.name), { size: 15.5, fill: t.fg })}
  ${text(x + width, ry, hours(item.seconds), { size: 14.5, fill: t.mid, anchor: "end", mono: true })}
  <rect x="${x}" y="${ry + 10}" width="${width}" height="8" fill="${t.faint}"/>
  <rect class="grow" style="animation-delay:${(0.1 + i * 0.07).toFixed(2)}s" x="${x}" y="${ry + 10}" width="${w.toFixed(1)}" height="8" fill="${i === 0 ? t.accent : t.fg}"/>`;
    })
    .join("\n  ");
  return { svg: `${heading.svg}\n  ${rows}`, bottom: y + 36 + (items.length - 1) * row + 26 };
}

function headline(w) {
  return [
    [nf.format(Math.round(w.total / 3600)), "hours of code, all time"],
    [duration(w.dailyAverage), "per coding day, on average"],
    [nf.format(w.languageCount), "languages, 10 hours or more"],
  ];
}

function wide(t, { waka: w }) {
  const W = 810, PAD = 28, ROW = 44;
  const cells = headline(w)
    .map(([value, label], i) => {
      const x = PAD + i * 262;
      return `${fitted(value, 44, 232, { x, y: 92, fill: i === 0 ? t.accent : t.fg }).svg}
  ${text(x, 118, esc(label), { size: 15, fill: t.mid })}`;
    })
    .join("\n  ");
  const sections = [
    ["Languages", w.languages, PAD],
    ["Editors", w.editors, PAD + 262],
    ["Systems", w.systems, PAD + 524],
  ].map(([title, items, x]) => list(t, { x, y: 196, width: 230, title, items, row: ROW }));
  const H = Math.max(...sections.map((s) => s.bottom)) + 24;

  const body = `
  ${cells}
  <rect x="${PAD}" y="140" width="${W - PAD * 2}" height="6" fill="url(#hatch)"/>
  ${sections.map((s) => s.svg).join("\n  ")}`;
  return shell({ w: W, h: H, t, title: "Coding time from WakaTime", body });
}

function narrow(t, { waka: w }) {
  const W = 370, PAD = 24, ROW = 44;
  const [hours_, perDay, langs] = headline(w);
  const body0 = `
  ${fitted(hours_[0], 62, W - PAD * 2, { x: PAD, y: 84, fill: t.accent }).svg}
  ${text(PAD, 110, esc(hours_[1]), { size: 15, fill: t.mid })}
  ${fitted(perDay[0], 31, 160, { x: PAD, y: 176, fill: t.fg }).svg}
  ${text(PAD, 200, esc(perDay[1]), { size: 14.5, fill: t.mid })}
  ${fitted(langs[0], 31, 138, { x: 208, y: 176, fill: t.fg }).svg}
  ${text(208, 200, esc(langs[1]), { size: 14.5, fill: t.mid })}
  <rect x="${PAD}" y="222" width="${W - PAD * 2}" height="8" fill="url(#hatch)"/>`;

  let y = 276;
  const sections = [["Languages", w.languages], ["Editors", w.editors], ["Systems", w.systems]].map(([title, items]) => {
    const built = list(t, { x: PAD, y, width: W - PAD * 2, title, items, row: ROW });
    y = built.bottom + 30;
    return built;
  });
  const H = sections[sections.length - 1].bottom + 22;
  return shell({ w: W, h: H, t, title: "Coding time from WakaTime", body: `${body0}\n  ${sections.map((s) => s.svg).join("\n  ")}` });
}

export const waka = (t, data, mode) => (mode === "narrow" ? narrow(t, data) : wide(t, data));
