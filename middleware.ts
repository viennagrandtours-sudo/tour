import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { routing } from "./i18n/routing";
import { supabaseAnonKey, supabaseUrl } from "./lib/supabase-env";

const intlMiddleware = createMiddleware(routing);

const LOGIN_PATH = "/admin/login";

/**
 * The admin area lives outside the `[locale]` segment, so next-intl must not
 * touch it. Instead we refresh the Supabase session cookie and gate access.
 */
async function adminMiddleware(request: NextRequest, options: { api?: boolean } = {}) {
  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname === LOGIN_PATH;
  const isApi = options.api === true;

  const url = supabaseUrl();
  const anonKey = supabaseAnonKey();

  // No Supabase project wired up yet: let the admin area render in demo mode
  // rather than locking the owner out of a site that has no auth backend.
  if (!url || !anonKey) {
    if (isLoginRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(url, anonKey, {
    // No client JS anywhere in the admin area reads this cookie directly (the
    // login form posts through a Server Action) — force httpOnly so an XSS
    // bug elsewhere can't read the admin session token.
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" },
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        response.cookies.set({ name, value, ...options });
      },
      remove: (name: string, options: CookieOptions) => {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // A failed lookup (bad URL, project paused, network blip) must not grant
  // access — treat it as signed out and send the owner to the login screen.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("Admin session check failed:", error);
  }

  // Photo uploads POST to /api/admin/… — refresh the session cookie here, but
  // never redirect to the HTML login page (the route returns JSON 403 itself).
  if (isApi) return response;

  if (!user && !isLoginRoute) {
    const redirectUrl = new URL(LOGIN_PATH, request.url);
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/admin")) {
    return adminMiddleware(request, { api: true });
  }
  if (pathname.startsWith("/admin")) {
    return adminMiddleware(request);
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(de|en|es|it|ar|zh|pt|tr)/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
