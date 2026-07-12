import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const moneyKindEnum = pgEnum("money_kind", ["income", "expense"]);
export const moneyCategoryKindEnum = pgEnum("money_category_kind", ["income", "expense", "both"]);
export const commitmentFrequencyEnum = pgEnum("commitment_frequency", ["once", "weekly", "monthly", "yearly"]);
export const commitmentStatusEnum = pgEnum("commitment_status", ["active", "paused", "completed"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
    userIdIdx: index("accounts_user_id_idx").on(account.userId),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (session) => ({
    userIdIdx: index("sessions_user_id_idx").on(session.userId),
  }),
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  }),
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    color: varchar("color", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (category) => ({
    userIdIdx: index("categories_user_id_idx").on(category.userId),
    userNameUnique: uniqueIndex("categories_user_name_unique").on(
      category.userId,
      category.name,
    ),
  }),
);

export const timeLogs = pgTable(
  "time_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 140 }),
    note: text("note"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    isRunning: boolean("is_running").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (log) => ({
    userIdIdx: index("time_logs_user_id_idx").on(log.userId),
    userStartedAtIdx: index("time_logs_user_started_at_idx").on(
      log.userId,
      log.startedAt,
    ),
    categoryIdx: index("time_logs_category_id_idx").on(log.categoryId),
    oneRunningTimerPerUser: uniqueIndex("time_logs_one_running_per_user")
      .on(log.userId)
      .where(sql`${log.isRunning} = true`),
  }),
);

export const moneyCategories = pgTable(
  "money_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    kind: moneyCategoryKindEnum("kind").default("both").notNull(),
    color: varchar("color", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (category) => ({
    userNameUnique: uniqueIndex("money_categories_user_name_unique").on(category.userId, category.name),
    userIdIdx: index("money_categories_user_id_idx").on(category.userId),
  }),
);

export const moneyCommitments = pgTable(
  "money_commitments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").notNull().references(() => moneyCategories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 140 }).notNull(),
    kind: moneyKindEnum("kind").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).default("THB").notNull(),
    firstDueOn: date("first_due_on", { mode: "string" }).notNull(),
    frequency: commitmentFrequencyEnum("frequency").notNull(),
    installmentCount: integer("installment_count"),
    remainingInstallments: integer("remaining_installments"),
    endsOn: date("ends_on", { mode: "string" }),
    status: commitmentStatusEnum("status").default("active").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (commitment) => ({
    upcomingIdx: index("money_commitments_upcoming_idx").on(commitment.userId, commitment.status, commitment.firstDueOn),
  }),
);

export const moneyTransactions = pgTable(
  "money_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").notNull().references(() => moneyCategories.id, { onDelete: "restrict" }),
    commitmentId: uuid("commitment_id").references(() => moneyCommitments.id, { onDelete: "set null" }),
    kind: moneyKindEnum("kind").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).default("THB").notNull(),
    occurredOn: date("occurred_on", { mode: "string" }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (transaction) => ({
    occurredIdx: index("money_transactions_occurred_idx").on(transaction.userId, transaction.occurredOn),
  }),
);

export const calendarConnections = pgTable("calendar_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  calendarId: text("calendar_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at"),
  scopes: text("scopes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const calendarEventLinks = pgTable(
  "calendar_event_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    commitmentId: uuid("commitment_id").notNull().references(() => moneyCommitments.id, { onDelete: "cascade" }),
    occurrenceOn: date("occurrence_on", { mode: "string" }).notNull(),
    providerEventId: text("provider_event_id").notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
    lastError: text("last_error"),
  },
  (link) => ({
    occurrenceUnique: uniqueIndex("calendar_event_links_occurrence_unique").on(link.commitmentId, link.occurrenceOn),
  }),
);

// V2 extension point: api_keys and api_request_logs tables should live here.
