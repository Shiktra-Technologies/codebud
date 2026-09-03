// Single source of truth for linking from the marketing site (codebud-web)
// to the product app (codebud-platform). Never fall back to a relative path:
// the auth routes do not exist in this app.
export const PLATFORM_URL = (
    process.env.NEXT_PUBLIC_PLATFORM_URL || "https://app.mycodebud.in"
).replace(/\/+$/, "");

export const PLATFORM_AUTH_URL = `${PLATFORM_URL}/auth`;
