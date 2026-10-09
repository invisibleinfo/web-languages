-- LingoCrawlUI database schema — the only SQL file. Paste it into the
-- Supabase SQL Editor. Safe to re-run: on a fresh project it creates
-- everything; on a v2 project it drops the old category / name / email
-- columns (that data is deleted).
--
-- languages + repo_links are read-only reference data, written only by the
-- seed/sync scripts via the service-role key. submissions is the staging
-- table reviewers work from directly in the Supabase Table Editor.

create table if not exists languages (
  id text primary key,                 -- ISO-639-3 code, e.g. 'cat'
  ref_name text not null,
  alt_names text[] not null default '{}',
  language_type text not null check (language_type in ('living', 'extinct', 'historical', 'constructed', 'special')),
  repo_file_slug text
);

create table if not exists repo_links (
  id uuid primary key default gen_random_uuid(),
  language_id text not null references languages(id),
  url text not null,
  note text,
  synced_at timestamptz not null default now(),
  unique (language_id, url)
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  language_id text not null references languages(id),
  url text not null,
  note text,
  session_id text,                     -- random id kept in the visitor's browser
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'duplicate')),
  reviewed_by text,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

-- Upgrade from v2: drop the views first (they reference the columns being dropped).
drop view if exists public_submissions;
drop view if exists repo_links_stats;
alter table repo_links drop column if exists category;
alter table submissions drop column if exists category;
alter table submissions drop column if exists contributor_name;
alter table submissions drop column if exists submitter_contact;
alter table submissions add column if not exists session_id text;

create index if not exists submissions_language_id_idx on submissions(language_id);
create index if not exists submissions_status_idx on submissions(status);
create index if not exists repo_links_language_id_idx on repo_links(language_id);

-- Public-facing view: no status/reviewer/session fields, and excludes
-- rejected/duplicate rows so a reviewer's decision in the Table Editor
-- removes a link from the public list. Pending rows still show.
--
-- The view runs as its owner (Postgres's default), which is what lets it
-- read the RLS-locked `submissions` table for anonymous visitors. Don't
-- "fix" this with `security_invoker = true` — it would break the view.
create view public_submissions as
  select language_id, url, note, submitted_at
  from submissions
  where status not in ('rejected', 'duplicate');

-- Landing-page stat: one fast query instead of paging all of repo_links.
create view repo_links_stats as
  select count(distinct language_id) as languages_with_sources
  from repo_links;

alter table languages enable row level security;
alter table repo_links enable row level security;
alter table submissions enable row level security;

drop policy if exists "languages are publicly readable" on languages;
create policy "languages are publicly readable"
  on languages for select
  using (true);

drop policy if exists "repo_links are publicly readable" on repo_links;
create policy "repo_links are publicly readable"
  on repo_links for select
  using (true);

-- No policies on `submissions`: with RLS on, anon/authenticated are denied
-- by default. Writes go through the server-only service-role client in the
-- API route.

-- Table privileges (RLS picks the rows, GRANT lets the role touch the table).
-- `submissions` is deliberately NOT granted to anon/authenticated.
grant select on languages, repo_links to anon, authenticated;
grant select on public_submissions, repo_links_stats to anon, authenticated;
grant all on languages, repo_links, submissions to service_role;
