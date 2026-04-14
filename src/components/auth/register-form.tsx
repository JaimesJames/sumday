"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: null };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={() => {
        console.info("[register] form submit handler fired");
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
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={isPending}
        onClick={() => console.info("[register] sign-up button clicked")}
      >
        {isPending ? "Signing up..." : "Sign up"}
      </Button>
    </form>
  );
}
