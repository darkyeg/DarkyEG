// Renders README.md from the same data as the cards. The cards come in wide and narrow
// versions; <picture> picks the narrow ones when the viewport is 640px or less (phones,
// or browser zoom-in) and the dark/light ones from the colour scheme. Every image's alt
// text carries the numbers it shows, so the page still reads if an image fails to load
// and screen readers get the content.
import { BLURBS } from "../cards/project.mjs";
import { UPCOMING } from "../cards/upcoming.mjs";
import { standStats } from "../cards/stand.mjs";
import { NARROW_BREAKPOINT, fmtDayYear, nf } from "../theme.mjs";

const narrow = `(max-width: ${NARROW_BREAKPOINT}px)`;
const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function sources(name) {
  return [
    `<source media="${narrow} and (prefers-color-scheme: dark)" srcset="assets/${name}-narrow-dark.svg">`,
    `<source media="${narrow} and (prefers-color-scheme: light)" srcset="assets/${name}-narrow-light.svg">`,
    `<source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg">`,
    `<source media="(prefers-color-scheme: light)" srcset="assets/${name}-light.svg">`,
  ];
}

const block = (name, alt) => `<picture>\n  ${sources(name).join("\n  ")}\n  <img alt="${attr(alt)}" src="assets/${name}-dark.svg" width="100%">\n</picture>`;

const card = (p) =>
  `<a href="https://github.com/${p.owner}/${p.name}"><picture>${sources(`project-${p.name}`).join("")}<img alt="${attr(altProject(p))}" src="assets/project-${p.name}-dark.svg" width="49.9%"></picture></a>`;

function altProject(p) {
  const facts = [p.primaryLanguage?.name, p.stargazerCount ? `${p.stargazerCount} stars` : ""].filter(Boolean).join(", ");
  return `${p.name}. ${BLURBS[p.name] ?? p.description ?? ""} ${facts}.`.replace(/\s+/g, " ").trim();
}

function altNumbers({ github }) {
  const { current, longest } = github.streaks;
  const streak = current.length ? `${current.length}-day contribution streak` : "No active streak";
  return `${streak}, longest ${longest.length} days. ${nf.format(github.totals.contributions)} contributions since ${github.since}; ${github.recent.activeDays} active days in the last 12 months.`;
}

function altActivity({ github }) {
  const { busiest, recent } = github;
  return `${nf.format(recent.total)} contributions in the last 12 months. Busiest day: ${nf.format(busiest.count)} on ${fmtDayYear(busiest.date)}. Heatmap with weekday, monthly and yearly totals.`;
}

function altStand(data) {
  const ranks = standStats(data).map((s) => `${s.name} ${"EDCBA"[s.level]}`).join(", ");
  return `Stand stats, ranked E to A from my numbers: ${ranks}.`;
}

function altWaka(waka) {
  if (!waka) return "Coding time from WakaTime";
  const langs = waka.languages.slice(0, 3).map((l) => l.name).join(", ");
  return `${nf.format(Math.round(waka.total / 3600))} hours of code tracked by WakaTime. Top languages: ${langs}.`;
}

function altOpenSource({ github }) {
  const { merged, repos } = github.openSource;
  const list = repos.slice(0, 7).map((r) => `${r.name} (${r.merged})`).join(", ");
  return `${merged} pull requests merged into other people's open source projects: ${list}.`;
}

const chip = (id, label, href) =>
  `<a href="${href}"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/chip-${id}-dark.svg"><source media="(prefers-color-scheme: light)" srcset="assets/chip-${id}-light.svg"><img alt="${attr(label)}" src="assets/chip-${id}-dark.svg" height="64"></picture></a>`;

export function renderReadme(data) {
  const { github, waka } = data;
  // Cards are glued together (no whitespace between the tags) so two fit exactly per line.
  const rows = github.projects.map(card).join("");
  return `${block("banner", "Darky (Youssef Khalil): I fix the small things that annoy me")}

${chip("site", "darky.dev", "https://www.darky.dev")}${chip("mail", "me@darky.dev", "mailto:me@darky.dev")}

${block("chapter-projects", "Part 1: Projects")}

${block("upcoming", `${UPCOMING.name}, not public yet. ${UPCOMING.blurb}`)}

${rows}

${block("opensource", altOpenSource(data))}

${block("chapter-numbers", "Part 2: Numbers")}

${block("numbers", altNumbers(data))}

${block("activity", altActivity(data))}

${block("stand", altStand(data))}

${block("chapter-time", "Part 3: Time")}

${block("waka", altWaka(waka))}

${block("footer", "")}
`;
}
