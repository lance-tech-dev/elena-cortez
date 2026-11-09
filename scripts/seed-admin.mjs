// Creates the admin account, or gives an existing account the admin role.
// Run with: npm run seed:admin   (reads .env.local)
//
// Uses the service role key, so it only ever runs from your machine.
// Doesn't change the password of an account that already exists.

import { createClient } from "@supabase/supabase-js";

const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  ADMIN_EMAIL: email,
  ADMIN_INITIAL_PASSWORD: password,
} = process.env;

const missing = Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  ADMIN_EMAIL: email,
  ADMIN_INITIAL_PASSWORD: password,
})
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUser(target) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (match || data.users.length < 200) return match;
  }
}

const existing = await findUser(email);

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    app_metadata: { ...existing.app_metadata, role: "admin" },
  });
  if (error) throw error;
  console.log(`✓ ${email} already existed. Gave it the admin role (password unchanged).`);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });
  if (error) throw error;
  console.log(`✓ Created admin ${email}.`);
}
