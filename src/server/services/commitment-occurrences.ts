import { addMonths, addWeeks, addYears, format, parseISO } from "date-fns";

export type RecurringCommitment = {
  firstDueOn: string;
  frequency: "once" | "weekly" | "monthly" | "yearly";
  installmentCount: number | null;
  endsOn: string | null;
};

export function expandCommitmentOccurrences(commitment: RecurringCommitment, horizonEnd: string) {
  const results: string[] = [];
  const anchor = parseISO(commitment.firstDueOn);
  let current = anchor;
  let occurrenceIndex = 0;
  const horizon = parseISO(horizonEnd);
  const end = commitment.endsOn ? parseISO(commitment.endsOn) : horizon;
  const limit = commitment.installmentCount ?? 120;

  while (current <= horizon && current <= end && results.length < limit) {
    results.push(format(current, "yyyy-MM-dd"));
    if (commitment.frequency === "once") break;
    occurrenceIndex += 1;
    current = commitment.frequency === "weekly" ? addWeeks(anchor, occurrenceIndex)
      : commitment.frequency === "monthly" ? addMonths(anchor, occurrenceIndex)
      : addYears(anchor, occurrenceIndex);
  }
  return results;
}
