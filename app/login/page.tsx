"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

export default function LoginPage() {
  const router = useRouter();
  const { isConfigured } = getSupabaseEnv();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormDisabled = isSubmitting || !isConfigured;

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!isConfigured) {
      setMessage(
        "Studio login is not configured yet. Add the Supabase environment variables in Vercel, then redeploy."
      );
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/studio`,
      },
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage(
      "Signup submitted. Check your email, confirm your account, then return here to sign in."
    );
    setIsSubmitting(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!isConfigured) {
      setMessage(
        "Studio login is not configured yet. Add the Supabase environment variables in Vercel, then redeploy."
      );
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/studio");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20 text-white">
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">
        Breaking Mad
      </p>

      <h1 className="text-4xl font-black uppercase">Login</h1>

      <form
        onSubmit={handleSignIn}
        className="mt-8 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isFormDisabled}
          className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isFormDisabled}
          className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isFormDisabled}
            className="rounded-lg bg-cyan-400 px-4 py-3 font-bold text-black"
          >
            {isSubmitting ? "Working..." : "Sign In"}
          </button>

          <button
            onClick={handleSignUp}
            type="button"
            disabled={isFormDisabled}
            className="rounded-lg border border-zinc-700 px-4 py-3 font-bold text-white"
          >
            Create Account
          </button>
        </div>

        {!isConfigured ? (
          <p className="text-sm text-amber-300">
            Supabase login is not configured in this environment yet. Add the
            public Supabase variables in Vercel to enable sign-in.
          </p>
        ) : null}

        {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
      </form>
    </main>
  );
}
