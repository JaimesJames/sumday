# Authentication Technical Overview

This document describes how credentials-based authentication is implemented in this project, including sign-up, sign-in, session handling, and route protection.

## Stack and Libraries

- Next.js App Router
- Auth.js / NextAuth
- Credentials provider (email + password)
- Optional Google OAuth provider
- Drizzle ORM + Drizzle Adapter for Auth.js
- Zod for input validation
- bcryptjs for password hashing and password verification

## Authentication Architecture

### Core Auth Configuration

Auth.js is configured in `src/server/auth/config.ts`.

Main responsibilities:
- Registers providers:
  - `CredentialsProvider` for email/password login
  - `GoogleProvider` only if `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are present
- Uses `DrizzleAdapter` with app tables (`users`, `accounts`, `sessions`, `verificationTokens`)
- Uses JWT session strategy
- Defines custom auth pages:
  - Sign-in page: `/login`
  - Error page: `/login`
- Extends JWT/session callbacks to include `user.id` in `session.user.id`

### Auth Route Handler

Auth route is defined in:
- `src/app/api/auth/[...nextauth]/route.ts`

This exports NextAuth handlers for both `GET` and `POST`.

## Sign-Up Flow (Credentials)

### UI Entry

Sign-up page:
- `src/app/register/page.tsx`

Form component:
- `src/components/auth/register-form.tsx` (client component)

Key behavior:
- Uses `useActionState` with server action `registerAction`
- Submit button explicitly uses `type="submit"`
- Shows pending state and error message in UI
- Includes targeted debug logs for click and submit stages

### Server Action

Server action:
- `src/app/(auth)/actions.ts`

Flow:
1. Validates input using `registerSchema` from `src/server/validators/auth.ts`
2. Hashes password with bcrypt
3. Checks if user already exists by email
4. Handles cases:
   - Existing credentials account: returns UI error
   - Existing OAuth-only account (no password): updates user with password hash
   - New user: inserts new user row
5. Redirects to `/login` with query flags when successful

## Sign-In Flow (Credentials)

### UI Entry

Sign-in page:
- `src/app/login/page.tsx` (client component)

Key behavior:
- Form uses explicit `onSubmit` handler
- Submit button explicitly uses `type="submit"`
- Calls `signIn("credentials", { redirect: false })`
- On success: redirects to `/dashboard`
- On failure: shows visible UI error
- Includes targeted debug logs:
  - Button click
  - Form submit fired
  - Before `signIn` call
  - Returned `signIn` status/error
  - Caught exception path

### Credentials Authorize Logic

Inside `CredentialsProvider.authorize` in `src/server/auth/config.ts`:
1. Validates payload with Zod (`email`, `password`)
2. Finds user by email
3. Verifies user has `passwordHash`
4. Compares password using `bcrypt.compare`
5. Returns safe user object: `{ id, email, name }`
6. Returns `null` for invalid credentials

The authorize flow includes focused server logs to confirm whether request execution reached backend auth logic.

## Session and Protected Routes

Session helpers:
- `src/server/auth/session.ts`

Functions:
- `getCurrentSession()` wraps `getServerSession(authOptions)`
- `requireUser()` enforces authenticated access and redirects to `/login` if not signed in

Example protected route:
- `src/app/(protected)/dashboard/page.tsx`

The page calls `requireUser()`, which confirms session presence and user identity.

## Validation and Types

Validation:
- `src/server/validators/auth.ts`
  - `registerSchema` validates sign-up payload

Type augmentation:
- `src/types/next-auth.d.ts`
  - Extends `session.user` with typed `id`

## Environment Variables

Expected auth-related environment values include:
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID` (optional, for Google provider)
- `AUTH_GOOGLE_SECRET` (optional, for Google provider)

When Google env vars are missing, Google sign-in is disabled and credentials auth still works.

## Debugging Strategy Used

To troubleshoot "button click does nothing" and "no network request" symptoms, debug points were added at:
- Login submit button click
- Login form submit handler
- Before and after `signIn("credentials")`
- Register submit button click
- Register form submit handler
- Register server action entry + validation branch
- Credentials `authorize` callback entry/success

This provides an end-to-end trace from UI interaction to backend authorization.

## Known Behavior and Recommendations

- Use explicit `type="submit"` for all form submit buttons.
- Keep user-facing error messages visible for all expected failure states.
- Prefer targeted logs over broad logging noise.
- Keep `requireUser()` checks in protected App Router segments.

