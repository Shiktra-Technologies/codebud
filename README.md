# codebud

This repo holds CodeBud's frontend apps, split from a single monorepo into two
independently deployable Next.js apps:

- **[frontend/codebud-platform](frontend/codebud-platform)** — the
  authenticated product app (dashboard, courses, DSA problems, jobs,
  mentorship, admin/mentor/company/exec portals). Deployed to
  `app.mycodebud.in`.
- **[frontend/codebud-web](frontend/codebud-web)** — the public marketing
  site (landing page, about, blog, careers, contact, privacy, terms).
  Deployed to `mycodebud.in`. Makes no backend calls; only links to the
  platform app for the "Get Started" / login handoff.

Each app has its own `README.md`, `.env.example`, and `package.json` — see
those for setup instructions. The backend lives in separate repos
(`codebud-auth`, `codebud-be`), not in this one.

## History

`main` previously held a single combined Next.js app at the repo root (see
branch `backup/main-before-frontend-update-20260710` for that snapshot). It
was split into the two apps above; this repo's `main` now reflects that split.
