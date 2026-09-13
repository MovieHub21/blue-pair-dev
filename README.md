# Blue Pair Developer Control Center

A **separate Next.js application** for private Blue Pair operations. It is intentionally independent from the main Blue Pair repository.

## What this does

- Uses the existing Blue Pair Supabase/Postgres backend.
- Does **not** add a `developer` role.
- Does **not** add a developer table, developer migration, developer profile, or developer identity.
- Does **not** modify the main site's source code.
- Can read the existing database schema and records.
- Can operate the existing `site_settings` maintenance row.
- Can inspect existing audit logs.
- Can manage Supabase Auth users through the server-only Admin API.
- Can list existing storage buckets.
- Includes an optional server-side SQL console for complete database-level control.

## Security model

Authentication is intentionally left to you. The app does not contain a developer login or developer role.

Your authentication/reverse-proxy layer must set an **HttpOnly** cookie named by `DEV_CONTROL_COOKIE` whose value equals `DEV_CONTROL_SECRET`. Middleware and every privileged API route verify that secret server-side with timing-safe comparison.

For production, use a long random secret and ideally put this app behind your own SSO, VPN, Cloudflare Access, Tailscale, or another identity-aware proxy. Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` to the browser.

## Environment

Copy `.env.example` to `.env.local` and fill it in.

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `DATABASE_URL` (server only)
- `SITE_ENVIRONMENT` (`development`, `preview`, or `production`)
- `DEV_CONTROL_SECRET`

Optional:

- `ENABLE_SQL_CONSOLE=true` to enable raw SQL.
- `NEXT_PUBLIC_SITE_URL` for display/integration work.

## Run

```bash
npm install
npm run dev
```

Then connect your authentication layer so it establishes the private cookie before opening the app.

## Deploy separately

Deploy this folder as a **different Vercel project**. Give it a private domain such as `dev.bluepairhotel.com`.

The main Blue Pair site does not need a developer role or developer table. Both applications simply point at the same backend.

## Important

The SQL console is powerful by design. Keep it disabled until needed. Even though a small destructive-operation filter is included, a privileged database connection can still change or delete application data. Use backups and only expose the control center to trusted operators.
