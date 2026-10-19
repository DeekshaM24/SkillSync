import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedAreas = ["/student", "/trainer", "/admin"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedArea = protectedAreas.find((area) => path === area || path.startsWith(`${area}/`));
  const response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (protectedArea || path.startsWith("/onboarding")) {
      return NextResponse.json({ error: "Supabase is not configured. Set the project URL and anonymous key to continue." }, { status: 503 });
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: `Unable to verify your Supabase session: ${authError.message}` }, { status: 503 });
  if (!user && (protectedArea || path.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!user) return response;
  if (path === "/" || path.startsWith("/onboarding")) {
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (error) return NextResponse.json({ error: "Unable to load your profile. Please try again shortly." }, { status: 503 });
    if (profile?.role) {
      const redirect = NextResponse.redirect(new URL(`/${profile.role}`, request.url));
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
    if (path !== "/onboarding/role" && path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding/role", request.url));
    }
    if (path === "/") {
      const redirect = NextResponse.redirect(new URL("/onboarding/role", request.url));
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
    return response;
  }

  if (protectedArea) {
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (error) return NextResponse.json({ error: "Unable to load your profile. Please try again shortly." }, { status: 503 });
    if (!profile?.role) {
      const redirect = NextResponse.redirect(new URL("/onboarding/role", request.url));
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
    if (profile.role !== protectedArea.slice(1)) {
      const redirect = NextResponse.redirect(new URL(`/${profile.role}`, request.url));
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  }
  return response;
}

export const config = {
  matcher: ["/", "/onboarding/:path*", "/student/:path*", "/trainer/:path*", "/admin/:path*"],
};
