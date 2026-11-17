"use client";

import { useActionState } from "react";
import { signIn, type FormState } from "@/app/admin/actions";
import { Field, SubmitButton, btnPrimary, inputCls } from "./ui";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800 ring-1 ring-red-200">
          {state.error}
        </p>
      )}
      <Field label="E-mail">
        <input type="email" name="email" required autoComplete="username" defaultValue={state.values?.email ?? ""} className={inputCls} />
      </Field>
      <Field label="Password">
        <input type="password" name="password" required autoComplete="current-password" className={inputCls} />
      </Field>
      <SubmitButton className={`${btnPrimary} w-full`} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
