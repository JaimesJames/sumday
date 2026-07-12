"use client";

import { BarChart3, LayoutDashboard, Logs, Settings, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/logs", label: "Logging", icon: Logs },
  { href: "/money", label: "Money", icon: WalletCards },
  { href: "/categories", label: "Categories", icon: BarChart3 },
  { href: "/settings", label: "Setting", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-screen overflow-hidden bg-[#242424] p-3 text-[#f1f1f1]">
      <div className="flex h-full gap-3">
        <aside className="flex h-full w-[260px] shrink-0 flex-col rounded-[20px] border border-[#3a3a3a] bg-[#2B2B2B] p-4">
          <h1 className="mb-5 text-3xl font-semibold tracking-tight text-[#D0FF00]">.Dayly</h1>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                className={`flex items-center gap-2 rounded-[8px] px-3 py-2 text-base transition ${
                    active ? "bg-[#D0FF00] font-semibold text-[#202609]" : "font-normal text-[#e7e7e7] hover:bg-[#343434]"
                  }`}
                >
                  <Icon className="size-4 opacity-85" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-4">
            <SignOutButton />
          </div>
        </aside>

        <main className="h-full flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
