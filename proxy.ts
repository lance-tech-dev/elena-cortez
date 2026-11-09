import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdmin } from "@/lib/auth-role";

// Next 16 renamed middleware to proxy. This runs only on /admin and /login:
//  - refreshes the Supabase session cookie
//  - /admin (and anything under it) without an admin session → /login
//  - /login with an admin session → /admin
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
