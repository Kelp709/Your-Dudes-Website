#!/usr/bin/env node
/* Optional helper: run `node tools/update-meta.js` from the project folder.
   Reads organization.siteUrl from site-config.js, then:
     1. writes sitemap.xml and robots.txt with your real address
     2. adds canonical, og:url, og:image and twitter:image tags (absolute URLs,
        which social sites and search engines need) to every page
   Needs Node.js only. The website itself does not need this to work.
   Re-run it whenever you change siteUrl or add a page. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "site-config.js"), "utf8"), sandbox);
const cfg = sandbox.window.SITE_CONFIG;
const raw = (cfg.organization.siteUrl || "").trim();
if (!raw) {
  console.error('organization.siteUrl in site-config.js is empty. Set it first, e.g. "https://yourname.github.io/your-repo".');
  process.exit(1);
}
const base = raw.replace(/\/+$/, "") + "/";
try { new URL(base); } catch (e) { console.error("organization.siteUrl is not a valid URL."); process.exit(1); }

const pages = cfg.navigation.items.map((i) => i.href);
const today = new Date().toISOString().slice(0, 10);

const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map((p) => `  <url><loc>${base}${p === "index.html" ? "" : p}</loc><lastmod>${today}</lastmod></url>`).join("\n") + "\n</urlset>\n";
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`);

const img = cfg.organization.socialImage ? base + cfg.organization.socialImage : "";
let changed = 0;
for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  const full = path.join(root, file);
  let html = fs.readFileSync(full, "utf8");
  if (!/<!-- meta:start -->[\s\S]*<!-- meta:end -->/.test(html)) continue;
  const is404 = file === "404.html";
  const url = base + (file === "index.html" ? "" : file);
  const lines = is404 ? [] : [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:url" content="${url}">`,
  ];
  if (img) { lines.push(`<meta property="og:image" content="${img}">`, `<meta name="twitter:image" content="${img}">`); }
  html = html.replace(/<!-- meta:start -->[\s\S]*<!-- meta:end -->/, `<!-- meta:start -->\n  ${lines.join("\n  ")}\n  <!-- meta:end -->`);
  fs.writeFileSync(full, html);
  changed++;
}
console.log(`Done. Wrote sitemap.xml, robots.txt and updated ${changed} pages for ${base}`);
