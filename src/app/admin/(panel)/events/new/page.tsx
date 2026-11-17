import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";
import { requireAdmin } from "@/lib/auth";

export const instant = false;
export const metadata = { title: "Add event" };

export default async function NewEventPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("events").select("year").order("year", { ascending: false }).limit(1);
  const defaultYear = data?.[0]?.year ?? new Date().getFullYear();

  return (
    <div>
      <Link href="/admin" className="text-sm text-navy-500 hover:text-navy-900">← All events</Link>
      <h1 className="mt-2 mb-8 font-display text-4xl font-medium">Add a prayer breakfast</h1>
      <EventForm defaultYear={defaultYear} />
    </div>
  );
}
