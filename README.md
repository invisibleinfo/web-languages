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

The site shows what's already listed for a language, so you can check
before adding one that's already there. New links are reviewed by a person
before they are added.


## For developers

This repo is the engine behind the site above. It's a Next.js app on
[Railway](https://railway.com). There is no database: the list of known
links is built from the upstream repo on every deploy, and submissions
are GitHub issues that end up in a CSV file in this repo.

```bash
npm install
npm run sync-repo-links   # once, to create the link files the site reads
npm run dev               # local copy for trying out a code change
                          # before it's pushed — the live site itself runs
                          # on Railway and is never started this way
```

Submitting links needs a `.env.local` file (gitignored) with two values:

```
GITHUB_TOKEN=
GITHUB_REPO=
```

`GITHUB_REPO` is the repo that receives submission issues, as `owner/name`.
`GITHUB_TOKEN` is a fine-grained personal access token limited to that one
repo, with **Issues: read and write** — keep it server-only and never
commit it. Set the same two values as Railway's service variables for the
live site. Without them the site still works, but sending a link fails.

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server, for working on the code |
| `npm run build` / `npm run start` | What Railway runs to serve the live site |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `npm run seed-languages` | Rebuild `public/languages.json` from SIL's language list |
| `npm run sync-repo-links` | Rebuild `public/repo-links/` and `public/stats.json` from the live `web-languages` repo |

**How submissions flow:**

1. A visitor sends links. The site opens **one issue** in `GITHUB_REPO`,
   labelled `submission`, `lang:<code>` and `ui:<interface language>`.
   Links already listed upstream or already approved are dropped first.
2. A maintainer reviews the issue. To drop a bad link, edit the issue and
   delete its line from the list.
3. **Accept:** add the `approved` label. The workflow in
   `.github/workflows/approve-submission.yml` appends the links still in the
   issue to `data/submissions.csv`, commits it, and closes the issue.
   Railway redeploys on that commit.
   **Reject:** close the issue as "not planned". The links are logged in
   `data/rejected.csv`.

Both CSV files record the visitor's interface language (`ui_locale`) and the
issue number. The workflow uses only GitHub's built-in per-run token — no
secret of ours is stored on GitHub — and ignores the `approved` label from
anyone without write access.

**Interface languages:** site content lives in `lib/i18n/messages/`, one file
per language, with `en.ts` as the source. To add a language, add
it to `lib/i18n/locales.ts`, add its content file, and register it in
`lib/i18n/load-messages.ts` — the typecheck will catch any missing text.
To change existing site content, just edit that language's file.

**Keeping the data fresh:** `npm run build` runs `sync-repo-links` first, so
every deploy pulls in the links added upstream. To pick up new upstream
links without a code change, redeploy on Railway. Run `npm run seed-languages`
only if SIL's own language list changes (rare).

**Deploying:** Railway auto-builds on push to the connected branch, with
`GITHUB_TOKEN` and `GITHUB_REPO` set as service variables before the first
build. The build fails if the upstream download fails, rather than shipping
a site with empty lists.
