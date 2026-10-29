# [Clear, specific lesson title]

> **Reader promise:** In one sentence, state what a founder will understand, decide, or be able to do after reading.

- **Type:** Lesson / Practical guide / Framework / Comparison / Field note
- **Topic:** Product & customers / Distribution / Money / Operations / Founder decisions / Technology
- **Audience:** The founder or operator this is for
- **Decision or problem:** The real question this piece helps resolve
- **Reading time:** Estimate after drafting
- **Evidence status:** Research needed / Researched / Field observation / Mixed

> **Before drafting:** Read [The Founders Knowledge Editorial Standard](founders-knowledge-editorial-standard.md). This template is a scaffold, not a mandatory sequence. Use only sections that help the reader understand the problem and make a better decision.

## The situation

What is happening? Why does it matter to the intended reader? Start with the real founder problem, not a generic definition or broad industry preamble.

## The tension or misconception

What is commonly assumed, overlooked, or confused? Explain why that assumption can lead to a poor decision.

## How it actually works

Explain the mechanism in plain language. Define technical terms when they become relevant. Use grounded examples to make the reasoning concrete.

## The decision framework

Give the reader a sequence, comparison, checklist, question set, or decision rule they can apply. Explain why the criteria matter and how to use them. Do not treat a score as a substitute for judgement.

## Apply it

Show how the framework works in a realistic scenario. Label examples accurately as verified, reported, anonymised, hypothetical, or illustrative.

## What could change the answer?

Name the important limits, trade-offs, unknowns, and context that could make the recommendation different. For current or consequential claims, link to reliable sources and verify that they support the exact claim.

## The next step

Give the reader a specific action, test, measurement, or question. Where appropriate, state what result would support or overturn the working recommendation.

## Takeaway

One clear decision rule or insight—not a generic summary.

---

## Optional sections

Use these when the content type calls for them:

- **Comparison table:** Use consistent criteria across options; include the context and date for changing specifications or prices.
- **Failure paths:** For technical guides, explain what happens when the happy path breaks and how to recover safely.
- **Sources / What this is based on:** Link primary sources close to claims and collect key references where useful.
- **Series context:** Link the related parts without making this article dependent on reading every part.

## Editorial quality gate

- Does the piece solve a real founder problem rather than merely describe a topic?
- Is the main argument clear and does each section advance it?
- Does it explain why, show trade-offs, and provide a practical next step?
- Are facts, reported claims, interpretation, and illustrations clearly distinguished?
- Are consequential or time-sensitive claims verified and appropriately sourced?
- Are numbers, units, dates, prices, calculations, and examples accurate and contextualised?
- Is the writing direct, specific, free of hype, and free of needless repetition?
- Does the recommendation state the conditions that could change the answer?
- Does the page use the existing FK design system, responsive structure, and accessible semantics?
- Are canonical metadata, structured data, Open Graph/Twitter metadata, artwork, internal links, and sources correct?
- Has the deployed page been inspected?

**A polished draft is not automatically a good FK piece. It must be grounded, insightful, and useful.**

---

## Canonical page shell (HTML) — build every lesson on this, exactly

Every lesson page uses the single FK design system: `assets/site.css` is the only
stylesheet, and the page shell below is the only shell.

**Theme v2 — "Hippo-sky" (2026-10-30):** sky-blue platform primary `#2e9bff`
(deep link blue `#1668b8`), deep-navy ink `#12263a`, lime marker highlight
`#c8f04b`, sky-tint surfaces `#e8f3ff`, pastel card bands (sky `#bfe0ff`, peach
`#ffd9c4`, mint `#b9ecd2`), soft shadows and 1px `#a9c6de` borders — no purple,
no hard offset shadows. In `site.css` the legacy token names are kept: `--purple`
holds the sky-blue primary and `--yellow` holds the lime highlight. New OG
artwork must use this palette (background `#e8f3ff`, ink `#12263a`, blue
`#1d7fe0`, lime `#c8f04b`). It is copied from the
reference lesson (`lessons/list-at-home-or-list-abroad/`, 2026-10-22). Replace the
`[BRACKETED]` placeholders with the lesson's own values; change nothing else in
the shell. Editorial content (kicker text, title, dek, meta, cover art, sidebar
labels and note, sections, callouts, takeaway, sources) is the lesson's own —
the shell, classes and element order are not.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="[META DESCRIPTION]">
  <meta name="theme-color" content="#2e9bff">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="shortcut icon" href="/favicon.svg">
  <title>[TITLE] — Founders Knowledge</title>
  <link rel="canonical" href="https://founders-knowledge.vercel.app/lessons/[SLUG]/">
  <script type="application/ld+json">
  {
    "@context":"https://schema.org",
    "@type":"Article",
    "headline":"[TITLE]",
    "description":"[META DESCRIPTION]",
    "mainEntityOfPage":"https://founders-knowledge.vercel.app/lessons/[SLUG]/",
    "publisher":{"@type":"Organization","name":"Founders Knowledge","url":"https://founders-knowledge.vercel.app/"},
    "isPartOf":{"@type":"CreativeWorkSeries","name":"Founders Knowledge"},
    "datePublished":"[YYYY-MM-DD — the real publication date]",
    "dateModified":"[YYYY-MM-DD]",
    "inLanguage":"en"
  }
  </script>
  <meta property="og:site_name" content="Founders Knowledge">
  <meta property="og:type" content="article">
  <meta property="og:title" content="[TITLE]">
  <meta property="og:description" content="[META DESCRIPTION]">
  <meta property="og:url" content="https://founders-knowledge.vercel.app/lessons/[SLUG]/">
  <meta property="og:image" content="[OG IMAGE URL — wsrv.nl 1200x630 pipeline URL for /assets/og/lessons/[SLUG].svg]">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="[SHORT ALT TEXT]">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="[TITLE]">
  <meta name="twitter:description" content="[META DESCRIPTION]">
  <meta name="twitter:image" content="[SAME OG IMAGE URL]">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/site.css">
  <script src="/assets/analytics.js" defer></script>
  <meta property="og:image:secure_url" content="[SAME OG IMAGE URL]">
</head>
<body class="lesson-page">
  <a class="skip-link" href="#lesson-content">Skip to article</a>
  <header class="site-header">
    <a class="brand" href="/" aria-label="Founders Knowledge home"><span class="brand-mark" aria-hidden="true">FK</span><span class="brand-name">Founders <b>Knowledge</b></span></a>
    <nav aria-label="Article navigation"><a href="/library/">Knowledge library</a><a href="/#approach">Our approach</a></nav>
    <a class="nav-cta" href="/library/">All knowledge</a>
  </header>
  <main id="lesson-content">
    <section class="lesson-hero">
      <a class="lesson-back" href="/library/">Back to the knowledge library</a>
      <div class="lesson-cover">
        <div class="lesson-cover-copy">
          <p class="lesson-kicker"><span class="lesson-kicker-dot"></span> [TYPE, ALL CAPS] <span class="lesson-separator">/</span> [TOPIC, ALL CAPS]</p>
          <h1>[TITLE — wrap the phrase to highlight in a <span>]</h1>
          <p class="lesson-dek">[DEK]</p>
          <div class="lesson-meta"><span>◷ [N] minute read</span><span>✳ [TYPE LABEL]</span><span>Published [D MONTH YYYY]</span></div>
        </div>
        <div class="lesson-cover-art" aria-hidden="true">
          <div class="lesson-art-spark spark-one">✳</div><div class="lesson-art-spark spark-two">✦</div>
          <div class="lesson-art-card art-current"><span class="art-label">[CARD 1 LABEL]</span><div class="art-lines"><i></i><i></i><i></i></div><span class="art-small">[CARD 1 NOTE]</span></div>
          <div class="lesson-art-card art-better"><span class="art-label">[CARD 2 LABEL]</span><strong>[CARD 2 HEADLINE]</strong><span class="art-highlight"></span></div>
          <span class="lesson-art-stamp">[STAMP TEXT]</span>
        </div>
      </div>
      <div class="lesson-progress"><span></span></div>
      <div class="lesson-progress-caption"><span>[TOPIC, ALL CAPS]</span><span>[ONE-LINE TAGLINE]</span></div>
    </section>
    <div class="lesson-layout">
      <aside class="lesson-sidebar" aria-label="On this page">
        <div class="lesson-sidebar-inner">
          <p class="sidebar-label">IN THIS ARTICLE</p>
          <!-- One link per numbered section, in order:
          <a href="#[SECTION-ID]">01 <span>[SHORT HAND-WRITTEN LABEL]</span></a> -->
          <div class="sidebar-note"><span>✳</span><p>[THE LESSON'S ONE-LINE BOTTOM LINE]</p></div>
        </div>
      </aside>
      <article class="lesson-body">
        <div class="lesson-opening"><span class="opening-mark">“</span><p>[OPENING PARAGRAPH]</p></div>
        <section id="[SECTION-ID]" class="lesson-section">
          <p class="section-number">01 — [SECTION LABEL, ALL CAPS]</p>
          <h2>[SECTION HEADING]</h2>
          <!-- Body copy. Inline components, all defined in assets/site.css:
               .lesson-callout.callout-yellow / .callout-lilac (with .callout-icon),
               .lesson-question-card (with .question-card-title),
               .fill-in-card, .lesson-two-up, .translation-list, .lesson-equation -->
        </section>
        <!-- [further numbered sections] -->
        <div class="lesson-takeaway"><span class="takeaway-label">THE TAKEAWAY</span><p>[TAKEAWAY — the decision rule, with the highlighted part in <em>]</p></div>
        <div class="lesson-callout callout-lilac"><span class="callout-icon">◈</span><div><strong>Evidence &amp; limits</strong><p>[WHAT IS VERIFIED, WHAT IS REPORTED, WHAT IS NOT VERIFIED]</p></div></div>
        <section class="lesson-section" aria-label="Sources">
          <p class="section-number">SOURCES — CHECK BEFORE YOU ACT</p>
          <!-- source list -->
        </section>
        <nav class="lesson-next" aria-label="Article navigation">
          <a href="/library/" class="next-library"><span></span><span><small>WHEN YOU'RE READY</small><strong>Back to the knowledge library</strong></span></a>
          <a href="/lessons/[RELATED-SLUG]/" class="next-card"><span class="next-card-label">[RELATED LABEL]</span><strong>[RELATED TITLE]</strong><span class="next-arrow"></span></a>
        </nav>
      </article>
    </div>
  </main>
  <footer class="site-footer"><a class="brand" href="/" aria-label="Founders Knowledge home"><span class="brand-mark" aria-hidden="true">FK</span><span class="brand-name">Founders <b>Knowledge</b></span></a><p>Built by founders, for founders.</p><a class="back-top" href="#lesson-content">Back to top</a></footer>
  <script src="/assets/share.js" defer></script>
</body>
</html>
```

### Shell rules (no exceptions)

- **No inline `style=` attributes, ever.** If a component needs a declaration,
  it belongs in `assets/site.css`. The art-current card headline is styled by
  `.art-current strong` and question-card sub-headings by `.lesson-question-card h3`.
- **Progress bar width:** the stylesheet default is 14%. For a different fill,
  put `class="progress-50"` or `class="progress-100"` on the progress `<span>` —
  never an inline width.
- **Every class used must already exist in `assets/site.css`.** If it doesn't,
  add the rule to the stylesheet (using the existing design tokens) in the same
  change — never leave a class undefined, and never invent a one-off class name
  when an existing component covers the need.
- **Sidebar TOC links are hand-written**: the number matches the section's
  `section-number`, the label is a short editorial label (not a copy of the
  section heading), and every numbered section — plus the exercise/checklist
  block when it has an `id` — gets a link.
- **Closing order:** takeaway → Evidence & limits callout → sources section →
  `lesson-next` nav. An exercise block (`.lesson-exercise`, a `<div>`) goes
  before the takeaway when the lesson has one.
- **Fonts link** is the exact URL in the shell above (raw `&`, not `&amp;`),
  and `og:image:secure_url` stays last in the head, after the analytics script.
