"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction, type SignInState } from "@/lib/admin/auth-actions";
import { btnGold, input, label } from "./styles";

const initialState: SignInState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`${btnGold} w-full py-2.5`} disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label className={label} htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={input}
          placeholder="you@yourdomain.at"
        />
      </div>

      <div>
        <label className={label} htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
          placeholder="••••••••"
        />
      </div>

      {state.error ? (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
