import { esc, extruded, glyphs, shell, starPoints, text, wrap, compact } from "../theme.mjs";

// Curated copy: several repos have no description on GitHub.
export const BLURBS = {
  spinup: "One command sets up every machine I code on, and keeps them all the same.",
  echobridge: "Stops your headphones leaking into your mic on calls. Windows, Rust.",
  kozan: "A Rust UI platform: a browser-level engine for frameworks to build on.",
  dotfiles: "My NixOS setup. Reproducible down to the last config file.",
};

function ago(iso) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Fits the title on one line by shrinking it, never overflowing. */
function title(t, name, { x, y, size, maxW, depth }) {
  const base = glyphs("dela", name, { x, y, size, fill: t.face });
  const s = base.width <= maxW ? size : size * (maxW / base.width);
  return extruded("dela", name, { x, y, size: s, fill: t.face }, { color: t.accent, outline: t.ink, depth, stroke: 3 });
}

/**
 * Language swatch and star count on one row. Every shape is centred on the same line as
 * the text's x-height, so icons and words sit level in any font.
 */
export function languageMeta(t, repo, { x, y, size }) {
  const cy = y - size * 0.36;
  const lang = repo.primaryLanguage;
  const parts = [];
  let cursor = x;
  if (lang) {
    parts.push(`<rect x="${cursor}" y="${(cy - 6).toFixed(1)}" width="12" height="12" fill="${lang.color ?? t.mid}" stroke="${t.fg}" stroke-width="1.4"/>${text(cursor + 20, y, esc(lang.name), { size, fill: t.mid })}`);
    cursor += 20 + lang.name.length * size * 0.56 + 20;
  }
  if (repo.stargazerCount > 0) {
    parts.push(`<polygon points="${starPoints(cursor + 7, cy, 7.5, 0.45)}" fill="${t.gold}" stroke="${t.fg}" stroke-width="1" stroke-linejoin="round"/>${text(cursor + 20, y, compact(repo.stargazerCount), { size, fill: t.mid })}`);
  }
  return parts.join("");
}

function wide(t, repo) {
  const W = 385, H = 164, L = 36;
  const lines = wrap(BLURBS[repo.name] ?? repo.description ?? "", 40, 2);
  const name = title(t, repo.name, { x: L, y: 60, size: 34, maxW: W - L - 30, depth: 3 });
  const body = `
  <rect x="0" y="0" width="14" height="${H}" fill="url(#stripe)"/>
  ${name.svg}
  ${lines.map((l, i) => text(L, 93 + i * 22, esc(l), { size: 15.5, fill: t.mid })).join("\n  ")}
  ${languageMeta(t, repo, { x: L, y: 144, size: 14.5 })}
  ${text(W - 24, 144, `pushed ${ago(repo.pushedAt)}`, { size: 14.5, fill: t.mid, anchor: "end" })}`;
  return shell({ w: W, h: H, t, title: `${repo.name}: ${lines.join(" ")}`, body });
}

function narrow(t, repo) {
  const W = 190, H = 236, L = 26;
  const lines = wrap(BLURBS[repo.name] ?? repo.description ?? "", 19, 4);
  const name = title(t, repo.name, { x: L, y: 54, size: 27, maxW: W - L - 18, depth: 2 });
  const body = `
  <rect x="0" y="0" width="9" height="${H}" fill="url(#stripe)"/>
  ${name.svg}
  ${lines.map((l, i) => text(L, 86 + i * 21, esc(l), { size: 14.5, fill: t.mid })).join("\n  ")}
  ${languageMeta(t, repo, { x: L, y: 192, size: 14 })}
  ${text(L, 216, `pushed ${ago(repo.pushedAt)}`, { size: 14, fill: t.mid })}`;
  return shell({ w: W, h: H, t, title: `${repo.name}: ${lines.join(" ")}`, body });
}

export const project = (t, repo, mode) => (mode === "narrow" ? narrow(t, repo) : wide(t, repo));
