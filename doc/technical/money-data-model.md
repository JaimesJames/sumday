# Money Data Model

## Design rules

- Every domain row includes `userId`, even while Dayly is single-user locally.
- Monetary values are stored as integer minor units, for example 1050 for THB 10.50.
- Dates representing a due day use a date column; event timestamps include a timezone.
- External provider identifiers are stored separately from domain records.

## Tables

### `money_categories`

- `id` UUID primary key.
- `user_id` UUID, foreign key to users.
- `name` varchar(80).
- `kind` enum: income, expense, or both.
- `color` varchar(20).
- `created_at`, `updated_at`.
- Unique index on `(user_id, name)`.

### `money_transactions`

- `id` UUID primary key.
- `user_id` UUID, foreign key to users.
- `category_id` UUID, foreign key to money categories.
- `kind` enum: income or expense.
- `amount_minor` bigint, greater than zero.
- `currency` char(3), initially THB.
- `occurred_on` date.
- `note` text, optional.
- `commitment_id` UUID, optional origin reference.
- `created_at`, `updated_at`.
- Index on `(user_id, occurred_on)`.

### `money_commitments`

- `id` UUID primary key.
- `user_id` UUID, foreign key to users.
- `category_id` UUID, foreign key to money categories.
- `name` varchar(140).
- `kind` enum: income or expense.
- `amount_minor` bigint, greater than zero.
- `currency` char(3).
- `first_due_on` date.
- `frequency` enum: once, weekly, monthly, or yearly.
- `installment_count` integer, optional and greater than zero.
- `remaining_installments` integer, optional and non-negative.
- `ends_on` date, optional.
- `status` enum: active, paused, or completed.
- `created_at`, `updated_at`.
- Index on `(user_id, status, first_due_on)`.

### `calendar_connections`

- `id` UUID primary key.
- `user_id` UUID, unique foreign key to users.
- `provider` enum, initially google.
- `provider_account_id` text.
- `calendar_id` text.
- Encrypted refresh token material or a reference to a managed secret.
- Granted scopes and token expiry metadata.
- `created_at`, `updated_at`.

### `calendar_event_links`

- `id` UUID primary key.
- `user_id` UUID, foreign key to users.
- `commitment_id` UUID, foreign key to commitments.
- `occurrence_on` date.
- `provider_event_id` text.
- `content_hash` varchar(64) for change detection.
- `last_synced_at` timestamp with timezone.
- `last_error` text, optional.
- Unique index on `(commitment_id, occurrence_on)`.

## Migration policy

- Use generated Drizzle migrations committed to the repository.
- CI must apply migrations to an empty PostgreSQL database once integration tests are added.
- Do not use `db:push` for production deployments.
