/* Your Dudes: site renderer
   Reads window.SITE_CONFIG (site-config.js) and builds the shared header,
   footer, and each page's content with safe DOM methods.
   No config value is ever inserted as HTML: everything goes through
   textContent or validated attributes.
   You normally do not need to edit this file. Edit site-config.js instead. */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG;
  var PAGE = "home"; /* read from <body data-page> inside boot(), once the body exists */
  var warnings = [];

  /* ---------- small utilities ---------- */

  function warn(msg) {
    warnings.push(msg);
    if (window.console && console.warn) console.warn("[Your Dudes config] " + msg);
  }

  function has(v) {
    return v !== undefined && v !== null && String(v).trim() !== "";
  }

  function arr(v) {
    return Array.isArray(v) ? v : [];
  }

  function append(node, kids) {
    if (kids === undefined || kids === null || kids === false) return;
    if (!Array.isArray(kids)) kids = [kids];
    kids.forEach(function (c) {
      if (c === undefined || c === null || c === false) return;
      if (Array.isArray(c)) return append(node, c);
      node.appendChild(typeof c === "object" && c.nodeType ? c : document.createTextNode(String(c)));
    });
  }

  function h(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === undefined || v === null || v === false) return;
        if (k === "class") n.className = v;
        else if (k === "text") n.textContent = v;
        else n.setAttribute(k, v === true ? "" : v);
      });
    }
    append(n, kids);
    return n;
  }

  /* Only allow http(s), mailto, tel, sms, and relative links. Blocks javascript: etc. */
  function safeUrl(u) {
    if (!has(u)) return "";
    u = String(u).trim();
    if (/^(https?:|mailto:|tel:|sms:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.\-]*:/i.test(u)) return "";
    if (/^\/\//.test(u)) return "";
    return u;
  }

  function isExternal(u) {
    return /^https?:/i.test(u);
  }

  function link(href, label, cls, extra) {
    var url = safeUrl(href);
    if (!url) return null;
    var props = { href: url, class: cls || null };
    if (isExternal(url)) props.rel = "noopener noreferrer";
    if (extra) Object.keys(extra).forEach(function (k) { props[k] = extra[k]; });
    return h("a", props, label);
  }

  function isHex(c) {
    return /^#[0-9a-fA-F]{6}$/.test(String(c || ""));
  }

  function mix(hex, withHex, amount) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(withHex.slice(1), 16);
    function ch(shift) {
      var x = (a >> shift) & 255, y = (b >> shift) & 255;
      return Math.round(x + (y - x) * amount);
    }
    return "#" + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
  }

  function parseDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }

  function fmtDate(iso) {
    var d = parseDate(iso);
    if (!d) return "";
    try {
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
    } catch (e) {
      return iso;
    }
  }

  function daysSince(iso) {
    var d = parseDate(iso);
    if (!d) return Infinity;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
  }

  /* Image that removes itself if it fails, so layouts never show a broken icon.
     Optional onfail(parent) lets the caller put something in its place. */
  function safeImg(src, alt, cls, w, hgt, onfail) {
    var url = safeUrl(src);
    if (!url || /^(mailto|tel|sms):/i.test(url)) return null;
    var img = h("img", { src: url, alt: alt || "", class: cls || null, loading: "lazy", decoding: "async" });
    if (w) img.setAttribute("width", w);
    if (hgt) img.setAttribute("height", hgt);
    img.addEventListener("error", function () {
      var holder = img.closest("figure") || img;
      var parent = holder.parentNode;
      if (!parent) return;
      parent.removeChild(holder);
      parent.classList.add("has-missing-image");
      if (onfail) onfail(parent);
    });
    return img;
  }

  /* ---------- config access and validation ---------- */

  var ORG = (CFG && CFG.organization) || {};
  var CONTACT = ORG.contact || {};

  var STATUS = {
    planning: { label: "In planning", note: "Not yet available" },
    active: { label: "Active", note: "" },
    paused: { label: "Paused", note: "" },
    completed: { label: "Completed", note: "" }
  };

  function orgName() { return has(ORG.name) ? ORG.name : "Our organization"; }

  function resolveAction(cta) {
    if (!cta || !has(cta.label)) return null;
    var href = safeUrl(cta.href);
    if (href) return { label: cta.label, href: href };
    if (has(cta.emailSubject) && has(CONTACT.email)) {
      return {
        label: cta.label,
        href: "mailto:" + String(CONTACT.email).trim() + "?subject=" + encodeURIComponent(cta.emailSubject)
      };
    }
    return null;
  }

  function button(cta, cls) {
    var a = resolveAction(cta);
    if (!a) return null;
    return link(a.href, a.label, "btn " + (cls || "btn--solid"));
  }

  function validate() {
    if (!CFG) return;
    var seen = {};
    arr(CFG.programs).forEach(function (p, i) {
      if (!p || !has(p.id)) return warn("programs[" + i + "] has no id.");
      if (seen[p.id]) warn("Duplicate program id: " + p.id);
      seen[p.id] = true;
      if (!STATUS[p.status]) warn('Program "' + p.id + '" has invalid status "' + p.status + '" (use planning, active, paused, or completed). It will be hidden.');
      if (!has(p.name)) warn('Program "' + p.id + '" has no name. It will be hidden.');
    });
    var rseen = {};
    arr(CFG.resources && CFG.resources.items).forEach(function (r, i) {
      if (!r || !has(r.id)) return warn("resources.items[" + i + "] has no id.");
      if (rseen[r.id]) warn("Duplicate resource id: " + r.id);
      rseen[r.id] = true;
      var ok = arr(CFG.resources.categories).some(function (c) { return c.key === r.category; });
      if (!ok) warn('Resource "' + r.id + '" has unknown category "' + r.category + '".');
      if (r.verificationStatus === "verified" && !parseDate(r.lastVerified)) warn('Verified resource "' + r.id + '" needs lastVerified as YYYY-MM-DD.');
    });
    arr(CFG.news && CFG.news.entries).forEach(function (n, i) {
      if (!n || !has(n.id)) warn("news.entries[" + i + "] has no id.");
      if (n && n.status !== "draft" && n.status !== "published") warn('News "' + n.id + '" status must be "draft" or "published".');
      if (n && !parseDate(n.date)) warn('News "' + n.id + '" needs date as YYYY-MM-DD.');
    });
    ["primary", "accent", "glow"].forEach(function (k) {
      if (ORG.colors && has(ORG.colors[k]) && !isHex(ORG.colors[k])) warn("organization.colors." + k + " must be a 6-digit hex like #0E1A2B.");
    });
    arr(CFG.home && CFG.home.featuredProgramIds).forEach(function (id) {
      if (!seen[id]) warn('home.featuredProgramIds lists "' + id + '" but no such program exists.');
    });
  }

  /* ---------- visibility rules ---------- */

  function visiblePrograms() {
    return arr(CFG.programs).filter(function (p) {
      return p && p.published !== false && has(p.id) && has(p.name) && STATUS[p.status];
    });
  }

  function featuredPrograms() {
    var all = visiblePrograms();
    var ids = arr(CFG.home && CFG.home.featuredProgramIds);
    var picked = ids.map(function (id) {
      return all.filter(function (p) { return p.id === id; })[0];
    }).filter(Boolean);
    if (picked.length) return picked;
    return all.filter(function (p) { return p.featured; });
  }

  function publishedNews() {
    return arr(CFG.news && CFG.news.entries)
      .filter(function (n) { return n && n.status === "published" && has(n.title) && has(n.id); })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  function verifiedMetrics() {
    return arr(CFG.impact && CFG.impact.metrics).filter(function (m) {
      return m && m.verificationStatus === "verified" && has(m.name) && has(m.value) &&
        has(m.reportingPeriod) && has(m.measurementMethod);
    });
  }

  function approvedPartners() {
    return arr(CFG.partners).filter(function (p) {
      return p && has(p.name) && p.displayStatus === "approved" && p.permissionConfirmed === true;
    });
  }

  function leadershipGroups() {
    var L = CFG.leadership || {};
    if (L.show === false) return [];
    return arr(L.groups).map(function (g) {
      var people = arr(g.people).filter(function (p) { return p && has(p.name) && has(p.role); })
        .slice().sort(function (a, b) {
          return (a.order === undefined ? 999 : a.order) - (b.order === undefined ? 999 : b.order);
        });
      return { heading: g.heading, key: g.key, people: people };
    }).filter(function (g) { return g.people.length; });
  }

  function visibleResources() {
    var R = CFG.resources || {};
    var stale = typeof R.staleAfterDays === "number" ? R.staleAfterDays : 365;
    return arr(R.items).filter(function (r) {
      return r && r.verificationStatus === "verified" && has(r.name) && parseDate(r.lastVerified);
    }).map(function (r) {
      return { item: r, stale: daysSince(r.lastVerified) > stale };
    });
  }

  /* ---------- shared pieces ---------- */

  function sectionHead(title, intro, opts) {
    opts = opts || {};
    return h("div", { class: "section-head" + (opts.narrow ? " section-head--narrow" : "") }, [
      h(opts.level || "h2", { class: "section-title", id: opts.id || null, text: title }),
      has(intro) ? h("p", { class: "lede", text: intro }) : null
    ]);
  }

  function section(cls, id, children) {
    return h("section", { class: "section " + cls, "aria-labelledby": id || null }, h("div", { class: "container" }, children));
  }

  function pageHero(title, intro) {
    return h("section", { class: "page-hero" }, h("div", { class: "container" }, [
      h("h1", { class: "page-hero__title", text: title }),
      has(intro) ? h("p", { class: "page-hero__intro", text: intro }) : null
    ]));
  }

  function paragraphs(list, cls) {
    return arr(list).filter(has).map(function (t) { return h("p", { class: cls || null, text: t }); });
  }

  function statusBadge(status) {
    var s = STATUS[status];
    return h("span", { class: "badge badge--" + status }, [
      h("span", { class: "badge__dot", "aria-hidden": "true" }),
      s.label
    ]);
  }

  function dlRow(dl, term, def) {
    if (!has(def)) return;
    dl.appendChild(h("div", { class: "facts__row" }, [h("dt", { text: term }), h("dd", { text: def })]));
  }

  function bulletList(items, cls) {
    var list = arr(items).filter(has);
    if (!list.length) return null;
    return h("ul", { class: cls || "list" }, list.map(function (t) { return h("li", { text: t }); }));
  }

  function emptyState(title, body) {
    return h("div", { class: "empty" }, [
      h("p", { class: "empty__title", text: title }),
      has(body) ? h("p", { class: "empty__body", text: body }) : null
    ]);
  }

  function statLedger() {
    var stats = arr(CFG.context && CFG.context.statistics).filter(function (s) {
      return s && has(s.value) && has(s.measures) && has(s.sourceName) && safeUrl(s.sourceUrl);
    });
    if (!stats.length) return null;
    return h("ul", { class: "ledger" }, stats.map(function (s) {
      return h("li", { class: "ledger__item" }, [
        h("p", { class: "ledger__value", text: s.value }),
        h("div", { class: "ledger__text" }, [
          h("p", { class: "ledger__unit", text: s.unit }),
          h("p", { class: "ledger__measures" }, [h("strong", { text: "What this measures: " }), s.measures]),
          h("p", { class: "ledger__source" }, [
            "Source: ",
            link(s.sourceUrl, s.sourceName),
            has(s.accessed) ? " (accessed " + fmtDate(s.accessed) + ")" : null
          ])
        ])
      ]);
    }));
  }

  /* ---------- programs ---------- */

  function programLink(p) {
    return "programs.html#" + encodeURIComponent(p.id);
  }

  function programFeature(p) {
    var note = STATUS[p.status].note;
    return h("article", { class: "program-feature" }, [
      h("div", { class: "program-feature__top" }, [statusBadge(p.status), has(note) ? h("span", { class: "program-note", text: note }) : null]),
      h("h3", { class: "program-feature__name" }, link(programLink(p), p.name, "stretched")),
      h("p", { class: "program-feature__text", text: p.shortDescription }),
      h("p", { class: "program-feature__more" }, h("span", { text: "Read the plan" }))
    ]);
  }

  function programRow(p) {
    var note = STATUS[p.status].note;
    return h("article", { class: "program-row" }, [
      h("div", { class: "program-row__top" }, [statusBadge(p.status), has(note) ? h("span", { class: "program-note", text: note }) : null]),
      h("h3", { class: "program-row__name" }, link(programLink(p), p.name, "stretched")),
      h("p", { class: "program-row__text", text: p.shortDescription })
    ]);
  }

  function programDetail(p) {
    var facts = h("dl", { class: "facts" });
    dlRow(facts, "Status", STATUS[p.status].label + (has(STATUS[p.status].note) ? " (" + STATUS[p.status].note.toLowerCase() + ")" : ""));
    dlRow(facts, "Who it's for", p.audience);
    dlRow(facts, "Started", fmtDate(p.startDate));
    dlRow(facts, "Ended", fmtDate(p.endDate));
    dlRow(facts, "Reporting period", p.reportingPeriod);

    var links = arr(p.links).map(function (l) {
      return has(l.label) ? link(l.url, l.label, "text-link") : null;
    }).filter(Boolean);

    var results = arr(p.results).filter(has);

    var img = has(p.image) ? safeImg(p.image, p.imageAlt, "program__img") : null;

    return h("article", { class: "program", id: p.id }, [
      h("header", { class: "program__head" }, [
        statusBadge(p.status),
        h("h2", { class: "program__name", text: p.name }),
        h("p", { class: "program__short", text: p.shortDescription })
      ]),
      h("div", { class: "program__grid" }, [
        h("div", { class: "program__main prose" }, [
          img ? h("figure", { class: "program__figure" }, img) : null,
          paragraphs(p.fullDescription),
          bulletList(p.activities) ? [h("h3", { text: "What is happening" }), bulletList(p.activities)] : null,
          bulletList(p.plannedActivities) ? [h("h3", { text: p.status === "planning" ? "What we plan to do (not started)" : "Planned next" }), bulletList(p.plannedActivities)] : null,
          bulletList(p.goals) ? [h("h3", { text: "Goals" }), h("p", { class: "muted", text: "Goals describe what we hope to do. They are not results." }), bulletList(p.goals)] : null,
          results.length ? [h("h3", { text: "Verified results" }), bulletList(results)] : null
        ]),
        h("aside", { class: "program__side" }, [
          facts,
          has(p.participation) ? h("div", { class: "callout" }, [h("h3", { class: "callout__title", text: "How to take part" }), h("p", { text: p.participation })]) : null,
          links.length ? h("p", { class: "program__links" }, links) : null
        ])
      ])
    ]);
  }

  /* ---------- leadership ---------- */

  function personCard(p) {
    var photo = has(p.photo) ? safeImg(p.photo, p.photoAlt || p.name, "person__img", 160, 160, function (parent) {
      parent.setAttribute("aria-hidden", "true");
      parent.appendChild(h("span", { text: initials(p.name) }));
    }) : null;
    var avatar = h("div", { class: "person__avatar", "aria-hidden": photo ? null : "true" },
      photo || h("span", { text: initials(p.name) }));
    var cred = p.credentialsVerified === true && has(p.credentials) ? h("p", { class: "person__cred", text: p.credentials }) : null;
    var profile = has(p.profileUrl) ? link(p.profileUrl, "Public profile", "text-link") : null;
    return h("li", { class: "person" }, [
      avatar,
      h("div", { class: "person__body" }, [
        h("h4", { class: "person__name", text: p.name }),
        h("p", { class: "person__role", text: p.role }),
        cred,
        has(p.bio) ? h("p", { class: "person__bio", text: p.bio }) : null,
        profile ? h("p", null, profile) : null
      ])
    ]);
  }

  function leadershipBlock(groups) {
    return groups.map(function (g) {
      return h("div", { class: "people-group" }, [
        h("h3", { class: "people-group__title", text: g.heading }),
        h("ul", { class: "people" }, g.people.map(personCard))
      ]);
    });
  }

  function partnersBlock() {
    var list = approvedPartners();
    if (!list.length) return null;
    return section("section--tint", "partners-title", [
      sectionHead("Partners", CFG.partnersIntro, { id: "partners-title" }),
      h("ul", { class: "partners" }, list.map(function (p) {
        var logo = has(p.logo) ? safeImg(p.logo, p.logoAlt || p.name + " logo", "partner__logo", 160, 80) : null;
        var site = has(p.website) ? link(p.website, "Visit website", "text-link") : null;
        return h("li", { class: "partner" }, [
          logo ? h("figure", { class: "partner__fig" }, logo) : null,
          h("h3", { class: "partner__name", text: p.name }),
          has(p.type) ? h("p", { class: "partner__type", text: p.type }) : null,
          has(p.description) ? h("p", { text: p.description }) : null,
          site ? h("p", null, site) : null
        ]);
      }))
    ]);
  }

  function faqBlock() {
    var faqs = arr(CFG.faqs).filter(function (f) { return f && has(f.q) && has(f.a); });
    if (!faqs.length) return null;
    return section("", "faq-title", [
      sectionHead("Common questions", "", { id: "faq-title" }),
      h("div", { class: "faq" }, faqs.map(function (f) {
        return h("details", { class: "faq__item" }, [
          h("summary", { text: f.q }),
          h("p", { text: f.a })
        ]);
      }))
    ]);
  }

  /* ---------- crisis block ---------- */

  function crisisBox(opts) {
    var C = CFG.crisis || {};
    if (C.enabled === false) return null;
    opts = opts || {};
    var lines = arr(C.lines).filter(function (l) { return l && has(l.label) && safeUrl(l.href); });
    return h("div", { class: "crisis-box" + (opts.compact ? " crisis-box--compact" : ""), id: opts.id || null }, [
      h(opts.level || "h2", { class: "crisis-box__title", text: opts.title || "If you need help right now" }),
      h("ul", { class: "crisis-box__lines" }, lines.map(function (l) {
        return h("li", null, [
          link(l.href, l.label, "btn btn--glow"),
          has(l.detail) ? h("span", { class: "crisis-box__detail", text: l.detail }) : null
        ]);
      })),
      h("div", { class: "crisis-box__notes" }, [
        has(C.emergencyNote) ? h("p", { class: "crisis-box__emergency", text: C.emergencyNote }) : null,
        has(C.veteransNote) ? h("p", { text: C.veteransNote }) : null,
        has(C.spanishNote) ? h("p", { text: C.spanishNote }) : null,
        has(C.notEmergencyService) ? h("p", { text: C.notEmergencyService }) : null,
        h("p", { class: "crisis-box__source" }, [
          "Official information: ",
          link(C.officialUrl, has(C.officialLabel) ? C.officialLabel : C.officialUrl),
          parseDate(C.lastVerified) ? ". We last checked this on " + fmtDate(C.lastVerified) + "." : null
        ])
      ])
    ]);
  }

  /* ---------- page: home ---------- */

  function renderHome() {
    var H = CFG.home || {};
    var hero = H.hero || {};
    var frag = document.createDocumentFragment();

    /* hero */
    var heroImg = has(hero.image) ? safeImg(hero.image, hero.imageAlt, "hero__img", 640, 720) : null;
    if (heroImg) { heroImg.removeAttribute("loading"); heroImg.setAttribute("fetchpriority", "high"); }
    var primary = button(hero.primaryCta, "btn--glow");
    var secondary = button(hero.secondaryCta, "btn--line");
    frag.appendChild(h("section", { class: "hero" + (heroImg ? "" : " hero--no-art") }, h("div", { class: "container hero__grid" }, [
      h("div", { class: "hero__copy" }, [
        has(ORG.status && ORG.status.label) ? h("p", { class: "hero__status" }, [h("span", { class: "hero__dot", "aria-hidden": "true" }), ORG.status.label + ": we're building"]) : null,
        h("h1", { class: "hero__title", text: hero.headline || ORG.tagline || orgName() }),
        has(hero.subtitle) ? h("p", { class: "hero__subtitle", text: hero.subtitle }) : null,
        (primary || secondary) ? h("div", { class: "actions" }, [primary, secondary]) : null
      ]),
      heroImg ? h("figure", { class: "hero__art" }, heroImg) : null
    ])));

    /* problem */
    var prob = H.problem || {};
    var ledger = statLedger();
    frag.appendChild(section("section--problem", "problem-title", [
      h("div", { class: "split" }, [
        h("div", { class: "split__lead" }, [
          h("h2", { class: "section-title", id: "problem-title", text: prob.heading || "The problem" }),
          paragraphs(prob.body, "prose-p")
        ]),
        ledger ? h("div", { class: "split__aside" }, [
          h("h3", { class: "ledger-title", text: prob.statsHeading || "National context" }),
          has(prob.statsNote) ? h("p", { class: "muted", text: prob.statsNote }) : null,
          ledger
        ]) : null
      ])
    ]));

    /* mission and values */
    var m = H.mission || {};
    var values = arr(CFG.about && CFG.about.values).filter(function (v) { return v && has(v.title); }).slice(0, 4);
    frag.appendChild(h("section", { class: "section section--dark section--mission", "aria-labelledby": "mission-title" }, h("div", { class: "container" }, [
      h("div", { class: "mission" }, [
        h("div", { class: "mission__lead" }, [
          h("h2", { class: "mission__title", id: "mission-title", text: m.heading || "Our mission" }),
          has(m.intro) ? h("p", { class: "mission__intro", text: m.intro }) : null,
          has(ORG.mission) ? h("p", { class: "mission__statement" }, [h("span", { class: "mission__label", text: "Our mission. " }), ORG.mission]) : null
        ]),
        values.length ? h("ul", { class: "values" }, values.map(function (v) {
          return h("li", { class: "values__item" }, [h("h3", { class: "values__title", text: v.title }), has(v.body) ? h("p", { text: v.body }) : null]);
        })) : null
      ]),
      h("p", { class: "mission__more" }, link("about.html", "Read about our values and status", "text-link text-link--light"))
    ])));

    /* featured programs */
    var feats = featuredPrograms();
    if (feats.length) {
      frag.appendChild(section("", "programs-title", [
        sectionHead(H.programsHeading || "Programs", H.programsIntro, { id: "programs-title" }),
        h("div", { class: "programs-layout" }, [
          programFeature(feats[0]),
          feats.length > 1 ? h("div", { class: "programs-stack" }, feats.slice(1).map(programRow)) : null
        ]),
        h("p", { class: "section-link" }, link("programs.html", "All programs and their status", "text-link"))
      ]));
    }

    /* community approach */
    var c = H.community || {};
    var steps = arr(c.steps).filter(function (s) { return s && has(s.title); });
    if (steps.length) {
      frag.appendChild(section("section--tint", "community-title", [
        h("div", { class: "split split--wide-left" }, [
          h("div", { class: "split__lead" }, [
            h("h2", { class: "section-title", id: "community-title", text: c.heading }),
            has(c.intro) ? h("p", { class: "lede", text: c.intro }) : null,
            has(c.statusNote) ? h("p", { class: "note-chip", text: c.statusNote }) : null
          ]),
          h("ol", { class: "path" }, steps.map(function (s) {
            return h("li", { class: "path__step" }, [h("h3", { class: "path__title", text: s.title }), has(s.body) ? h("p", { text: s.body }) : null]);
          }))
        ])
      ]));
    }

    /* impact */
    var imp = H.impact || {};
    var metrics = verifiedMetrics();
    var early = (CFG.impact && CFG.impact.earlyStageMessage) || {};
    frag.appendChild(section("", "impact-title", [
      sectionHead(imp.heading || "Impact", imp.intro, { id: "impact-title" }),
      metrics.length ? metricGrid(metrics.slice(0, 3)) : h("div", { class: "early-panel" }, [
        h("h3", { class: "early-panel__title", text: early.heading || "We're setting up our measurement process." }),
        has(early.body) ? h("p", { text: early.body }) : null,
        bulletList((CFG.impact && CFG.impact.principles || []).slice(0, 2), "list list--tight")
      ]),
      h("p", { class: "section-link" }, link("impact.html", "How we plan to measure and report", "text-link"))
    ]));

    /* leadership */
    var groups = leadershipGroups();
    if (groups.length) {
      var lead = H.leadership || {};
      frag.appendChild(section("section--tint", "lead-title", [
        sectionHead(lead.heading || "Leadership", lead.intro, { id: "lead-title" }),
        leadershipBlock(groups),
        h("p", { class: "section-link" }, link("about.html", "More about us", "text-link"))
      ]));
    }

    /* updates */
    var U = H.updates || {};
    var news = publishedNews().slice(0, typeof U.count === "number" ? U.count : 3);
    frag.appendChild(section("", "updates-title", [
      sectionHead(U.heading || "Latest updates", "", { id: "updates-title" }),
      news.length ? h("div", { class: "news-list" }, news.map(function (n) { return newsItem(n, true); })) : emptyState("No updates yet", U.emptyMessage),
      news.length ? h("p", { class: "section-link" }, link("news.html", "All news", "text-link")) : null
    ]));

    /* final CTA */
    var F = H.finalCta || {};
    if (F.enabled !== false && has(F.heading)) {
      var p1 = button(F.primaryCta, "btn--glow"), p2 = button(F.secondaryCta, "btn--line");
      frag.appendChild(h("section", { class: "section section--glow", "aria-labelledby": "final-title" }, h("div", { class: "container final" }, [
        h("h2", { class: "final__title", id: "final-title", text: F.heading }),
        has(F.body) ? h("p", { class: "final__body", text: F.body }) : null,
        (p1 || p2) ? h("div", { class: "actions" }, [p1, p2]) : null
      ])));
    }
    return frag;
  }

  function metricGrid(list) {
    return h("ul", { class: "metrics" }, list.map(function (m) {
      var report = has(m.reportUrl) ? link(m.reportUrl, "Read the full report", "text-link") : null;
      return h("li", { class: "metric" }, [
        h("p", { class: "metric__value" }, [m.value, has(m.unit) ? h("span", { class: "metric__unit", text: " " + m.unit }) : null]),
        h("h3", { class: "metric__name", text: m.name }),
        has(m.explanation) ? h("p", { text: m.explanation }) : null,
        h("dl", { class: "facts facts--small" }, (function () {
          var dl = document.createDocumentFragment();
          dlRow(dl, "Period", m.reportingPeriod);
          dlRow(dl, "How measured", m.measurementMethod);
          dlRow(dl, "Last updated", fmtDate(m.lastUpdated));
          return dl;
        })()),
        report ? h("p", null, report) : null
      ]);
    }));
  }

  /* ---------- page: about ---------- */

  function renderAbout() {
    var A = CFG.about || {};
    var frag = document.createDocumentFragment();
    frag.appendChild(pageHero("About " + orgName(), A.intro));

    frag.appendChild(section("", "mv-title", [
      h("h2", { class: "visually-hidden", id: "mv-title", text: "Mission and vision" }),
      h("div", { class: "mv" }, [
        has(ORG.mission) ? h("div", { class: "mv__block" }, [h("h3", { class: "mv__label", text: "Mission" }), h("p", { class: "mv__text", text: ORG.mission })]) : null,
        has(ORG.vision) ? h("div", { class: "mv__block mv__block--vision" }, [h("h3", { class: "mv__label", text: "Vision" }), h("p", { class: "mv__text", text: ORG.vision })]) : null
      ]),
      has(ORG.description) ? h("p", { class: "lede lede--wide", text: ORG.description }) : null
    ]));

    var values = arr(A.values).filter(function (v) { return v && has(v.title); });
    if (values.length) {
      frag.appendChild(section("section--tint", "values-title", [
        sectionHead("What we believe", "", { id: "values-title" }),
        h("ul", { class: "values values--page" }, values.map(function (v) {
          return h("li", { class: "values__item" }, [h("h3", { class: "values__title", text: v.title }), has(v.body) ? h("p", { text: v.body }) : null]);
        }))
      ]));
    }

    var fs = A.foundingStory || {};
    if (fs.published === true && arr(fs.paragraphs).filter(has).length) {
      frag.appendChild(section("", "story-title", [
        h("div", { class: "narrow" }, [
          h("h2", { class: "section-title", id: "story-title", text: fs.heading || "Why we started" }),
          h("p", { class: "note-chip", text: "In the founders' own words. This is personal motivation, separate from our formal mission above." }),
          h("div", { class: "prose" }, paragraphs(fs.paragraphs))
        ])
      ]));
    }

    var wh = A.whereWeAre || {};
    var st = ORG.status || {};
    var legalBits = [];
    if (ORG.legal && has(ORG.legal.registrationInfo)) legalBits.push(["Registration", ORG.legal.registrationInfo]);
    if (ORG.legal && has(ORG.legal.taxExemptStatus)) legalBits.push(["Tax status", ORG.legal.taxExemptStatus]);
    if (has(ORG.foundedYear)) legalBits.push(["Founded", ORG.foundedYear]);
    if (has(CONTACT.serviceArea)) legalBits.push(["Where we focus", CONTACT.serviceArea]);
    var facts = h("dl", { class: "facts" });
    dlRow(facts, "Stage", st.label);
    legalBits.forEach(function (b) { dlRow(facts, b[0], b[1]); });
    var done = arr(wh.completedWork).filter(has);
    frag.appendChild(section(values.length ? "" : "section--tint", "status-title", [
      h("div", { class: "split" }, [
        h("div", { class: "split__lead" }, [
          h("h2", { class: "section-title", id: "status-title", text: wh.heading || "Where we are today" }),
          has(st.summary) ? h("p", { class: "lede", text: st.summary }) : null
        ]),
        h("div", { class: "split__aside" }, [
          facts,
          h("h3", { class: "mini-title", text: "Completed so far" }),
          done.length ? bulletList(done) : h("p", { class: "muted", text: "No completed milestones to report yet." })
        ])
      ])
    ]));

    var groups = leadershipGroups();
    if (groups.length) {
      frag.appendChild(section("section--tint", "leader-title", [
        sectionHead("Leadership", (CFG.home && CFG.home.leadership && CFG.home.leadership.intro) || "", { id: "leader-title" }),
        leadershipBlock(groups)
      ]));
    }

    var partners = partnersBlock();
    if (partners) frag.appendChild(partners);
    var faq = faqBlock();
    if (faq) frag.appendChild(faq);
    return frag;
  }

  /* ---------- page: programs ---------- */

  function renderPrograms() {
    var frag = document.createDocumentFragment();
    frag.appendChild(pageHero("Programs", "What we are working toward. Every program is labeled with its real status."));
    var list = visiblePrograms();
    var key = h("div", { class: "status-key" }, [
      h("p", { class: "status-key__title", text: "What the labels mean" }),
      h("ul", null, [
        h("li", null, [statusBadge("planning"), " An idea we are developing. Nothing to join yet."]),
        h("li", null, [statusBadge("active"), " Running now. Details say how to take part."]),
        h("li", null, [statusBadge("paused"), " Not running at the moment."]),
        h("li", null, [statusBadge("completed"), " Finished. Results appear only if verified."])
      ])
    ]);
    if (!list.length) {
      frag.appendChild(section("", "no-programs", [h("h2", { class: "visually-hidden", id: "no-programs", text: "Programs" }), emptyState("No programs to show yet", "When programs are ready to share, they will be listed here with their status.")]));
      return frag;
    }
    frag.appendChild(section("section--tight", "key-title", [h("h2", { class: "visually-hidden", id: "key-title", text: "Status labels" }), key]));
    frag.appendChild(h("div", { class: "program-list" }, list.map(function (p) {
      return h("div", { class: "program-wrap" }, h("div", { class: "container" }, programDetail(p)));
    })));
    return frag;
  }

  /* ---------- page: impact ---------- */

  function renderImpact() {
    var I = CFG.impact || {};
    var frag = document.createDocumentFragment();
    frag.appendChild(pageHero("Impact", I.intro));

    var metrics = verifiedMetrics();
    var early = I.earlyStageMessage || {};
    frag.appendChild(section("", "results-title", [
      sectionHead("Verified results", "", { id: "results-title" }),
      metrics.length ? metricGrid(metrics) : h("div", { class: "early-panel" }, [
        h("h3", { class: "early-panel__title", text: early.heading || "We're setting up our measurement process." }),
        has(early.body) ? h("p", { text: early.body }) : null
      ])
    ]));

    if (arr(I.principles).filter(has).length) {
      frag.appendChild(section("section--dark", "principles-title", [
        h("div", { class: "split" }, [
          h("div", { class: "split__lead" }, h("h2", { class: "section-title", id: "principles-title", text: "How we will treat numbers" })),
          h("div", { class: "split__aside" }, bulletList(I.principles, "list list--light"))
        ])
      ]));
    }

    if (arr(I.goals).filter(has).length) {
      frag.appendChild(section("", "goals-title", [
        sectionHead(I.goalsHeading || "Goals", "", { id: "goals-title" }),
        has(I.goalsNote) ? h("p", { class: "note-chip", text: I.goalsNote }) : null,
        h("div", { class: "goals" }, bulletList(I.goals, "list list--goals"))
      ]));
    }

    var ledger = statLedger();
    if (ledger) {
      frag.appendChild(section("section--tint", "context-title", [
        sectionHead("National context", (CFG.home && CFG.home.problem && CFG.home.problem.statsNote) || "", { id: "context-title" }),
        ledger
      ]));
    }

    var acts = arr(I.completedActivities).filter(function (a) { return a && has(a.text); });
    var lessons = arr(I.lessons).filter(function (l) { return l && has(l.title); });
    frag.appendChild(section("", "done-title", [
      h("div", { class: "two-col" }, [
        h("div", null, [
          h("h2", { class: "section-title section-title--sm", id: "done-title", text: "Completed activities" }),
          acts.length ? h("ul", { class: "timeline" }, acts.map(function (a) {
            return h("li", null, [has(a.date) ? h("span", { class: "timeline__date", text: fmtDate(a.date) || a.date }) : null, h("span", { text: a.text })]);
          })) : h("p", { class: "muted", text: "None yet. We will list real, completed activities here." })
        ]),
        h("div", null, [
          h("h2", { class: "section-title section-title--sm", text: "Lessons learned" }),
          lessons.length ? lessons.map(function (l) { return h("div", { class: "lesson" }, [h("h3", { text: l.title }), has(l.body) ? h("p", { text: l.body }) : null]); }) : h("p", { class: "muted", text: "None yet. We will share what we learn, including what does not work." })
        ])
      ])
    ]));

    var reports = arr(I.reports).filter(function (r) { return r && has(r.title); })
      .slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    frag.appendChild(section("section--tint", "reports-title", [
      sectionHead("Report archive", "", { id: "reports-title" }),
      reports.length ? h("ul", { class: "reports" }, reports.map(function (r) {
        var l = has(r.url) ? link(r.url, r.title, "text-link") : null;
        return h("li", null, [
          h("h3", null, l || r.title),
          has(r.date) ? h("p", { class: "muted", text: fmtDate(r.date) || r.date }) : null,
          has(r.summary) ? h("p", { text: r.summary }) : null
        ]);
      })) : emptyState("No reports yet", "Reports will be listed here, newest first, as we publish them.")
    ]));
    return frag;
  }

  /* ---------- page: resources ---------- */

  function resourceCard(entry) {
    var r = entry.item;
    var facts = h("dl", { class: "facts facts--small" });
    dlRow(facts, "Service area", r.serviceArea);
    dlRow(facts, "Cost", r.cost);
    dlRow(facts, "Eligibility", r.eligibility);
    dlRow(facts, "Intended for", r.audience);
    var phoneHref = safeUrl(r.phoneHref) || (has(r.phone) && /^[0-9+()\-\s.]+$/.test(r.phone) ? "tel:" + r.phone.replace(/[^0-9+]/g, "") : "");
    var phone = has(r.phone) ? (phoneHref ? link(phoneHref, "Call " + r.phone, "btn btn--solid btn--sm") : h("span", { text: r.phone })) : null;
    var site = has(r.website) ? link(r.website, "Visit website", "btn btn--line-dark btn--sm") : null;
    return h("article", { class: "resource" }, [
      h("h3", { class: "resource__name", text: r.name }),
      has(r.provider) ? h("p", { class: "resource__provider", text: r.provider }) : null,
      has(r.description) ? h("p", { text: r.description }) : null,
      bulletList(r.extra, "list list--tight"),
      facts,
      (phone || site) ? h("div", { class: "actions actions--tight" }, [phone, site]) : null,
      h("p", { class: "resource__verified" }, "Last verified " + fmtDate(r.lastVerified) + "."),
      entry.stale ? h("p", { class: "resource__stale", text: "This entry has not been re-checked recently. Please confirm details with the provider before relying on it." }) : null
    ]);
  }

  function renderResources() {
    var R = CFG.resources || {};
    var frag = document.createDocumentFragment();
    frag.appendChild(pageHero("Resources and crisis support", R.intro));
    var box = crisisBox({ id: "crisis", title: "If you need help right now", level: "h2" });
    if (box) frag.appendChild(h("section", { class: "section section--tight section--crisis", "aria-label": "Crisis support" }, h("div", { class: "container" }, box)));

    var entries = visibleResources();
    var cats = arr(R.categories);
    frag.appendChild(section("", "dir-title", [
      sectionHead("Directory of verified resources", R.directoryNote, { id: "dir-title" }),
      h("p", { class: "note-chip", text: "Informational only. This directory does not replace professional care, and listing a resource is not an endorsement of any individual treatment." }),
      cats.map(function (c) {
        var list = entries.filter(function (e) { return e.item.category === c.key; });
        return h("div", { class: "res-cat", id: "cat-" + c.key }, [
          h("h3", { class: "res-cat__title", text: c.label }),
          has(c.blurb) ? h("p", { class: "muted", text: c.blurb }) : null,
          list.length ? h("div", { class: "resources" }, list.map(resourceCard)) : h("p", { class: "res-cat__empty", text: R.emptyCategoryMessage || "No verified resources yet." })
        ]);
      })
    ]));
    return frag;
  }

  /* ---------- page: get involved ---------- */

  function renderGetInvolved() {
    var G = CFG.getInvolved || {};
    var frag = document.createDocumentFragment();
    frag.appendChild(pageHero("Get involved", G.intro));
    var haveEmail = has(CONTACT.email);
    var items = arr(G.sections).filter(function (s) { return s && s.enabled !== false && has(s.heading); });
    frag.appendChild(section("", "ways-title", [
      h("h2", { class: "visually-hidden", id: "ways-title", text: "Ways to get involved" }),
      h("div", { class: "ways" }, items.map(function (s) {
        var btn = button(s.cta, "btn--solid");
        return h("article", { class: "way", id: s.id || null }, [
          h("h3", { class: "way__title", text: s.heading }),
          has(s.body) ? h("p", { text: s.body }) : null,
          btn ? h("p", null, btn) : (haveEmail ? null : h("p", { class: "muted", text: G.noContactNote || "" }))
        ]);
      }))
    ]));

    var D = G.donations || {};
    var donateBtn = D.acceptingDonations === true && safeUrl(D.donateUrl) ? link(D.donateUrl, "Donate", "btn btn--solid") : null;
    if (D.acceptingDonations === true && !donateBtn) warn("getInvolved.donations.acceptingDonations is true but donateUrl is empty or invalid, so donations are hidden.");
    var showDonations = donateBtn || (D.acceptingDonations !== true && has(D.notice));
    if (showDonations) {
      var taxOk = ORG.legal && ORG.legal.taxDeductibleVerified === true && has(D.taxNote);
      frag.appendChild(section("section--tint", "donate-title", [
        h("div", { class: "narrow" }, [
          h("h2", { class: "section-title", id: "donate-title", text: D.heading || "Donations" }),
          donateBtn ? [h("p", { text: D.acceptingBody }), taxOk ? h("p", { class: "muted", text: D.taxNote }) : null, h("p", null, donateBtn)] : h("p", { class: "lede", text: D.notice })
        ])
      ]));
    }
    var partners = partnersBlock();
    if (partners) frag.appendChild(partners);
    return frag;
  }

  /* ---------- page: news ---------- */

  function newsItem(n, compact) {
    var img = !compact && has(n.image) ? safeImg(n.image, n.imageAlt, "news__img") : null;
    var ext = n.link && has(n.link.label) ? link(n.link.url, n.link.label, "text-link") : null;
    return h("article", { class: "news" + (compact ? " news--compact" : ""), id: compact ? null : n.id }, [
      h("p", { class: "news__meta" }, [
        h("time", { datetime: n.date, text: fmtDate(n.date) || n.date }),
        has(n.category) ? h("span", { class: "news__cat", text: n.category }) : null
      ]),
      h("h3", { class: "news__title", text: n.title }),
      has(n.summary) ? h("p", { class: "news__summary", text: n.summary }) : null,
      img ? h("figure", { class: "news__fig" }, img) : null,
      !compact && arr(n.body).filter(has).length ? h("div", { class: "prose" }, paragraphs(n.body)) : null,
      ext ? h("p", null, ext) : null,
      compact ? h("p", null, link("news.html#" + encodeURIComponent(n.id), "Read this update", "text-link")) : null
    ]);
  }

  function renderNews() {
    var N = CFG.news || {};
    var frag = document.createDocumentFragment();
    frag.appendChild(pageHero("News", N.intro));
    var list = publishedNews();
    frag.appendChild(section("", "news-title", [
      h("h2", { class: "visually-hidden", id: "news-title", text: "Published updates" }),
      list.length ? h("div", { class: "news-list news-list--page" }, list.map(function (n) { return newsItem(n, false); })) : emptyState("No updates yet", N.emptyMessage)
    ]));
    return frag;
  }

  /* ---------- page: contact ---------- */

  function renderContact() {
    var P = CFG.contactPage || {};
    var frag = document.createDocumentFragment();
    frag.appendChild(pageHero("Contact", P.intro));

    var methods = [];
    if (has(CONTACT.email)) methods.push(["Email", link("mailto:" + CONTACT.email.trim(), CONTACT.email.trim(), "text-link")]);
    if (has(CONTACT.phone)) methods.push(["Phone", link("tel:" + CONTACT.phone.replace(/[^0-9+]/g, ""), CONTACT.phone, "text-link")]);
    if (has(CONTACT.mailingAddress)) methods.push(["Mailing address", CONTACT.mailingAddress]);
    if (has(CONTACT.serviceArea)) methods.push(["Area we focus on", CONTACT.serviceArea]);
    arr(ORG.social).forEach(function (s) {
      if (s && has(s.label) && safeUrl(s.url)) methods.push([s.label, link(s.url, s.label, "text-link")]);
    });
    var hasDirect = has(CONTACT.email) || has(CONTACT.phone) || has(CONTACT.mailingAddress);

    frag.appendChild(section("", "ways-title", [
      h("div", { class: "split" }, [
        h("div", { class: "split__lead" }, [
          h("h2", { class: "section-title", id: "ways-title", text: "How to reach us" }),
          methods.length && hasDirect ? h("dl", { class: "contact-list" }, methods.map(function (m) {
            return h("div", { class: "contact-list__row" }, [h("dt", { text: m[0] }), h("dd", null, m[1])]);
          })) : h("div", null, [emptyState("Contact details are not posted yet", P.noContactMessage), h("p", null, link("resources.html", "Go to resources", "text-link"))]),
          has(P.responseNote) ? h("p", { class: "muted", text: P.responseNote }) : null
        ]),
        h("div", { class: "split__aside" }, [
          h("div", { class: "callout callout--warn" }, [
            h("h3", { class: "callout__title", text: "Please keep it general" }),
            h("p", { text: P.safetyNote })
          ]),
          crisisBox({ compact: true, title: "Need support now?", level: "h3" })
        ])
      ])
    ]));

    var V = CFG.privacy || {};
    frag.appendChild(section("section--tint", "privacy", [
      h("div", { class: "narrow" }, [
        h("h2", { class: "section-title", id: "privacy", text: V.heading || "Privacy notice" }),
        bulletList(V.points),
        link(V.hostPrivacyUrl, V.hostPrivacyLabel || "Host privacy statement", "text-link") ? h("p", null, link(V.hostPrivacyUrl, V.hostPrivacyLabel || "Host privacy statement", "text-link")) : null,
        parseDate(V.updated) ? h("p", { class: "muted", text: "Last updated " + fmtDate(V.updated) + "." }) : null
      ])
    ]));
    return frag;
  }

  /* ---------- page: not found ---------- */

  function renderNotFound() {
    var frag = document.createDocumentFragment();
    frag.appendChild(h("section", { class: "page-hero page-hero--lost" }, h("div", { class: "container" }, [
      h("h1", { class: "page-hero__title", text: "We couldn't find that page." }),
      h("p", { class: "page-hero__intro", text: "The link may be old or mistyped. These places should help." }),
      h("div", { class: "actions" }, [
        link("index.html", "Go to the homepage", "btn btn--glow"),
        link("resources.html", "Resources and crisis support", "btn btn--line")
      ])
    ])));
    var box = crisisBox({ title: "If you need help right now", level: "h2" });
    if (box) frag.appendChild(h("section", { class: "section section--tight section--crisis", "aria-label": "Crisis support" }, h("div", { class: "container" }, box)));
    frag.appendChild(section("", "lost-title", [
      h("h2", { class: "section-title section-title--sm", id: "lost-title", text: "Pages" }),
      h("ul", { class: "lost-links" }, arr(CFG.navigation && CFG.navigation.items).map(function (i) {
        return h("li", null, link(i.href, i.label, "text-link"));
      }))
    ]));
    return frag;
  }

  /* ---------- shared: crisis strip, header, footer ---------- */

  function renderStrip() {
    var C = CFG.crisis || {};
    var host = document.getElementById("crisis-strip");
    if (!host || C.enabled === false) return;
    host.className = "crisis-strip";
    host.setAttribute("role", "region");
    host.setAttribute("aria-label", "Crisis support");
    host.appendChild(h("div", { class: "container crisis-strip__inner" }, [
      h("p", { class: "crisis-strip__text" }, [
        h("strong", { text: C.stripText || "In crisis? Call or text 988 (U.S.)." }),
        has(C.stripSubtext) ? " " + C.stripSubtext : null
      ]),
      h("a", { class: "crisis-strip__link", href: "resources.html#crisis", text: "More ways to get help" })
    ]));
  }

  function renderHeader() {
    var host = document.getElementById("site-header");
    if (!host) return;
    host.className = "site-header";
    var items = arr(CFG.navigation && CFG.navigation.items).filter(function (i) { return i && has(i.label) && safeUrl(i.href); });
    var nav = h("nav", { class: "nav", id: "primary-nav", "aria-label": "Main" }, h("ul", { class: "nav__list" }, items.map(function (i) {
      var cur = i.id === PAGE;
      return h("li", null, h("a", { class: "nav__link", href: safeUrl(i.href), "aria-current": cur ? "page" : null, text: i.label }));
    })));
    var cta = CFG.navigation && resolveAction(CFG.navigation.cta);
    var C = CFG.crisis || {};
    var logo = has(ORG.logo) ? safeImg(ORG.logo, "", "brand__mark", 40, 40) : null;
    if (logo) logo.removeAttribute("loading");
    var toggle = h("button", { class: "menu-toggle", type: "button", "aria-expanded": "false", "aria-controls": "primary-nav" }, [
      h("span", { class: "menu-toggle__bars", "aria-hidden": "true" }),
      h("span", { class: "menu-toggle__label", text: "Menu" })
    ]);
    host.appendChild(h("div", { class: "container site-header__bar" }, [
      h("a", { class: "brand", href: "index.html" }, [logo, h("span", { class: "brand__name", text: ORG.shortName || orgName() })]),
      nav,
      h("div", { class: "site-header__actions" }, [
        C.enabled === false ? null : h("a", { class: "pill-988", href: "tel:988", "aria-label": "Call or text 988, the Suicide and Crisis Lifeline" }, [h("span", { class: "pill-988__dot", "aria-hidden": "true" }), "988"]),
        cta ? link(cta.href, cta.label, "btn btn--solid btn--sm site-header__cta") : null,
        toggle
      ])
    ]));

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.querySelector(".menu-toggle__label").textContent = open ? "Close" : "Menu";
    }
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
    });
    nav.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) setOpen(false); });
  }

  function renderFooter() {
    var host = document.getElementById("site-footer");
    if (!host) return;
    host.className = "site-footer";
    var items = arr(CFG.navigation && CFG.navigation.items).filter(function (i) { return i && has(i.label) && safeUrl(i.href); });
    var C = CFG.crisis || {};
    var st = ORG.status || {};
    var contactBits = [];
    if (has(CONTACT.email)) contactBits.push(h("li", null, link("mailto:" + CONTACT.email.trim(), CONTACT.email.trim())));
    if (has(CONTACT.phone)) contactBits.push(h("li", null, link("tel:" + CONTACT.phone.replace(/[^0-9+]/g, ""), CONTACT.phone)));
    if (has(CONTACT.mailingAddress)) contactBits.push(h("li", { text: CONTACT.mailingAddress }));
    if (has(CONTACT.serviceArea)) contactBits.push(h("li", { text: "Focus area: " + CONTACT.serviceArea }));
    arr(ORG.social).forEach(function (s) { if (s && has(s.label) && safeUrl(s.url)) contactBits.push(h("li", null, link(s.url, s.label))); });
    var logo = has(ORG.logo) ? safeImg(ORG.logo, "", "brand__mark", 40, 40) : null;
    var legal = [];
    if (ORG.legal && has(ORG.legal.registrationInfo)) legal.push(ORG.legal.registrationInfo);
    if (ORG.legal && has(ORG.legal.taxExemptStatus)) legal.push(ORG.legal.taxExemptStatus);

    host.appendChild(h("div", { class: "container" }, [
      h("div", { class: "footer-grid" }, [
        h("div", { class: "footer-brand" }, [
          h("a", { class: "brand brand--footer", href: "index.html" }, [logo, h("span", { class: "brand__name", text: orgName() })]),
          has(ORG.tagline) ? h("p", { class: "footer-tagline", text: ORG.tagline }) : null,
          has(ORG.mission) ? h("p", { class: "footer-mission", text: ORG.mission }) : null,
          has(st.label) ? h("p", { class: "footer-status" }, [h("strong", { text: st.label + ". " }), legal.length ? legal.join(" ") : "Not yet registered or tax-exempt as far as we have confirmed."]) : null
        ]),
        h("nav", { class: "footer-col", "aria-label": "Footer" }, [h("h2", { class: "footer-col__title", text: "Explore" }), h("ul", null, items.map(function (i) { return h("li", null, link(i.href, i.label)); }))]),
        contactBits.length ? h("div", { class: "footer-col" }, [h("h2", { class: "footer-col__title", text: "Contact" }), h("ul", null, contactBits)]) : null,
        C.enabled === false ? null : h("div", { class: "footer-col footer-col--help" }, [
          h("h2", { class: "footer-col__title", text: "Need help now?" }),
          h("p", null, [h("a", { class: "footer-988", href: "tel:988", text: "Call or text 988" })]),
          has(C.emergencyNote) ? h("p", { text: C.emergencyNote }) : null,
          has(C.notEmergencyService) ? h("p", { class: "footer-small", text: C.notEmergencyService }) : null,
          h("p", null, link("resources.html#crisis", "More crisis resources"))
        ])
      ]),
      h("div", { class: "footer-bottom" }, [
        h("p", { text: "© " + new Date().getFullYear() + " " + orgName() + "." }),
        h("p", null, [link("contact.html#privacy", "Privacy notice"), " · Not a medical or crisis service."])
      ])
    ]));
  }

  /* ---------- theme + head ---------- */

  function applyTheme() {
    var c = ORG.colors || {};
    var root = document.documentElement.style;
    if (isHex(c.primary)) {
      root.setProperty("--ink", c.primary);
      root.setProperty("--ink-2", mix(c.primary, "#FFFFFF", 0.08));
      root.setProperty("--ink-3", mix(c.primary, "#FFFFFF", 0.16));
    }
    if (isHex(c.accent)) {
      root.setProperty("--accent", c.accent);
      root.setProperty("--accent-light", mix(c.accent, "#FFFFFF", 0.55));
      root.setProperty("--accent-tint", mix(c.accent, "#FFFFFF", 0.9));
    }
    if (isHex(c.glow)) {
      root.setProperty("--glow", c.glow);
      root.setProperty("--glow-soft", mix(c.glow, "#FFFFFF", 0.82));
    }
  }

  function setMeta(selector, attr, value) {
    var el = document.querySelector(selector);
    if (el && has(value)) el.setAttribute(attr, value);
  }

  function applyHead() {
    var p = (CFG.pages && CFG.pages[PAGE]) || {};
    var name = orgName();
    var title = PAGE === "home" ? (has(p.title) ? p.title : name) + (has(ORG.tagline) ? ": " + ORG.tagline : "")
      : (has(p.title) ? p.title : document.title) + " | " + name;
    document.title = title;
    var desc = has(p.description) ? p.description : ORG.description;
    setMeta('meta[name="description"]', "content", desc);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:site_name"]', "content", name);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", desc);
    if (has(ORG.favicon) && safeUrl(ORG.favicon)) setMeta('link[rel="icon"]', "href", safeUrl(ORG.favicon));
    if (isHex(ORG.colors && ORG.colors.primary)) setMeta('meta[name="theme-color"]', "content", ORG.colors.primary);
    if (has(ORG.siteUrl) && !document.querySelector('link[rel="canonical"]') && PAGE !== "not-found") {
      try {
        var base = String(ORG.siteUrl).replace(/\/+$/, "") + "/";
        var file = (location.pathname.split("/").pop() || "index.html");
        var known = arr(CFG.navigation && CFG.navigation.items).some(function (i) { return i.href === file; });
        var href = new URL(known && file !== "index.html" ? file : "", base).href;
        document.head.appendChild(h("link", { rel: "canonical", href: href }));
      } catch (e) { warn("organization.siteUrl is not a valid URL."); }
    }
  }

  /* ---------- boot ---------- */

  var RENDERERS = {
    home: renderHome, about: renderAbout, programs: renderPrograms, impact: renderImpact,
    resources: renderResources, "get-involved": renderGetInvolved, news: renderNews,
    contact: renderContact, "not-found": renderNotFound
  };

  function boot() {
    PAGE = (document.body && document.body.getAttribute("data-page")) || "home";
    var main = document.getElementById("main");
    if (!CFG || typeof CFG !== "object") {
      if (window.console) console.error("[Your Dudes] site-config.js did not load or has a syntax error. Open the browser console for details.");
      if (main) {
        main.appendChild(h("div", { class: "container fallback" }, [
          h("h1", { text: "This page could not load its content." }),
          h("p", { text: "If you are in crisis or worried about your safety, call or text 988 (U.S.). If someone is in immediate danger, call 911." }),
          h("p", null, [link("index.html", "Go to the homepage"), " or ", link("resources.html", "see resources"), "."])
        ]));
      }
      return;
    }
    validate();
    applyTheme();
    applyHead();
    renderStrip();
    renderHeader();
    var render = RENDERERS[PAGE];
    if (main && render) {
      var fb = main.querySelector("[data-fallback]");
      if (fb) fb.parentNode.removeChild(fb);
      main.appendChild(render());
    }
    renderFooter();
    document.documentElement.classList.add("is-ready");
    window.__YOUR_DUDES__ = { warnings: warnings, page: PAGE };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
