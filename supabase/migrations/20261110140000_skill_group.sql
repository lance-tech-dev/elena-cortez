-- Skills: named groups of skills on the Skills page (the home page shows the
-- first 12 skills across groups). Edited in Admin → Skills. Safe to re-run.

create table if not exists public.skill_group (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  skills     text[] not null default '{}',  -- in display order
  position   integer not null default 0,    -- groups are shown by position, lowest first
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.skill_group enable row level security;

drop policy if exists "skill_group is public" on public.skill_group;
create policy "skill_group is public"
  on public.skill_group for select
  to anon, authenticated
  using (true);

-- Only a signed-in user with app_metadata.role = 'admin' can change it.
drop policy if exists "admin can insert skill_group" on public.skill_group;
create policy "admin can insert skill_group"
  on public.skill_group for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can update skill_group" on public.skill_group;
create policy "admin can update skill_group"
  on public.skill_group for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can delete skill_group" on public.skill_group;
create policy "admin can delete skill_group"
  on public.skill_group for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.skill_group to anon, authenticated;
grant insert, update, delete on public.skill_group to authenticated;

-- Starting content (the groups that were hard-coded in lib/site.ts).
-- Only seeded when the table is empty, so re-running never duplicates rows.
insert into public.skill_group (title, skills, position)
select * from (values
  ('IT & Networking',
   array['Network Technology', 'Hardware Troubleshooting', 'Operating Systems', 'Web Development'], 1),
  ('Professional',
   array['Teaching & Instruction', 'Records Management', 'Documentation & Reporting', 'Client Coordination', 'Public Communication'], 2),
  ('Office & Productivity',
   array['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Canva'], 3),
  ('Creative',
   array['Event Photography', 'Adobe Lightroom', 'Adobe Photoshop'], 4)
) as seed(title, skills, position)
where not exists (select 1 from public.skill_group);
