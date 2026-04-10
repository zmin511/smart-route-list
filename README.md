# Smart Route List Admin

Admin UI for editing `smart-route-list.txt` directly in the same GitHub repository used by the primary node.

## Project layout

- `routes.json` - editable source data
- `smart-route-list.txt` - generated output used by the primary node
- `app/`, `components/`, `lib/` - Next.js app for Vercel

## How it works

1. Vercel deploys the Next.js app from this repository.
2. You sign in with the admin username and password from environment variables.
3. The admin UI reads `routes.json`.
4. After editing, the admin UI updates:
   - `routes.json`
   - `smart-route-list.txt`
5. The primary node continues reading `smart-route-list.txt` from the repository root.

## Environment variables

See `.env.example`.

Required values:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `AUTH_SECRET`
- `GITHUB_TOKEN`
- `GITHUB_OWNER=zmin511`
- `GITHUB_REPO=smart-route-list`
- `GITHUB_BRANCH=main`
- `ROUTES_JSON_PATH=routes.json`
- `ROUTES_TXT_PATH=smart-route-list.txt`

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Deployment

Connect this repository to Vercel and add the environment variables from `.env.example`.
