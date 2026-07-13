"use client";

import { CalendarSync, CircleDollarSign, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { formatMoney } from "@/lib/money";
import { trpc } from "@/trpc/react";

const inputClass = "border-[#454545] bg-[#242424] text-[#f1f1f1]";
const selectClass = "h-10 rounded-[8px] border border-[#454545] bg-[#242424] px-3 text-sm";

export function MoneyView({ month }: { month: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: categories = [] } = trpc.money.listCategories.useQuery();
  const { data: transactions = [] } = trpc.money.listTransactions.useQuery({ month });
  const { data: commitments = [] } = trpc.money.listCommitments.useQuery();
  const { data: summary = { income: 0, expense: 0, net: 0 } } = trpc.money.summary.useQuery({ month });
  const { data: upcoming = 0 } = trpc.money.upcomingExpenseTotal.useQuery();
  const { data: calendarState = { googleConnected: false, calendarReady: false } } = trpc.calendar.connectionState.useQuery();

  function invalidateTransactions() {
    utils.money.listTransactions.invalidate();
    utils.money.summary.invalidate();
    utils.money.upcomingExpenseTotal.invalidate();
  }
  function invalidateCommitments() {
    utils.money.listCommitments.invalidate();
    utils.money.upcomingExpenseTotal.invalidate();
  }

  const transactionFormRef = useRef<HTMLFormElement>(null);
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const commitmentFormRef = useRef<HTMLFormElement>(null);

  const createTransaction = trpc.money.createTransaction.useMutation({
    onSuccess: () => {
      invalidateTransactions();
      transactionFormRef.current?.reset();
    },
  });
  const createCategory = trpc.money.createCategory.useMutation({
    onSuccess: () => {
      utils.money.listCategories.invalidate();
      categoryFormRef.current?.reset();
    },
  });
  const deleteTransaction = trpc.money.deleteTransaction.useMutation({
    onSuccess: () => invalidateTransactions(),
  });
  const createCommitment = trpc.money.createCommitment.useMutation({
    onSuccess: () => {
      invalidateCommitments();
      commitmentFormRef.current?.reset();
    },
  });
  const setCommitmentStatus = trpc.money.setCommitmentStatus.useMutation({
    onSuccess: () => invalidateCommitments(),
  });
  const deleteCommitment = trpc.money.deleteCommitment.useMutation({
    onSuccess: () => invalidateCommitments(),
  });
  const syncCalendar = trpc.calendar.sync.useMutation({
    onSuccess: (result) => {
      toast.success(`Calendar synced: ${result.created} created, ${result.updated} updated.`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="h-full overflow-auto pr-1">
      <div className="mx-auto max-w-[1500px] space-y-4 pb-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Money</h2>
            <p className="text-sm text-[#a9a9a9]">Daily cash flow and upcoming commitments</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="month"
              defaultValue={month}
              className={inputClass}
              onChange={(event) => {
                if (event.target.value) router.push(`/money?month=${event.target.value}`);
              }}
            />
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {(
            [
              ["Income", summary.income, "#22C55E"],
              ["Expenses", summary.expense, "#FB7185"],
              ["Net", summary.net, "#38BDF8"],
              ["Next 30 days", upcoming, "#FBBF24"],
            ] as const
          ).map(([label, value, color]) => (
            <Card key={label} className="border-[#3a3a3a] bg-[#2B2B2B]">
              <CardContent className="p-4">
                <p className="text-xs text-[#a9a9a9]">{label}</p>
                <p className="mt-1 text-xl font-semibold" style={{ color }}>
                  {formatMoney(Number(value))}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <Card className="border-[#3a3a3a] bg-[#2B2B2B]">
              <CardHeader>
                <CardTitle className="text-base">Add transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  ref={transactionFormRef}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fd = new FormData(event.currentTarget);
                    createTransaction.mutate({
                      categoryId: String(fd.get("categoryId") || ""),
                      kind: String(fd.get("kind")) as "income" | "expense",
                      amountMinor: String(fd.get("amount") || ""),
                      currency: "THB",
                      occurredOn: String(fd.get("occurredOn")),
                      note: String(fd.get("note") || "") || undefined,
                    });
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <select name="kind" className={selectClass}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <Input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required className={inputClass} />
                  </div>
                  <select name="categoryId" required className={`${selectClass} w-full`}>
                    <option value="">Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Input name="occurredOn" type="date" required defaultValue={format(new Date(), "yyyy-MM-dd")} className={inputClass} />
                  <Input name="note" placeholder="Note (optional)" className={inputClass} />
                  <Button type="submit" disabled={createTransaction.isPending} className="w-full bg-[#D0FF00] text-[#202609]">
                    <Plus className="size-4" />
                    Add transaction
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-[#3a3a3a] bg-[#2B2B2B]">
              <CardHeader>
                <CardTitle className="text-base">Add category</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  ref={categoryFormRef}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fd = new FormData(event.currentTarget);
                    createCategory.mutate({
                      name: String(fd.get("name") || ""),
                      kind: String(fd.get("kind")) as "income" | "expense" | "both",
                      color: String(fd.get("color") || "#38BDF8"),
                    });
                  }}
                  className="grid grid-cols-[1fr_auto] gap-2"
                >
                  <Input name="name" placeholder="Category name" required className={inputClass} />
                  <select name="kind" className={selectClass}>
                    <option value="both">Both</option>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <Input type="color" name="color" defaultValue="#38BDF8" className="col-span-2 h-10 w-full" />
                  <Button type="submit" disabled={createCategory.isPending} variant="outline" className="col-span-2">
                    Create category
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#3a3a3a] bg-[#2B2B2B]">
            <CardHeader>
              <CardTitle className="text-base">Transactions - {month}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {transactions.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#999]">No transactions this month.</p>
              ) : (
                transactions.map(({ transaction, categoryName, categoryColor }) => (
                  <div key={transaction.id} className="grid grid-cols-[100px_1fr_auto_auto] items-center gap-3 border-b border-[#3a3a3a] py-3">
                    <span className="text-xs text-[#aaa]">{transaction.occurredOn}</span>
                    <div>
                      <p className="font-medium" style={{ color: categoryColor }}>
                        {categoryName}
                      </p>
                      <p className="text-xs text-[#999]">{transaction.note || "No note"}</p>
                    </div>
                    <span className={transaction.kind === "income" ? "text-[#22C55E]" : "text-[#FB7185]"}>
                      {transaction.kind === "income" ? "+" : "-"}
                      {formatMoney(transaction.amountMinor, transaction.currency)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title="Delete transaction"
                      disabled={deleteTransaction.isPending}
                      onClick={() => deleteTransaction.mutate({ id: transaction.id })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <Card className="border-[#3a3a3a] bg-[#2B2B2B]">
            <CardHeader>
              <CardTitle className="text-base">Add commitment</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                ref={commitmentFormRef}
                onSubmit={(event) => {
                  event.preventDefault();
                  const fd = new FormData(event.currentTarget);
                  createCommitment.mutate({
                    name: String(fd.get("name") || ""),
                    kind: String(fd.get("kind")) as "income" | "expense",
                    amountMinor: String(fd.get("amount") || ""),
                    currency: "THB",
                    categoryId: String(fd.get("categoryId") || ""),
                    firstDueOn: String(fd.get("firstDueOn")),
                    frequency: String(fd.get("frequency")) as "once" | "weekly" | "monthly" | "yearly",
                    installmentCount: String(fd.get("installmentCount") || "") || undefined,
                    endsOn: String(fd.get("endsOn") || "") || undefined,
                    note: String(fd.get("note") || "") || undefined,
                  });
                }}
                className="space-y-3"
              >
                <Input name="name" placeholder="Rent, subscription, salary..." required className={inputClass} />
                <div className="grid grid-cols-2 gap-2">
                  <select name="kind" className={selectClass}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <Input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required className={inputClass} />
                </div>
                <select name="categoryId" required className={`${selectClass} w-full`}>
                  <option value="">Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Input name="firstDueOn" type="date" required className={inputClass} />
                  <select name="frequency" className={selectClass}>
                    <option value="once">One time</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input name="installmentCount" type="number" min="1" placeholder="Installments" className={inputClass} />
                  <Input name="endsOn" type="date" className={inputClass} />
                </div>
                <Input name="note" placeholder="Note (optional)" className={inputClass} />
                <Button type="submit" disabled={createCommitment.isPending} className="w-full bg-[#D0FF00] text-[#202609]">
                  <CircleDollarSign className="size-4" />
                  Add commitment
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-[#3a3a3a] bg-[#2B2B2B]">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Commitments</CardTitle>
              {calendarState.googleConnected ? (
                <Button type="button" variant="outline" disabled={syncCalendar.isPending} onClick={() => syncCalendar.mutate()}>
                  <CalendarSync className="size-4" />
                  {syncCalendar.isPending ? "Syncing..." : "Sync Calendar"}
                </Button>
              ) : (
                <Link href="/api/integrations/google-calendar/connect" className={cn(buttonVariants({ variant: "outline" }))}>
                  <CalendarSync className="size-4" />
                  Connect Google Calendar
                </Link>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {commitments.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#999]">No commitments yet.</p>
              ) : (
                commitments.map(({ commitment, categoryName, categoryColor }) => (
                  <div key={commitment.id} className="grid gap-2 border-b border-[#3a3a3a] py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                    <div>
                      <p className="font-medium">{commitment.name}</p>
                      <p className="text-xs" style={{ color: categoryColor }}>
                        {categoryName} - {commitment.frequency} - due {commitment.firstDueOn}
                      </p>
                    </div>
                    <span className="font-medium">{formatMoney(commitment.amountMinor, commitment.currency)}</span>
                    <div className="flex items-center gap-2">
                      <select
                        key={commitment.status}
                        defaultValue={commitment.status}
                        className={selectClass}
                        onChange={(event) =>
                          setCommitmentStatus.mutate({
                            id: commitment.id,
                            status: event.target.value as "active" | "paused" | "completed",
                          })
                        }
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title="Delete commitment"
                      disabled={deleteCommitment.isPending}
                      onClick={() => deleteCommitment.mutate({ id: commitment.id })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
