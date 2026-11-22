// Fetches GitHub + WakaTime data and derives everything the cards display.
import { execSync } from "node:child_process";

export const LOGIN = process.env.PROFILE_LOGIN ?? "darkyeg";
// Public WakaTime share id (the profile is already public).
const WAKA_ID = process.env.WAKATIME_ID ?? "8f9fbc0a-97f0-4c26-9794-c5b2c7cf0555";

// Featured cards only render PUBLIC repositories, so a private repo can never
// appear even if it is added here by mistake. "owner/name" entries are repos
// outside the personal account (an organisation's).
export const FEATURED = ["spinup", "echobridge", "kozan-rs/kozan", "dotfiles"];

const DAY = 86_400_000;
const isoDay = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * DAY);

const token = process.env.GH_TOKEN ?? execSync("gh auth token").toString().trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retries transient failures (network, 5xx, rate limits) with exponential backoff. */
async function withRetry(label, fn, attempts = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === attempts) throw new Error(`${label} failed after ${attempts} attempts: ${error.message}`);
      console.warn(`${label} attempt ${attempt} failed (${error.message}); retrying`);
      await sleep(1500 * 2 ** (attempt - 1));
    }
  }
}

function graphql(query) {
  return withRetry("GitHub GraphQL", async () => {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data, errors } = await res.json();
    if (errors || !data) throw new Error(JSON.stringify(errors ?? "no data"));
    return data;
  });
}

export async function fetchGitHub() {
  const now = new Date();
  const today = isoDay(now);

  const profile = await graphql(`{
    user(login: "${LOGIN}") {
      followers { totalCount }
      contributionsCollection { contributionYears }
      repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100) {
        totalCount
        nodes { name description stargazerCount pushedAt primaryLanguage { name color } }
      }
    }
  }`);

  const years = profile.user.contributionsCollection.contributionYears;
  const yearQueries = years
    .map((y) => {
      const to = y === now.getUTCFullYear() ? now.toISOString() : `${y}-12-31T23:59:59Z`;
      return `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${to}") {
        totalCommitContributions totalPullRequestContributions
        totalPullRequestReviewContributions totalIssueContributions
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      }`;
    })
    .join("\n");
  const history = (await graphql(`{ user(login: "${LOGIN}") { ${yearQueries} } }`)).user;

  const counts = new Map();
  const totals = { contributions: 0, commits: 0, prs: 0, reviews: 0 };
  for (const y of years) {
    const c = history[`y${y}`];
    totals.contributions += c.contributionCalendar.totalContributions;
    totals.commits += c.totalCommitContributions;
    totals.prs += c.totalPullRequestContributions;
    totals.reviews += c.totalPullRequestReviewContributions;
    for (const week of c.contributionCalendar.weeks)
      for (const d of week.contributionDays) if (d.date <= today) counts.set(d.date, d.contributionCount);
  }
  const dates = [...counts.keys()].sort();

  const projects = await featuredProjects(profile.user.repositories.nodes);

  return {
    today,
    since: Math.min(...years),
    totals,
    followers: profile.user.followers.totalCount,
    publicRepos: profile.user.repositories.totalCount,
    stars: profile.user.repositories.nodes.reduce((n, r) => n + r.stargazerCount, 0),
    streaks: streaks(dates, counts),
    ...recentWindow(counts, dates, today),
    busiest: busiest(dates, counts),
    bestMonth: bestMonth(dates, counts),
    projects,
    yearly: years.slice().sort().map((y) => ({ year: y, count: history[`y${y}`].contributionCalendar.totalContributions })),
    openSource: await openSource(),
  };
}

const REPO_FIELDS = "name description stargazerCount pushedAt isPrivate primaryLanguage { name color }";

async function featuredProjects(ownRepos) {
  const foreign = FEATURED.filter((slug) => slug.includes("/"));
  const data = foreign.length
    ? await graphql(`{ ${foreign.map((slug, i) => {
        const [owner, name] = slug.split("/");
        return `r${i}: repository(owner: "${owner}", name: "${name}") { ${REPO_FIELDS} }`;
      }).join("\n")} }`)
    : {};
  return FEATURED.flatMap((slug) => {
    const i = foreign.indexOf(slug);
    const repo = i >= 0 ? data[`r${i}`] : ownRepos.find((r) => r.name === slug);
    if (!repo || repo.isPrivate) {
      console.warn(`skipping featured repo "${slug}": not found or not public`);
      return [];
    }
    return [{ ...repo, owner: i >= 0 ? slug.split("/")[0] : LOGIN }];
  });
}

/**
 * Merged pull requests in other people's PUBLIC repositories, grouped per repository.
 * Private repositories are skipped here, so employer work never appears. The totals only
 * move when a pull request is merged, which makes this a stable card (unlike a commit feed).
 */
async function openSource() {
  const byRepo = new Map();
  let after = "null";
  for (let page = 0; page < 20; page++) {
    const { user } = await graphql(`{
      user(login: "${LOGIN}") {
        pullRequests(states: MERGED, first: 100, after: ${after}) {
          pageInfo { hasNextPage endCursor }
          nodes { repository { nameWithOwner isPrivate stargazerCount owner { login } } }
        }
      }
    }`);
    for (const { repository: r } of user.pullRequests.nodes) {
      if (r.isPrivate || r.owner.login.toLowerCase() === LOGIN.toLowerCase()) continue;
      const entry = byRepo.get(r.nameWithOwner) ?? { name: r.nameWithOwner, stars: r.stargazerCount, merged: 0 };
      entry.merged++;
      byRepo.set(r.nameWithOwner, entry);
    }
    const { hasNextPage, endCursor } = user.pullRequests.pageInfo;
    if (!hasNextPage) break;
    after = JSON.stringify(endCursor);
  }
  const repos = [...byRepo.values()].sort((a, b) => b.stars - a.stars || b.merged - a.merged);
  return { merged: repos.reduce((n, r) => n + r.merged, 0), repos };
}

function streaks(dates, counts) {
  let run = 0, runStart = "";
  let longest = { length: 0, start: "", end: "" };
  for (const date of dates) {
    if (counts.get(date) > 0) {
      if (run === 0) runStart = date;
      run++;
      if (run > longest.length) longest = { length: run, start: runStart, end: date };
    } else {
      run = 0;
    }
  }
  // Today may not have a contribution yet; the streak is still alive until it ends.
  let i = dates.length - 1;
  if (counts.get(dates[i]) === 0) i--;
  const current = { length: 0, start: "", end: dates[i] ?? "" };
  for (; i >= 0 && counts.get(dates[i]) > 0; i--) {
    current.length++;
    current.start = dates[i];
  }
  return { current, longest };
}

function busiest(dates, counts) {
  const date = dates.reduce((best, d) => (counts.get(d) > counts.get(best) ? d : best), dates[0]);
  return { date, count: counts.get(date) };
}

function bestMonth(dates, counts) {
  const months = new Map();
  for (const d of dates) months.set(d.slice(0, 7), (months.get(d.slice(0, 7)) ?? 0) + counts.get(d));
  const [key, count] = [...months].reduce((a, b) => (b[1] > a[1] ? b : a));
  return { key, count };
}

/** The 53-week heatmap grid and the aggregates shown next to it. */
function recentWindow(counts, dates, today) {
  const end = new Date(`${today}T00:00:00Z`);
  const lastSunday = addDays(end, -end.getUTCDay());
  const gridStart = addDays(lastSunday, -52 * 7);

  const weeks = [];
  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let dow = 0; dow < 7; dow++) {
      const date = isoDay(addDays(gridStart, w * 7 + dow));
      if (date <= today) week.push({ date, dow, count: counts.get(date) ?? 0 });
    }
    weeks.push(week);
  }

  const windowStart = isoDay(addDays(end, -364));
  const recent = dates.filter((d) => d >= windowStart);
  const total = recent.reduce((n, d) => n + counts.get(d), 0);
  const activeDays = recent.filter((d) => counts.get(d) > 0).length;

  const weekday = Array(7).fill(0);
  for (const d of recent) weekday[new Date(`${d}T00:00:00Z`).getUTCDay()] += counts.get(d);

  const monthly = [];
  for (let m = 11; m >= 0; m--) {
    const first = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - m, 1));
    const key = isoDay(first).slice(0, 7);
    monthly.push({
      key,
      label: first.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      count: dates.filter((d) => d.startsWith(key)).reduce((n, d) => n + counts.get(d), 0),
    });
  }

  return { weeks, recent: { total, activeDays, perActiveDay: activeDays ? Math.round(total / activeDays) : 0, weekday, monthly } };
}

// Non-programming formats that would otherwise dominate a "languages" chart.
const NOT_LANGUAGES = new Set(["Other", "Markdown", "JSON", "YAML", "TOML", "Text", "XML", "INI", "Git Config", "Properties"]);
// Only actual editors and IDEs are listed; WakaTime also reports plugin hosts and "Unknown Editor".
const RENAME = { Rustrover: "RustRover", Goland: "GoLand", Webstorm: "WebStorm", Pycharm: "PyCharm", Clion: "CLion" };
const EDITORS = new Set(["VS Code", "Visual Studio", "Rider", "Rustrover", "RustRover", "Goland", "GoLand", "Webstorm", "WebStorm", "Pycharm", "PyCharm", "Clion", "CLion", "Intellij", "IntelliJ", "Zed", "Vim", "Neovim", "Emacs", "Sublime Text", "Helix", "Xcode", "Android Studio"]);

/**
 * Returns null when WakaTime stays unreachable, so the caller keeps the committed
 * cards. With WAKATIME_TOKEN (an OAuth access token with read_stats; WakaTime
 * issues these without an expiry) it reads your own stats. Without it, it falls
 * back to the public stats endpoint, which needs "share coding activity" enabled.
 * Plain API keys cannot read stats; WakaTime limits them to editor plugins.
 */
export async function fetchWaka() {
  const token = process.env.WAKATIME_TOKEN;
  const url = `https://wakatime.com/api/v1/users/${token ? "current" : WAKA_ID}/stats/all_time`;
  const headers = { "User-Agent": "profile-cards", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  try {
    const data = await withRetry("WakaTime", async () => {
      const res = await fetch(url, { headers });
      if (res.status === 202) throw new Error("stats still being calculated");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      if (!data?.total_seconds) throw new Error("no totals in response");
      return data;
    });

    // WakaTime can report one tool under two spellings ("Rustrover", "RustRover"): merge them.
    const top = (list, keep = () => true) => {
      const merged = new Map();
      for (const x of (list ?? []).filter((x) => keep(x.name))) {
        const name = RENAME[x.name] ?? x.name;
        merged.set(name, (merged.get(name) ?? 0) + x.total_seconds);
      }
      return [...merged].map(([name, seconds]) => ({ name, seconds })).sort((p, q) => q.seconds - p.seconds).slice(0, 5);
    };

    return {
      total: data.total_seconds,
      dailyAverage: data.daily_average,
      languages: top(data.languages, (n) => !NOT_LANGUAGES.has(n)),
      languageCount: (data.languages ?? []).filter((l) => !NOT_LANGUAGES.has(l.name) && l.total_seconds >= 36_000).length,
      editors: top(data.editors, (n) => EDITORS.has(n)),
      systems: top(data.operating_systems, (n) => n !== "Unknown OS"),
    };
  } catch (error) {
    console.warn(error.message);
    return null;
  }
}
