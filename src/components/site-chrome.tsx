import Link from "next/link";
import type { PBEvent } from "@/lib/types";
import { Logo } from "./brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-navy-900/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Prayer Breakfasts, home">
          <Logo variant="horizontal" height={44} priority />
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-8 text-xs font-semibold tracking-[0.16em] text-navy-700 uppercase sm:flex">
          <a href="#coming-up" className="hover:text-navy-900">Upcoming</a>
          <a href="#calendar" className="hover:text-navy-900">Calendar</a>
          <a href="#nations" className="hover:text-navy-900">Nations</a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ events }: { events: PBEvent[] }) {
  // One line per place and photographer (the same photo can be used for several years).
  const credits = [
    ...new Map(
      events
        .filter((e) => e.image_url && e.image_credit)
        .map((e) => {
          const place = e.city ?? e.country;
          return [`${place}|${e.image_credit}`, { place, credit: e.image_credit!, href: e.image_source_url }];
        }),
    ).values(),
  ];

  return (
    <footer className="mt-auto bg-navy-950 text-navy-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <Logo variant="stacked" tone="light" height={208} />
          <p className="max-w-sm text-sm leading-relaxed">
            For questions about a specific event, please use the contact details shown on its entry in
            the calendar.
          </p>
        </div>

        {credits.length > 0 && (
          <details className="mt-10 border-t border-white/10 pt-6 text-xs">
            <summary className="cursor-pointer font-semibold tracking-[0.16em] uppercase hover:text-white">
              Photo credits
            </summary>
            <ul className="mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
              {credits.map((c) => (
                <li key={c.credit + c.place}>
                  <span className="text-white">{c.place}</span>:{" "}
                  {c.href ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                      {c.credit}
                    </a>
                  ) : (
                    c.credit
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 text-xs">
          <p>prayerbreakfasts.com</p>
          <Link href="/admin" className="hover:text-white">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
