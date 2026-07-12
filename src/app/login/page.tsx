"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasGoogleProvider, setHasGoogleProvider] = useState(false);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (!authError) return;

    if (authError === "CredentialsSignin") {
      setError("Invalid email or password. If this account was created with Google, set a password via Register.");
      return;
    }

    if (authError === "Callback") {
      setError("Authentication callback failed. Please try again.");
      return;
    }

    setError(`Authentication failed: ${authError}`);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadProviders() {
      try {
        const providers = await getProviders();
        if (!isMounted) return;
        setHasGoogleProvider(Boolean(providers?.google));
      } catch {
        if (!isMounted) return;
        setHasGoogleProvider(false);
      }
    }

    void loadProviders();
    return () => {
      isMounted = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    console.info("[login] form submit handler fired");
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setIsSubmitting(true);
    try {
      const email = String(formData.get("email") ?? "");
      console.info("[login] attempting credentials sign in", { email });
      const result = await signIn("credentials", {
        email,
        password: formData.get("password"),
        redirect: false,
      });
      console.info("[login] signIn result received", {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
      });

      if (result?.ok) {
        window.location.href = "/dashboard";
        return;
      }
      setError("Invalid email or password");
    } catch (caughtError) {
      console.error("[login] signIn threw an exception", caughtError);
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-100 via-pink-100 to-cyan-100 p-4">
      <Card className="w-full max-w-md rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Dayly</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={isSubmitting}
              onClick={() => console.info("[login] sign-in button clicked")}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              disabled={!hasGoogleProvider}
              onClick={() => {
                if (!hasGoogleProvider) {
                  setError(
                    "Google sign-in is not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.",
                  );
                  return;
                }
                void signIn("google", { callbackUrl: "/dashboard" });
              }}
            >
              Continue with Google
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            No account yet?{" "}
            <Link href="/register" className="font-medium text-violet-600">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-100 to-cyan-100"
          aria-hidden="true"
        />
      }
    >
      <LoginContent />
    </Suspense>
  );
}
