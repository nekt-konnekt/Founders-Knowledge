# Founders Knowledge distribution automation

This workflow watches for a new lesson page merged into `main`, waits until the canonical production page is reachable, prepares channel-specific copy, and distributes it to configured channels.

## Current behavior

- Triggers only when `lessons/<slug>/index.html` changes on `main`.
- Publishes new lessons only by default; edits do not create duplicate posts.
- Checks the live page before sending anything.
- Uses the existing Open Graph title, description, URL, and image metadata.
- Tracks delivery per lesson and channel in `distribution/state.json` so reruns do not resend a successful post.
- Generates a JSON distribution pack as a GitHub Actions artifact even when credentials are not configured.
- Does not generate or publish an AI summary. The copy is derived from the reviewed article metadata.

## Enable Telegram distribution

Create a Telegram bot using BotFather, add it to the destination channel as an administrator with permission to post, and add these repository Actions secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID` — the channel ID (often starts with `-100`) or the channel's public `@username`.

## Enable LinkedIn distribution

Use an approved LinkedIn app and the required member or organization publishing permissions. Add these repository Actions secrets:

- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_AUTHOR_URN` — the exact permitted author URN, such as `urn:li:person:...` or `urn:li:organization:...`.

Optionally set the repository Actions variable `LINKEDIN_VERSION` to a currently supported LinkedIn API version. The default in the script is a fallback and should be verified against the version available to the app before enabling posting.

LinkedIn API access and permissions are controlled by LinkedIn; the workflow cannot grant them. Test with a controlled destination before enabling public posts.

## Manual test

Open **GitHub → Actions → Distribute new Founders Knowledge publications → Run workflow**. Enter a lesson slug (for example, `validate-the-idea`) to generate and distribute that lesson. Successful channels are remembered in `distribution/state.json`; rerunning will only attempt channels that have not already succeeded for that article version.

## Safety and operating rules

- Never place tokens in source code, committed files, or workflow inputs. Use GitHub Actions secrets.
- The site must be publicly reachable and include valid `og:title`, `og:description`, and canonical URL metadata.
- A missing channel credential means that channel is skipped; it is not reported as sent.
- A failed channel is logged and can be retried without resending to channels that already succeeded.
- Updating an article does not automatically repost it. Reposts should be a deliberate choice.
- This first version supports LinkedIn and Telegram. WhatsApp broadcast and reader email distribution require a properly configured opt-in audience and an approved provider; they are intentionally not faked by this workflow.
