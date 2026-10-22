# Founders Knowledge — Open Graph & Social Card Design System

This is the canonical specification for share images used by lesson, field-note, and editorial pages. Open Graph artwork is a designed editorial cover, not a generic site screenshot or an automatically cropped page hero.

## Core composition

- **Canvas:** 1200 × 630 px (1.91:1), landscape. Keep essential text and the brand inside a safe margin of at least 48 px.
- **Background:** white (#FFFFFF) by default. Do not use lavender or purple as the full canvas unless a deliberate campaign variation calls for it.
- **Brand:** place the FK mark and the “Founders Knowledge” name together at the **top-left**. The FK mark and wordmark use deep purple (#2B146B; approved close equivalent #301078). Maintain strong contrast and do not substitute a yellow logo tile.
- **Headline:** very large, heavy, black (#111111), editorial/post-style typography. The title is the main visual anchor; use deliberate line breaks and avoid tiny type.
- **Supporting line:** one concise, readable sentence that states the lesson's central tension or takeaway.
- **Visual:** one strong editorial subject or illustration, ideally on the right half. Yellow (#FFF000 / #FFE600) is the main accent for shapes and annotations; use black hand-drawn notes/icons sparingly to signal an active founder's field notes.
- **Footer:** a small consistent label such as “FOUNDER FIELD NOTE • 7-MINUTE READ”, positioned near the bottom with clear spacing.

## Typography and hierarchy

1. Founders Knowledge brand line, top-left.
2. Heavy title, black and immediately readable at thumbnail size.
3. Short supporting sentence.
4. Editorial image/visual and restrained annotations.
5. Series label and reading time.

Prefer bold, compact sans-serif display type for headlines and a clean sans-serif for supporting text. Never let decorative elements compete with the headline.

## Social metadata and technical requirements

- Use a direct, absolute, publicly accessible image URL in `og:image` and `twitter:image`; avoid third-party image-proxy URLs when the asset can be hosted with the site.
- Use `twitter:card=summary_large_image`.
- Include `og:image:secure_url`, `og:image:type`, width, height, and descriptive alt text.
- Keep Open Graph and Twitter image metadata pointed to the same final asset.
- Store source assets under `assets/og/`, grouped by content type when helpful (for example, `assets/og/lessons/`).
- After publishing, verify that the image URL returns the image directly and inspect the page's HTML metadata. Social platforms cache previews, so use their debugger/refresh tools when an older preview persists.

## Do / don't

**Do:** white canvas, deep-purple FK logo and brand name at top-left, thick black post title, yellow accent, readable editorial composition.

**Don't:** generic stock art, unrelated generated graphics, a purple full-bleed background by default, tiny headline text, an FK logo detached from the brand name, or an image proxy where a first-party asset is available.

## Reference implementation

The lesson “Everyone Is Building. Who Is Actually Winning?” is the reference composition for this system. Its final share artwork should be hosted as `assets/og/lessons/everyone-is-building-who-is-winning.jpg` and referenced directly from both Open Graph and Twitter metadata.
