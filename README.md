# MPF Blog Portal

Ghost-like publishing platform (Phase 1 MVP) built with **Next.js**, **Tailwind CSS**, **Lexical**, **Auth.js**, **Apollo Client**, and **Cloudinary**. Content is served from the GraphQL API.

## Features

- Role-based admin (`AUTHOR`, `EDITOR`, `ADMIN`, `OWNER`)
- Posts & pages with Lexical editor, autosave, revisions, preview, scheduling
- Categories, tags, series
- Cloudinary uploads + GraphQL media library
- Public blog with SEO metadata, Open Graph, JSON-LD, RSS, sitemap
- Full-text search
- Page-view analytics dashboard

## Setup

1. Copy env and fill values:

```bash
cp .env.example .env.local
```

Required:

- `AUTH_SECRET` — random secret for Auth.js
- `NEXT_PUBLIC_SITE_URL` — e.g. `http://localhost:3000`
- `NEXT_PUBLIC_GRAPHQL_URL` / `GRAPHQL_URL` — GraphQL endpoint
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — for media uploads
- `CRON_SECRET` — bearer token for `/api/cron/publish`

2. Install & run:

```bash
npm install
npm run dev
```

3. Open:

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- Login: [http://localhost:3000/login](http://localhost:3000/login)

Sign in with a GraphQL blog-portal account (not a local seed user).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Scheduling

Due scheduled posts/pages are published by:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/publish
```

On Vercel, `vercel.json` runs this every 5 minutes.

## Project structure

```
src/app/(public)/     Public site routes
src/app/(admin)/admin Admin dashboard
src/app/api/          Auth, Cloudinary upload, cron
src/components/       Editor, admin, public UI
src/graphql/          Operations
src/lib/              Auth, Apollo, RBAC, SEO, validators
```

## Roles

| Role | Capabilities |
|---|---|
| AUTHOR | Own drafts, media upload |
| EDITOR | Edit/publish any content, taxonomies |
| ADMIN | Users, settings, analytics, media delete |
| OWNER | Full access including OWNER role assignment |
