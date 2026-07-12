# Google Calendar Sync

## User flow

1. The user selects `Connect Google Calendar` from Money settings.
2. Dayly requests the minimum Calendar scopes needed to manage Dayly events.
3. Dayly creates or reuses a dedicated calendar named `Dayly - Money`.
4. The user selects `Sync` from the Commitments view.
5. Dayly creates or updates events and reports a per-item sync result.

The MVP is manual sync. Automatic background sync is a later enhancement.

## Event contract

- One Calendar event represents one commitment occurrence.
- The summary contains the commitment name and formatted amount.
- The description contains category, installment information, and a Dayly record ID.
- The default reminders are three days before and at 09:00 on the due date.
- Events are written only to the dedicated Dayly calendar.

## Idempotency

- Look up `calendar_event_links` by commitment and occurrence date.
- Create an event only when no link exists.
- Update the existing event when its content hash changes.
- Treat a provider `not found` response as a deleted event and recreate it once.
- Never infer identity from event titles.

## Authorization and security

- Keep Google authorization separate from NextAuth login authorization.
- Request offline access only when automatic sync is introduced.
- Never expose provider tokens to client components or logs.
- Encrypt refresh tokens at rest or use the deployment platform's managed secret storage.
- Revocation disconnects the integration but does not delete Money data.

## Failure behavior

- Saving a transaction or commitment never depends on Google availability.
- A partial sync records successes and failures independently.
- Retrying is safe because sync is idempotent.
- Deleting a commitment asks whether its linked future Calendar events should also be removed.

## Test strategy

- Unit-test recurrence expansion and event payload mapping.
- Integration-test link creation, update, retry, and deleted-event recovery.
- Mock Google APIs in CI; do not place real Google credentials in GitHub Actions.
- Run a manual sandbox-account smoke test before production release.
