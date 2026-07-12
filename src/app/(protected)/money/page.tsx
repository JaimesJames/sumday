import { format } from "date-fns";
import { CalendarSync, CircleDollarSign, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  changeMoneyMonthAction, createMoneyCategoryAction, createMoneyCommitmentAction, createMoneyTransactionAction,
  deleteMoneyCommitmentAction, deleteMoneyTransactionAction, setCommitmentStatusAction,
  syncMoneyCalendarAction,
} from "@/app/(protected)/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth/session";
import { getMoneySummary, getUpcomingExpenseTotal, listMoneyCategories, listMoneyCommitments, listMoneyTransactions } from "@/server/services/money-service";
import { getCalendarConnectionState } from "@/server/services/google-calendar-service";

const inputClass = "border-[#454545] bg-[#242424] text-[#f1f1f1]";
const selectClass = "h-10 rounded-[8px] border border-[#454545] bg-[#242424] px-3 text-sm";

export default async function MoneyPage({ searchParams }: { searchParams: Promise<{ month?: string; sync?: string; created?: string; updated?: string; calendar?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(query.month ?? "") ? query.month! : format(new Date(), "yyyy-MM");
  const [categories, transactions, commitments, summary, upcoming, calendarState] = await Promise.all([
    listMoneyCategories(user.id), listMoneyTransactions(user.id, month), listMoneyCommitments(user.id), getMoneySummary(user.id, month), getUpcomingExpenseTotal(user.id), getCalendarConnectionState(user.id),
  ]);

  return (
    <div className="h-full overflow-auto pr-1">
      <div className="mx-auto max-w-[1500px] space-y-4 pb-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-2xl font-semibold">Money</h2><p className="text-sm text-[#a9a9a9]">Daily cash flow and upcoming commitments</p></div>
          <form action={changeMoneyMonthAction} className="flex items-center gap-2"><Input type="month" name="month" defaultValue={month} className={inputClass} /><Button variant="outline">View</Button></form>
        </header>
        {query.sync === "ok" ? <div className="rounded-[8px] border border-[#22C55E] bg-[#17351f] px-4 py-2 text-sm text-[#9BE7AE]">Calendar synced: {query.created ?? 0} created, {query.updated ?? 0} updated.</div> : null}
        {query.calendar === "connected" ? <div className="rounded-[8px] border border-[#38BDF8] bg-[#17303a] px-4 py-2 text-sm text-[#9DDBF5]">Google Calendar connected. You can sync active commitments now.</div> : null}

        <section className="grid gap-3 md:grid-cols-4">
          {[['Income', summary.income, '#22C55E'], ['Expenses', summary.expense, '#FB7185'], ['Net', summary.net, '#38BDF8'], ['Next 30 days', upcoming, '#FBBF24']].map(([label, value, color]) => (
            <Card key={String(label)} className="border-[#3a3a3a] bg-[#2B2B2B]"><CardContent className="p-4"><p className="text-xs text-[#a9a9a9]">{label}</p><p className="mt-1 text-xl font-semibold" style={{ color: String(color) }}>{formatMoney(Number(value))}</p></CardContent></Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <Card className="border-[#3a3a3a] bg-[#2B2B2B]"><CardHeader><CardTitle className="text-base">Add transaction</CardTitle></CardHeader><CardContent>
              <form action={createMoneyTransactionAction} className="space-y-3">
                <div className="grid grid-cols-2 gap-2"><select name="kind" className={selectClass}><option value="expense">Expense</option><option value="income">Income</option></select><Input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required className={inputClass} /></div>
                <select name="categoryId" required className={`${selectClass} w-full`}><option value="">Category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <Input name="occurredOn" type="date" required defaultValue={format(new Date(), "yyyy-MM-dd")} className={inputClass} />
                <Input name="note" placeholder="Note (optional)" className={inputClass} /><input type="hidden" name="currency" value="THB" />
                <Button className="w-full bg-[#D0FF00] text-[#202609]"><Plus className="size-4" />Add transaction</Button>
              </form>
            </CardContent></Card>

            <Card className="border-[#3a3a3a] bg-[#2B2B2B]"><CardHeader><CardTitle className="text-base">Add category</CardTitle></CardHeader><CardContent>
              <form action={createMoneyCategoryAction} className="grid grid-cols-[1fr_auto] gap-2"><Input name="name" placeholder="Category name" required className={inputClass} /><select name="kind" className={selectClass}><option value="both">Both</option><option value="expense">Expense</option><option value="income">Income</option></select><Input type="color" name="color" defaultValue="#38BDF8" className="col-span-2 h-10 w-full" /><Button variant="outline" className="col-span-2">Create category</Button></form>
            </CardContent></Card>
          </div>

          <Card className="border-[#3a3a3a] bg-[#2B2B2B]"><CardHeader><CardTitle className="text-base">Transactions - {month}</CardTitle></CardHeader><CardContent className="space-y-2">
            {transactions.length === 0 ? <p className="py-10 text-center text-sm text-[#999]">No transactions this month.</p> : transactions.map(({ transaction, categoryName, categoryColor }) => (
              <div key={transaction.id} className="grid grid-cols-[100px_1fr_auto_auto] items-center gap-3 border-b border-[#3a3a3a] py-3">
                <span className="text-xs text-[#aaa]">{transaction.occurredOn}</span><div><p className="font-medium" style={{ color: categoryColor }}>{categoryName}</p><p className="text-xs text-[#999]">{transaction.note || "No note"}</p></div>
                <span className={transaction.kind === "income" ? "text-[#22C55E]" : "text-[#FB7185]"}>{transaction.kind === "income" ? "+" : "-"}{formatMoney(transaction.amountMinor, transaction.currency)}</span>
                <form action={deleteMoneyTransactionAction}><input type="hidden" name="id" value={transaction.id} /><Button size="icon" variant="ghost" title="Delete transaction"><Trash2 className="size-4" /></Button></form>
              </div>
            ))}
          </CardContent></Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <Card className="border-[#3a3a3a] bg-[#2B2B2B]"><CardHeader><CardTitle className="text-base">Add commitment</CardTitle></CardHeader><CardContent>
            <form action={createMoneyCommitmentAction} className="space-y-3"><Input name="name" placeholder="Rent, subscription, salary..." required className={inputClass} />
              <div className="grid grid-cols-2 gap-2"><select name="kind" className={selectClass}><option value="expense">Expense</option><option value="income">Income</option></select><Input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required className={inputClass} /></div>
              <select name="categoryId" required className={`${selectClass} w-full`}><option value="">Category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <div className="grid grid-cols-2 gap-2"><Input name="firstDueOn" type="date" required className={inputClass} /><select name="frequency" className={selectClass}><option value="once">One time</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
              <div className="grid grid-cols-2 gap-2"><Input name="installmentCount" type="number" min="1" placeholder="Installments" className={inputClass} /><Input name="endsOn" type="date" className={inputClass} /></div>
              <Input name="note" placeholder="Note (optional)" className={inputClass} /><input type="hidden" name="currency" value="THB" />
              <Button className="w-full bg-[#D0FF00] text-[#202609]"><CircleDollarSign className="size-4" />Add commitment</Button>
            </form>
          </CardContent></Card>

          <Card className="border-[#3a3a3a] bg-[#2B2B2B]"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Commitments</CardTitle>{calendarState.googleConnected ? <form action={syncMoneyCalendarAction}><Button variant="outline"><CalendarSync className="size-4" />Sync Calendar</Button></form> : <Link href="/api/integrations/google-calendar/connect" className={cn(buttonVariants({ variant: "outline" }))}><CalendarSync className="size-4" />Connect Google Calendar</Link>}</CardHeader><CardContent className="space-y-2">
            {commitments.length === 0 ? <p className="py-10 text-center text-sm text-[#999]">No commitments yet.</p> : commitments.map(({ commitment, categoryName, categoryColor }) => (
              <div key={commitment.id} className="grid gap-2 border-b border-[#3a3a3a] py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center"><div><p className="font-medium">{commitment.name}</p><p className="text-xs" style={{ color: categoryColor }}>{categoryName} - {commitment.frequency} - due {commitment.firstDueOn}</p></div><span className="font-medium">{formatMoney(commitment.amountMinor, commitment.currency)}</span>
                <form action={setCommitmentStatusAction}><input type="hidden" name="id" value={commitment.id} /><select name="status" defaultValue={commitment.status} className={selectClass}><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select><Button size="sm" variant="ghost">Save</Button></form>
                <form action={deleteMoneyCommitmentAction}><input type="hidden" name="id" value={commitment.id} /><Button size="icon" variant="ghost" title="Delete commitment"><Trash2 className="size-4" /></Button></form>
              </div>
            ))}
          </CardContent></Card>
        </section>
      </div>
    </div>
  );
}
