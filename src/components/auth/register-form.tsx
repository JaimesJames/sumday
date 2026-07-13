"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const register = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      router.push(data.upgradedGoogleAccount ? "/login?registered=true&fromGoogle=true" : "/login?registered=true");
    },
    onError: (err) => {
      setError(err.message || "Please provide a valid name, email, and password (minimum 8 characters).");
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);
        register.mutate({
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || ""),
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button type="submit" className="w-full rounded-full" disabled={register.isPending}>
        {register.isPending ? "Signing up..." : "Sign up"}
      </Button>
    </form>
  );
}
