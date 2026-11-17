import { deleteNation } from "@/app/admin/actions";
import { NationForm } from "@/components/admin/nation-form";
import { SubmitButton } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { flag } from "@/lib/event-utils";
import type { Nation } from "@/lib/types";

export const instant = false;
export const metadata = { title: "Nations" };

export default async function AdminNationsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { saved } = await searchParams;
  const { data, error } = await supabase.from("nations").select("*").order("sort_order").order("country");
  const nations = (data ?? []) as Nation[];

  return (
    <div>
      <h1 className="font-display text-4xl font-medium">Nations</h1>
      <p className="mt-1 max-w-2xl text-sm text-navy-500">
        Countries where a prayer breakfast is being established or relaunched, or where details have
        not yet been confirmed. They appear in the “Nations” section at the bottom of the website.
      </p>

      {saved && (
        <p role="status" className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
          {saved === "deleted" ? "Deleted." : "Saved. The website is updated."}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
          Could not load the nations: {error.message}
        </p>
      )}

      <ul className="mt-8 space-y-3">
        {nations.map((n) => (
          <li key={n.id} className="rounded-2xl bg-white ring-1 ring-navy-900/10">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                <span>
                  <span className="font-semibold">
                    {flag(n.country_code)} {n.country}
                  </span>
                  <span className="ml-3 text-xs font-semibold tracking-wide text-gold-700 uppercase">
                    {n.status === "in_progress" ? "In preparation" : "Information requested"}
                  </span>
                  {n.note && <span className="mt-0.5 block text-sm text-navy-500">{n.note}</span>}
                </span>
                <span className="text-xs font-semibold text-navy-500 group-open:hidden">Edit</span>
                <span className="hidden text-xs font-semibold text-navy-500 group-open:inline">Close</span>
              </summary>
              <div className="border-t border-navy-900/8 p-4">
                <NationForm key={n.id} nation={n} />
                <form action={deleteNation} className="mt-3">
                  <input type="hidden" name="id" value={n.id} />
                  <SubmitButton
                    className="text-xs font-semibold text-red-700 hover:underline"
                    pendingLabel="Deleting…"
                    confirm={`Remove ${n.country} from the list?`}
                  >
                    Remove {n.country}
                  </SubmitButton>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-2xl bg-white p-6 ring-1 ring-navy-900/10">
        <h2 className="mb-5 font-display text-2xl font-medium">Add a nation</h2>
        <NationForm />
      </section>
    </div>
  );
}
