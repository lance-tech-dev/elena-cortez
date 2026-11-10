import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdmin } from "@/lib/auth-role";
import {
  IDLE_TIMEOUT_MS,
  LAST_ACTIVE_COOKIE,
  SERVER_GRACE_MS,
  lastActiveCookieOptions,
} from "@/lib/session";

// Next 16 renamed middleware to proxy. This runs only on /admin and /login:
//  - refreshes the Supabase session cookie
//  - /admin (and anything under it) without an admin session → /login
//  - /login with an admin session → /admin
//  - signs the admin out after 30 minutes without a request (lib/session.ts)
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Keeps CDNs from caching a response that carries a session cookie.
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const signedIn = isAdmin(data?.claims);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !signedIn) {
    return redirectTo("/login", request, response);
  }

  if (pathname.startsWith("/admin") && signedIn) {
    const now = Date.now();
    const lastActive = Number(request.cookies.get(LAST_ACTIVE_COOKIE)?.value);

    // Login always sets this cookie, so a missing or unreadable one means the
    // session can't prove recent activity (e.g. back after the cookie expired,
    // or signed in before this check existed): treat it as expired.
    if (!lastActive || now - lastActive > IDLE_TIMEOUT_MS + SERVER_GRACE_MS) {
      // "local": only this browser. The default would also sign out every other device.
      await supabase.auth.signOut({ scope: "local" }); // clears the session cookies via setAll
      const params = new URLSearchParams({ reason: "expired", next: pathname });
      const redirect = redirectTo(`/login?${params}`, request, response);
      redirect.cookies.delete(LAST_ACTIVE_COOKIE);
      return redirect;
    }

    response.cookies.set(LAST_ACTIVE_COOKIE, String(now), lastActiveCookieOptions);
  }
  if (pathname === "/login" && signedIn) {
    return redirectTo("/admin", request, response);
  }

  return response;
}

/** Redirect while keeping any refreshed session cookies. */
function redirectTo(path: string, request: NextRequest, from: NextResponse) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
