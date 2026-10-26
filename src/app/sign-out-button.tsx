"use client";

import { useState } from "react";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";

const authClient = createAuthClient();

export default function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setError("");
    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setError(result.error.message || "Unable to sign out.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Unable to connect to the authentication service.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="max-w-56 text-right text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
