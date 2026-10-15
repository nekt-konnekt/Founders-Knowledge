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

## Enable X distribution (recommended first channel)

Create an X developer project/app with permission to publish Posts on behalf of your own account. Complete the required user authorization flow and store the resulting user-context access token as the repository Actions secret:

- `X_API_USER_ACCESS_TOKEN`

The token must be authorized for writing Posts (for example, OAuth 2.0 user context with `tweet.write`; request `tweet.read`, `users.read`, and `offline.access` as appropriate for your auth flow). An app-only bearer token is not sufficient to post as your account. X controls API access, plan eligibility, and rate limits. Official reference: https://docs.x.com/x-api/posts/manage-tweets/quickstart

The workflow posts one concise X post with the article title, description excerpt, and link. Successful post IDs are recorded to prevent duplicate posts on retries.

## WhatsApp and founder community (manual share packs)

Every run prepares `whatsapp` and `community` copy in the generated JSON pack. These are deliberately not auto-sent to your personal WhatsApp contacts or founder community. Use the copy only with people who want it and where community rules allow promotional/editorial sharing. WhatsApp's business messaging APIs require a properly configured business account and recipient opt-in; they are not a way to automate a personal account's contact list. Official overview: https://developers.facebook.com/docs/whatsapp/cloud-api/overview

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
- X can be enabled once an authorized user-context token is configured.
- LinkedIn and Telegram remain optional future channels.
- WhatsApp and founder-community text is generated for deliberate manual sharing, not automated sending.
