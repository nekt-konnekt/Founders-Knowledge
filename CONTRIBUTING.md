# Publishing to Founders Knowledge

## The editorial source of truth

Before drafting or editing any FK publication, read [content/founders-knowledge-editorial-standard.md](content/founders-knowledge-editorial-standard.md). It defines the FK voice, reasoning standard, research discipline, technical comparison requirements, page design system, metadata requirements, and quality gate.

Use [content/lesson-template.md](content/lesson-template.md) to start a draft. The template is a working scaffold; the editorial standard determines whether the finished piece meets FK quality.

## Content principles

Founders Knowledge is a knowledge centre, not a chronological blog. Organize material around recurring founder problems. Content types include lessons, practical guides, frameworks, comparisons, and field notes.

## Current static-site structure

- index.html — library homepage and navigation
- assets/editorial-system.css — shared visual system and design tokens
- assets/analytics.js — shared PostHog initialization and custom event tracking
- assets/share.js — shared lesson-sharing behavior
- lessons/<slug>/index.html — individual lesson pages
- content/founders-knowledge-editorial-standard.md — canonical writing, research, and design standard
- content/lesson-template.md — editorial template for drafting new lessons
- assets/og/lessons/ — lesson Open Graph artwork

## Add a lesson

1. Read the editorial standard and choose the right content type.
2. Draft with the lesson template, adapting the structure to the actual argument rather than filling sections mechanically.
3. Research and verify claims that are current, technical, regulated, consequential, or disputed. Keep facts, reported claims, interpretation, and illustrative examples distinct.
4. Choose a short, readable slug such as find-your-first-customers.
5. Create lessons/<slug>/index.html, using the current lesson design system and a relevant existing lesson as the structural reference.
6. Reuse the shared stylesheet and existing design tokens; include the established analytics and sharing scripts as appropriate.
7. Complete unique page metadata, canonical URL, Article structured data, OG/Twitter metadata, and the lesson's Open Graph artwork.
8. Add the piece to the knowledge library and any relevant reading path or series links.
9. Check factual accuracy, citations, internal links, mobile layout, headings, accessibility, metadata, and the editorial quality gate.
10. Commit through the repository workflow, confirm the Vercel deployment is ready, and inspect the live page. A successful commit alone does not prove that production is correct.

## Publishing workflow with ChatGPT

Bring an observation, question, rough note, or founder problem into the conversation. Challenge assumptions, research claims when needed, choose the right format, and draft using the canonical editorial standard. Do not publish until the piece passes the quality gate and has approval.

## Infrastructure decisions

Keep the site static and Git-managed initially. Do not add a database, CMS, or publishing dashboard until the content workflow demonstrates a real need for one.
