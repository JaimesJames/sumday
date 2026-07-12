import assert from "node:assert/strict";
import test from "node:test";
import { expandCommitmentOccurrences } from "./commitment-occurrences";

test("expands monthly commitments without exceeding installments", () => {
  assert.deepEqual(
    expandCommitmentOccurrences(
      { firstDueOn: "2026-01-31", frequency: "monthly", installmentCount: 3, endsOn: null },
      "2026-12-31",
    ),
    ["2026-01-31", "2026-02-28", "2026-03-31"],
  );
});

test("keeps one-time commitments to one occurrence", () => {
  assert.deepEqual(
    expandCommitmentOccurrences(
      { firstDueOn: "2026-07-12", frequency: "once", installmentCount: null, endsOn: null },
      "2027-01-01",
    ),
    ["2026-07-12"],
  );
});
