"use client";

import { useRef } from "react";
import { flag, formatDateRange } from "@/lib/event-utils";
import type { PBEvent } from "@/lib/types";
import { CityPhoto } from "./city-photo";
import { ArrowLeft, ArrowRight } from "./icons";

/** Horizontal, swipeable strip with the next prayer breakfasts. */
export function UpcomingStrip({ events }: { events: PBEvent[] }) {
  const scroller = useRef<HTMLUListElement>(null);
  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  const arrow =
    "hidden h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition hover:border-white hover:bg-white hover:text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 sm:flex";

  return (
    <div>
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-gold-300 uppercase">Upcoming</p>
          <h2 className="mt-2 font-display text-4xl font-medium text-white sm:text-5xl">Upcoming events</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll back" className={arrow}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll forward" className={arrow}>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <ul
        ref={scroller}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 sm:scroll-px-6 sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]"
      >
        {events.map((e, i) => (
          <li key={e.id} className="w-[78vw] max-w-80 shrink-0 snap-start sm:w-80">
            <a
              href={`#e-${e.id}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-navy-950 text-white shadow-lg shadow-navy-950/40 ring-1 ring-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              <CityPhoto
                event={e}
                sizes="320px"
                priority={i < 2}
                className="absolute inset-0 transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-navy-950 via-navy-950/35 to-navy-950/10" />
              <span className="glass-badge absolute top-4 left-4 rounded-full px-3.5 py-1.5 text-xs font-semibold">
                {formatDateRange(e)}
              </span>
              <span className="absolute inset-x-5 bottom-5">
                <span className="block text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">
                  {flag(e.country_code)} {e.country}
                </span>
                <span className="mt-1 block font-display text-4xl leading-none font-medium">{e.city ?? e.country}</span>
                <span className="mt-2 block text-sm leading-snug text-white/85">{e.title}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
