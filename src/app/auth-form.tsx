"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = isSignup
        ? await authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: "/courses",
          })
        : await authClient.signIn.email({
            email,
            password,
            callbackURL: "/courses",
          });

      if (result.error) {
        setError(result.error.message || "Authentication failed.");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to connect to the authentication service.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-6 py-12 text-ink">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-brand hover:underline"
        >
          CampusFlow
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isSignup
            ? "Create a student account to explore courses and manage your projects."
            : "Sign in to continue to your courses and projects."}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          {isSignup && (
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={isSignup ? 8 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isSignup ? "Already have an account?" : "New to CampusFlow?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-brand hover:underline"
          >
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
        {isSignup && (
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            New accounts are students. Instructor access is assigned separately.
          </p>
        )}
      </section>
    </main>
  );
}
