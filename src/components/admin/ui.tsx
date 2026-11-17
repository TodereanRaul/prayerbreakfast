"use client";

import { useFormStatus } from "react-dom";

export const inputCls =
  "mt-1.5 block w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-500/60 focus:border-navy-900 focus:ring-2 focus:ring-gold-300 focus:outline-none";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-navy-900/20 px-4 py-2 text-sm font-semibold text-navy-900 transition hover:border-navy-900 disabled:opacity-60";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-semibold text-navy-900 ${className}`}>
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-navy-500">{hint}</span>}
    </label>
  );
}

/** Submit button that shows it is working while the action runs. */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = btnPrimary,
  confirm,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  /** Ask before submitting (used for delete). */
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
