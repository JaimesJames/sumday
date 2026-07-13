"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import {
  createCalendarSlot,
  createManualLog,
  deleteLog,
  startTimer,
  stopTimer,
  updateLog,
  updateRunningLog,
} from "@/server/services/time-log-service";
import {
  createMoneyCategory,
  createMoneyCommitment,
  createMoneyTransaction,
  deleteMoneyCommitment,
  deleteMoneyTransaction,
  setCommitmentStatus,
} from "@/server/services/money-service";
import { syncMoneyCommitmentsToGoogle } from "@/server/services/google-calendar-service";

export async function createLogAction(formData: FormData) {
  const user = await requireUser();
  await createManualLog(user.id, {
    categoryId: formData.get("categoryId") || undefined,
    title: formData.get("title") || undefined,
    note: formData.get("note") || undefined,
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt"),
  });
  revalidatePath("/logs");
  revalidatePath("/dashboard");
}

export async function updateLogAction(formData: FormData) {
  const user = await requireUser();
  await updateLog(user.id, String(formData.get("id")), {
    categoryId: formData.get("categoryId") || undefined,
    title: formData.get("title") || undefined,
    note: formData.get("note") || undefined,
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt"),
  });
  revalidatePath("/logs");
  revalidatePath("/dashboard");
}

export async function updateRunningLogAction(formData: FormData) {
  const user = await requireUser();
  await updateRunningLog(user.id, String(formData.get("id")), {
    categoryId: formData.get("categoryId") || undefined,
    title: formData.get("title") || undefined,
    note: formData.get("note") || undefined,
  });
  revalidatePath("/logs");
  revalidatePath("/dashboard");
}

export async function deleteLogAction(formData: FormData) {
  const user = await requireUser();
  await deleteLog(user.id, String(formData.get("id")));
  revalidatePath("/logs");
  revalidatePath("/dashboard");
}

export async function startTimerAction(formData: FormData) {
  const user = await requireUser();
  await startTimer(user.id, {
    categoryId: formData.get("categoryId") || undefined,
    title: formData.get("title") || undefined,
    note: formData.get("note") || undefined,
  });
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}

export async function stopTimerAction(formData: FormData) {
  const user = await requireUser();
  await stopTimer(user.id, {
    logId: formData.get("logId"),
  });
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}

export async function createCalendarSlotAction(formData: FormData) {
  const user = await requireUser();
  await createCalendarSlot(user.id, {
    categoryId: formData.get("categoryId") || undefined,
    title: formData.get("title") || undefined,
    note: formData.get("note") || undefined,
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt") || undefined,
    mode: formData.get("mode") || "instant",
  });
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}

export async function createMoneyCategoryAction(formData: FormData) {
  const user = await requireUser();
  await createMoneyCategory(user.id, { name: formData.get("name"), kind: formData.get("kind"), color: formData.get("color") });
  revalidatePath("/money");
}

export async function createMoneyTransactionAction(formData: FormData) {
  const user = await requireUser();
  await createMoneyTransaction(user.id, {
    categoryId: formData.get("categoryId"), kind: formData.get("kind"), amountMinor: formData.get("amount"),
    currency: formData.get("currency") || "THB", occurredOn: formData.get("occurredOn"), note: formData.get("note") || undefined,
  });
  revalidatePath("/money");
}

export async function deleteMoneyTransactionAction(formData: FormData) {
  const user = await requireUser();
  await deleteMoneyTransaction(user.id, String(formData.get("id")));
  revalidatePath("/money");
}

export async function createMoneyCommitmentAction(formData: FormData) {
  const user = await requireUser();
  await createMoneyCommitment(user.id, {
    categoryId: formData.get("categoryId"), name: formData.get("name"), kind: formData.get("kind"), amountMinor: formData.get("amount"),
    currency: formData.get("currency") || "THB", firstDueOn: formData.get("firstDueOn"), frequency: formData.get("frequency"),
    installmentCount: formData.get("installmentCount"), endsOn: formData.get("endsOn"), status: "active", note: formData.get("note") || undefined,
  });
  revalidatePath("/money");
}

export async function setCommitmentStatusAction(formData: FormData) {
  const user = await requireUser();
  await setCommitmentStatus(user.id, String(formData.get("id")), String(formData.get("status")) as "active" | "paused" | "completed");
  revalidatePath("/money");
}

export async function deleteMoneyCommitmentAction(formData: FormData) {
  const user = await requireUser();
  await deleteMoneyCommitment(user.id, String(formData.get("id")));
  revalidatePath("/money");
}

export async function changeMoneyMonthAction(formData: FormData) {
  redirect(`/money?month=${encodeURIComponent(String(formData.get("month")))}`);
}

export async function syncMoneyCalendarAction() {
  const user = await requireUser();
  const result = await syncMoneyCommitmentsToGoogle(user.id);
  redirect(`/money?sync=ok&created=${result.created}&updated=${result.updated}`);
}
