-- Awards: the Recognition list on the About page.
-- Edited in Admin → Awards. Safe to re-run.

create table if not exists public.award (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  org         text not null default '',   -- who gave it
  year        smallint not null check (year between 1950 and 2100),
  description text not null default '',   -- optional detail, shown under the title
  position    integer not null default 0, -- order within the same year, lowest first
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.award enable row level security;

drop policy if exists "award is public" on public.award;
create policy "award is public"
  on public.award for select
  to anon, authenticated
  using (true);

-- Only a signed-in user with app_metadata.role = 'admin' can change it.
drop policy if exists "admin can insert award" on public.award;
create policy "admin can insert award"
  on public.award for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can update award" on public.award;
create policy "admin can update award"
  on public.award for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can delete award" on public.award;
create policy "admin can delete award"
  on public.award for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.award to anon, authenticated;
grant insert, update, delete on public.award to authenticated;

-- Starting content (the awards that were hard-coded in lib/site.ts).
-- Only seeded when the table is empty, so re-running never duplicates rows.
insert into public.award (title, org, year, position)
select * from (values
  ('Cum Laude · Consistent Dean''s Lister', 'DLSP', 2026::smallint, 1),
  ('Leadership Awardee', 'DLSP', 2026, 2),
  ('Loyalty Awardee', 'DLSP', 2026, 3),
  ('Service Awardee (2025–2026)', 'DLSP', 2025, 4),
  ('Best Barangay Information Office Reporter', 'San Pablo City', 2024, 5)
) as seed(title, org, year, position)
where not exists (select 1 from public.award);
