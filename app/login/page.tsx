"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { firebaseAuthMessage } from "@/lib/firebase/errors";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Input";

function LoginForm() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setBusy(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      router.replace(next);
    } catch (error) {
      toast.error(firebaseAuthMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-4xl text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-muted">Sign in to give, create, or manage a Chema.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FieldError message={errors.email} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FieldError message={errors.password} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Button
        variant="secondary"
        className="mt-3 w-full"
        onClick={async () => {
          try {
            await signInWithGoogle();
            router.replace(next);
          } catch (error) {
            toast.error(firebaseAuthMessage(error));
          }
        }}
      >
        Continue with Google
      </Button>
      <p className="mt-6 text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-forest">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
