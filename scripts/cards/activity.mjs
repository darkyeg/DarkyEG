import { barChart, glyphs, nf, shell, text } from "../theme.mjs";

const GAP = 3;
const level = (count, max) => (count === 0 ? 0 : count / max > 0.75 ? 4 : count / max > 0.5 ? 3 : count / max > 0.25 ? 2 : 1);

/** Heatmap whose last column ends exactly on the right margin. */
function heatmap(t, weeks, max, { left, right, top, gutter, labelSize }) {
  const pitch = (right - left - gutter + GAP) / weeks.length;
  const cell = pitch - GAP;
  const x0 = left + gutter;

  const cells = weeks
    .flatMap((week, wi) =>
      week.map((d) => {
        const delay = (wi * 0.012 + d.dow * 0.01).toFixed(2);
        return `<rect class="pop" style="animation-delay:${delay}s" x="${(x0 + wi * pitch).toFixed(1)}" y="${(top + d.dow * pitch).toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" fill="${t.ramp[level(d.count, max)]}"><title>${d.date}: ${d.count}</title></rect>`;
      }),
    )
    .join("");

  let lastMonth = "";
  let lastLabelEnd = -Infinity;
  const months = weeks
    .map((week, wi) => {
      const month = new Date(`${week[0].date}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      const x = x0 + wi * pitch;
      if (month === lastMonth) return "";
      lastMonth = month;
      if (x < lastLabelEnd + 4 || x + 26 > right) return "";
      lastLabelEnd = x + 28;
      return text(x.toFixed(1), top - 12, month, { size: labelSize, fill: t.mid });
    })
    .join("");

  const days = [[1, "Mon"], [3, "Wed"], [5, "Fri"]]
    .map(([dow, label]) => text(left, (top + dow * pitch + cell - 1).toFixed(1), label, { size: labelSize, fill: t.mid }))
    .join("");

  return { svg: `${cells}${months}${days}`, bottom: top + 7 * pitch - GAP };
}

function legend(t, { right, y, size = 13 }) {
  const sw = 12, step = 15;
  const x = right - 5 * step - 34;
  return `${text(x - 8, y, "Less", { size, fill: t.mid, anchor: "end" })}
  ${t.ramp.map((c, i) => `<rect x="${x + i * step}" y="${y - 11}" width="${sw}" height="${sw}" fill="${c}"/>`).join("")}
  ${text(x + 5 * step + 2, y, "More", { size, fill: t.mid })}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function charts(github) {
  const { recent, yearly } = github;
  return {
    weekday: { title: "By weekday", items: recent.weekday.map((value, i) => ({ value, label: WEEKDAYS[i] })) },
    month: { title: "By month", items: recent.monthly.map((m) => ({ value: m.count, label: m.label })) },
    year: { title: "By year", items: yearly.map((y) => ({ value: y.count, label: `’${String(y.year).slice(2)}` })) },
  };
}

function wide(t, { github }) {
  const W = 810, PAD = 28;
  const total = glyphs("dela", nf.format(github.recent.total), { x: PAD, y: 62, size: 36, fill: t.accent });
  const map = heatmap(t, github.weeks, Math.max(...github.weeks.flat().map((d) => d.count), 1), { left: PAD, right: W - PAD, top: 116, gutter: 36, labelSize: 13 });
  const dividerY = Math.round(map.bottom) + 28;
  const c = charts(github);
  const top = dividerY + 46;
  const specs = [
    [c.weekday, PAD, 180],
    [c.month, PAD + 208, 330],
    [c.year, PAD + 566, W - PAD - (PAD + 566)],
  ].map(([chart, x, width]) => barChart(t, { ...chart, x, width, top, maxH: 76 }));
  const H = Math.max(...specs.map((s) => s.bottom)) + 26;

  const body = `
  ${total.svg}
  ${text(PAD + total.width + 14, 60, "contributions in the last 12 months", { size: 16, fill: t.mid })}
  ${legend(t, { right: W - PAD, y: 62 })}
  ${map.svg}
  <rect x="${PAD}" y="${dividerY}" width="${W - PAD * 2}" height="6" fill="url(#hatch)"/>
  ${specs.map((s) => s.svg).join("\n  ")}`;
  return shell({ w: W, h: H, t, title: "Contribution heatmap, weekday rhythm, monthly and yearly volume", body });
}

function narrow(t, { github }) {
  const W = 370, PAD = 24, WEEKS = 20;
  const weeks = github.weeks.slice(-WEEKS);
  const shown = weeks.flat().reduce((n, d) => n + d.count, 0);
  const total = glyphs("dela", nf.format(shown), { x: PAD, y: 60, size: 38, fill: t.accent });
  const map = heatmap(t, weeks, Math.max(...github.weeks.flat().map((d) => d.count), 1), { left: PAD, right: W - PAD, top: 130, gutter: 34, labelSize: 13.5 });
  const legendY = Math.round(map.bottom) + 28;
  const dividerY = legendY + 20;
  const c = charts(github);
  let y = dividerY + 44;
  const stacked = [c.weekday, c.month, c.year].map((chart) => {
    const built = barChart(t, { ...chart, x: PAD, width: W - PAD * 2, top: y, maxH: 70, labelSize: 13.5 });
    y = built.bottom + 38;
    return built;
  });
  const H = stacked[stacked.length - 1].bottom + 26;

  const body = `
  ${total.svg}
  ${text(PAD, 88, `contributions in the last ${WEEKS} weeks`, { size: 15.5, fill: t.mid })}
  ${map.svg}
  ${legend(t, { right: W - PAD, y: legendY, size: 13.5 })}
  <rect x="${PAD}" y="${dividerY}" width="${W - PAD * 2}" height="6" fill="url(#hatch)"/>
  ${stacked.map((s) => s.svg).join("\n  ")}`;
  return shell({ w: W, h: H, t, title: "Contribution heatmap and volume", body });
}

export const activity = (t, data, mode) => (mode === "narrow" ? narrow(t, data) : wide(t, data));
