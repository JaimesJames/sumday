import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuchsia-100 via-rose-100 to-orange-100 p-4">
      <Card className="w-full max-w-md rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Create your Dayly account</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-4 text-sm text-slate-600">
            Have an account?{" "}
            <Link href="/login" className="font-medium text-violet-600">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
