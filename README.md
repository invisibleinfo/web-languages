# web-languages

**[web-languages.invisible.info](https://web-languages.invisible.info/)**

A website where anyone can share a website in their own language — no
account needed. It feeds Common Crawl's
[`web-languages`](https://github.com/commoncrawl/web-languages) project,
which is working to cover more of the world's ~7,900 languages on the web,
including ones that are small, regional, or easy to overlook.

Many languages barely have a presence online. If you know a news site,
government page, or community site in a language you speak, adding it
here helps that language show up where it currently doesn't.

## How to contribute

1. Open the [site](https://web-languages.invisible.info/) and
   search for your language — by name or by its 3-letter code.
2. Paste the link to a website that's actually written in that language,
   with an optional note about what it is.
3. Send it. That's it — no sign-up, no GitHub account.

The site shows what's already listed for a language, and what's been
added recently, so you can check before adding one that's already there.


## For developers

This repo is the engine behind the site above. It's a Next.js app on
[Railway](https://railway.com) with a Supabase database; both are already
set up and running.

```bash
npm install
npm run dev   # local copy for trying out a code change
              # before it's pushed — the live site itself runs on Railway
              # and is never started this way
```

`npm run dev` needs a `.env.local` file with four Supabase values (see
below). 
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```
All four are in the Supabase dashboard under Project Settings → API (the
last two under the service role key — keep those two server-only, never
expose them to the browser). These are the same four values already set
as Railway's service variables for the live site.

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server, for working on the code |
| `npm run build` / `npm run start` | What Railway runs to serve the live site |
| `npm run lint` | ESLint |
| `npm run seed-languages` | Seed the `languages` table + `public/languages.json` from SIL |
| `npm run sync-repo-links` | Sync `repo_links` from the live `web-languages` repo |

Both seed/sync scripts also run fine without Supabase credentials set —
they fetch and parse but skip writing, which is useful for checking them
against the live repo on their own.

**Database:** `supabase/schema.sql`, run in the Supabase SQL Editor,
creates everything the site needs. It only adds, never drops, so it's
safe to re-run any time (e.g. after pulling a change that adds a column).

**Reviewing submissions:** Reviewers work directly in the Supabase Table Editor — filter `submissions` by `status = 'pending'`, edit `status` inline.

**Interface languages:** site content lives in `lib/i18n/messages/`, one file
per language, with `en.ts` as the source. To add a language, add
it to `lib/i18n/locales.ts`, add its content file, and register it in
`lib/i18n/load-messages.ts` — the typecheck will catch any missing text.
To change existing site content, just edit that language's file.

**Keeping the data fresh — nothing runs this automatically** (no GitHub
Actions, no cron, by choice — no secrets go on GitHub), **so run these by
hand:**

```bash
npm run sync-repo-links   # monthly-ish — pulls in links added upstream
npm run seed-languages    # only if SIL's own language list changes (rare)
```

Also worth opening the Supabase dashboard every few weeks — the free tier
pauses a project after a period of inactivity. More detail in
[`docs/notes.md`](docs/notes.md).

**Deploying:** Railway auto-builds on push to the connected branch, using
the same four variables above as its service variables, set *before* the
first build (the `NEXT_PUBLIC_*` ones are baked in at build time). Open
the Supabase project now and then too, so the free tier doesn't pause
from inactivity.
