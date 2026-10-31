# Founders Knowledge — Reference 02 design system

Status: implementation branch for full-site review.

## Design direction
Use the second visual reference as the complete design direction: a calm, structured, photography-led editorial publication. The site should feel like a considered journal and practical knowledge library, not a creative-agency portfolio, course platform, social feed or SaaS dashboard.

## Visual language
- Warm near-white paper background, charcoal typography and restrained sage-green accents.
- Manrope display typography and DM Sans body typography.
- Generous whitespace, clear typographic hierarchy and quiet dividers.
- Editorial photography is the primary visual component. Images should show the actual subject, environment, people or process relevant to the article.
- Clean rectangular image frames, restrained controls, minimal ornament and no decorative stickers or floating paper illustrations.
- Consistent responsive layouts for homepage, library, briefings, article pages, product discovery and private editorial review.

## Article template
1. Category and content-type label.
2. Clear headline and concise reader-focused dek.
3. Publication date and reading time.
4. Wide, relevant lead photograph with descriptive alt text and caption/credit where appropriate.
5. Readable article body with section hierarchy, sources, practical callouts and a clear takeaway.
6. Related reading and sharing controls.

## Photography rules
- Prefer original, commissioned, licensed or appropriately attributed images.
- Select images for editorial relevance, not generic startup aesthetics.
- Avoid random laptop stock photos, staged handshakes and decorative images that add no information.
- Preserve subject context when cropping on mobile.
- Always provide meaningful alt text; use an empty alt only for genuinely decorative imagery.
- If an appropriate photograph is unavailable, use a neutral image placeholder rather than reverting to the previous illustrated card system.

## Components and behaviour
- Keep navigation, search, filters, submission forms, authentication, analytics, structured data, URLs and publishing workflows functional.
- Use the same visual language on public and private pages.
- Keep text contrast accessible, controls keyboard accessible and motion restrained.
- Article content must remain comfortable to read on mobile and desktop.

## Design tokens
- Paper: #fbfaf7
- White: #ffffff
- Ink: #20211f
- Muted: #777a73
- Soft surface: #ecece6
- Accent: #536b55
- Deep accent: #354b39
- Rule: #dedfd8

## Acceptance checks
- No visible blue/pastel course-platform styling, oversized rounded cards, playful stickers, floating note graphics or shadow-heavy components.
- Homepage and article cover use real editorial photography.
- All published article routes, library, briefings, product discovery and private review use the same visual system.
- Search, filters, sharing, product submission and review workflows remain operational.
- Desktop and mobile layouts are checked before merge.
- The production domain is verified only after the deployment is ready and the live pages are inspected.
