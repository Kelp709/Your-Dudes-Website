/* =============================================================================
   YOUR DUDES: SITE CONFIGURATION
   =============================================================================
   This is the ONE file you edit to change what the website says.
   You should not need to touch any HTML, CSS, or main.js for normal updates.

   HOW TO EDIT SAFELY (read this once)
   -----------------------------------
   1. Keep the quotes. Every piece of text lives inside "double quotes".
   2. Keep the commas. Every item in a list or object ends with a comma
      (a comma after the last item is fine).
   3. Keep brackets matched:  [ ... ] is a list,  { ... } is one item.
   4. If a quote appears INSIDE your text, write \" or use a typographic
      quote. Example:  "She said \"hello\"."
   5. A line starting with // is a comment. The site ignores it.
   6. Leave a value as "" (empty quotes) to hide it. The site never shows
      empty fields.
   7. After editing, open the site in a browser and press F12 > Console.
      Any mistake in the config shows up as a "[Your Dudes config]" warning.

   LEGEND
   ------
   REQUIRED  = the site needs this to look right.
   OPTIONAL  = leave "" or [] to hide it.
   VERIFIED  = only fill in when you have confirmed it is true.

   RULES THIS SITE FOLLOWS (please keep following them)
   ----------------------------------------------------
   - Never present a planned program as running. Use status "planning" until
     it really happens.
   - Never list a partner, board member, credential, statistic, or testimonial
     you cannot document.
   - Never claim nonprofit or tax-exempt status until it is confirmed.
   ============================================================================= */

window.SITE_CONFIG = {

  /* ===========================================================================
     A. ORGANIZATION
     =========================================================================== */
  organization: {
    // REQUIRED. Provisional working name and tagline. Change anytime.
    name: "Your Dudes",
    shortName: "Your Dudes",
    tagline: "You don't have to figure it out alone.",

    // REQUIRED. Mission is drawn from the founders' planning notes.
    mission:
      "To help young men dealing with depression, anxiety, loneliness, or other mental health challenges find real connection, trusted resources, and appropriate support before things reach a crisis.",

    // REQUIRED. PROVISIONAL wording. Founders should review and rewrite.
    vision:
      "A community where reaching out for support is ordinary, welcomed, and met with real help.",

    // REQUIRED. Short description used for search results and sharing.
    description:
      "Your Dudes is a developing community initiative focused on men's mental health outreach, suicide prevention, and helping people access support.",

    // OPTIONAL. Four-digit year as text, or "" to hide.
    foundedYear: "",

    // Paths are relative to the site root. Do not start them with "/".
    // The logo mark is shown next to the name in the header and footer.
    logo: "assets/images/logo-mark.svg",
    favicon: "assets/icons/favicon.svg",
    // OPTIONAL. Image shown when links are shared (see README, "Social preview").
    // Use a PNG or JPG about 1200x630 for best results across platforms.
    socialImage: "assets/images/social-preview.png",

    // REQUIRED. Brand colors as 6-digit hex values. The whole site restyles.
    //  primary: deep dark color (header, dark sections)
    //  accent:  teal used for links and highlights on light backgrounds
    //  glow:    warm "porch light" color used sparingly for emphasis
    colors: {
      primary: "#0E1A2B",
      accent: "#1B6F66",
      glow: "#F2B04A"
    },

    // OPTIONAL contact details. Leave "" until you have a PUBLIC address you
    // are comfortable publishing. Do not use a personal or home address.
    // Pages hide any contact option that is empty.
    contact: {
      email: "",          // e.g. "hello@example.org"
      phone: "",          // e.g. "+1 555 555 0100" (only if monitored)
      serviceArea: "",    // e.g. "Name of your city or county"
      mailingAddress: ""  // only if you have a public organizational address
    },

    // OPTIONAL. Full public URL of the site, no trailing slash, e.g.
    // "https://yourname.github.io/your-repo" or "https://yourdudes.org".
    // Used for canonical links and sharing. See README for tools/update-meta.js.
    siteUrl: "",

    // OPTIONAL. Add only accounts you actually run and monitor.
    // Each: { label: "Instagram", url: "https://www.instagram.com/yourhandle" }
    social: [],

    // REQUIRED. Be honest. This text is shown on the About page and footer.
    // stage must be one of: "planning", "forming", "registered", "established"
    status: {
      stage: "planning",
      label: "Early planning stage",
      summary:
        "Your Dudes is a developing community initiative. Our organizational registration and tax-exempt status have not been established or confirmed, and our programs are still being planned. We will update this page as that changes."
    },

    // OPTIONAL legal facts. Fill ONLY when verified with official documents.
    legal: {
      registrationInfo: "",        // e.g. "Registered nonprofit corporation in [State], ID 000000"
      taxExemptStatus: "",         // e.g. "Recognized as tax-exempt under section 501(c)(3), EIN ..."
      taxDeductibleVerified: false // set true only if donations are verified deductible
    }
  },

  /* ===========================================================================
     NAVIGATION
     =========================================================================== */
  navigation: {
    // The nine core pages. You can rename the label. Keep "href" values.
    items: [
      { id: "home", label: "Home", href: "index.html" },
      { id: "about", label: "About", href: "about.html" },
      { id: "programs", label: "Programs", href: "programs.html" },
      { id: "impact", label: "Impact", href: "impact.html" },
      { id: "resources", label: "Resources", href: "resources.html" },
      { id: "get-involved", label: "Get Involved", href: "get-involved.html" },
      { id: "news", label: "News", href: "news.html" },
      { id: "contact", label: "Contact", href: "contact.html" }
    ],
    // OPTIONAL call-to-action button in the header. Set label to "" to hide.
    cta: { label: "Find support", href: "resources.html" }
  },

  /* ===========================================================================
     CRISIS SUPPORT (shown on every page)
     VERIFIED against SAMHSA and 988 Lifeline materials on 2026-10-18.
     Re-check at https://988lifeline.org every few months and update the date.
     =========================================================================== */
  crisis: {
    enabled: true,   // keep true
    lastVerified: "2026-10-18",
    stripText: "In crisis or worried about your safety? Call or text 988 (U.S.).",
    stripSubtext: "If someone is in immediate danger, call 911.",
    notEmergencyService:
      "This website is not an emergency service. Nobody here monitors messages, so please do not use it to ask for urgent help.",
    lines: [
      { label: "Call 988", href: "tel:988", detail: "24/7, free, confidential support from trained crisis counselors" },
      { label: "Text 988", href: "sms:988", detail: "Text-based crisis support" },
      { label: "Chat at 988lifeline.org", href: "https://988lifeline.org/chat", detail: "Online chat with a crisis counselor" }
    ],
    emergencyNote:
      "If you or someone else is in immediate danger, call 911 or go to the nearest emergency room.",
    veteransNote: "Veterans and service members can call 988 and press 1 to reach the Veterans Crisis Line.",
    spanishNote: "When calling 988, press 2 for Spanish.",
    officialUrl: "https://988lifeline.org",
    officialLabel: "988lifeline.org"
  },

  /* ===========================================================================
     B. HOME PAGE
     Featured programs and updates are PULLED from the lists further down.
     =========================================================================== */
  home: {
    hero: {
      headline: "You don't have to figure it out alone.",
      subtitle:
        "Your Dudes is a new community initiative working toward mental health support that young men can actually reach: real connection, trusted resources, and help before a crisis.",
      image: "assets/images/hero-art.svg",
      imageAlt:
        "Illustration of two people sitting side by side on a bench in a lit doorway, with a lamp glowing above them.",
      primaryCta: { label: "Find support now", href: "resources.html" },
      secondaryCta: { label: "See what we're building", href: "programs.html" }
    },

    mission: {
      heading: "Strength looks like having people in your corner.",
      intro:
        "We believe life is precious and everyone deserves support. We want asking for help to feel normal, practical, and free of shame."
    },

    problem: {
      heading: "Many young men carry it quietly.",
      body: [
        "Depression, anxiety, and loneliness do not always look the way people expect. Many young men keep struggling to themselves, and conventional mental health outreach can feel intimidating, hard to find, or meant for someone else.",
        "When support feels out of reach, problems can grow unseen. We want to help people find a path to support earlier, in places and conversations that feel familiar."
      ],
      statsHeading: "National context",
      statsNote:
        "These figures describe the United States as a whole. They are not results of our work, and they do not predict what will happen to any one person."
    },

    // ids from the "programs" list below. Missing ids are ignored.
    featuredProgramIds: ["trusted-spaces", "community-activities", "care-access"],
    programsHeading: "What we're planning",
    programsIntro:
      "These are ideas under development, not services you can sign up for today. We will not advertise them as available until partners, safeguards, funding, and operating plans are in place.",

    community: {
      heading: "How we hope to work with our community",
      intro:
        "We are not trying to replace professional care. The idea is to be a friendly, trustworthy step toward it, built together with local people and qualified professionals.",
      // A real sequence, so steps are numbered. Keep to 3 to 5 steps.
      steps: [
        {
          title: "Recognize",
          body: "Help people in everyday places notice when someone may be struggling, without turning friends into therapists."
        },
        {
          title: "Reach out",
          body: "Make starting a conversation feel natural, through shared activities and people someone already trusts."
        },
        {
          title: "Connect to support",
          body: "Point toward verified, appropriate resources, including crisis lines and professional care."
        }
      ],
      statusNote: "This is our intended approach. It is not yet operating."
    },

    impact: {
      heading: "How we'll measure what matters",
      intro:
        "We would rather show a small, honest number than a large, unsupported one. Verified results will appear here once we have them."
    },

    leadership: {
      heading: "The people behind it",
      intro: "Your Dudes is being founded by two college students who want to build something lasting, starting locally."
    },

    updates: {
      heading: "Latest updates",
      emptyMessage: "Nothing to report yet. We will post here when there is something real to share.",
      count: 3
    },

    finalCta: {
      enabled: true,
      heading: "Help us get started.",
      body:
        "We are building this carefully, with the right people and safeguards. If you would like to follow along, offer experience, or talk about working together, we would like to hear from you.",
      primaryCta: { label: "See ways to get involved", href: "get-involved.html" },
      secondaryCta: { label: "Find support now", href: "resources.html" }
    }
  },

  /* ===========================================================================
     ABOUT PAGE
     =========================================================================== */
  about: {
    intro: "Who we are, what we believe, and where we honestly are today.",
    values: [
      {
        title: "Life is precious",
        body: "Every person deserves support. We speak about struggle with hope, never guilt or fear."
      },
      {
        title: "No shame in struggling",
        body: "Having a hard time does not make anyone weak. Reaching out takes courage, and we treat it that way."
      },
      {
        title: "Connection first",
        body: "Friendship and belonging protect people. We build spaces where conversation can happen naturally."
      },
      {
        title: "Right help, right place",
        body: "We connect people with qualified care and trusted resources. We do not pretend to be a clinic or crisis service."
      },
      {
        title: "Honest about who we are",
        body: "We are new. We say what is planned, what is happening, and what is proven, and we keep those separate."
      },
      {
        title: "Welcoming to everyone",
        body: "Our focus is young men, and our door is open regardless of religion, background, or personal beliefs."
      }
    ],

    // OPTIONAL founding story. The founders should write this in their own words.
    // Set published: true and add paragraphs (plain text) when ready.
    foundingStory: {
      published: false,
      heading: "Why we started",
      paragraphs: []
    },

    // Plain-language reminder shown under "where we are today".
    whereWeAre: {
      heading: "Where we are today",
      completedWork: [] // OPTIONAL. Add REAL completed milestones, e.g. "Held first planning meeting with a licensed counselor (March 2027)"
    }
  },

  /* ===========================================================================
     C. LEADERSHIP
     Each person: name, role (REQUIRED). Everything else OPTIONAL.
       { name: "", role: "", bio: "", photo: "assets/images/people/name.jpg",
         photoAlt: "", credentials: "", credentialsVerified: false,
         profileUrl: "", order: 1 }
     Credentials only display when credentialsVerified is true.
     Get permission from each person before publishing their details.
     =========================================================================== */
  leadership: {
    show: true, // set false to hide leadership everywhere
    groups: [
      { key: "founders", heading: "Founders", people: [] },
      { key: "directors", heading: "Board of directors", people: [] },
      { key: "advisors", heading: "Advisors", people: [] },
      { key: "staff", heading: "Staff", people: [] },
      { key: "volunteers", heading: "Volunteers", people: [] }
    ]
  },

  /* ===========================================================================
     D. PROGRAMS
     status must be one of: "planning", "active", "paused", "completed"
     To ADD a program, copy one object, paste it below, and give it a new id.
     To HIDE one, set published: false (or delete it).
     Never set "active" unless people can really take part today.
     =========================================================================== */
  programs: [
    {
      id: "trusted-spaces",              // REQUIRED, unique, lowercase-with-dashes
      published: true,
      name: "Trusted Spaces",
      shortDescription:
        "An idea in development: working with barbershops, gyms, and other community spaces so more people can recognize when someone may need support and know where to point them.",
      fullDescription: [
        "Many people already talk with the people they see regularly: a barber, a gym buddy, a coach. This idea explores helping those trusted spaces recognize when someone may be struggling and direct them to appropriate resources.",
        "Nothing here is operating yet. Before any space is invited to take part, we need professional guidance, clear safeguards, and agreement from partners about what the role is and what it is not."
      ],
      status: "planning",
      audience: "Young men and the people around them in everyday community spaces",
      activities: [],                    // OPTIONAL. List only what is REAL for the current status.
      plannedActivities: [
        "Learn from local space owners and licensed professionals what would be helpful and safe",
        "Define clear boundaries: connecting people to resources, not providing counseling",
        "Draft simple materials and a training outline, reviewed by professionals"
      ],
      startDate: "",                     // OPTIONAL. "YYYY-MM-DD" once started
      endDate: "",                       // OPTIONAL
      image: "",                         // OPTIONAL path, e.g. "assets/images/programs/trusted-spaces.jpg"
      imageAlt: "",
      links: [],                         // OPTIONAL: [{ label: "Read the plan", url: "https://..." }]
      goals: [
        "Define, with professional input, what a safe and appropriate partnership looks like",
        "Identify what we can responsibly measure before any launch"
      ],
      results: [],                       // OPTIONAL. REAL, verified results only
      reportingPeriod: "",               // OPTIONAL. e.g. "Fall 2027"
      participation:
        "This program is not open yet. If you own or work in a community space and would like to talk about the idea, see Get Involved.",
      featured: true
    },
    {
      id: "community-activities",
      published: true,
      name: "Community Connection Activities",
      shortDescription:
        "An idea in development: structured, low-pressure activities that help friendships form and make conversations about mental health feel natural.",
      fullDescription: [
        "Belonging does not happen by accident, and it is hard to start from nothing. This idea explores simple, structured activities where people can meet, do something together, and talk when they are ready.",
        "We have not scheduled or launched any activities. Format, safety practices, and volunteer roles still need to be designed with qualified advisors."
      ],
      status: "planning",
      audience: "Young men looking for friendship, belonging, and people to talk with",
      activities: [],
      plannedActivities: [
        "Explore the kinds of activities that appeal to our community",
        "Design safeguards, including what volunteers should do if someone seems to be in crisis",
        "Pilot only after advisors have reviewed the plan"
      ],
      startDate: "",
      endDate: "",
      image: "",
      imageAlt: "",
      links: [],
      goals: [
        "Create a safe, welcoming format that has been reviewed by professionals",
        "Decide how to gather honest feedback from participants"
      ],
      results: [],
      reportingPeriod: "",
      participation:
        "These activities are not scheduled yet. To hear about them when they are, see Get Involved or News.",
      featured: true
    },
    {
      id: "care-access",
      published: true,
      name: "Access to Professional Care",
      shortDescription:
        "An idea in development: exploring partnerships that could make professional mental health care easier to reach.",
      fullDescription: [
        "Even when someone wants help, cost, waitlists, and not knowing where to start can get in the way. This idea explores partnerships with qualified providers and organizations that could make professional care more accessible.",
        "We have no partnerships in place. We are only at the stage of learning what already exists locally and where the gaps are."
      ],
      status: "planning",
      audience: "Young men who are ready to look into professional care",
      activities: [],
      plannedActivities: [
        "Map existing local and national resources and check each one",
        "Talk with licensed professionals and organizations about what is realistic",
        "Share only verified information in our resource directory"
      ],
      startDate: "",
      endDate: "",
      image: "",
      imageAlt: "",
      links: [{ label: "Browse verified resources", url: "resources.html" }],
      goals: [
        "Build a resource directory in which every entry has been checked",
        "Identify partnership options worth pursuing"
      ],
      results: [],
      reportingPeriod: "",
      participation:
        "Nothing to sign up for yet. If you are a licensed professional or organization and want to talk, see Get Involved.",
      featured: true
    }
  ],

  /* ===========================================================================
     E. IMPACT
     A metric appears publicly ONLY when verificationStatus is "verified" and it
     has a value, a reportingPeriod, and a measurementMethod.
     Statuses: "verified", "unverified", "estimate"  (only "verified" is shown).
     Example (do not enable unless real):
       { id: "referrals-q1", name: "Resource referrals shared", value: "0",
         unit: "referrals", reportingPeriod: "Jan to Mar 2027",
         measurementMethod: "Tally sheet kept by volunteers at events",
         explanation: "Counts times we handed someone a resource list; it does not measure outcomes.",
         verificationStatus: "verified", lastUpdated: "2027-04-02", reportUrl: "" }
     =========================================================================== */
  impact: {
    intro:
      "This page separates what we have actually measured from what we hope to do. Right now we are at the very beginning.",
    metrics: [],
    earlyStageMessage: {
      heading: "We're setting up our measurement process.",
      body: "We have no verified results to report yet, and we will not display numbers just to fill space. Before we publish any result, we will say what was counted, how, over what period, and what it does and does not tell us."
    },
    principles: [
      "A number is only published when we can say how it was collected and over what period.",
      "Website visits, social media followers, and event attendance are not evidence that someone's mental health improved, and we will not present them that way.",
      "We will never claim to have prevented a death or saved a life.",
      "Goals and results are kept separate. Anything on this page labeled a goal has not happened yet."
    ],
    goalsHeading: "Our goals and evaluation priorities",
    goalsNote: "These are goals, not results.",
    goals: [
      "Work with licensed mental health professionals to decide what we can responsibly measure.",
      "Choose simple measures that respect privacy and avoid collecting sensitive personal information.",
      "Write down our measurement plan before any program launches.",
      "Publish a plain-language report on a regular schedule, including what did not work."
    ],
    completedActivities: [], // OPTIONAL. REAL completed work: [{ date: "2027-03-01", text: "..." }]
    lessons: [],             // OPTIONAL. REAL lessons learned: [{ title: "", body: "" }]
    // Report archive. Add newest first:
    // { id: "2027-annual", title: "2027 Annual Report", date: "2028-01-15", summary: "...", url: "reports/2027.pdf" }
    reports: []
  },

  /* National context statistics: shown on Home and Impact. Each MUST have a
     source and plain-language explanation of what it measures.
     These are context, not our results. */
  context: {
    statistics: [
      {
        id: "cdc-rate-2024",
        value: "22.3 vs 5.6",
        unit: "suicide deaths per 100,000 people (males vs. females), U.S., 2024",
        measures:
          "An age-adjusted death rate, which accounts for differences in age makeup so groups can be compared fairly. It counts deaths recorded as suicide, not thoughts of suicide or attempts.",
        sourceName: "CDC National Center for Health Statistics, Data Brief No. 572",
        sourceUrl: "https://www.cdc.gov/nchs/products/databriefs/db572.htm",
        accessed: "2026-10-18"
      },
      {
        id: "cdc-share-2023",
        value: "Nearly 80%",
        unit: "of U.S. suicide deaths in 2023 were among males, who are about half the population",
        measures:
          "The share of recorded suicide deaths by sex in one year. It says nothing about why, and it does not mean most men are at risk.",
        sourceName: "CDC, Suicide Data and Statistics",
        sourceUrl: "https://www.cdc.gov/suicide/facts/data.html",
        accessed: "2026-10-18"
      }
    ]
  },

  /* ===========================================================================
     F. RESOURCES
     category must be one of: "crisis", "professional", "low-cost", "community", "general"
     verificationStatus: "verified" (shown), "needs-review" or "unverified" (hidden)
     A "verified" entry whose lastVerified is older than staleAfterDays is still
     shown, with a visible "confirm details before relying on this" note.
     To ADD a resource, copy an object and fill in every field you have VERIFIED.
     Leave cost/eligibility as "" if you have not confirmed them.
     =========================================================================== */
  resources: {
    intro:
      "A small directory of resources we have checked. It is informational and does not replace professional care. If you are in crisis, use the crisis support box just below.",
    staleAfterDays: 365,
    categories: [
      { key: "crisis", label: "Crisis support", blurb: "For emergencies and urgent emotional distress. Available now." },
      { key: "professional", label: "Professional treatment", blurb: "Licensed providers and treatment locators." },
      { key: "low-cost", label: "Low-cost care", blurb: "Options that can reduce the cost of care." },
      { key: "community", label: "Community support", blurb: "Peer and community-based support." },
      { key: "general", label: "General information", blurb: "Reliable background information." }
    ],
    emptyCategoryMessage: "We have not verified any resources in this category yet.",
    directoryNote:
      "We add a resource only after checking it ourselves. If something here is out of date, please tell us through the Contact page.",
    items: [
      {
        id: "988-lifeline",
        name: "988 Suicide & Crisis Lifeline",
        provider: "988 Lifeline network, administered with support from SAMHSA",
        description:
          "Free, confidential support from trained crisis counselors for suicidal thoughts, mental health or substance use crises, or emotional distress. You can also contact 988 if you are worried about someone else.",
        category: "crisis",
        website: "https://988lifeline.org",
        phone: "988",
        phoneHref: "tel:988",
        serviceArea: "United States",
        cost: "Free",
        eligibility: "Anyone in the U.S.",
        audience: "Anyone in distress, or anyone worried about another person",
        extra: [
          "Call or text 988, or chat at 988lifeline.org/chat.",
          "Veterans and service members: call 988 and press 1.",
          "Spanish: call 988 and press 2."
        ],
        lastVerified: "2026-10-18",
        verificationStatus: "verified"
      }
      /* TEMPLATE (copy, fill in, and remove the comment marks around it):
      ,{
        id: "example-resource",
        name: "",
        provider: "",
        description: "",
        category: "professional",
        website: "",
        phone: "",
        phoneHref: "",
        serviceArea: "",
        cost: "",
        eligibility: "",
        audience: "",
        extra: [],
        lastVerified: "YYYY-MM-DD",
        verificationStatus: "unverified"
      }
      */
    ]
  },

  /* ===========================================================================
     G. NEWS AND UPDATES
     status: "draft" (hidden) or "published" (public)
     date: "YYYY-MM-DD"    body: list of plain-text paragraphs
     Add newest entries anywhere; the site sorts by date.
     Example:
       { id: "hello", title: "Title", date: "2027-01-10", category: "Update",
         summary: "One or two sentences.", body: ["Paragraph one.", "Paragraph two."],
         image: "", imageAlt: "", link: { label: "Read more", url: "https://..." },
         status: "draft" }
     =========================================================================== */
  news: {
    intro: "Honest updates on what we are doing and learning.",
    emptyMessage:
      "No updates have been published yet. When we have something real to share, it will appear here.",
    entries: []
  },

  /* ===========================================================================
     H. PARTNERS
     A partner appears ONLY if displayStatus is "approved" AND
     permissionConfirmed is true (written permission to be listed).
       { name: "", description: "", logo: "", logoAlt: "", website: "",
         type: "Community space", displayStatus: "approved",
         permissionConfirmed: true }
     =========================================================================== */
  partners: [],
  partnersIntro: "Organizations and professionals who have agreed to be listed.",

  /* ===========================================================================
     GET INVOLVED
     Each section is shown when enabled is true. The button appears only if it
     has a working destination:
       - "href": a full link, or
       - "emailSubject": uses the public email in organization.contact.email
     If neither works, the button is hidden and a short note is shown instead.
     =========================================================================== */
  getInvolved: {
    intro:
      "We are early, and that means your help can shape how this starts. Here is how you can be part of it.",
    noContactNote:
      "Our public contact details are not posted yet. Please check back soon.",
    sections: [
      {
        id: "volunteer",
        enabled: true,
        heading: "Volunteer",
        body: "We are not running volunteer activities yet. If you would like to hear about opportunities when they exist, or help with early planning, let us know.",
        cta: { label: "Ask about volunteering", emailSubject: "Volunteering with Your Dudes" }
      },
      {
        id: "partner",
        enabled: true,
        heading: "Partner with us",
        body: "If you own or manage a barbershop, gym, or other community space, or lead an organization that serves young men, we would like to talk about what a good partnership could look like.",
        cta: { label: "Start a conversation", emailSubject: "Partnership with Your Dudes" }
      },
      {
        id: "advisor",
        enabled: true,
        heading: "Advise us",
        body: "We are looking for licensed mental health professionals and experienced community leaders who can review our plans and keep us safe and honest.",
        cta: { label: "Offer your expertise", emailSubject: "Advising Your Dudes" }
      },
      {
        id: "board",
        enabled: true,
        heading: "Join a future board",
        body: "We have not formed a board yet. If you may be interested in serving when we do, please reach out so we can keep in touch.",
        cta: { label: "Express interest", emailSubject: "Board interest, Your Dudes" }
      }
    ],
    donations: {
      acceptingDonations: false, // keep false until legally able to accept gifts
      donateUrl: "",             // only used if acceptingDonations is true
      heading: "Donations",
      notice:
        "We are not accepting donations right now. We are still in early planning, and we will announce it here if and when we are able to.",
      acceptingBody: "Thank you for considering a gift.",
      taxNote: "" // only shown when legal.taxDeductibleVerified is true
    }
  },

  /* ===========================================================================
     I. FAQ
     =========================================================================== */
  faqs: [
    {
      q: "Is Your Dudes a registered nonprofit?",
      a: "Not that we have confirmed. We are a developing community initiative in early planning. We will announce registration or tax-exempt status here only after it is official."
    },
    {
      q: "Do you offer counseling or a crisis line?",
      a: "No. We are not a clinical provider, and this website is not an emergency service. If you are in crisis, call or text 988 in the U.S., or call 911 if someone is in immediate danger."
    },
    {
      q: "Are your programs running?",
      a: "Not yet. Everything on the Programs page is in planning. We label each program's status so there is no confusion."
    },
    {
      q: "Is the resource directory complete?",
      a: "No. It only lists resources we have verified, so it is small for now. It is informational and does not replace professional care."
    },
    {
      q: "How can I help?",
      a: "See Get Involved. We are especially interested in hearing from licensed professionals, community space owners, and people who want to help with early planning."
    }
  ],

  /* ===========================================================================
     CONTACT PAGE and PRIVACY NOTICE
     =========================================================================== */
  contactPage: {
    intro: "Reach us for questions, partnerships, volunteering, or to tell us a resource needs updating.",
    safetyNote:
      "Please do not send personal mental health details, crisis messages, or other sensitive information by email or any general contact method. We cannot monitor messages for emergencies, and we cannot promise absolute confidentiality.",
    noContactMessage:
      "We have not posted public contact details yet. Check back soon. If you need support now, see the resources page.",
    responseNote: "" // OPTIONAL, e.g. "We aim to reply within a week." Only if true.
  },

  privacy: {
    heading: "Privacy notice",
    updated: "2026-10-18",
    points: [
      "This website does not use analytics, advertising, or tracking tools, and it does not use accounts.",
      "It has no forms, chat, or intake features, so it does not collect anything you type.",
      "The site is hosted on GitHub Pages. GitHub, like most web hosts, may log technical information such as IP addresses when pages are requested. Their privacy statement explains how.",
      "If you email us, we receive your email address and whatever you write, and we may keep it to respond. Please do not include sensitive personal or mental health information.",
      "We cannot promise absolute anonymity or confidentiality. If we change any of this, we will update this notice."
    ],
    hostPrivacyUrl: "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
    hostPrivacyLabel: "GitHub's privacy statement"
  },

  /* ===========================================================================
     PAGE TITLES AND DESCRIPTIONS (used for the browser tab and search results)
     The same text is also written in each page's HTML as a fallback.
     =========================================================================== */
  pages: {
    home: { title: "Your Dudes", description: "Your Dudes is a developing community initiative focused on men's mental health outreach, suicide prevention, and helping people access support." },
    about: { title: "About", description: "Our mission, values, and where Your Dudes honestly stands today." },
    programs: { title: "Programs", description: "Programs Your Dudes is planning, each labeled with its current status." },
    impact: { title: "Impact", description: "How Your Dudes will measure and report its work, and what we have verified so far." },
    resources: { title: "Resources and crisis support", description: "Crisis support information, including the 988 Suicide & Crisis Lifeline, and a directory of verified resources." },
    "get-involved": { title: "Get Involved", description: "Ways to volunteer, partner, advise, or help Your Dudes get started." },
    news: { title: "News", description: "Published updates from Your Dudes." },
    contact: { title: "Contact and privacy", description: "How to contact Your Dudes and how this website handles privacy." },
    "not-found": { title: "Page not found", description: "That page could not be found. Here are some helpful places to go." }
  }
};
