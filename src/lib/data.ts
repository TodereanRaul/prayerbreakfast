import { cacheLife, cacheTag } from "next/cache";
import seed from "@/data/seed.json";
import { compareEvents } from "./event-utils";
import { isSupabaseConfigured } from "./supabase/config";
import { createPublicClient } from "./supabase/server";
import type { Nation, PBEvent } from "./types";

export const DIRECTORY_TAG = "directory";

export interface Directory {
  events: PBEvent[];
  nations: Nation[];
  /** Today's date (YYYY-MM-DD, Central European time) when the data was read. */
  today: string;
  /** True when Supabase is not connected and the built-in list is shown. */
  demo: boolean;
}

function todayInEurope(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());
}

type SeedEvent = Partial<PBEvent> & Pick<PBEvent, "title" | "country" | "year">;

/** The built-in list (src/data/seed.json), used until Supabase is connected. */
export function demoEvents(): PBEvent[] {
  return (seed.events as SeedEvent[]).map((e, i) => ({
    id: `demo-${i + 1}`,
    short_name: null, city: null, country_code: null, venue: null, month: null,
    start_date: null, end_date: null, date_note: null, status: "confirmed",
    description: null, website_url: null, contact_name: null, contact_email: null,
    contact_phone: null, contact_url: null, image_query: null, image_url: null,
    image_path: null, image_credit: null, image_source_url: null, published: true,
    ...e,
  }));
}

export function demoNations(): Nation[] {
  return (seed.nations as Partial<Nation>[]).map((n, i) => ({
    id: `demo-nation-${i + 1}`,
    country: n.country ?? "",
    country_code: n.country_code ?? null,
    status: n.status ?? "info_needed",
    note: n.note ?? null,
    sort_order: i,
  }));
}

/**
 * Everything the public page shows. Cached and shared by all visitors;
 * the admin refreshes it immediately after each change (updateTag).
 */
export async function getDirectory(): Promise<Directory> {
  "use cache";
  cacheLife("hours"); // also keeps "today" (past / upcoming) reasonably fresh
  cacheTag(DIRECTORY_TAG);

  const today = todayInEurope();

  if (!isSupabaseConfigured()) {
    return { events: demoEvents().sort(compareEvents), nations: demoNations(), today, demo: true };
  }

  const supabase = createPublicClient();
  const [eventsRes, nationsRes] = await Promise.all([
    supabase.from("events").select("*").eq("published", true),
    supabase.from("nations").select("*").order("sort_order").order("country"),
  ]);
  if (eventsRes.error) throw new Error(`Could not load events: ${eventsRes.error.message}`);
  if (nationsRes.error) throw new Error(`Could not load nations: ${nationsRes.error.message}`);

  return {
    events: (eventsRes.data as PBEvent[]).sort(compareEvents),
    nations: nationsRes.data as Nation[],
    today,
    demo: false,
  };
}
