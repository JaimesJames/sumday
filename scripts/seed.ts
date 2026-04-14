import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { categories, timeLogs, users } from "@/server/db/schema";

async function seed() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const [user] = await db
    .insert(users)
    .values({
      name: "Dayly Demo",
      email: "demo@dayly.app",
      passwordHash,
    })
    .onConflictDoNothing()
    .returning();
  if (!user) return;

  const seededCategories = await db
    .insert(categories)
    .values([
      { userId: user.id, name: "Work", color: "#8B5CF6" },
      { userId: user.id, name: "Workout", color: "#22C55E" },
      { userId: user.id, name: "Reading", color: "#3B82F6" },
    ])
    .returning();

  const now = new Date();
  await db.insert(timeLogs).values({
    userId: user.id,
    categoryId: seededCategories[0].id,
    title: "Plan sprint tasks",
    startedAt: new Date(now.getTime() - 2 * 3600 * 1000),
    endedAt: new Date(now.getTime() - 3600 * 1000),
    durationSeconds: 3600,
    isRunning: false,
  });
}

seed()
  .then(() => {
    console.log("Seeded demo user: demo@dayly.app / password123");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
