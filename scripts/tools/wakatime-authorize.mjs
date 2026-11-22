// One-time WakaTime OAuth authorization. Usage:
//   node wakatime-authorize.mjs <client-id-file> <client-secret-file> <token-out-file>
// Opens a local listener on :8765, you approve in the browser, and the access and
// refresh tokens are written to <token-out-file> (mode 600). Nothing is printed.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const [idFile, secretFile, outFile] = process.argv.slice(2);
const clientId = readFileSync(idFile, "utf8").trim();
const clientSecret = readFileSync(secretFile, "utf8").trim();
const redirect = "http://localhost:8765/callback";
const state = randomBytes(16).toString("hex");

const url = `https://wakatime.com/oauth/authorize?${new URLSearchParams({
  client_id: clientId, response_type: "code", redirect_uri: redirect, scope: "read_stats", state,
})}`;
// The client id is public (it is in the authorize URL); only the secret stays private.
spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
console.log(`Opened the authorization page; if nothing opened, visit:\n${url}`);

const server = createServer(async (req, res) => {
  const u = new URL(req.url, redirect);
  if (u.pathname !== "/callback") { res.writeHead(404).end(); return; }
  if (u.searchParams.get("state") !== state || !u.searchParams.get("code")) {
    res.writeHead(400).end("Bad state or missing code."); return;
  }
  try {
    const r = await fetch("https://wakatime.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: clientId, client_secret: clientSecret, redirect_uri: redirect,
        grant_type: "authorization_code", code: u.searchParams.get("code"),
      }),
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`token endpoint HTTP ${r.status}: ${text.slice(0, 200)}`);
    const body = text.startsWith("{") ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text));
    writeFileSync(outFile, JSON.stringify(body), { mode: 0o600 });
    res.writeHead(200, { "Content-Type": "text/plain" }).end("Done. You can close this tab.");
    console.log(`saved; fields: ${Object.keys(body).join(", ")}; expires_in: ${body.expires_in ?? "?"}`);
  } catch (e) {
    res.writeHead(500).end("Failed, see the terminal.");
    console.error(String(e.message));
  } finally {
    server.close();
  }
});
server.listen(8765, "127.0.0.1");
setTimeout(() => { console.error("timed out after 10 minutes"); process.exit(1); }, 600_000).unref();
