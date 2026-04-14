import { AppShell } from "@/components/app-shell";
import { TimezoneSync } from "@/components/timezone-sync";
import { requireUser } from "@/server/auth/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <AppShell>
      <TimezoneSync />
      {children}
    </AppShell>
  );
}
