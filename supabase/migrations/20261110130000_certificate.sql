-- Certificates: trainings, seminars and certifications on the About page.
-- Edited in Admin → Certificates. Safe to re-run.

create table if not exists public.certificate (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,                 -- certificate / training name
  issuer         text not null default '',      -- short name shown in the list, e.g. "DLSP"
  description    text not null default '',      -- organizer or details
  issued_on      date not null,
  credential_url text not null default '',      -- optional link to verify or view it
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.certificate enable row level security;

drop policy if exists "certificate is public" on public.certificate;
create policy "certificate is public"
  on public.certificate for select
  to anon, authenticated
  using (true);

-- Only a signed-in user with app_metadata.role = 'admin' can change it.
drop policy if exists "admin can insert certificate" on public.certificate;
create policy "admin can insert certificate"
  on public.certificate for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can update certificate" on public.certificate;
create policy "admin can update certificate"
  on public.certificate for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin can delete certificate" on public.certificate;
create policy "admin can delete certificate"
  on public.certificate for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.certificate to anon, authenticated;
grant insert, update, delete on public.certificate to authenticated;

-- Starting content (the trainings that were hard-coded in lib/site.ts).
-- Only seeded when the table is empty, so re-running never duplicates rows.
insert into public.certificate (title, issuer, description, issued_on)
select * from (values
  ('A.S.C.E.N.D Student Leader and Teacher Adviser Assembly', 'DLSP',
   'University Student Parliament', date '2025-11-26'),
  ('Basic Computer Operations, MS Office, Canva & Bookkeeping', 'LSPU',
   'College of Business Administration and Accountancy, Laguna State Polytechnic University', date '2025-07-31'),
  ('Overview of ISO 9001:2015', 'ASCXENT',
   'ASCXENT Knowledge Resource Inc.', date '2025-06-18'),
  ('Digital Bayanihan Webinar', 'DLSP',
   'College of Computer Studies and Technology', date '2025-06-14'),
  ('Ethical Hacking and Data Security Seminar', 'DLSP',
   'College of Computer Studies and Technology', date '2025-04-04')
) as seed(title, issuer, description, issued_on)
where not exists (select 1 from public.certificate);
