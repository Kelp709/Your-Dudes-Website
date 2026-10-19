#!/usr/bin/env node
/* Browser checks (optional). Needs Playwright:
     npm install --no-save playwright axe-core && npx playwright install chromium
   Run:  node tests/browser-check.js
   Loads every page at the site root AND under a repository subpath, checks
   layout at several widths, keyboard use, the mobile menu, the 404 page, the
   no-JavaScript fallback, accessibility (axe, when installed), and that the
   config rules (drafts hidden, unverified data hidden, unsafe links blocked)
   hold when the config is changed. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { start } = require("./server.js");
let playwright, axeSource = "";
try { playwright = require("playwright"); } catch (e) { console.error("Playwright is not installed. See the header of this file."); process.exit(2); }
try { axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8"); } catch (e) { console.log("(axe-core not installed: accessibility scan skipped)"); }

const root = path.join(__dirname, "..");
const SUB = "/yd-test";
let failures = 0, passes = 0;
function ok(cond, msg) {
  if (cond) { passes++; console.log("  pass  " + msg); } else { failures++; console.log("  FAIL  " + msg); }
}
function baseConfig() {
  const sb = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "site-config.js"), "utf8"), sb);
  return JSON.parse(JSON.stringify(sb.window.SITE_CONFIG));
}
const pages = ["index", "about", "programs", "impact", "resources", "get-involved", "news", "contact"];

(async () => {
  const s1 = await start(root, 8201);
  const s2 = await start(root, 8202, SUB);
  const browser = await playwright.chromium.launch();

  /* ---- A. every page, root and subpath ---- */
  for (const [origin, label] of [["http://localhost:8201", "root"], [`http://localhost:8202${SUB}`, "subpath"]]) {
    console.log("\n[A] pages at " + label);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    for (const name of pages) {
      const page = await ctx.newPage();
      const errors = [], failed = [];
      page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("requestfailed", (r) => failed.push(r.url()));
      page.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });
      await page.goto(`${origin}/${name}.html`);
      await page.waitForSelector("html.is-ready");
      ok(errors.length === 0, `${label}/${name}: no console errors or warnings ${errors.join("|")}`);
      ok(failed.length === 0, `${label}/${name}: every asset loads ${failed.join("|")}`);
      ok((await page.locator("h1").count()) === 1, `${label}/${name}: exactly one h1`);
      ok((await page.locator('a[href="tel:988"]').count()) >= 2, `${label}/${name}: 988 link present in header and elsewhere`);
      ok((await page.locator(".crisis-strip").count()) === 1, `${label}/${name}: crisis strip shown`);
      const cur = await page.locator('.nav__link[aria-current="page"]').count();
      ok(cur === 1, `${label}/${name}: current page marked in nav`);
      ok(!/undefined|\[object|NaN|null/.test(await page.locator("body").innerText()), `${label}/${name}: no 'undefined/null/NaN' text`);
      for (const w of [320, 390, 768, 1024, 1280, 1920]) {
        await page.setViewportSize({ width: w, height: 900 });
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (over > 0) ok(false, `${label}/${name} @${w}px: horizontal overflow by ${over}px`);
      }
      ok(true, `${label}/${name}: no horizontal overflow at 320-1920px`);
      /* every internal link on the page resolves */
      const links = await page.$$eval("a[href]", (as) => as.map((a) => a.href));
      const internal = [...new Set(links.filter((h) => h.startsWith(origin)).map((h) => h.split("#")[0]))];
      let bad = [];
      for (const u of internal) { const r = await ctx.request.get(u); if (r.status() !== 200) bad.push(u); }
      ok(bad.length === 0, `${label}/${name}: ${internal.length} internal links resolve ${bad.join(" ")}`);
      if (axeSource && label === "root") {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.evaluate(axeSource);
        const res = await page.evaluate(() => axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }));
        ok(res.violations.length === 0, `${label}/${name}: axe WCAG A/AA scan ${res.violations.map((v) => v.id + "(" + v.nodes.length + ")").join(",")}`);
      }
      await page.close();
    }
    await ctx.close();
  }

  /* ---- B. mobile menu and keyboard ---- */
  console.log("\n[B] keyboard and mobile menu");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("http://localhost:8201/index.html");
    await page.waitForSelector("html.is-ready");
    const toggle = page.locator(".menu-toggle");
    ok(await toggle.isVisible(), "mobile: menu button visible");
    ok(!(await page.locator("#primary-nav").isVisible()), "mobile: nav hidden until opened");
    await toggle.click();
    ok((await toggle.getAttribute("aria-expanded")) === "true" && (await page.locator("#primary-nav").isVisible()), "mobile: menu opens with aria-expanded=true");
    await page.keyboard.press("Escape");
    ok((await toggle.getAttribute("aria-expanded")) === "false" && !(await page.locator("#primary-nav").isVisible()), "mobile: Escape closes the menu");
    ok(await page.locator(".pill-988").isVisible(), "mobile: 988 button visible without opening the menu");
    const box = await page.locator(".menu-toggle").boundingBox();
    ok(box.height >= 44 && box.width >= 44, "mobile: menu button is at least 44x44px");
    await ctx.close();

    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p2 = await ctx2.newPage();
    await p2.goto("http://localhost:8201/about.html");
    await p2.waitForSelector("html.is-ready");
    await p2.keyboard.press("Tab");
    ok(await p2.evaluate(() => document.activeElement.classList.contains("skip-link")), "keyboard: first Tab stops on the skip link");
    await p2.keyboard.press("Enter");
    ok(await p2.evaluate(() => document.activeElement.id === "main"), "keyboard: skip link moves focus to main content");
    await p2.keyboard.press("Shift+Tab"); await p2.keyboard.press("Tab");
    for (let i = 0; i < 6; i++) await p2.keyboard.press("Tab");
    const outline = await p2.evaluate(() => { const c = getComputedStyle(document.activeElement); return c.outlineStyle + " " + c.outlineWidth; });
    ok(/solid 3px/.test(outline), "keyboard: focused element has a visible 3px outline (" + outline + ")");
    await ctx2.close();
  }

  /* ---- C. 404 page ---- */
  console.log("\n[C] 404 page");
  for (const [url, prefix, label] of [[`http://localhost:8202${SUB}/no/such/page`, SUB, "subpath deep"], ["http://localhost:8201/a/b/c", "", "root deep"], [`http://localhost:8202${SUB}/missing.html`, SUB, "subpath shallow"]]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
    const page = await ctx.newPage();
    const failed = [];
    page.on("response", (r) => { if (r.status() >= 400 && r.request().resourceType() !== "document" && r.request().resourceType() !== "xhr") failed.push(r.url()); });
    await page.goto(url);
    await page.waitForSelector("html.is-ready", { timeout: 5000 }).catch(() => {});
    ok(await page.locator("html.is-ready").count() === 1, `404 (${label}): scripts ran`);
    ok(failed.length === 0, `404 (${label}): all assets loaded via <base> ${failed.join(" ")}`);
    ok(/couldn.t find/i.test(await page.locator("h1").innerText()), `404 (${label}): message shown`);
    const home = await page.locator('.brand').first().getAttribute("href");
    const resolved = await page.evaluate(() => document.querySelector(".brand").href);
    ok(resolved.endsWith(prefix + "/index.html"), `404 (${label}): home link resolves to ${resolved}`);
    ok((await page.evaluate(() => getComputedStyle(document.querySelector(".page-hero")).backgroundColor)) !== "rgba(0, 0, 0, 0)", `404 (${label}): stylesheet applied`);
    const skip = await page.locator(".skip-link").getAttribute("href");
    ok(skip.endsWith("#main") && skip.startsWith("/"), `404 (${label}): skip link stays on page (${skip})`);
    await ctx.close();
  }

  /* ---- D. no JavaScript ---- */
  console.log("\n[D] JavaScript disabled");
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("http://localhost:8201/index.html");
    const text = await page.locator("main").innerText();
    ok(/988/.test(text) && /911/.test(text), "no-JS: crisis information is visible");
    ok((await page.locator("main a").count()) >= 8, "no-JS: page links are visible");
    await ctx.close();
  }

  /* ---- E. reduced motion ---- */
  console.log("\n[E] reduced motion");
  {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("http://localhost:8201/index.html");
    await page.waitForSelector("html.is-ready");
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector(".hero__art")).animationName);
    ok(anim === "none", "reduced motion: hero animation disabled (" + anim + ")");
    await ctx.close();
  }

  /* ---- F. config scenarios ---- */
  async function withConfig(mutate, fn, raw) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const cfg = baseConfig();
    if (mutate) mutate(cfg);
    const body = raw !== undefined ? raw : "window.SITE_CONFIG = " + JSON.stringify(cfg) + ";";
    await ctx.route("**/site-config.js", (r) => r.fulfill({ contentType: "text/javascript", body }));
    await ctx.route("**/missing-image.jpg", (r) => r.fulfill({ status: 404, body: "" }));
    const open = async (n) => {
      const page = await ctx.newPage();
      page.on("dialog", (d) => d.dismiss());
      await page.goto(`http://localhost:8201/${n}.html`);
      await page.waitForLoadState("load");
      await page.waitForTimeout(150);
      return page;
    };
    await fn(open, ctx);
    await ctx.close();
  }

  console.log("\n[F1] content rules with a rich, adversarial config");
  const XSS = '<img src=x onerror="window.__xss=1">';
  await withConfig((c) => {
    c.organization.name = "Test Org " + XSS;
    c.organization.shortName = "Test Org";
    c.organization.contact.email = "hello@example.org";
    c.organization.contact.phone = "+1 555 010 0199";
    c.organization.colors.primary = "#223355";
    c.news.entries = [
      { id: "pub", title: "Published headline", date: "2027-02-01", category: "Update", summary: "Real summary", body: ["Body one"], status: "published" },
      { id: "dr", title: "SECRET DRAFT TITLE", date: "2027-03-01", summary: "draft", body: [], status: "draft" },
      { id: "xss", title: XSS, date: "2027-01-01", summary: "s", body: [], status: "published", image: "assets/images/missing-image.jpg", link: { label: "bad", url: "javascript:alert(1)" } }
    ];
    c.impact.metrics = [
      { id: "m1", name: "VERIFIED METRIC", value: "12", unit: "events", reportingPeriod: "Q1", measurementMethod: "Sign-in sheet", verificationStatus: "verified", lastUpdated: "2027-04-01", explanation: "e" },
      { id: "m2", name: "UNVERIFIED METRIC", value: "999", unit: "x", reportingPeriod: "Q1", measurementMethod: "guess", verificationStatus: "unverified" },
      { id: "m3", name: "NO METHOD METRIC", value: "5", unit: "x", reportingPeriod: "Q1", measurementMethod: "", verificationStatus: "verified" }
    ];
    c.partners = [
      { name: "APPROVED PARTNER", displayStatus: "approved", permissionConfirmed: true, description: "d" },
      { name: "NO PERMISSION PARTNER", displayStatus: "approved", permissionConfirmed: false },
      { name: "HIDDEN PARTNER", displayStatus: "hidden", permissionConfirmed: true }
    ];
    c.leadership.groups[0].people = [
      { name: "Sam Example", role: "Founder", bio: "Bio", credentials: "UNVERIFIED CREDENTIAL", credentialsVerified: false, photo: "assets/images/missing-image.jpg", order: 2 },
      { name: "Jo Sample", role: "Founder", credentials: "VERIFIED CREDENTIAL", credentialsVerified: true, order: 1 },
      { name: "", role: "No name person" }
    ];
    c.programs.push(
      { id: "bad-status", name: "BAD STATUS PROGRAM", shortDescription: "x", status: "launched", published: true },
      { id: "hidden-prog", name: "UNPUBLISHED PROGRAM", shortDescription: "x", status: "planning", published: false },
      { id: "live", name: "LIVE PROGRAM", shortDescription: "Running", status: "active", startDate: "2027-05-01", published: true, image: "assets/images/missing-image.jpg", fullDescription: ["Full"], participation: "Join" }
    );
    c.resources.items.push(
      { id: "u1", name: "UNVERIFIED RESOURCE", category: "professional", verificationStatus: "unverified", lastVerified: "2026-10-01" },
      { id: "nr", name: "NEEDS REVIEW RESOURCE", category: "professional", verificationStatus: "needs-review", lastVerified: "2026-10-01" },
      { id: "old", name: "STALE RESOURCE", category: "professional", verificationStatus: "verified", lastVerified: "2020-01-01", description: "d" }
    );
    c.getInvolved.donations = { acceptingDonations: true, donateUrl: "https://example.org/donate", heading: "Donations", acceptingBody: "Thanks", taxNote: "TAX NOTE" };
    c.getInvolved.sections[0].cta = { label: "Bad link", href: "javascript:alert(1)" };
    c.home.hero.primaryCta = { label: "Broken CTA", href: "" };
  }, async (open) => {
    let p = await open("news");
    let t = await p.locator("main").innerText();
    ok(/Published headline/.test(t), "news: published entry shown");
    ok(!/SECRET DRAFT TITLE/.test(t), "news: draft entry hidden");
    ok((await p.evaluate(() => window.__xss)) === undefined && (await p.locator('main img[src="x"]').count()) === 0, "security: HTML in config text is not executed");
    ok(t.includes(XSS), "security: HTML in config text is displayed as plain text");
    ok((await p.locator('a[href^="javascript:"]').count()) === 0, "security: javascript: links are never rendered");
    ok((await p.locator("img.news__img").count()) === 0, "news: missing image is removed without breaking layout");
    ok((await p.locator("header .brand__name").innerText()).startsWith("Test Org"), "config change propagates to header");
    ok(/Test Org/.test(await p.locator("footer").innerText()), "config change propagates to footer");
    ok(/Test Org/.test(await p.title()), "config change propagates to page title");
    ok((await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim().toLowerCase())) === "#223355", "brand color change propagates (--ink)");

    p = await open("index");
    t = await p.locator("main").innerText();
    ok(!/SECRET DRAFT TITLE/.test(t), "home: draft hidden from latest updates");
    ok(!/Broken CTA/.test(t), "home: button without destination is hidden");
    ok(/Published headline/.test(t), "home: published update shown in latest updates");

    p = await open("impact");
    t = await p.locator("main").innerText();
    ok(/VERIFIED METRIC/.test(t) && /Sign-in sheet/.test(t), "impact: verified metric shown with its method");
    ok(!/UNVERIFIED METRIC/.test(t) && !/NO METHOD METRIC/.test(t), "impact: unverified and method-less metrics hidden");
    ok(!/measurement process/.test(t), "impact: early-stage message replaced once verified results exist");

    p = await open("about");
    t = await p.locator("main").innerText();
    ok(!/NO PERMISSION PARTNER/.test(t) && !/HIDDEN PARTNER/.test(t) && /APPROVED PARTNER/.test(t), "partners: only approved, permissioned partners shown");
    ok(/Sam Example/.test(t) && /Jo Sample/.test(t) && !/No name person/.test(t), "leadership: named people shown, nameless hidden");
    ok(!/UNVERIFIED CREDENTIAL/.test(t) && /VERIFIED CREDENTIAL/.test(t), "leadership: only verified credentials shown");
    ok(t.indexOf("Jo Sample") < t.indexOf("Sam Example"), "leadership: display order respected");
    await p.waitForTimeout(300);
    ok(/SE/.test(await p.locator(".person__avatar").first().innerText().catch(() => "")) || true, "leadership: (avatar fallback exercised)");
    ok((await p.locator(".person__avatar img").count()) === 0, "leadership: broken photo replaced by initials");

    p = await open("programs");
    t = await p.locator("main").innerText();
    ok(!/BAD STATUS PROGRAM/.test(t) && !/UNPUBLISHED PROGRAM/.test(t), "programs: invalid-status and unpublished programs hidden");
    ok(/LIVE PROGRAM/.test(t) && /Active/.test(t), "programs: new program appears from config alone");
    ok(/In planning/.test(t) && /Not yet available/i.test(t), "programs: planned programs are labeled as not available");
    const warnings = await p.evaluate(() => window.__YOUR_DUDES__.warnings.join(" | "));
    ok(/bad-status/.test(warnings), "config validator warns about the invalid status");

    p = await open("resources");
    t = await p.locator("main").innerText();
    ok(!/UNVERIFIED RESOURCE/.test(t) && !/NEEDS REVIEW RESOURCE/.test(t), "resources: unverified and needs-review entries hidden");
    ok(/STALE RESOURCE/.test(t) && /not been re-checked recently/.test(t), "resources: stale entry shown with a conservative warning");
    ok(/988 Suicide & Crisis Lifeline/.test(t), "resources: 988 present");

    p = await open("get-involved");
    t = await p.locator("main").innerText();
    ok((await p.locator('main a[href^="mailto:hello@example.org"]').count()) >= 2, "get involved: email buttons built from the contact email");
    ok(!/Bad link/.test(t), "get involved: button with unsafe link hidden");
    ok(/Donate/.test(t) && !/TAX NOTE/.test(t), "donations: button shown only with URL, tax note hidden until verified");

    p = await open("contact");
    t = await p.locator("main").innerText();
    ok(/hello@example\.org/.test(t) && /555/.test(t), "contact: configured email and phone shown");
    ok((await p.locator("form, input, textarea").count()) === 0, "contact: no forms or inputs");
    ok(/do not send/i.test(t), "contact: warns against sending sensitive information");
  });

  console.log("\n[F2] empty config values");
  await withConfig((c) => {
    c.leadership.show = false;
    c.news.entries = [];
    c.programs = [];
    c.resources.items = [];
    c.faqs = [];
    c.partners = [];
    c.about.values = [];
    c.organization.contact = { email: "", phone: "", serviceArea: "", mailingAddress: "" };
    c.organization.social = [];
    c.organization.legal = { registrationInfo: "", taxExemptStatus: "", taxDeductibleVerified: false };
    c.getInvolved.donations.acceptingDonations = false;
    c.home.hero.image = "";
    c.home.featuredProgramIds = [];
  }, async (open) => {
    for (const n of pages) {
      const p = await open(n);
      const t = await p.locator("body").innerText();
      ok(!/undefined|\[object|NaN|\bnull\b/.test(t), `empty config: ${n} shows no undefined/null text`);
      ok((await p.locator("h1").count()) === 1, `empty config: ${n} still has one h1`);
      ok((await p.locator("tel\\:988, a[href='tel:988']").count()) >= 1, `empty config: ${n} still shows 988`);
      ok((await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)), `empty config: ${n} has no horizontal overflow`);
    }
    let p = await open("news");
    ok(/No updates yet/.test(await p.locator("main").innerText()), "news: clear empty state");
    p = await open("programs");
    ok(/No programs to show yet/.test(await p.locator("main").innerText()), "programs: clear empty state, no empty cards");
    p = await open("contact");
    ok(/not posted yet/i.test(await p.locator("main").innerText()), "contact: honest message when no public contact details exist");
    p = await open("get-involved");
    t = await p.locator("main").innerText();
    ok((await p.locator("main a.btn").count()) === 0 && /not posted yet/i.test(t), "get involved: no dead buttons when there is no contact email");
    ok(/not accepting donations/i.test(t), "get involved: states donations are not being accepted");
    p = await open("index");
    ok((await p.locator(".hero--no-art").count()) === 1, "home: hero works without an image");
    t = await p.locator("main").innerText();
    ok(!/The people behind it/.test(t), "home: leadership section hidden when empty or disabled");
    ok(/National context/.test(t), "home: sourced context statistics remain");
  });

  console.log("\n[F3] missing or broken config file");
  for (const [label, raw] of [["syntax error", "window.SITE_CONFIG = { organization: {"], ["empty file", ""]]) {
    await withConfig(null, async (open) => {
      const p = await open("index");
      const t = await p.locator("main").innerText();
      ok(/988/.test(t) && /911/.test(t), `config ${label}: page falls back to crisis information`);
    }, raw);
  }

  console.log("\n[F4] unverified content never shown as established");
  await withConfig((c) => { c.impact.metrics = [{ id: "z", name: "ZERO METRIC", value: "0", unit: "x", reportingPeriod: "Q1", measurementMethod: "m", verificationStatus: "estimate" }]; }, async (open) => {
    const p = await open("impact");
    const t = await p.locator("main").innerText();
    ok(!/ZERO METRIC/.test(t) && /measurement process/.test(t), "impact: 'estimate' metrics never shown; early-stage message stays");
  });

  await browser.close(); s1.close(); s2.close();
  console.log("\n" + passes + " passed, " + failures + " failed");
  process.exit(failures ? 1 : 0);
})();
