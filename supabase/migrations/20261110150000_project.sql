-- Projects: the cards on the Projects page (the home page shows the first 3).
-- Edited in Admin → Projects. Safe to re-run.

create table if not exists public.project (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  tags        text[] not null default '{}',
  live_url    text not null default '',      -- adds a "Live Preview" button when set
  image_url   text,                          -- cover image shown on the card
  image_key   text,                          -- R2 object key of that image
  published   boolean not null default true, -- false = hidden from the public site
  position    integer not null default 0,    -- shown by position, lowest first
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.project enable row level security;

-- Everyone can read projects; hidden ones are filtered out by the site.
drop policy if exists "project is public" on public.project;
create policy "project is public"
  on public.project for select
  to anon, authenticated
  using (true);

-- Only a signed-in user with app_metadata.role = 'admin' can change it.
drop policy if exists "admin can insert project" on public.project;
create policy "admin can insert project"
  on public.project for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can update project" on public.project;
create policy "admin can update project"
  on public.project for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can delete project" on public.project;
create policy "admin can delete project"
  on public.project for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.project to anon, authenticated;
grant insert, update, delete on public.project to authenticated;

-- Starting content (the placeholder projects that were hard-coded in lib/site.ts).
-- Only seeded when the table is empty, so re-running never duplicates rows.
insert into public.project (title, description, tags, position)
select * from (values
  ('Home Lab Network',
   'Segmented VLANs, firewall rules, and monitoring for a self-hosted lab environment.',
   array['Networking', 'pfSense', 'VLANs'], 1),
  ('Cloud Migration',
   'Moved on-prem services to the cloud with automated backups and access controls.',
   array['AWS', 'IAM', 'Backups'], 2),
  ('Helpdesk Automation',
   'Scripts that automate account setup and common support tasks to cut ticket time.',
   array['PowerShell', 'Active Directory'], 3)
) as seed(title, description, tags, position)
where not exists (select 1 from public.project);
