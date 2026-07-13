import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { calendarConnections } from "@/server/db/schema";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  const url = new URL(request.url);
  const stateCookie = request.headers.get("cookie")?.match(/(?:^|; )dayly_calendar_state=([^;]+)/)?.[1];
  if (!session?.user?.id || !stateCookie || stateCookie !== url.searchParams.get("state")) return NextResponse.redirect(new URL("/money?calendar=invalid-state", request.url));
  const code = url.searchParams.get("code");
  if (!code || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return NextResponse.redirect(new URL("/money?calendar=failed", request.url));
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({
    code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: `${url.origin}/api/integrations/google-calendar/callback`, grant_type: "authorization_code",
  }) });
  if (!response.ok) return NextResponse.redirect(new URL("/money?calendar=failed", request.url));
  const token = await response.json() as { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
  const [existing] = await db.select().from(calendarConnections).where(eq(calendarConnections.userId, session.user.id)).limit(1);
  const values = { accessToken: token.access_token, refreshToken: token.refresh_token ?? existing?.refreshToken ?? null, expiresAt: Math.floor(Date.now() / 1000) + token.expires_in, scopes: token.scope ?? null, updatedAt: new Date() };
  if (existing) await db.update(calendarConnections).set(values).where(eq(calendarConnections.id, existing.id));
  else await db.insert(calendarConnections).values({ userId: session.user.id, ...values });
  const redirect = NextResponse.redirect(new URL("/money?calendar=connected", request.url));
  redirect.cookies.delete("dayly_calendar_state");
  return redirect;
}
