"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { setupApi } from "@/lib/api/setup";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBrand } from "../auth-brand";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [router, user]);

  // A fresh server has no accounts yet, so there is nothing to sign in to.
  useEffect(() => {
    setupApi
      .getStatus()
      .then((status) => {
        if (!status.initialized) router.replace("/auth/setup");
      })
      .catch(() => undefined);
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(username, password);
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err, "Could not sign in"));
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 md:flex-row md:justify-center md:gap-16">
      <AuthBrand knightClassName="md:w-[300px] lg:w-[340px]" />

      <section aria-labelledby="sign-in-heading" className="w-full max-w-sm rounded-lg border border-seam bg-vault p-6 sm:p-8">
        <h2 id="sign-in-heading" className="text-xl font-semibold text-parchment">
          Sign in to your archive
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" aria-busy={submitting}>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "sign-in-error" : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-ash outline-none hover:text-parchment focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
              </button>
            </div>
          </div>

          {error && (
            <p id="sign-in-error" role="alert" className="rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-sm text-parchment">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="animate-spin" /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
