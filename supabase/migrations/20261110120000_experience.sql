-- Experience: the entries on the public Experience page and the home page.
-- Edited in Admin → Experience. Safe to re-run.

create table if not exists public.experience (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,                       -- job title, or degree for education
  org         text not null default '',            -- company / school
  location    text not null default '',
  start_year  smallint not null check (start_year between 1950 and 2100),
  start_month smallint check (start_month between 1 and 12),
  end_year    smallint check (end_year between 1950 and 2100), -- null = Present
  end_month   smallint check (end_month between 1 and 12),
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_year is null or end_year >= start_year),
  check (end_month is null or end_year is not null)
);

alter table public.experience enable row level security;

drop policy if exists "experience is public" on public.experience;
create policy "experience is public"
  on public.experience for select
  to anon, authenticated
  using (true);

-- Only a signed-in user with app_metadata.role = 'admin' can change it.
drop policy if exists "admin can insert experience" on public.experience;
create policy "admin can insert experience"
  on public.experience for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can update experience" on public.experience;
create policy "admin can update experience"
  on public.experience for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can delete experience" on public.experience;
create policy "admin can delete experience"
  on public.experience for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.experience to anon, authenticated;
grant insert, update, delete on public.experience to authenticated;

-- Starting content (the entries that were hard-coded in lib/site.ts).
-- Only seeded when the table is empty, so re-running never duplicates rows.
insert into public.experience (title, org, location, start_year, start_month, end_year, end_month, description)
select * from (values
  ('College Lecturer', 'DLSP', 'San Pablo City, Laguna', 2026::smallint, 8::smallint, null::smallint, null::smallint,
   'College of Computer Studies and Technology. Delivers lectures and leads class discussions on IT subjects, and builds instructional materials, presentations, quizzes, exams and learning activities aligned with course outcomes.'),
  ('On-the-Job Trainee', 'DepEd San Pablo', 'San Pablo City, Laguna', 2026, 2, 2026, 5,
   'Procurement Unit. Prepared, encoded and organized procurement documents, kept digital and physical filing systems accurate, and processed purchase requests and quotations in line with government procurement guidelines.'),
  ('Student Assistant', 'Cash for Work', '', 2025, 7, 2025, 8,
   'Administrative and clerical support: encoding, organizing and maintaining department records, with every task done reliably and on schedule.'),
  ('Barangay Information Officer', 'San Pablo City', 'San Pablo City, Laguna', 2024, 7, 2024, 12,
   'Wrote and shared community news and official announcements, documented barangay activities through reports and photography, and coordinated with local officials. Named Best Barangay Information Office Reporter in San Pablo City.'),
  ('BS Information Technology', 'DLSP', 'San Pablo City, Laguna', 2022, null, 2026, null,
   'Major in Network Technology at Dalubhasaan ng Lungsod ng San Pablo. Graduated Cum Laude and a consistent Dean''s Lister.'),
  ('Freelance Event Photographer', 'Independent', '', 2020, 10, null, null,
   'Covers birthdays, school events, fiestas and milestones end to end: client coordination, on-site shooting, and editing in Lightroom and Photoshop. Most work comes from repeat bookings and referrals.')
) as seed(title, org, location, start_year, start_month, end_year, end_month, description)
where not exists (select 1 from public.experience);
