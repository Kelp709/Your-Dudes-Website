# Your Dudes website

A static, build-free website for **Your Dudes**, an early-stage men's mental health outreach initiative. It is plain HTML, CSS, and JavaScript, hosted free on GitHub Pages. There is no backend, no database, no analytics, and no paid service.

> **Working name and tagline.** "Your Dudes" and "You don't have to figure it out alone." are provisional. Change them in one place: `site-config.js`.

---

## 1. What is in this folder

```
index.html, about.html, programs.html, impact.html,
resources.html, get-involved.html, news.html, contact.html
404.html                 Branded not-found page (GitHub Pages serves it automatically)
site-config.js           THE file you edit. All organization content lives here.
assets/css/styles.css    Styling and design tokens
assets/js/main.js        Renders the shared header, footer, and page content from the config
assets/images/           Logo mark, hero illustration, social preview image (all original)
assets/icons/            Favicon
robots.txt, sitemap.xml  Search engine files (see "Set your site address")
.nojekyll                Tells GitHub Pages to publish files as they are
tests/                   Optional automated checks (Node.js)
tools/update-meta.js     Optional helper that writes sitemap and sharing tags
```

### How it works (architecture)

- Each HTML page is a small shell. `main.js` reads `window.SITE_CONFIG` from `site-config.js` and builds the page. This avoids repeating navigation, footer, and cards in every file.
- All text is inserted with `textContent` and validated attributes. The code never uses `innerHTML`, so a typo or odd character in the config cannot inject markup. (`tests/static-check.js` enforces this.)
- If JavaScript is off, each page shows a plain fallback with the 988 crisis information and links to every page.
- If `site-config.js` has a syntax error, pages fall back to crisis information and a link home instead of a blank screen.
- All asset paths are relative, so the site works at a domain root (`https://yourdudes.org/`) and in a repository subpath (`https://name.github.io/repo/`). `404.html` works out its own base path because GitHub Pages serves it at any missing address.
- Design: deep navy, a muted teal accent, and a warm "porch light" amber used sparingly. Colors are CSS variables set from the config.

---

## 2. Preview locally

You need nothing for a quick look: double-click `index.html`. For the most accurate preview (it behaves like GitHub Pages, including the 404 page), use Node.js:

```bash
node tests/server.js 8080
# open http://localhost:8080/
```

Any static server also works, for example `python3 -m http.server 8080`.

---

## 3. Publish on GitHub Pages

1. Create a GitHub account and a new **public** repository (for example `your-dudes`).
2. Upload everything in this folder to the repository root. Using the web page: **Add file > Upload files**, drag in the files and folders (keep `assets/`, `tests/`, `tools/`), then **Commit changes**.
3. In the repository, open **Settings > Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose branch **main** and folder **/ (root)**, and click **Save**.
5. Wait one to two minutes. The address appears at the top of that page, usually `https://YOURNAME.github.io/your-dudes/`.
6. Open it and click through every page.

### Set your site address (recommended)

Open `site-config.js` and set `organization.siteUrl` to the exact public address, with no trailing slash, for example `"https://yourname.github.io/your-dudes"`. Then, with Node.js installed, run:

```bash
node tools/update-meta.js
```

This writes a real `sitemap.xml` and `robots.txt` and adds canonical and sharing-image tags to every page. Commit those changes. Re-run it whenever the address changes.

### Optional: custom domain

1. Buy a domain from any registrar. (This is the only cost, and it is optional.)
2. In **Settings > Pages > Custom domain**, enter it and save. Follow GitHub's DNS instructions at <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site>.
3. Turn on **Enforce HTTPS** once it becomes available.
4. Update `organization.siteUrl` and re-run `node tools/update-meta.js`.

### Updating after publication

Edit `site-config.js` (on GitHub, open the file and click the pencil icon), commit, and wait a minute or two. Refresh with Ctrl+Shift+R if you do not see the change.

---

## 4. Editing the site safely

Almost everything is in `site-config.js`. The file starts with a short guide. The essentials:

- Text goes in **"double quotes"**. Every item in a list ends with a **comma**.
- `[ ... ]` is a list, `{ ... }` is one item. Keep brackets matched.
- A quote inside text needs a backslash: `"She said \"hello\"."`
- Lines starting with `//` are comments.
- **Leave a value as `""` (or a list as `[]`) to hide it.** The site never shows empty fields or empty cards.
- After editing, open the page, press **F12 > Console**, and look for `[Your Dudes config]` warnings. They point at mistakes.
- Run `node tests/static-check.js` (if you have Node.js) to catch problems before publishing.

### Change brand colors

`organization.colors` takes three 6-digit hex values: `primary` (dark navy), `accent` (teal), `glow` (amber). The whole site restyles. Check that text stays readable against its background.

### Change names, tagline, mission

`organization.name`, `shortName`, `tagline`, `mission`, `vision`, `description`.

### Change images

Put image files in `assets/images/` and reference them with a path relative to the site root, with no leading slash, for example `"assets/images/people/alex.jpg"`. Always add the matching `...Alt` text. A missing or empty image path simply hides the image. Keep photos under about 300 KB (resize and compress first).

### Hide a section

- Leadership: `leadership.show: false` hides it everywhere. Empty groups hide themselves.
- Get Involved sections: set `enabled: false`.
- Programs, news, partners: set `published: false` or `status: "draft"`, or delete the entry.
- Navigation call-to-action: set `navigation.cta.label` to `""`.

### Configure links

Internal links are page names such as `"resources.html"`. External links must start with `https://`. `javascript:` links are rejected. A button with no working destination is hidden.

---

## 5. Configuration reference

| Section | What it controls | Required |
|---|---|---|
| `organization` | Name, tagline, mission, vision, colors, logo, favicon, contact, siteUrl, social links, legal status, honest status text | Name, tagline, mission, colors, status |
| `navigation` | The 8 menu items and the header button | Yes |
| `crisis` | 988 information shown on every page. Verified 2026-10-18 | Keep enabled |
| `home` | Hero, problem overview, mission intro, featured program ids, community approach, final call to action | Yes |
| `about` | Values, founding story, "where we are today" | Yes |
| `leadership` | Founders, directors, advisors, staff, volunteers | Optional |
| `programs` | One object per program | Optional (hides if empty) |
| `impact` | Verified metrics, principles, goals, completed activities, lessons, report archive | Optional |
| `context.statistics` | Sourced national statistics, clearly labeled as context | Optional |
| `resources` | Categories and the verified directory | Keep 988 entry |
| `news` | Updates, draft or published | Optional |
| `partners` | Approved partners only | Optional |
| `getInvolved` | Volunteer, partner, advisor, board, donations | Optional |
| `faqs` | Questions and answers | Optional |
| `contactPage`, `privacy` | Contact page text and privacy notice | Yes |
| `pages` | Browser-tab titles and descriptions | Yes |

### Organization contact (all optional)

`organization.contact.email`, `phone`, `serviceArea`, `mailingAddress`. Empty means hidden. Use a shared organizational email, never a personal address, home address, or personal phone. Get Involved buttons use the email as a `mailto:` link and are hidden while it is empty.

### Adding a program

Copy an object in `programs`, paste it after the last one (with a comma), and give it a **new unique `id`**. Fields: `id`, `published`, `name`, `shortDescription`, `fullDescription` (list of paragraphs), `status` (`"planning"`, `"active"`, `"paused"`, `"completed"`), `audience`, `activities` (real, current only), `plannedActivities`, `startDate`, `endDate`, `image`, `imageAlt`, `links`, `goals`, `results`, `reportingPeriod`, `participation`, `featured`. The homepage shows programs listed in `home.featuredProgramIds`, so no content is duplicated.

> Never set `status: "active"` unless people can actually take part today. Planning programs are always labeled "Not yet available."

### Publishing news

Add an entry to `news.entries` with `status: "draft"` while writing, then change it to `"published"`. Drafts never appear publicly. Fields: `id`, `title`, `date` (`YYYY-MM-DD`), `category`, `summary`, `body` (list of paragraphs), optional `image`, `imageAlt`, `link`. The homepage shows the newest published entries automatically.

### Impact metrics

A metric appears **only** when `verificationStatus` is `"verified"` and it has a `value`, `reportingPeriod`, and `measurementMethod`. Others stay hidden, and the page shows an honest early-stage message instead. Fields: `id`, `name`, `value`, `unit`, `reportingPeriod`, `measurementMethod`, `explanation`, `verificationStatus`, `lastUpdated`, `reportUrl`. Add yearly reports to `impact.reports`. Website visits, followers, and attendance alone are not outcomes. Do not present them as such.

### Resources

Each resource needs `id`, `name`, `provider`, `description`, `category` (`crisis`, `professional`, `low-cost`, `community`, `general`), `website`, `lastVerified`, `verificationStatus`. Optional: `phone`, `phoneHref`, `serviceArea`, `cost`, `eligibility`, `audience`. Only `"verified"` entries show. A verified entry older than `staleAfterDays` (365) still shows with a "confirm details" note, so review the directory at least once a year: open each website and phone number, then update `lastVerified`. Do not add a resource you have not personally checked.

### Leadership

Each person: `name` and `role` required. Optional: `bio`, `photo`, `photoAlt`, `credentials`, `credentialsVerified` (credentials show only when `true`), `profileUrl`, `order`. Get each person's permission before publishing anything about them. Do not publish founders' private contact details.

### Partners

A partner shows only if `displayStatus` is `"approved"` **and** `permissionConfirmed` is `true`. Get written permission first, including for logos.

### Donations

`getInvolved.donations.acceptingDonations` is `false`. There is no checkout. Only after you are legally able to accept gifts should you set it true, add a `donateUrl` from an authorized payment provider, and (only if verified) set `organization.legal.taxDeductibleVerified` to `true`.

---

## 6. Safety and trust rules built into the site

- 988 (call, text, chat) appears in a strip at the top of every page and in the mobile header, with a "not an emergency service" statement.
- No forms, chat, accounts, intake, or analytics. No third-party requests: fonts and scripts load from this site only.
- No promise of anonymity or confidentiality. The only "confidential" wording describes the 988 Lifeline itself, in its own terms.
- No invented testimonials, partners, credentials, or results. All statistics carry a source, access date, and plain-language "what this measures."
- Planned programs are labeled "In planning" and "Not yet available."

If you change wording, keep these rules.

---

## 7. Placeholders and setup tasks

Information that is **unknown** and left empty on purpose (the site hides them until filled):

- [ ] `organization.contact.email` (create a shared organizational email), phone, service area, mailing address
- [ ] `organization.siteUrl`, then run `node tools/update-meta.js`
- [ ] `organization.social` (only accounts you actually run)
- [ ] `organization.foundedYear`
- [ ] `leadership.groups[...].people` (founders and others, with permission)
- [ ] `news.entries`, `partners`, `impact.metrics`, `impact.reports` (only real items)
- [ ] `organization.legal` (only after incorporation or tax status is confirmed)
- [ ] `getInvolved.donations` (stays off until legally able)

Provisional wording the founders should review and rewrite:

- [ ] Name, tagline, mission, vision (`organization`)
- [ ] About-page values (`about.values`). The founding story is hidden until you write it: fill `about.foundingStory.paragraphs` and set `published: true`
- [ ] The three planned program descriptions (`programs`)
- [ ] FAQs, privacy notice (`faqs`, `privacy`)
- [ ] Hero illustration (`assets/images/hero-art.svg`) and social preview (`assets/images/social-preview.png`) are original placeholders and can be replaced
- [ ] Review resources yearly (see Resources above) and re-verify 988 details at <https://988lifeline.org>

### Facts verified on 2026-10-18

- 988: call or text 988, chat at 988lifeline.org, free and 24/7; press 1 for Veterans Crisis Line, press 2 for Spanish (988lifeline.org).
- Suicide rate 22.3 (males) vs 5.6 (females) per 100,000, age-adjusted, 2024: CDC NCHS Data Brief No. 572.
- Males make up about 50% of the population but nearly 80% of suicide deaths in 2023: CDC Suicide Data and Statistics.

Re-check these when you update the site.

---

## 8. Verification

Run from the project folder (Node.js 18+):

```bash
node tests/static-check.js
```

Checks pages exist, links and assets resolve, config is well-formed, program/resource/news/metric rules hold, and the code avoids `innerHTML`, forms, network calls, and external CSS.

Optional browser checks (needs Playwright and a Chromium browser):

```bash
npm install --no-save playwright axe-core
npx playwright install chromium
node tests/browser-check.js
```

This loads every page at the root and in a subpath, tests six widths for overflow, the mobile menu, keyboard use, the 404 page, the no-JavaScript fallback, an axe accessibility scan, and that drafts and unverified data stay hidden when the config changes.

### Manual checklist before each publish

- [ ] Open every page on a phone and on a laptop
- [ ] 988 strip and links visible on every page
- [ ] Tab through a page: focus ring visible, menu works with keyboard
- [ ] No draft news, unverified metrics, or unapproved partners visible
- [ ] Everything you state about programs, status, and results is true today
- [ ] Console (F12) shows no `[Your Dudes config]` warnings

### Not covered by the automated checks

Real-device testing, screen-reader testing (for example NVDA or VoiceOver), Lighthouse scores, and review by a licensed mental health professional or legal advisor were not performed. Please have the language reviewed by qualified people before launch.

---

## 9. Credits

The logo, illustration, and icons are original and were created for this project. The site uses system fonts only, and no third-party code.
