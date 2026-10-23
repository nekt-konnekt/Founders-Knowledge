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

X posting uses **OAuth 1.0a user-context** credentials: the app's consumer key pair plus an access token pair generated for the publishing account. These credentials are static — they do not expire and are never rotated — so no token refresh flow is involved.

> **Legacy note:** an earlier design used OAuth 2.0 with a refresh token; it was retired because X rotates the refresh token on every use, which cannot work from GitHub Actions (the rotated token could not be written back to the repository secret). `scripts/x-auth-helper.mjs` belongs to that old PKCE design and is **legacy/unused** — do not use it.

Setup:

1. In the X developer console, open your app and go to **Settings → Authentication settings**. Set **App permissions** to **Read and write**, and **Type of App** to **Web App, Automated App or Bot**. Set the permission *before* generating any tokens — changing app permissions afterwards invalidates existing tokens.
2. On the app's **Keys and tokens** page, find the **OAuth 1.0 Keys** section: the **Consumer Key** (API Key) and **Consumer Secret** (API Key Secret).
3. On the same page, in the OAuth 1.0 **Access Token** section (the block marked "For @<your account> — Read and write"), click **Generate** to create the **Access Token** and **Access Token Secret** for the publishing account.

The workflow predates this auth scheme, so the existing repository variable/secret **names are reused with new meanings** — no workflow change is needed:

- Repository **variable** `X_API_CLIENT_ID` — the OAuth 1.0a **Consumer Key**.
- Repository **secret** `X_API_CLIENT_SECRET` — the OAuth 1.0a **Consumer Secret**.
- Repository **secret** `X_API_REFRESH_TOKEN` — the access token pair joined by a single colon: `<Access Token>:<Access Token Secret>`.

The workflow posts one concise X post with the article title, description excerpt, and link. Successful post IDs are recorded to prevent duplicate posts on retries. X controls API access, plan eligibility, and rate limits. Official reference: https://docs.x.com/x-api/posts/manage-tweets/quickstart

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

## Enable Reddit distribution

Reddit posting uses a **script app** owned by the Reddit account that will publish the posts (OAuth2 password grant — the only grant type a script app supports for this flow). Only use an account in good standing that genuinely participates on Reddit; brand-new or post-only accounts are routinely filtered or banned by subreddit automoderation.

1. Sign in to Reddit as the publishing account and open https://www.reddit.com/prefs/apps.
2. Choose **create another app…**, select the **script** app type, give it a name (for example, `Founders Knowledge distribution`) and a redirect URI — `http://localhost:8080/callback` is fine; a script app never actually receives a browser redirect.
3. Create the app. The string shown under the app name is the **client ID**; the **secret** is shown in the app's edit view.

Add these repository Actions secrets:

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USERNAME` — the publishing account's Reddit username.
- `REDDIT_PASSWORD` — that account's password. (If the account has two-factor authentication enabled, the password grant will fail; use a dedicated publishing account without 2FA, protected by a strong unique password stored only as this secret.)

Optionally set the repository Actions variable:

- `REDDIT_SUBREDDITS` — a comma-separated list of subreddits to post each new lesson to, for example `startups, Entrepreneur`. Leave it empty to post to the account's own profile (`u_<username>`) instead — the safest starting point while the account builds standing.

Each lesson is submitted once per target as a **text (self) post**: the lesson title as the post title, and the body made from the article summary, the standard Founders Knowledge takeaway line, and the lesson URL. Delivery is tracked per target in `distribution/state.json`, so a retry only attempts the subreddits that have not already received the post.

**Subreddit rules vary and matter.** Many communities ban or strictly limit self-promotion, require a minimum account age or karma, require moderator approval before posting links, or expect a 9:1 ratio of genuine participation to promotion. Read each subreddit's rules and get moderator permission where required *before* adding it to `REDDIT_SUBREDDITS` — automated posting into a subreddit that forbids it can get the account banned and the domain flagged as spam. Start with the account's own profile and one or two welcoming communities.

## Manual test

Open **GitHub → Actions → Distribute new Founders Knowledge publications → Run workflow**. Enter a lesson slug (for example, `validate-the-idea`) to generate and distribute that lesson. Successful channels are remembered in `distribution/state.json`; rerunning will only attempt channels that have not already succeeded for that article version.

## Safety and operating rules

- Never place tokens in source code, committed files, or workflow inputs. Use GitHub Actions secrets.
- The site must be publicly reachable and include valid `og:title`, `og:description`, and canonical URL metadata.
- A missing channel credential means that channel is skipped; it is not reported as sent.
- A failed channel is logged and can be retried without resending to channels that already succeeded.
- Updating an article does not automatically repost it. Reposts should be a deliberate choice.
- X can be enabled once the OAuth 1.0a credentials are configured (see "Enable X distribution" above).
- Reddit can be enabled once a script app is configured for the publishing account (see "Enable Reddit distribution" above).
- LinkedIn and Telegram remain optional future channels.
- WhatsApp and founder-community text is generated for deliberate manual sharing, not automated sending.
