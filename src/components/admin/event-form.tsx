"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveEvent, type FormState } from "@/app/admin/actions";
import { CityPhoto } from "@/components/city-photo";
import { MONTHS } from "@/lib/event-utils";
import type { PBEvent } from "@/lib/types";
import { Field, SubmitButton, btnGhost, inputCls } from "./ui";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl bg-white p-6 ring-1 ring-navy-900/10">
      <legend className="float-left mb-5 w-full">
        <span className="font-display text-2xl font-medium">{title}</span>
        {hint && <span className="mt-1 block text-sm text-navy-500">{hint}</span>}
      </legend>
      <div className="clear-both grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function EventForm({ event, defaultYear }: { event?: PBEvent; defaultYear: number }) {
  const [state, action] = useActionState<FormState, FormData>(saveEvent, {});
  const [imageAction, setImageAction] = useState<"keep" | "refresh" | "remove">("keep");

  // After an error the form shows what was typed; otherwise the saved event.
  const v = (key: keyof PBEvent): string => {
    if (state.values && key in state.values) return state.values[key];
    const value = event?.[key];
    return value === null || value === undefined ? "" : String(value);
  };

  const ownPhoto = Boolean(event?.image_url && !event.image_source_url);

  return (
    <form action={action} className="space-y-6">
      {event && <input type="hidden" name="id" value={event.id} />}
      <input type="hidden" name="image_action" value={imageAction} />

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
          {state.error}
        </p>
      )}

      <Section title="The event">
        <Field label="Name" className="sm:col-span-2">
          <input name="title" required defaultValue={v("title")} placeholder="National Prayer Breakfast" className={inputCls} />
        </Field>
        <Field label="Short name" hint="Optional, e.g. NPB, FNPB">
          <input name="short_name" defaultValue={v("short_name")} className={inputCls} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={v("status") || "confirmed"} className={inputCls}>
            <option value="confirmed">Confirmed</option>
            <option value="tbc">To be confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="Description" hint="Optional, one or two sentences shown on the card" className="sm:col-span-2">
          <textarea name="description" rows={3} defaultValue={v("description")} className={inputCls} />
        </Field>
      </Section>

      <Section title="Where" hint="The city decides which photo is shown on the card.">
        <Field label="City" hint="Capital or city where it takes place">
          <input name="city" defaultValue={v("city")} placeholder="Helsinki" className={inputCls} />
        </Field>
        <Field label="Country or region">
          <input name="country" required defaultValue={v("country")} placeholder="Finland" className={inputCls} />
        </Field>
        <Field label="Country code" hint="Two letters, for the flag (FI, GB, UA…)">
          <input name="country_code" maxLength={2} defaultValue={v("country_code")} placeholder="FI" className={`${inputCls} uppercase`} />
        </Field>
        <Field label="Venue" hint="Optional, e.g. Westminster Hall">
          <input name="venue" defaultValue={v("venue")} className={inputCls} />
        </Field>
      </Section>

      <Section title="When" hint="Pick the exact dates if they are known. If not, choose the year and month and add a note.">
        <Field label="Start date">
          <input type="date" name="start_date" defaultValue={v("start_date")} className={inputCls} />
        </Field>
        <Field label="End date" hint="Only for events lasting several days">
          <input type="date" name="end_date" defaultValue={v("end_date")} className={inputCls} />
        </Field>
        <Field label="Year" hint="Used when there is no exact date yet">
          <input type="number" name="year" min={1950} max={2200} defaultValue={v("year") || defaultYear} className={inputCls} />
        </Field>
        <Field label="Month" hint="Used when there is no exact date yet">
          <select name="month" defaultValue={v("month")} className={inputCls}>
            <option value="">Not known yet</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Date note" hint='Optional, e.g. "Week 21" or "Date to be confirmed"' className="sm:col-span-2">
          <input name="date_note" defaultValue={v("date_note")} className={inputCls} />
        </Field>
      </Section>

      <Section title="Buttons on the card" hint="“More info” opens their website. “Contact” shows this event’s own contact details.">
        <Field label="Website (More info button)" className="sm:col-span-2">
          <input name="website_url" inputMode="url" defaultValue={v("website_url")} placeholder="https://…" className={inputCls} />
        </Field>
        <Field label="Contact name">
          <input name="contact_name" defaultValue={v("contact_name")} className={inputCls} />
        </Field>
        <Field label="Contact e-mail">
          <input type="email" name="contact_email" defaultValue={v("contact_email")} className={inputCls} />
        </Field>
        <Field label="Contact phone">
          <input name="contact_phone" inputMode="tel" defaultValue={v("contact_phone")} className={inputCls} />
        </Field>
        <Field label="Contact page" hint="Link to a contact form, if they have one">
          <input name="contact_url" inputMode="url" defaultValue={v("contact_url")} placeholder="https://…" className={inputCls} />
        </Field>
      </Section>

      <Section
        title="Photo"
        hint="A photo of the city is found automatically when you save. You can search for something more specific, or upload your own."
      >
        <div className="sm:col-span-2 sm:grid sm:grid-cols-[16rem_1fr] sm:gap-6">
          <div>
            <CityPhoto
              event={{
                image_url: imageAction === "remove" ? null : (event?.image_url ?? null),
                city: event?.city ?? null,
                country: event?.country ?? "",
              }}
              sizes="256px"
              width={500}
              className="aspect-[16/10] w-full rounded-xl"
            />
            {event?.image_credit && imageAction !== "remove" && (
              <p className="mt-2 text-xs text-navy-500">Photo: {event.image_credit}</p>
            )}
            {imageAction === "refresh" && (
              <p className="mt-2 text-xs font-semibold text-gold-700">A new photo will be searched when you save.</p>
            )}
            {imageAction === "remove" && (
              <p className="mt-2 text-xs font-semibold text-red-700">The photo will be removed when you save.</p>
            )}
          </div>

          <div className="mt-5 space-y-5 sm:mt-0">
            <Field label="Search for" hint="Leave empty to use the city. Use a landmark for a more specific photo, e.g. “Westminster Hall”.">
              <input name="image_query" defaultValue={v("image_query")} className={inputCls} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setImageAction(imageAction === "refresh" ? "keep" : "refresh")}
                className={`${btnGhost} ${imageAction === "refresh" ? "border-gold-500 bg-gold-100" : ""}`}
              >
                Find a photo again
              </button>
              {event?.image_url && (
                <button
                  type="button"
                  onClick={() => setImageAction(imageAction === "remove" ? "keep" : "remove")}
                  className={`${btnGhost} ${imageAction === "remove" ? "border-red-300 bg-red-50" : ""}`}
                >
                  Remove photo
                </button>
              )}
            </div>
            <Field label="Or upload your own photo" hint="JPG, PNG or WebP, up to 7 MB. Landscape works best.">
              <input type="file" name="image_file" accept="image/jpeg,image/png,image/webp,image/avif" className="mt-1.5 block w-full text-sm font-normal file:mr-3 file:rounded-full file:border-0 file:bg-navy-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy-900" />
            </Field>
            <Field label="Photo credit" hint="For your own photo: who took it. Automatic photos are credited for you.">
              <input name="image_credit" defaultValue={ownPhoto ? v("image_credit") : (state.values?.image_credit ?? "")} className={inputCls} />
            </Field>
          </div>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-4 border-t border-navy-900/10 bg-cream/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            name="published"
            defaultChecked={state.values ? state.values.published === "on" : (event?.published ?? true)}
            className="h-4 w-4 accent-navy-900"
          />
          Visible on the website
        </label>
        <div className="flex gap-3">
          <Link href="/admin" className={btnGhost}>Cancel</Link>
          <SubmitButton>{event ? "Save changes" : "Add event"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
