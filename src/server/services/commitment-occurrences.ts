import { addMonths, addWeeks, addYears, format, parseISO } from "date-fns";

export type RecurringCommitment = {
  firstDueOn: string;
  frequency: "once" | "weekly" | "monthly" | "yearly";
  installmentCount: number | null;
  endsOn: string | null;
};

export function expandCommitmentOccurrences(commitment: RecurringCommitment, horizonEnd: string) {
  const results: string[] = [];
  let current = parseISO(commitment.firstDueOn);
  const horizon = parseISO(horizonEnd);
  const end = commitment.endsOn ? parseISO(commitment.endsOn) : horizon;
  const limit = commitment.installmentCount ?? 120;

  while (current <= horizon && current <= end && results.length < limit) {
    results.push(format(current, "yyyy-MM-dd"));
    if (commitment.frequency === "once") break;
    current = commitment.frequency === "weekly" ? addWeeks(current, 1)
      : commitment.frequency === "monthly" ? addMonths(current, 1)
      : addYears(current, 1);
  }
  return results;
}
