"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full justify-start gap-2 rounded-xl border border-[#FF5C5C] bg-transparent px-3 text-[#FF5C5C] hover:bg-[#3a2626] hover:text-[#FF5C5C]"
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
