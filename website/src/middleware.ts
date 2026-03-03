import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware — Server-side route guards
 *
 * Checks for the `codebud_token` JWT cookie (or Authorization header)
 * before allowing access to protected routes. This runs at the edge
 * BEFORE any page code or React renders.
 *
 * Protected route groups:
 *   /mentor/*       → requires valid JWT with role mentor, admin, or super_admin
 *   /admin/*        → requires valid JWT with role admin or super_admin
 *   /super-admin/*  → requires valid JWT with role super_admin
 *   /dashboard/*    → requires valid JWT (any role)
 *   /profile/*      → requires valid JWT (any role)
 *   /aptitude-test  → requires valid JWT (any role)
 *   /dsa-test       → requires valid JWT (any role)
 *   /permissions    → requires valid JWT (any role)
 *   /problems/*     → requires valid JWT (any role)
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

export function middleware(request: NextRequest) {
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

    // ── Decode ──
    const payload = token ? decodeJWTPayload(token) : null;
    const isValid = payload !== null && !isTokenExpired(payload);
    const role = isValid ? (payload?.role || "student") : null;

    // ── Route matching ──

    // Safety: never redirect auth page (prevents infinite loops)
    if (pathname.startsWith("/auth")) {
        return NextResponse.next();
    }

    // Admin routes
    if (pathname.startsWith("/admin")) {
        if (!isValid) {
            return NextResponse.redirect(new URL(AUTH_PAGE, request.url));
        }
        if (role !== "admin" && role !== "super_admin") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Mentor routes
    if (pathname.startsWith("/mentor")) {
        if (!isValid) {
            return NextResponse.redirect(new URL(AUTH_PAGE, request.url));
        }
        if (role !== "mentor" && role !== "admin" && role !== "super_admin") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Super admin routes
    if (pathname.startsWith("/super-admin")) {
        if (!isValid) {
            return NextResponse.redirect(new URL(AUTH_PAGE, request.url));
        }
        if (role !== "super_admin") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Authenticated-only routes (any role)
    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/aptitude-test") ||
        pathname.startsWith("/dsa-test") ||
        pathname.startsWith("/permissions") ||
        pathname.startsWith("/problems") ||
        pathname.startsWith("/submitted")
    ) {
        if (!isValid) {
            return NextResponse.redirect(new URL(AUTH_PAGE, request.url));
        }
        return NextResponse.next();
    }

    // Everything else → allow
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
