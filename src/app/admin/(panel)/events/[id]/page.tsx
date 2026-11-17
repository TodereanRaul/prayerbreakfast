import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { requireAdmin } from "@/lib/auth";
import type { PBEvent } from "@/lib/types";

export const instant = false;
export const metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ copied?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const [{ id }, { copied }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const event = data as PBEvent;

  return (
    <div>
      <Link href="/admin" className="text-sm text-navy-500 hover:text-navy-900">← All events</Link>
      <h1 className="mt-2 font-display text-4xl font-medium">{event.title}</h1>
      <p className="mb-8 text-sm text-navy-500">
        {event.city ? `${event.city}, ` : ""}
        {event.country} · {event.year}
      </p>
      {copied && (
        <p role="status" className="mb-6 rounded-xl bg-gold-100 px-4 py-3 text-sm font-medium text-gold-700 ring-1 ring-gold-300">
          Copied to {event.year}. It is hidden for now: set the dates, tick “Visible on the website” and save.
        </p>
      )}
      <EventForm key={event.id} event={event} defaultYear={event.year} />
    </div>
  );
}
