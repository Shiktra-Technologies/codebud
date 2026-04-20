import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware — Server-side route guards
 *
 * Uses the Keycloak access token to call backend `/api/me` on protected
 * routes and enforces onboarding + role access before page code renders.
 *
 * Protected route groups:
 *   /mentor/*, /admin/*, /super-admin/*, /company/*
 *   /dashboard/*, /profile/*, /aptitude-test, /dsa-test,
 *   /permissions, /problems/*, /submitted/*, /onboarding
 *
 * Public routes (no auth):
 *   /auth, /auth/*, /, /api/*, /_next/*, /favicon.ico, static files
 */

const AUTH_PAGE = "/auth";

// Simple base64url decode (Edge Runtime compatible — no Node Buffer)
function base64UrlDecode(str: string): string {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    return atob(padded);
}

/**
 * Decode JWT payload WITHOUT verifying the signature.
 * Signature verification still happens server-side in Flask when
 * the frontend makes API calls. This middleware only does a quick
 * "is there a plausible, non-expired JWT?" check to prevent
 * unauthenticated users from even loading the page shell.
 */
function decodeJWTPayload(token: string): Record<string, any> | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        return payload;
    } catch {
        return null;
    }
}

function isTokenExpired(payload: Record<string, any>): boolean {
    if (!payload.exp) return false; // no expiry → treat as valid
    return Math.floor(Date.now() / 1000) > payload.exp;
}

function getDefaultRouteByRole(role: string): string {
    if (role === "codebud_super_admin" || role === "admin") return "/admin";
    if (role === "mentor") return "/mentor";
    if (role === "company") return "/company";
    if (role === "student") return "/dashboard";
    return AUTH_PAGE;
}

function isProtectedPath(pathname: string): boolean {
    return (
        pathname.startsWith("/admin") ||
        pathname.startsWith("/mentor") ||
        pathname.startsWith("/super-admin") ||
        pathname.startsWith("/company") ||
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/aptitude-test") ||
        pathname.startsWith("/dsa-test") ||
        pathname.startsWith("/permissions") ||
        pathname.startsWith("/problems") ||
        pathname.startsWith("/submitted")
    );
}

async function fetchBackendMe(request: NextRequest, token: string) {
    try {
        const meUrl = new URL("/api/proxy/me", request.url);
        const response = await fetch(meUrl.toString(), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (!data?.success) {
            return null;
        }

        if (typeof data.role !== "string") {
            return null;
        }

        return {
            role: data.role,
            is_new_user: Boolean(data.is_new_user),
            is_onboarded: Boolean(data.is_onboarded),
        };
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── Try to read the token ──
    // Priority: cookie → Authorization header (for programmatic access)
    let token =
        request.cookies.get("codebud_token")?.value ||
        null;

    if (!token) {
        const authHeader = request.headers.get("authorization") || "";
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.slice(7);
        }
    }

    // Safety: never redirect auth page (prevents infinite loops)
    if (pathname.startsWith("/auth")) {
        return NextResponse.next();
    }

    if (!isProtectedPath(pathname)) {
        return NextResponse.next();
    }

    // Decode only for quick expiry screening before backend /api/me verification.
    const payload = token ? decodeJWTPayload(token) : null;
    const isValid = payload !== null && !isTokenExpired(payload);
    if (!token || !isValid) {
        return NextResponse.redirect(new URL(AUTH_PAGE, request.url));
    }

    const me = await fetchBackendMe(request, token);
    if (!me) {
        return NextResponse.redirect(new URL(AUTH_PAGE, request.url));
    }

    const needsOnboarding = !me.is_onboarded || me.is_new_user;

    // Onboarding route — requires auth; block already-onboarded users.
    if (pathname.startsWith("/onboarding")) {
        if (!needsOnboarding) {
            return NextResponse.redirect(new URL(getDefaultRouteByRole(me.role), request.url));
        }
        return NextResponse.next();
    }

    if (needsOnboarding) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (pathname.startsWith("/admin")) {
        if (me.role !== "admin" && me.role !== "codebud_super_admin") {
            return NextResponse.redirect(new URL(getDefaultRouteByRole(me.role), request.url));
        }
        return NextResponse.next();
    }

    if (pathname.startsWith("/mentor")) {
        if (me.role !== "mentor" && me.role !== "admin" && me.role !== "codebud_super_admin") {
            return NextResponse.redirect(new URL(getDefaultRouteByRole(me.role), request.url));
        }
        return NextResponse.next();
    }

    if (pathname.startsWith("/super-admin")) {
        if (me.role !== "codebud_super_admin") {
            return NextResponse.redirect(new URL(getDefaultRouteByRole(me.role), request.url));
        }
        return NextResponse.next();
    }

    if (pathname.startsWith("/company")) {
        if (me.role !== "company" && me.role !== "codebud_super_admin") {
            return NextResponse.redirect(new URL(getDefaultRouteByRole(me.role), request.url));
        }
        return NextResponse.next();
    }

    // Authenticated + onboarded routes
    return NextResponse.next();
}

/**
 * Only run middleware on routes that are NOT:
 * - Next.js internals (_next/*)
 * - Static files (images, fonts, etc.)
 * - API routes (handled by Flask, not Next.js)
 * - Auth page itself
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static, _next/image, _next/data
         * - favicon.ico, robots.txt, sitemap.xml
         * - Files with extensions (.png, .jpg, .svg, .css, .js, etc.)
         * - /auth paths
         */
        "/((?!_next|api|auth|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
    ],
};
