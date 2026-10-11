<!-- README for GitHub: colourful, developer-friendly, and still useful. -->

<div align="center">

# ✳ Founders Knowledge

### Build with more clarity.

A practical knowledge centre for founders — lessons, frameworks, field notes, and guides organized around real founder problems, not publishing dates.

[![Live Site](https://img.shields.io/badge/🌐_Live_Site-Founders_Knowledge-7C3AED?style=for-the-badge)](https://founders-knowledge.vercel.app/)
[![Built with HTML](https://img.shields.io/badge/HTML5-static_site-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Hosted on Vercel](https://img.shields.io/badge/Hosted_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Analytics](https://img.shields.io/badge/Analytics-PostHog-1D4AFF?style=flat-square&logo=posthog&logoColor=white)](https://posthog.com/)

</div>

---

## 💡 The idea

Founders do not need another chronological feed to scroll past. They need useful knowledge they can find again when a real question comes up.

**Founders Knowledge is a reusable library**, built around practical questions about customers, products, distribution, monetization, and the decisions founders face while building.

> Less noise. Better questions. Clearer next steps.

## 🧭 Explore the knowledge

| Area | What it helps with |
| --- | --- |
| 🎯 Customers & value | Understand why the right people would choose a product |
| 📣 Distribution | Diagnose why a product is not being discovered |
| 💸 Monetization | Connect pricing, payments, delivery, and customer discovery |
| 🧪 Validation | Separate tested demand from assumptions |
| 🛠️ Product decisions | Decide what to ship now, build next, or leave aside |

Browse the [live knowledge library](https://founders-knowledge.vercel.app/).

## ⚙️ Built with

- **HTML + CSS + JavaScript** — lightweight static pages
- **GitHub** — source of truth and publishing workflow
- **Vercel** — hosting and deployment
- **PostHog** — planned measurement for page views and intentional knowledge actions

No database or publishing dashboard unless a real need justifies one.

## 📁 Project structure

```text
.
├── index.html
├── assets/
│   ├── site.css
│   ├── analytics.js
│   ├── share.js
│   └── og/
└── lessons/
    ├── app-monetization/
    ├── product-is-invisible/
    └── why-should-users-choose-your-product/
```

## 🚀 How publishing works

1. Capture a useful founder question or observation.
2. Shape it into a lesson, guide, framework, or field note.
3. Review the content for clarity and practical value.
4. Commit approved changes to `main`.
5. Vercel builds and publishes the site from GitHub.

## 📊 Analytics status

PostHog is configured in the site source for page views and focused events, including:

- `knowledge_share_clicked`
- `knowledge_link_copied`
- `lesson_navigation_clicked`

**Verification note:** the connected PostHog project currently reports that it has not ingested events. Analytics should therefore be treated as **not yet verified end to end**. The project is using an existing shared PostHog project, so confirm incoming events before relying on the numbers.

## 🧱 Principles

- **Problem-first navigation** — organize by the question, not the date.
- **Reusable knowledge** — create assets people can return to.
- **Useful over frequent** — publish when there is something worth keeping.
- **Evidence-aware writing** — distinguish facts, hypotheses, and opinion.
- **Static-first** — keep the system simple until the work demands more.

---

<div align="center">

**Think clearly. Build deliberately.**

[Open Founders Knowledge ↗](https://founders-knowledge.vercel.app/)

</div>
