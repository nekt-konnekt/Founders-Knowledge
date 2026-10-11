# Founders Knowledge

A practical knowledge centre for founders: lessons, frameworks, field notes, and guides organized around real founder problems—not publishing dates.

## Publishing workflow

1. Capture an observation or founder question.
2. Shape it into a lesson, guide, framework, or field note.
3. Review and approve the content.
4. Commit the approved changes to the `main` branch.
5. Vercel builds and publishes the static site from GitHub.

## Production

- Live site: https://founders-knowledge.vercel.app
- Hosting and deployment: Vercel
- Source of truth: this GitHub repository
- Page styling: `assets/site.css`
- Shared analytics: `assets/analytics.js`
- Shared lesson-sharing behavior: `assets/share.js`

## Analytics

PostHog is configured for page views, page leaves, and focused knowledge actions. Custom events include `knowledge_share_clicked`, `knowledge_link_copied`, and `lesson_navigation_clicked`. Generic click autocapture and session recording are disabled.

The current PostHog connection uses the existing `Default project` because the account could not create another project. Keep that limitation in mind when interpreting its data.

## Principles

- Problem-first navigation
- Reusable content templates
- Clear, practical, evidence-aware writing
- Static-first; no database or publishing dashboard until needed
