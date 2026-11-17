"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSession, requireAdmin } from "@/lib/auth";
import { downloadImage, findCityImage } from "@/lib/city-image";
import { DIRECTORY_TAG } from "@/lib/data";
import { imageSearchTerm } from "@/lib/event-utils";
import { IMAGE_BUCKET } from "@/lib/supabase/config";
import type { EventStatus, PBEvent } from "@/lib/types";

export interface FormState {
  error?: string;
  /** What the admin typed, so the form is not emptied when there is an error. */
  values?: Record<string, string>;
}

// --------------------------------------------------------------------------
// Sign in / out
// --------------------------------------------------------------------------

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const session = await getSession();
  if (!session.supabase) return { error: "Supabase is not connected yet." };

  const { error } = await session.supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Wrong e-mail or password.", values: { email } };

  const { data: isAdmin } = await session.supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await session.supabase.auth.signOut();
    return { error: "This account is not an administrator of the site.", values: { email } };
  }
  redirect("/admin");
}

export async function signOut() {
  const session = await getSession();
  await session.supabase?.auth.signOut();
  redirect("/admin/login");
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const text = (fd: FormData, key: string): string | null => {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
};

/** Only http(s) links are accepted; "example.org" becomes "https://example.org". */
function cleanUrl(value: string | null): string | null | undefined {
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

type ImageFields = Pick<PBEvent, "image_url" | "image_path" | "image_credit" | "image_source_url">;

const NO_IMAGE: ImageFields = { image_url: null, image_path: null, image_credit: null, image_source_url: null };

async function storeImage(
  supabase: SupabaseClient,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<{ url: string; path: string } | null> {
  const ext = { "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[contentType] ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, bytes, { contentType });
  if (error) return null;
  return { url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl, path };
}

/** Looks the city up on Wikipedia and copies the photo into our own storage. */
async function findAndStoreCityImage(supabase: SupabaseClient, term: string): Promise<ImageFields | null> {
  const found = await findCityImage(term);
  if (!found) return null;

  const file = await downloadImage(found.url);
  const stored = file ? await storeImage(supabase, file.bytes, file.contentType.split(";")[0]) : null;
  return {
    // If the copy fails we still show the photo straight from Wikimedia.
    image_url: stored?.url ?? found.url,
    image_path: stored?.path ?? null,
    image_credit: found.credit,
    image_source_url: found.sourceUrl,
  };
}

/** Deletes a photo file once no event uses it (copies to next year share the file). */
async function removeStoredImageIfUnused(supabase: SupabaseClient, path: string | null) {
  if (!path) return;
  const { count, error } = await supabase
    .from("events").select("id", { count: "exact", head: true }).eq("image_path", path);
  if (!error && !count) await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}

// --------------------------------------------------------------------------
// Events
// --------------------------------------------------------------------------

export async function saveEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") values[k] = v;
  const fail = (error: string): FormState => ({ error, values });

  const id = text(formData, "id");
  const title = text(formData, "title");
  const country = text(formData, "country");
  if (!title) return fail("Please give the event a name.");
  if (!country) return fail("Please fill in the country (or region).");

  const countryCode = text(formData, "country_code")?.toUpperCase() ?? null;
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode))
    return fail("The country code is two letters, for example FI for Finland.");

  const startDate = text(formData, "start_date");
  const endDate = text(formData, "end_date");
  if (startDate && !isDate(startDate)) return fail("The start date is not valid.");
  if (endDate && !isDate(endDate)) return fail("The end date is not valid.");
  if (endDate && !startDate) return fail("Add a start date, or remove the end date.");
  if (startDate && endDate && endDate < startDate) return fail("The end date is before the start date.");

  // With an exact date, year and month follow from it.
  const year = startDate ? Number(startDate.slice(0, 4)) : Number(text(formData, "year"));
  const month = startDate ? Number(startDate.slice(5, 7)) : Number(text(formData, "month")) || null;
  if (!Number.isInteger(year) || year < 1950 || year > 2200)
    return fail("Choose a start date, or at least the year the event takes place.");

  const websiteUrl = cleanUrl(text(formData, "website_url"));
  const contactUrl = cleanUrl(text(formData, "contact_url"));
  if (websiteUrl === undefined) return fail("The website link is not a valid web address.");
  if (contactUrl === undefined) return fail("The contact link is not a valid web address.");

  const contactEmail = text(formData, "contact_email");
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
    return fail("The contact e-mail address is not valid.");

  const status = (text(formData, "status") ?? "confirmed") as EventStatus;
  if (!["confirmed", "tbc", "cancelled"].includes(status)) return fail("Unknown status.");

  const row = {
    title,
    short_name: text(formData, "short_name"),
    city: text(formData, "city"),
    country,
    country_code: countryCode,
    venue: text(formData, "venue"),
    year,
    month,
    start_date: startDate,
    end_date: endDate,
    date_note: text(formData, "date_note"),
    status,
    description: text(formData, "description"),
    website_url: websiteUrl,
    contact_name: text(formData, "contact_name"),
    contact_email: contactEmail,
    contact_phone: text(formData, "contact_phone"),
    contact_url: contactUrl,
    image_query: text(formData, "image_query"),
    published: formData.get("published") === "on",
  };

  // ---- Photo -------------------------------------------------------------
  let existing: PBEvent | null = null;
  if (id) {
    const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
    if (error || !data) return fail("This event no longer exists.");
    existing = data as PBEvent;
  }

  const upload = formData.get("image_file");
  const imageAction = text(formData, "image_action") ?? "keep"; // keep | refresh | remove
  const term = imageSearchTerm(row);
  const termChanged = existing ? imageSearchTerm(existing) !== term : true;
  const wasAutomatic = !existing?.image_url || Boolean(existing.image_source_url);

  let image: ImageFields | undefined; // undefined = leave as it is
  let photoNote = "";

  if (upload instanceof File && upload.size > 0) {
    if (!upload.type.startsWith("image/")) return fail("The photo must be an image file (JPG, PNG or WebP).");
    if (upload.size > 7 * 1024 * 1024) return fail("The photo is too large (7 MB at most).");
    const stored = await storeImage(supabase, await upload.arrayBuffer(), upload.type);
    if (!stored) return fail("The photo could not be uploaded. Please try again.");
    image = {
      image_url: stored.url,
      image_path: stored.path,
      image_credit: text(formData, "image_credit"),
      image_source_url: null,
    };
  } else if (imageAction === "remove") {
    image = NO_IMAGE;
  } else if (imageAction === "refresh" || (termChanged && wasAutomatic)) {
    // New city (or "find again"): look for a photo of the place.
    const found = term ? await findAndStoreCityImage(supabase, term) : null;
    if (found) image = found;
    else if (termChanged) image = NO_IMAGE;
    if (!found && term) photoNote = "nophoto";
  } else if (existing && !existing.image_source_url) {
    // Admin's own photo: the credit line can be edited.
    image = { ...existing, image_credit: text(formData, "image_credit") };
  }

  const payload = image
    ? { ...row, image_url: image.image_url, image_path: image.image_path, image_credit: image.image_credit, image_source_url: image.image_source_url }
    : row;

  const { error } = existing
    ? await supabase.from("events").update(payload).eq("id", existing.id)
    : await supabase.from("events").insert(payload);
  if (error) return fail(`Could not save: ${error.message}`);

  if (image && existing?.image_path && existing.image_path !== image.image_path)
    await removeStoredImageIfUnused(supabase, existing.image_path);

  updateTag(DIRECTORY_TAG);
  redirect(`/admin?saved=${photoNote || "1"}`);
}

export async function deleteEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { data } = await supabase.from("events").delete().eq("id", id).select("image_path").maybeSingle();
  await removeStoredImageIfUnused(supabase, data?.image_path ?? null);
  updateTag(DIRECTORY_TAG);
  redirect("/admin?saved=deleted");
}

/** Annual events: copy this one to the following year, dates to be confirmed. */
export async function copyToNextYear(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { data } = await supabase.from("events").select("*").eq("id", id).single();
  if (!data) redirect("/admin");

  const src = data as PBEvent & { created_at?: string; updated_at?: string };
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = src;
  void _id; void _c; void _u;
  const { data: created, error } = await supabase
    .from("events")
    .insert({
      ...rest,
      year: src.year + 1,
      month: src.month ?? (src.start_date ? Number(src.start_date.slice(5, 7)) : null),
      start_date: null,
      end_date: null,
      date_note: "Date to be confirmed",
      status: "tbc",
      published: false, // review before it goes live
    })
    .select("id")
    .single();
  if (error || !created) redirect("/admin?saved=error");

  updateTag(DIRECTORY_TAG);
  redirect(`/admin/events/${created.id}?copied=1`);
}

/** Finds a city photo for every event that does not have one yet. */
export async function fillMissingImages() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("events").select("*").is("image_url", null);
  const cache = new Map<string, ImageFields | null>();
  let filled = 0;

  for (const event of ((data ?? []) as PBEvent[]).slice(0, 25)) {
    const term = imageSearchTerm(event);
    if (!term) continue;
    if (!cache.has(term)) {
      cache.set(term, await findAndStoreCityImage(supabase, term));
      await new Promise((r) => setTimeout(r, 400)); // stay under Wikipedia's rate limit
    }
    const image = cache.get(term);
    if (!image) continue;
    const { error } = await supabase.from("events").update(image).eq("id", event.id);
    if (!error) filled++;
  }

  updateTag(DIRECTORY_TAG);
  redirect(`/admin?saved=photos-${filled}`);
}

// --------------------------------------------------------------------------
// Nations
// --------------------------------------------------------------------------

export async function saveNation(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") values[k] = v;

  const id = text(formData, "id");
  const country = text(formData, "country");
  if (!country) return { error: "Please fill in the country.", values };
  const countryCode = text(formData, "country_code")?.toUpperCase() ?? null;
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode))
    return { error: "The country code is two letters, for example NL.", values };

  const row = {
    country,
    country_code: countryCode,
    status: text(formData, "status") === "in_progress" ? "in_progress" : "info_needed",
    note: text(formData, "note"),
    sort_order: Number(text(formData, "sort_order")) || 0,
  };
  const { error } = id
    ? await supabase.from("nations").update(row).eq("id", id)
    : await supabase.from("nations").insert(row);
  if (error) return { error: `Could not save: ${error.message}`, values };

  updateTag(DIRECTORY_TAG);
  redirect("/admin/nations?saved=1");
}

export async function deleteNation(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("nations").delete().eq("id", String(formData.get("id") ?? ""));
  updateTag(DIRECTORY_TAG);
  redirect("/admin/nations?saved=deleted");
}
