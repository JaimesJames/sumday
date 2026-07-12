# Deployment Path

## Current decision

Keep local PostgreSQL and Drizzle while building the MVP. Preserve portability so
production can use Supabase-hosted PostgreSQL without replacing Drizzle.

## Proposed production shape

- Application: Vercel-hosted Next.js.
- Database: Supabase PostgreSQL or another managed PostgreSQL service.
- ORM and migrations: Drizzle.
- Authentication: existing NextAuth initially; revisit only when multi-user production needs justify it.
- Notifications: Google Calendar reminders, not a custom push service.

## Promotion gates

Production deployment is enabled only after:

- Money schema and migrations are committed and tested on an empty database.
- Calendar integration has automated mapping/idempotency tests.
- Secrets and environment variables are documented.
- A staging deployment passes login, time logging, Money CRUD, and Calendar smoke tests.
- Backup, restore, and token-revocation behavior are documented.

## Required environments

- Local: developer PostgreSQL and localhost OAuth callbacks.
- Preview: isolated database or schema with no production data.
- Production: managed PostgreSQL, production OAuth client, and protected secrets.

## CI/CD follow-up

When hosting is selected, add a production release workflow modeled after the
repository quality gate. A production tag must validate, point to `main`, run CI,
apply Drizzle migrations once, deploy the application, and run public smoke tests.

Do not add provider tokens, production URLs, or deployment commands before the
provider accounts and environments exist.
