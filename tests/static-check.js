#!/usr/bin/env node
/* Static checks. Needs only Node.js:   node tests/static-check.js
   Verifies pages exist, links and assets resolve, config is well-formed,
   and the code avoids unsafe patterns (HTML injection, forms, trackers). */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
let failures = 0, passes = 0;
function ok(cond, msg) {
  if (cond) { passes++; console.log("  pass  " + msg); }
  else { failures++; console.log("  FAIL  " + msg); }
}
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

/* config */
const sandbox = { window: {} };
let cfg;
try { vm.runInNewContext(read("site-config.js"), sandbox); cfg = sandbox.window.SITE_CONFIG; } catch (e) { console.log("config error:", e.message); }
ok(!!cfg, "site-config.js parses and defines window.SITE_CONFIG");
if (!cfg) process.exit(1);

/* pages */
const navItems = cfg.navigation.items;
const pageFiles = navItems.map((i) => i.href).concat(["404.html"]);
pageFiles.forEach((f) => ok(fs.existsSync(path.join(root, f)), "page exists: " + f));
["README.md", "site-config.js", "assets/css/styles.css", "assets/js/main.js", "robots.txt", "sitemap.xml", ".nojekyll"].forEach((f) => ok(fs.existsSync(path.join(root, f)), "file exists: " + f));
ok(navItems.length === 8, "navigation has the 8 required items");

/* per-page html checks */
const titles = new Set();
pageFiles.forEach((f) => {
  const html = read(f);
  ok(/<html lang="en">/.test(html), f + ": has lang attribute");
  const t = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
  ok(!!t && !titles.has(t), f + ": unique <title> (" + t + ")");
  titles.add(t);
  ok(/<meta name="description" content="[^"]{20,}"/.test(html), f + ": meta description");
  ok(/<meta name="viewport"/.test(html), f + ": viewport meta");
  ok((html.match(/<main\b/g) || []).length === 1, f + ": exactly one <main>");
  ok(/class="skip-link"/.test(html), f + ": skip link");
  ok(/<noscript>[\s\S]*988[\s\S]*<\/noscript>/.test(html), f + ": no-JS fallback mentions 988");
  ok(!/<form\b|<input\b|<textarea\b|<select\b/i.test(html), f + ": no forms or inputs");
  ok(!/(https?:)?\/\/[^"' ]*(googletagmanager|google-analytics|gtag|plausible|facebook\.net|hotjar|segment\.com)/i.test(html), f + ": no tracking scripts");
  /* every src/href that is local must resolve */
  const markup = html.replace(/<script>[\s\S]*?<\/script>/g, "");
  const refs = [...markup.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  refs.forEach((r) => {
    if (/^(https?:|mailto:|tel:|sms:|#|javascript:)/i.test(r)) return;
    const clean = r.split("#")[0].split("?")[0];
    if (!clean) return;
    ok(fs.existsSync(path.join(root, clean)), f + ": reference resolves -> " + r);
  });
  const external = [...html.matchAll(/<(?:script|img)\b[^>]*\bsrc="(https?:[^"]+)"/g)];
  ok(external.length === 0, f + ": no external scripts or images");
  ok(!/<link[^>]+rel="stylesheet"[^>]+href="https?:/.test(html), f + ": no external stylesheets");
});

/* config: paths referenced in config exist */
const strings = [];
(function walk(o, k) {
  if (typeof o === "string") strings.push([k, o]);
  else if (Array.isArray(o)) o.forEach((x) => walk(x, k));
  else if (o && typeof o === "object") Object.keys(o).forEach((key) => walk(o[key], key));
})(cfg, "");
strings.filter(([k, v]) => /^(logo|favicon|socialImage|image|photo|hero|logoPath)$/.test(k) && v && !/^https?:/.test(v) && /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(v))
  .forEach(([k, v]) => ok(fs.existsSync(path.join(root, v)), "config " + k + " path exists -> " + v));
navItems.forEach((i) => ok(fs.existsSync(path.join(root, i.href)), "nav target exists -> " + i.href));
strings.filter(([k, v]) => /^(href|url|donateUrl)$/.test(k) && v).forEach(([k, v]) => {
  ok(!/^\s*javascript:/i.test(v), "config " + k + " is not a javascript: URL -> " + v);
  if (!/^(https?:|mailto:|tel:|sms:|#)/i.test(v)) {
    const clean = v.split("#")[0];
    if (clean) ok(fs.existsSync(path.join(root, clean)), "config internal link resolves -> " + v);
  }
});

/* config: structure and honesty rules */
const ids = (arr) => arr.map((x) => x.id);
const uniq = (arr) => new Set(arr).size === arr.length;
ok(uniq(ids(cfg.programs)), "program ids are unique");
ok(cfg.programs.every((p) => ["planning", "active", "paused", "completed"].includes(p.status)), "program statuses are valid");
ok(cfg.programs.every((p) => !(p.status === "active" && !p.startDate)), "no program is 'active' without a start date");
ok(uniq(ids(cfg.resources.items)), "resource ids are unique");
ok(cfg.resources.items.every((r) => cfg.resources.categories.some((c) => c.key === r.category)), "resource categories are valid");
ok(cfg.resources.items.filter((r) => r.verificationStatus === "verified").every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.lastVerified)), "verified resources have lastVerified dates");
ok(cfg.resources.items.some((r) => r.id === "988-lifeline" && r.phone === "988" && /988lifeline\.org/.test(r.website)), "988 Lifeline resource is present");
ok(cfg.crisis.enabled === true && cfg.crisis.lines.some((l) => l.href === "tel:988"), "crisis support enabled with tel:988");
ok(uniq(ids(cfg.news.entries)), "news ids are unique");
ok(cfg.news.entries.every((n) => n.status === "draft" || n.status === "published"), "news statuses are valid");
ok(["primary", "accent", "glow"].every((k) => /^#[0-9a-fA-F]{6}$/.test(cfg.organization.colors[k])), "brand colors are 6-digit hex");
ok(cfg.getInvolved.donations.acceptingDonations === false || cfg.organization.legal.taxExemptStatus, "donations not enabled without verified legal status");
ok(cfg.organization.legal.taxDeductibleVerified === false || cfg.organization.legal.taxExemptStatus, "tax-deductible claim not enabled without verified status");
ok(cfg.impact.metrics.every((m) => m.verificationStatus !== "verified" || (m.measurementMethod && m.reportingPeriod)), "verified metrics include method and period");
(cfg.context.statistics || []).forEach((s) => ok(s.sourceUrl && s.measures && s.accessed, "statistic has source, explanation, access date -> " + s.id));
ok(!/saves? lives|prevent(ed|s)? (deaths|suicides)/i.test(JSON.stringify(cfg).replace(/never claim to have prevented a death or saved a life/gi, "")), "config makes no 'saves lives' or 'prevents deaths' claims");

/* code safety */
const main = read("assets/js/main.js");
ok(!/\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/.test(main), "main.js uses no innerHTML, document.write, or eval");
ok(!/createElement\(\s*["'](form|input|textarea|select)["']/.test(main), "main.js creates no forms or inputs");
ok(!/XMLHttpRequest|fetch\(|localStorage|sessionStorage|document\.cookie|sendBeacon/.test(main), "main.js makes no network calls and stores nothing");
ok(!/https?:\/\/(?!www\.w3\.org)/.test(read("assets/css/styles.css")), "CSS loads nothing from external sites");

console.log("\n" + passes + " passed, " + failures + " failed");
process.exit(failures ? 1 : 0);
