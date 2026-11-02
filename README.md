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
   search for your language — by name or by its 3-letter SIL code.
2. Paste the link to a website that's actually written in that language,
   with an optional note about what it is.
3. Send it. That's it — no sign-up, no GitHub account.

The site shows what's already listed for a language, so you can check
before adding one that's already there. New links are reviewed by us
before they are added.

## Reviewing submissions (for Moderators)

Each submission is an issue in `GITHUB_REPO`, labelled `submission`.

1. Open the issue. Each link is a tick box, and the link itself is clickable
   (Ctrl/Cmd-click to open it in a new tab).
2. Tick the links you accept. Links left unticked are rejected.
3. Optional: to say why, type the reason at the end of that link's line (after
   the link and any note), for example `... not Punjabi`. Comments are never
   read. Don't put text before the link.
4. Add the `validated` label. Ticked links are added to `data/accepted.csv`,
   unticked ones to `data/rejected.csv` (with your reasons in the `reason`
   column), a comment summarises it, and the issue closes. Leave the issue
   open until then.

To reject the whole submission, close the issue as "not planned" instead.
Every link is then recorded in `data/rejected.csv`, ticked or not.

To see every link in one place, open `data/all-links.csv` (or `/all-links.csv`
on the live site) in Excel or Sheets. It lists the approved and upstream links
per language. Rejected links and reasons are never in it. Approvals update it
automatically; the upstream part is a saved copy, so refresh it now and then
with `npm run refresh-all-links` and commit the result.

The `validated` label has to exist in the repo. If it doesn't, create it
under Issues → Labels. GitHub creates `submission` and `ui:<language>` on its
own.

## For developers

This repo is the engine behind the site above. It's a Next.js app on
[Railway](https://railway.com). There is no database: the language list
(names, ISO codes, other names) and the known links are both built from the
upstream `web-languages` repo on every deploy, and submissions are GitHub
issues that end up in a CSV file in this repo.

```bash
npm install
npm run sync-repo-links   # once, to create the language and link files the site reads
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
| `npm run sync-repo-links` | Rebuild `public/language-list.json`, `public/repo-links/` and `public/stats.json` from the live `web-languages` repo and `data/accepted.csv`, and copy `data/all-links.csv` to `public/` |
| `npm run refresh-all-links` | Re-download the `web-languages` repo and rewrite `data/all-links.csv` (upstream links plus everything in `data/accepted.csv`); commit the result |

**How submissions flow:**

1. A visitor sends links. The site opens **one issue** in `GITHUB_REPO`,
   labelled `submission` and `ui:<interface language>`, with the language
   code in its title.
   Links already listed upstream or already approved are dropped first.
2. A maintainer reviews the issue (see below). The workflow in
   `.github/workflows/approve-submission.yml` then records the links in
   `data/accepted.csv` and `data/rejected.csv`, updates `data/all-links.csv`,
   commits the files, and closes the issue. Railway redeploys on that commit.

Both CSV files record the visitor's interface language (`ui_locale`), the
issue number and the reviewer's reason, if any. The workflow uses only
GitHub's built-in per-run token — no secret of ours is stored on GitHub - and
ignores labels added by anyone without write access.

**Interface languages:** site content lives in `lib/i18n/messages/`, one file
per language, with `en.ts` as the source. To add a language, add
it to `lib/i18n/locales.ts`, add its content file, and register it in
`lib/i18n/load-messages.ts` — the typecheck will catch any missing text.
To change existing site content, just edit that language's file.

**Keeping the data fresh:** `npm run build` runs `sync-repo-links` first, so
every deploy pulls in the languages and links added upstream. To pick up
new upstream changes without a code change, redeploy on Railway. Each
upstream language file supplies its own name, other names, category and
ISO-639-3 code; the sync warns about any file that has no code. The
exception is `data/all-links.csv`: a deploy only copies the committed file, so
refresh it with `npm run refresh-all-links`.

**Deploying:** Railway auto-builds on push to the connected branch, with
`GITHUB_TOKEN` and `GITHUB_REPO` set as service variables before the first
build. The build fails if the upstream download fails, rather than shipping
a site with empty lists.
