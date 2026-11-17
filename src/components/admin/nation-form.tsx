"use client";

import { useActionState } from "react";
import { saveNation, type FormState } from "@/app/admin/actions";
import type { Nation } from "@/lib/types";
import { Field, SubmitButton, inputCls } from "./ui";

export function NationForm({ nation }: { nation?: Nation }) {
  const [state, action] = useActionState<FormState, FormData>(saveNation, {});
  const v = (key: keyof Nation): string => {
    if (state.values && key in state.values) return state.values[key];
    const value = nation?.[key];
    return value === null || value === undefined ? "" : String(value);
  };

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_6rem_12rem]">
      {nation && <input type="hidden" name="id" value={nation.id} />}
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800 ring-1 ring-red-200 sm:col-span-3">
          {state.error}
        </p>
      )}
      <Field label="Country or region">
        <input name="country" required defaultValue={v("country")} className={inputCls} />
      </Field>
      <Field label="Code">
        <input name="country_code" maxLength={2} defaultValue={v("country_code")} placeholder="NL" className={`${inputCls} uppercase`} />
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={v("status") || "info_needed"} className={inputCls}>
          <option value="in_progress">In preparation</option>
          <option value="info_needed">Information requested</option>
        </select>
      </Field>
      <Field label="Note" hint="Optional, shown under the country" className="sm:col-span-2">
        <input name="note" defaultValue={v("note")} className={inputCls} />
      </Field>
      <Field label="Order" hint="Lower numbers first">
        <input type="number" name="sort_order" defaultValue={v("sort_order") || "0"} className={inputCls} />
      </Field>
      <div className="sm:col-span-3">
        <SubmitButton>{nation ? "Save" : "Add nation"}</SubmitButton>
      </div>
    </form>
  );
}
