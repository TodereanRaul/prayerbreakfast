"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MONTHS, eventMonth, upcomingEvents } from "@/lib/event-utils";
import type { PBEvent } from "@/lib/types";
import { EventCard } from "./event-card";
import { ArrowDown, Close, Search } from "./icons";

interface MonthGroup {
  year: number;
  month: number | null;
  events: PBEvent[];
}

function groupByMonth(events: PBEvent[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const e of events) {
    const month = eventMonth(e);
    const last = groups.at(-1);
    if (last && last.year === e.year && last.month === month) last.events.push(e);
    else groups.push({ year: e.year, month, events: [e] });
  }
  return groups;
}

/** Forget a "#e-…" link once the visitor browses on, so clicking it again works. */
function clearCardHash() {
  if (window.location.hash.startsWith("#e-"))
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
}

function matches(e: PBEvent, q: string): boolean {
  return [e.title, e.short_name, e.city, e.country, e.venue]
    .filter(Boolean)
    .some((v) => v!.toLowerCase().includes(q));
}

/** The full calendar: one year at a time, month by month, in date order. */
export function Timeline({ events, today }: { events: PBEvent[]; today: string }) {
  const years = useMemo(() => [...new Set(events.map((e) => e.year))].sort((a, b) => a - b), [events]);
  const next = useMemo(() => upcomingEvents(events, today)[0], [events, today]);
  const currentYear = Number(today.slice(0, 4));
  const defaultYear = next?.year ?? (years.includes(currentYear) ? currentYear : years.at(-1));

  const [year, setYear] = useState(defaultYear);
  const [query, setQuery] = useState("");
  const pendingScroll = useRef<string | null>(null);

  // Links like #e-<id> (from the "Coming up" strip) open the right year first.
  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.slice(1);
      if (!id.startsWith("e-")) return;
      const target = events.find((e) => `e-${e.id}` === id);
      if (!target) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: "center" });
        return;
      }
      // The card is in another year (or hidden by a search): show it first.
      pendingScroll.current = id;
      setQuery("");
      setYear(target.year);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [events]);

  // Runs after the year has been switched and the card exists in the page.
  useEffect(() => {
    if (!pendingScroll.current) return;
    document.getElementById(pendingScroll.current)?.scrollIntoView({ block: "center" });
    pendingScroll.current = null;
  });

  const q = query.trim().toLowerCase();
  const visible = q ? events.filter((e) => matches(e, q)) : events.filter((e) => e.year === year);
  const groups = groupByMonth(visible);
  const monthsInYear = q ? [] : groups.filter((g) => g.month).map((g) => g.month!);

  return (
    <div>
      {/* Sticky controls */}
      <div className="sticky top-16 z-20 -mx-4 border-y border-navy-900/10 bg-cream/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div role="tablist" aria-label="Year" className="flex rounded-full bg-navy-900/6 p-1">
            {years.map((y) => {
              const active = !q && y === year;
              return (
                <button
                  key={y}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    clearCardHash();
                    setQuery("");
                    setYear(y);
                  }}
                  className={`rounded-full px-5 py-1.5 text-sm font-semibold tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 ${
                    active ? "bg-navy-900 text-white shadow" : "text-navy-700 hover:text-navy-900"
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>

          <label className="relative order-last w-full sm:order-none sm:ml-auto sm:w-64">
            <span className="sr-only">Search by city or country</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-navy-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                clearCardHash();
                setQuery(e.target.value);
              }}
              placeholder="Search by city or country"
              className="w-full rounded-full border border-navy-900/15 bg-white py-2 pr-9 pl-10 text-sm placeholder:text-navy-500/70 focus:border-navy-900 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-navy-500 hover:text-navy-900"
              >
                <Close className="h-4 w-4" />
              </button>
            )}
          </label>

          {!q && next && next.year === year && (
            <a
              href={`#e-${next.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-gold-700 underline-offset-4 hover:underline"
            >
              Go to next event <ArrowDown className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {monthsInYear.length > 0 && (
          <nav aria-label="Months" className="no-scrollbar -mx-1 mt-3 flex gap-1 overflow-x-auto">
            {monthsInYear.map((m) => (
              <a
                key={m}
                href={`#m-${year}-${m}`}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-medium tracking-wide text-navy-700 hover:bg-navy-900/6 hover:text-navy-900"
              >
                {MONTHS[m - 1]}
              </a>
            ))}
          </nav>
        )}
      </div>

      {/* Month by month */}
      {groups.length === 0 ? (
        <p className="py-20 text-center text-navy-500">
          No events match “{query}”.
        </p>
      ) : (
        <ol className="mt-4">
          {groups.map((g, gi) => {
            const showYear = q && (gi === 0 || groups[gi - 1].year !== g.year);
            return (
              <li key={`${g.year}-${g.month}`} id={g.month ? `m-${g.year}-${g.month}` : undefined}>
                {showYear && (
                  <p className="pt-10 font-display text-5xl font-medium text-navy-900/25">{g.year}</p>
                )}
                <div className="grid gap-x-10 gap-y-4 border-b border-navy-900/10 py-10 lg:grid-cols-[11rem_1fr]">
                  <div className="lg:sticky lg:top-48 lg:self-start">
                    <h3 className="font-display text-4xl leading-none font-medium">
                      {g.month ? MONTHS[g.month - 1] : "Date to be confirmed"}
                    </h3>
                    <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-gold-600 uppercase">
                      {g.year} · {g.events.length} {g.events.length === 1 ? "event" : "events"}
                    </p>
                  </div>
                  <div className="space-y-5">
                    {g.events.map((e) => (
                      <EventCard key={e.id} event={e} today={today} isNext={e.id === next?.id} />
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
