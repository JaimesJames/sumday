# Money MVP

## Goal

Add a simple personal money log to Dayly so one user can see daily transactions,
monthly totals, and upcoming payment obligations without turning the product into
accounting software.

## MVP outcomes

- Record an income or expense with an amount, date, category, and optional note.
- Mark an entry as one-time or recurring.
- Track upcoming recurring expenses with active, paused, and completed states.
- Show monthly income, expenses, and net total.
- Sync due items to a dedicated Google Calendar after explicit user action.

## Navigation

Add a top-level `Money` section with two views:

- `Transactions`: chronological income and expense history.
- `Commitments`: recurring or future-dated items that may be synced to Calendar.

## Core records

### Transaction

- Type: income or expense.
- Amount: positive decimal value stored in minor currency units.
- Currency: ISO 4217 code, initially `THB`.
- Occurred date.
- Category.
- Optional note.

### Commitment

- Type: income or expense.
- Amount and currency.
- First due date.
- Frequency: one-time, weekly, monthly, or yearly.
- Optional end date or installment count.
- Remaining installments when finite.
- Status: active, paused, or completed.
- Calendar sync state.

## Acceptance criteria

- A signed-in user can create, edit, and delete only their own records.
- Amounts never use floating-point storage.
- Monthly totals use the user's configured timezone and currency.
- Paused and completed commitments are excluded from upcoming totals.
- Calendar sync is idempotent and never creates duplicate events for one commitment occurrence.
- Calendar failures do not prevent Money records from being saved.

## Out of scope

- Bank connections or statement imports.
- Double-entry accounting, tax reports, or invoice management.
- Multiple currencies in one aggregate total.
- Shared wallets, household accounts, or organization roles.
- Automatic Calendar sync before the manual flow is proven.

## Delivery slices

1. Database schema, validation, and service tests.
2. Transactions CRUD and monthly summary.
3. Commitments CRUD and upcoming total.
4. Google authorization and manual Calendar sync.
5. Sync status, retry behavior, and production readiness.
