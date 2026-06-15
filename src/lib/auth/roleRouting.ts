/**
 * Single source of truth for role → default route.
 *
 * Used by:
 *   - middleware.ts (Edge Runtime — keep this file dependency-free)
 *   - app/(platform)/layout.tsx
 *   - app/auth/page.tsx
 *   - app/auth/callback/page.tsx
 *   - app/(platform)/onboarding/page.tsx
 *
 * Precedence is deterministic by structure: `codebud_super_admin` is checked
 * first, so a user holding both `codebud_super_admin` and `admin` lands on
 * `/super-admin`. There is intentionally NO aliasing, fallback role, or
 * `roles[0]`-style "primary role" guess — the backend already resolves the
 * Keycloak realm roles to a single canonical role string before the frontend
 * sees it.
 */

export const AUTH_PAGE = "/auth";

export type CanonicalRole =
    | "student"
    | "mentor"
    | "admin"
    | "company"
    | "codebud_super_admin";

export function defaultRouteForRole(role: string | null | undefined): string {
    switch (role) {
        case "codebud_super_admin":
            return "/super-admin";
        case "admin":
            return "/admin";
        case "mentor":
            return "/mentor";
        case "company":
            return "/company";
        case "student":
            return "/dashboard";
        default:
            return AUTH_PAGE;
    }
}
