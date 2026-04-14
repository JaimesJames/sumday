"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/session";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/server/services/category-service";
import {
  createManualLog,
  deleteLog,
  startTimer,
  stopTimer,
  updateLog,
} from "@/server/services/time-log-service";

export async function createCategoryAction(formData: FormData) {
  const user = await requireUser();
  await createCategory(user.id, {
    name: formData.get("name"),
    color: formData.get("color"),
  });
  revalidatePath("/categories");
  revalidatePath("/dashboard");
}

export async function updateCategoryAction(formData: FormData) {
  const user = await requireUser();
  await updateCategory(user.id, String(formData.get("id")), {
    name: formData.get("name"),
    color: formData.get("color"),
  });
  revalidatePath("/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await requireUser();
  await deleteCategory(user.id, String(formData.get("id")));
  revalidatePath("/categories");
}

export async function createLogAction(formData: FormData) {
  const user = await requireUser();
  await createManualLog(user.id, {
    categoryId: formData.get("categoryId"),
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
    categoryId: formData.get("categoryId"),
    title: formData.get("title") || undefined,
    note: formData.get("note") || undefined,
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt"),
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
    categoryId: formData.get("categoryId"),
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
