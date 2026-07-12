# codebud-web

The public CodeBud marketing site (Next.js, fully static): landing page, about,
blog, careers, contact, privacy, terms. It makes **no backend calls** and holds
no auth state — its only job is content plus the "Get Started" handoff to the
platform app.

## Development

```bash
npm install
cp .env.example .env.local   # points Get Started at http://localhost:3000
npm run dev                  # http://localhost:3001
```

## Environment variables

One variable (see [.env.example](.env.example)):

| Variable | Prod value |
|---|---|
| `NEXT_PUBLIC_PLATFORM_URL` | `https://app.mycodebud.in` |

All "Get Started" / "Start Learning" / login CTAs resolve through
`src/lib/platformUrl.ts` using this variable. No code changes are needed
between environments.
