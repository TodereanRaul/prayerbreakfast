import Link from "next/link";
import { copyToNextYear, deleteEvent, fillMissingImages } from "@/app/admin/actions";
import { SubmitButton, btnGhost, btnPrimary } from "@/components/admin/ui";
import { CityPhoto } from "@/components/city-photo";
import { requireAdmin } from "@/lib/auth";
import { compareEvents, contactHref, flag, formatDateRange } from "@/lib/event-utils";
import type { PBEvent } from "@/lib/types";

export const instant = false;
export const metadata = { title: "Events" };

function flashMessage(saved: string | undefined): string | null {
  if (!saved) return null;
  if (saved === "1") return "Saved. The website is updated.";
  if (saved === "deleted") return "Deleted.";
  if (saved === "nophoto") return "Saved, but no photo was found for that city. Try another search term or upload one.";
  if (saved === "error") return "Something went wrong. Please try again.";
  if (saved.startsWith("photos-")) {
    const n = Number(saved.slice(7));
    return n ? `Found a photo for ${n} event${n === 1 ? "" : "s"}.` : "No new photos were found.";
  }
  return null;
}

const link = "rounded-full px-2.5 py-1 text-xs font-semibold text-navy-700 hover:bg-navy-50 hover:text-navy-900";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { saved } = await searchParams;
  const { data, error } = await supabase.from("events").select("*");
  const events = ((data ?? []) as PBEvent[]).sort(compareEvents);
  const years = [...new Set(events.map((e) => e.year))].sort((a, b) => b - a);
  const missingPhotos = events.filter((e) => !e.image_url && (e.image_query || e.city)).length;
  const message = flashMessage(saved);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium">Events</h1>
          <p className="mt-1 text-sm text-navy-500">
            {events.length} prayer breakfasts. Changes appear on the website straight away.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {missingPhotos > 0 && (
            <form action={fillMissingImages}>
              <SubmitButton className={btnGhost} pendingLabel="Searching…">
                Find {missingPhotos} missing photo{missingPhotos === 1 ? "" : "s"}
              </SubmitButton>
            </form>
          )}
          <Link href="/admin/events/new" className={btnPrimary}>+ Add event</Link>
        </div>
      </div>

      {message && (
        <p role="status" className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
          Could not load the events: {error.message}
        </p>
      )}
      {!error && events.length === 0 && (
        <p className="mt-10 rounded-2xl bg-white p-8 text-center text-navy-500 ring-1 ring-navy-900/10">
          No events yet. Add the first one, or load the starting list from <code>supabase/seed.sql</code>.
        </p>
      )}

      {years.map((year) => (
        <section key={year} className="mt-10">
          <h2 className="font-display text-3xl font-medium text-navy-900/40">{year}</h2>
          <ul className="mt-3 divide-y divide-navy-900/8 overflow-hidden rounded-2xl bg-white ring-1 ring-navy-900/10">
            {events
              .filter((e) => e.year === year)
              .map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 sm:flex-nowrap">
                  <CityPhoto event={e} sizes="80px" width={500} className="h-14 w-20 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 basis-48">
                    <Link href={`/admin/events/${e.id}`} className="font-semibold hover:underline">
                      {e.title}
                    </Link>
                    <p className="truncate text-sm text-navy-500">
                      {flag(e.country_code)} {e.city ? `${e.city}, ` : ""}
                      {e.country} · {formatDateRange(e, { withYear: false })}
                      {e.date_note ? ` · ${e.date_note}` : ""}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1.5 text-[0.65rem] font-semibold tracking-wide uppercase">
                      {!e.published && <span className="rounded bg-navy-900 px-1.5 py-0.5 text-white">Hidden</span>}
                      {e.status === "cancelled" && <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-800">Cancelled</span>}
                      {e.status === "tbc" && <span className="rounded bg-gold-100 px-1.5 py-0.5 text-gold-700">To be confirmed</span>}
                      {!e.website_url && <span className="rounded bg-navy-50 px-1.5 py-0.5 text-navy-500">No website</span>}
                      {!contactHref(e) && <span className="rounded bg-navy-50 px-1.5 py-0.5 text-navy-500">No contact</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Link href={`/admin/events/${e.id}`} className={link}>Edit</Link>
                    <form action={copyToNextYear}>
                      <input type="hidden" name="id" value={e.id} />
                      <SubmitButton className={link} pendingLabel="Copying…">Copy to {e.year + 1}</SubmitButton>
                    </form>
                    <form action={deleteEvent}>
                      <input type="hidden" name="id" value={e.id} />
                      <SubmitButton
                        className={`${link} text-red-700 hover:bg-red-50 hover:text-red-800`}
                        pendingLabel="Deleting…"
                        confirm={`Delete “${e.title}” (${e.city ?? e.country}, ${e.year})? This cannot be undone.`}
                      >
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
