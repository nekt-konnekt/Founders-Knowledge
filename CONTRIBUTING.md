# Publishing to Founders Knowledge

## Content principles

Founders Knowledge is a knowledge centre, not a chronological blog. Organize material around recurring founder problems. Content types include lessons, practical guides, frameworks, and field notes.

## Current static-site structure

- `index.html` — library homepage and navigation
- `assets/site.css` — shared visual system
- `lessons/<slug>/index.html` — individual lesson pages
- `content/lesson-template.md` — editorial template for drafting new lessons

## Add a lesson

1. Draft the content with `content/lesson-template.md`.
2. Choose a short, readable slug such as `find-your-first-customers`.
3. Create `lessons/<slug>/index.html`, using the existing lesson page as the visual and semantic pattern.
4. Add a card linking to the new page in `index.html`.
5. Check internal links, mobile layout, headings, page title, and description.
6. Commit the change to the connected production branch.
7. Confirm the Netlify deployment is ready and open the live page.

## Publishing workflow with ChatGPT

Bring an observation, question, rough note, or founder problem into the conversation. We can challenge assumptions, research claims when needed, shape it into the right format, and draft it using the shared content standard. Publish only after approval.

## Infrastructure decisions

Keep the site static and Git-managed initially. Do not add a database, CMS, or publishing dashboard until the content workflow demonstrates a real need for one.
