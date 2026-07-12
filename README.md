# Dayly

Colorful personal time logging app built with Next.js, TypeScript, Tailwind, PostgreSQL, Drizzle, NextAuth, Zod, and date-fns.

## Environment Variables

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- `AUTH_URL` (or `NEXTAUTH_URL`)
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` for Google OAuth (or `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`)

Google OAuth callback URL for local dev:

- `http://localhost:3000/api/auth/callback/google`

Google Calendar integration callback URL for local dev:

- `http://localhost:3000/api/integrations/google-calendar/callback`

Enable the Google Calendar API for the OAuth project and register both callback URLs.
Calendar access is requested separately from sign-in when the user selects
`Connect Google Calendar` in Money.

## Setup

1. `npm install`
2. `npm run db:push`
3. Optional: `npm run db:seed`
4. `npm run dev`

## Routes

- Public: `/login`, `/register`
- Protected: `/dashboard`, `/logs`, `/categories`, `/settings`

## V2 Prep Notes

- Future API key and request log tables should be added in `src/server/db/schema.ts`.
- Future API key management UI should be added in `src/app/(protected)/settings/page.tsx`.
