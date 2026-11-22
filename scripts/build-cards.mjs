// Generates assets/*.svg (dark + light, wide + narrow) and README.md from the GitHub and WakaTime APIs.
// Output is committed to the profile repo, so GitHub serves plain files and no
// third-party server can rate-limit or break the images.
// Usage: GH_TOKEN=... node scripts/build-cards.mjs   (falls back to `gh auth token`)
import { mkdirSync, writeFileSync } from "node:fs";
import { fetchGitHub, fetchWaka } from "./data.mjs";
import { themes } from "./theme.mjs";
import { activity } from "./cards/activity.mjs";
import { banner } from "./cards/banner.mjs";
import { chapter } from "./cards/chapter.mjs";
import { footer } from "./cards/footer.mjs";
import { opensource } from "./cards/opensource.mjs";
import { numbers } from "./cards/numbers.mjs";
import { project } from "./cards/project.mjs";
import { stand } from "./cards/stand.mjs";
import { chip } from "./cards/chip.mjs";
import { upcoming } from "./cards/upcoming.mjs";
import { renderReadme } from "./tools/gen-readme.mjs";
import { waka } from "./cards/waka.mjs";

const [github, wakaStats] = await Promise.all([fetchGitHub(), fetchWaka()]);
if (!wakaStats) console.warn("WakaTime unreachable: keeping the existing waka cards");

mkdirSync("assets", { recursive: true });
let written = 0;
const write = (file, svg) => {
  writeFileSync(`assets/${file}.svg`, svg);
  written++;
};

const CHAPTERS = [
  ["projects", { number: 1, kanji: "一", title: "Projects" }],
  ["numbers", { number: 2, kanji: "二", title: "Numbers" }],
  ["time", { number: 3, kanji: "三", title: "Time" }],
];

for (const [name, t] of Object.entries(themes)) {
  write(`chip-site-${name}`, chip(t, "darky.dev"));
  write(`chip-mail-${name}`, chip(t, "me@darky.dev"));
  for (const mode of ["wide", "narrow"]) {
    const suffix = mode === "narrow" ? `-narrow-${name}` : `-${name}`;
    const data = { github, waka: wakaStats };
    write(`banner${suffix}`, banner(t, data, mode));
    for (const [id, spec] of CHAPTERS) write(`chapter-${id}${suffix}`, chapter(t, spec, mode));
    write(`numbers${suffix}`, numbers(t, data, mode));
    write(`activity${suffix}`, activity(t, data, mode));
    write(`stand${suffix}`, stand(t, data, mode));
    write(`upcoming${suffix}`, upcoming(t, data, mode));
    write(`opensource${suffix}`, opensource(t, data, mode));
    write(`footer${suffix}`, footer(t, data, mode));
    if (wakaStats) write(`waka${suffix}`, waka(t, data, mode));
    for (const repo of github.projects) write(`project-${repo.name}${suffix}`, project(t, repo, mode));
  }
}

writeFileSync("README.md", renderReadme({ github, waka: wakaStats }));

const { current, longest } = github.streaks;
console.log(`wrote ${written} svgs · ${github.totals.contributions} contributions · streak ${current.length}/${longest.length} · projects: ${github.projects.map((p) => p.name).join(", ")}`);
