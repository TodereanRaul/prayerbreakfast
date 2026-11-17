// Pure helpers shared by server and client components.
import type { PBEvent } from "./types";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** Month the event belongs to (exact date wins over the month field). */
export function eventMonth(e: Pick<PBEvent, "start_date" | "month">): number | null {
  return e.start_date ? parts(e.start_date).m : e.month;
}

/** Chronological order inside a year; undated events go last within their month. */
export function compareEvents(a: PBEvent, b: PBEvent): number {
  if (a.year !== b.year) return a.year - b.year;
  const am = eventMonth(a) ?? 13;
  const bm = eventMonth(b) ?? 13;
  if (am !== bm) return am - bm;
  if (a.start_date && b.start_date && a.start_date !== b.start_date)
    return a.start_date < b.start_date ? -1 : 1;
  if (a.start_date && !b.start_date) return -1;
  if (!a.start_date && b.start_date) return 1;
  return a.title.localeCompare(b.title);
}

/** "18-19 May 2026", "29 May to 2 Jun 2026", "May 2026" */
export function formatDateRange(e: PBEvent, opts: { withYear?: boolean } = {}): string {
  const withYear = opts.withYear ?? true;
  const yr = withYear ? ` ${e.year}` : "";
  if (!e.start_date) {
    const m = eventMonth(e);
    return m ? `${MONTHS[m - 1]}${yr}` : `${e.year}`;
  }
  const s = parts(e.start_date);
  if (!e.end_date || e.end_date === e.start_date) return `${s.d} ${MONTHS[s.m - 1]}${yr}`;
  const en = parts(e.end_date);
  if (s.m === en.m && s.y === en.y) return `${s.d}-${en.d} ${MONTHS[s.m - 1]}${yr}`;
  return `${s.d} ${SHORT_MONTHS[s.m - 1]} to ${en.d} ${SHORT_MONTHS[en.m - 1]}${yr}`;
}

/** Big "day" label for the date tile: "18-19", "9", or "TBC". */
export function dayLabel(e: PBEvent): string {
  if (!e.start_date) return "TBC";
  const s = parts(e.start_date);
  if (!e.end_date || e.end_date === e.start_date) return String(s.d);
  const en = parts(e.end_date);
  return s.m === en.m ? `${s.d}-${en.d}` : `${s.d}+`;
}

export function shortMonth(e: PBEvent): string {
  const m = eventMonth(e);
  return m ? SHORT_MONTHS[m - 1] : String(e.year);
}

/** Last day the event could be happening, used to decide if it is in the past. */
function lastPossibleDay(e: PBEvent): string {
  if (e.end_date) return e.end_date;
  if (e.start_date) return e.start_date;
  const m = eventMonth(e);
  if (!m) return `${e.year}-12-31`;
  const last = new Date(Date.UTC(e.year, m, 0)).getUTCDate();
  return `${e.year}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export type Phase = "past" | "now" | "upcoming";

export function eventPhase(e: PBEvent, today: string): Phase {
  if (lastPossibleDay(e) < today) return "past";
  if (e.start_date && e.start_date <= today) return "now";
  return "upcoming";
}

/** Upcoming (or happening now) events that are not cancelled, in order. */
export function upcomingEvents(events: PBEvent[], today: string): PBEvent[] {
  return events.filter((e) => e.status !== "cancelled" && eventPhase(e, today) !== "past");
}

/** 🇫🇮 from "FI" */
export function flag(code: string | null | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function placeLabel(e: PBEvent): string {
  return e.city ? `${e.city}, ${e.country}` : e.country;
}

/** What to search for when looking for the city photo. */
export function imageSearchTerm(e: Pick<PBEvent, "image_query" | "city">): string | null {
  return e.image_query?.trim() || e.city?.trim() || null;
}

export function contactHref(e: PBEvent): string | null {
  if (e.contact_email) return `mailto:${e.contact_email}`;
  if (e.contact_url) return e.contact_url;
  if (e.contact_phone) return `tel:${e.contact_phone.replace(/[^+\d]/g, "")}`;
  return null;
}
