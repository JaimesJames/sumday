import { createHash } from "node:crypto";
import { addYears, format } from "date-fns";
import { and, eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { db } from "@/server/db";
import { calendarConnections, calendarEventLinks, moneyCommitments } from "@/server/db/schema";
import { expandCommitmentOccurrences } from "@/server/services/commitment-occurrences";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export async function getCalendarConnectionState(userId: string) {
  const [connection] = await db.select().from(calendarConnections).where(eq(calendarConnections.userId, userId)).limit(1);
  return { googleConnected: Boolean(connection?.refreshToken || connection?.accessToken), calendarReady: Boolean(connection?.calendarId) };
}

async function getAccessToken(userId: string) {
  const [connection] = await db.select().from(calendarConnections).where(eq(calendarConnections.userId, userId)).limit(1);
  if (!connection) throw new Error("Connect Google Calendar before syncing.");
  const validUntil = (connection.expiresAt ?? 0) * 1000;
  if (connection.accessToken && validUntil > Date.now() + 60_000) return connection.accessToken;
  if (!connection.refreshToken || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) throw new Error("Google offline access is unavailable. Connect Calendar again.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, grant_type: "refresh_token", refresh_token: connection.refreshToken }),
  });
  if (!response.ok) throw new Error(`Google token refresh failed (${response.status}).`);
  const token = await response.json() as { access_token: string; expires_in: number };
  await db.update(calendarConnections).set({ accessToken: token.access_token, expiresAt: Math.floor(Date.now() / 1000) + token.expires_in, updatedAt: new Date() }).where(eq(calendarConnections.userId, userId));
  return token.access_token;
}

async function googleFetch<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CALENDAR_API}${path}`, { ...init, headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json", ...init?.headers } });
  if (!response.ok) throw new Error(`Google Calendar request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

async function ensureCalendar(userId: string, accessToken: string) {
  const [existing] = await db.select().from(calendarConnections).where(eq(calendarConnections.userId, userId)).limit(1);
  if (existing?.calendarId) return existing.calendarId;
  const created = await googleFetch<{ id: string }>(accessToken, "/calendars", { method: "POST", body: JSON.stringify({ summary: "Dayly - Money", timeZone: "Asia/Bangkok" }) });
  await db.insert(calendarConnections).values({ userId, calendarId: created.id }).onConflictDoUpdate({ target: calendarConnections.userId, set: { calendarId: created.id, updatedAt: new Date() } });
  return created.id;
}

function eventPayload(commitment: typeof moneyCommitments.$inferSelect, occurrenceOn: string) {
  const start = `${occurrenceOn}T09:00:00+07:00`;
  const end = `${occurrenceOn}T09:15:00+07:00`;
  return {
    summary: `${commitment.name} - ${formatMoney(commitment.amountMinor, commitment.currency)}`,
    description: [`Dayly commitment: ${commitment.id}`, commitment.note ?? "", commitment.remainingInstallments != null ? `Remaining installments: ${commitment.remainingInstallments}` : ""].filter(Boolean).join("\n"),
    start: { dateTime: start, timeZone: "Asia/Bangkok" }, end: { dateTime: end, timeZone: "Asia/Bangkok" },
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 4320 }, { method: "popup", minutes: 0 }] },
  };
}

export async function syncMoneyCommitmentsToGoogle(userId: string) {
  const token = await getAccessToken(userId);
  const calendarId = await ensureCalendar(userId, token);
  const commitments = await db.select().from(moneyCommitments).where(and(eq(moneyCommitments.userId, userId), eq(moneyCommitments.status, "active")));
  const horizon = format(addYears(new Date(), 1), "yyyy-MM-dd");
  let created = 0;
  let updated = 0;

  for (const commitment of commitments) {
    for (const occurrenceOn of expandCommitmentOccurrences(commitment, horizon)) {
      const payload = eventPayload(commitment, occurrenceOn);
      const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
      const [link] = await db.select().from(calendarEventLinks).where(and(eq(calendarEventLinks.commitmentId, commitment.id), eq(calendarEventLinks.occurrenceOn, occurrenceOn))).limit(1);
      if (link?.contentHash === hash) continue;
      if (link) {
        await googleFetch(token, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(link.providerEventId)}`, { method: "PUT", body: JSON.stringify(payload) });
        await db.update(calendarEventLinks).set({ contentHash: hash, lastSyncedAt: new Date(), lastError: null }).where(eq(calendarEventLinks.id, link.id));
        updated += 1;
      } else {
        const event = await googleFetch<{ id: string }>(token, `/calendars/${encodeURIComponent(calendarId)}/events`, { method: "POST", body: JSON.stringify(payload) });
        await db.insert(calendarEventLinks).values({ userId, commitmentId: commitment.id, occurrenceOn, providerEventId: event.id, contentHash: hash });
        created += 1;
      }
    }
  }
  return { created, updated };
}
