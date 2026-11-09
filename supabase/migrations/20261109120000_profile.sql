-- Profile: the single row behind the public intro, About and Contact pages.
-- Run once in Supabase → SQL Editor. Safe to re-run.

create table if not exists public.profile (
  id                  smallint primary key default 1 check (id = 1), -- only one row
  name                text not null,
  role                text not null default '',
  tagline             text not null default '',
  bio                 text not null default '',  -- paragraphs separated by a blank line
  status              text not null default '',
  location            text not null default '',
  email               text not null default '',
  avatar_url          text,                      -- cropped photo shown on the site
  avatar_key          text,                      -- R2 object key of that photo
  avatar_original_key text,                      -- R2 key of the uncropped upload, for re-cropping
  updated_at          timestamptz not null default now()
);

alter table public.profile enable row level security;

-- Everyone can read the profile (it's the public portfolio).
drop policy if exists "profile is public" on public.profile;
create policy "profile is public"
  on public.profile for select
  to anon, authenticated
  using (true);

-- Only a signed-in user with app_metadata.role = 'admin' can change it.
-- That role can only be set with the service role key (npm run seed:admin).
drop policy if exists "admin can update profile" on public.profile;
create policy "admin can update profile"
  on public.profile for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.profile to anon, authenticated;
grant update on public.profile to authenticated;

-- Starting content (the values that were hard-coded in lib/site.ts).
insert into public.profile (id, name, role, tagline, bio, status, location, email)
values (
  1,
  'Elena Cortez',
  'IT Professional',
  'You bring the problem — I''ll find the fix.',
  'IT professional focused on building dependable systems, troubleshooting complex issues, and keeping technology running smoothly for the people who rely on it.',
  'Open to opportunities',
  'Philippines',
  'dlsp.ccst.cortezelena@gmail.com'
)
on conflict (id) do nothing;
