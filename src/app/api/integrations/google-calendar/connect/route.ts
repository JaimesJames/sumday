import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/server/auth/session";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", request.url));
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return NextResponse.redirect(new URL("/money?calendar=not-configured", request.url));
  const state = randomBytes(32).toString("hex");
  const origin = new URL(request.url).origin;
  const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorization.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/integrations/google-calendar/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.app.created",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  }).toString();
  const response = NextResponse.redirect(authorization);
  response.cookies.set("dayly_calendar_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
