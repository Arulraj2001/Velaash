import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Refreshes auth tokens, manages session cookies, and enforces route protection
 * for Customer (/account/*) and Admin (/admin/*) gates.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Gracefully handle unconfigured placeholder credentials during initial setup or tests
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
    return supabaseResponse;
  }

  const rawClient = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const supabase = rawClient as unknown as SupabaseClient<Database>;

  // Refresh auth tokens if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const fullPath = `${pathname}${search}`;

  // ==========================================
  // 1. ADMIN ROUTE PROTECTION (/admin/*)
  // ==========================================
  if (pathname.startsWith("/admin")) {
    const isAdminLogin = pathname === "/admin/login";

    if (!user) {
      if (!isAdminLogin) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("returnUrl", fullPath);
        return NextResponse.redirect(loginUrl);
      }
      return supabaseResponse;
    }

    // User is logged in — verify whether they exist in admin_users
    const { data: adminRecord } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminRecord) {
      // User is logged in as a regular customer but attempting to access /admin
      if (!isAdminLogin) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(loginUrl);
      }
      return supabaseResponse;
    }

    // User is a verified admin: if visiting /admin/login, redirect to console
    if (isAdminLogin) {
      const returnUrl = request.nextUrl.searchParams.get("returnUrl") || "/admin";
      return NextResponse.redirect(new URL(returnUrl, request.url));
    }

    return supabaseResponse;
  }

  // ==========================================
  // 2. CUSTOMER ACCOUNT ROUTE PROTECTION (/account/*)
  // ==========================================
  if (pathname.startsWith("/account")) {
    const isCustomerLogin = pathname === "/account/login";
    const isAuthCallback = pathname.startsWith("/account/auth/callback");

    if (isAuthCallback) {
      return supabaseResponse;
    }

    if (!user) {
      if (!isCustomerLogin) {
        const loginUrl = new URL("/account/login", request.url);
        loginUrl.searchParams.set("returnUrl", fullPath);
        return NextResponse.redirect(loginUrl);
      }
      return supabaseResponse;
    }

    // User is logged in — if visiting /account/login, redirect to account dashboard
    if (isCustomerLogin) {
      const returnUrl = request.nextUrl.searchParams.get("returnUrl") || "/account";
      return NextResponse.redirect(new URL(returnUrl, request.url));
    }

    return supabaseResponse;
  }

  // ==========================================
  // 3. PUBLIC & GUEST CHECKOUT ROUTES
  // ==========================================
  // Browsing, catalog, cart, and checkout remain fully open to guests without forced login.
  return supabaseResponse;
}
