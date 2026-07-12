# codebud-platform

The authenticated CodeBud product app (Next.js App Router): dashboard, courses,
DSA problems & tests, jobs, mentorship, onboarding, and the admin/mentor/company/exec
portals. Auth is Keycloak. The browser calls the Flask backend **directly**
(cross-origin) — the backend enforces an explicit CORS allowlist
(`CORS_ORIGINS`) with credentials support, and the prod domains
(app.mycodebud.in ↔ auth.mycodebud.in) are same-site so `SameSite=Lax` cookies
flow. The former same-origin `/api/proxy` route was removed once backend CORS
was hardened.

## Development

```bash
npm install
cp .env.example .env.local   # defaults point at http://localhost:5000 backend
npm run dev                  # http://localhost:3000
```

The Flask backend (`server/codebud-auth/server/app.py`) must be running on :5000.
The marketing site (`codebud-web`) runs separately on :3001.

## Environment variables

See [.env.example](.env.example) for the complete annotated list. For a
production deploy, set:

| Variable | Prod value |
|---|---|
| `BACKEND_BASE_URL` | `https://auth.mycodebud.in` |
| `NEXT_PUBLIC_BACKEND_BASE_URL` | same as above |
| `NEXT_PUBLIC_KEYCLOAK_URL` | `https://keycloak.mycodebud.in` |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | `codebud` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | `codebud-app` |
| `NEXT_PUBLIC_USE_BROWSER_FIRST` / `NEXT_PUBLIC_FALLBACK_TO_SERVER` | `true` / `true` |

No code changes are needed between environments — env vars only.

**Keycloak prerequisites for a new environment:** the `codebud-app` client must
list `<platform-origin>/auth/callback` in *Valid Redirect URIs* and
`<platform-origin>` in *Web Origins* (the browser exchanges the auth code with
Keycloak directly).

## Adding DSA problems

The problem **list** comes from the backend (`GET /api/problems`); the problem
**workspace** at `/problems/[id]` is keyed by slug in `problemsData` inside
`src/app/(platform)/problems/[id]/page.tsx` (it carries starter code, examples,
and test cases the backend doesn't have). When adding a problem:

1. Add it to the backend problem bank (`dsa_analyzer.py`).
2. Add a matching entry to `problemsData` in `problems/[id]/page.tsx`.
3. If the slugified backend title differs from your chosen slug, add an alias in
   `PROBLEM_SLUG_ALIASES` in `src/app/(platform)/problems/page.tsx` and add the
   slug to `KNOWN_PROBLEM_SLUGS` there.

Problems without a slug entry render in the list but show "Problem Not Found"
when opened. (Longer term: serve workspace content from the backend and delete
the map.)
