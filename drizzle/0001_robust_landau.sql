ALTER TABLE "calendar_connections" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD COLUMN "expires_at" integer;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD COLUMN "scopes" text;