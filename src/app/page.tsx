import { Logo, Tagline } from "@/components/brand";
import { CityPhoto } from "@/components/city-photo";
import { ArrowDown, ArrowRight } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Timeline } from "@/components/timeline";
import { UpcomingStrip } from "@/components/upcoming-strip";
import { getDirectory } from "@/lib/data";
import { flag, formatDateRange, upcomingEvents } from "@/lib/event-utils";
import type { Nation, PBEvent } from "@/lib/types";

function Hero({ events, next }: { events: PBEvent[]; next: PBEvent | undefined }) {
  const active = events.filter((e) => e.status !== "cancelled");
  const cities = new Set(active.map((e) => e.city).filter(Boolean)).size;
  const countries = new Set(active.map((e) => e.country_code ?? e.country)).size;
  const years = [...new Set(events.map((e) => e.year))].sort();

  return (
    <section className="relative overflow-hidden bg-white">
      <Logo
        variant="emblem"
        height={608}
        decorative
        className="pointer-events-none absolute -top-24 -right-32 h-[38rem] w-[38rem] max-w-none opacity-[0.04]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Tagline className="text-gold-600" />
          <h1 className="mt-6 font-display text-5xl leading-[1.02] font-medium text-balance sm:text-7xl">
            Calendar of <em className="text-gold-600">Prayer Breakfasts</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-700">
            An overview of national and regional prayer breakfasts in Europe and beyond. Each entry
            gives the host city, the dates and a point of contact, in chronological order for every year.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#calendar"
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-navy-700"
            >
              View the calendar <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <dl className="mt-12 flex gap-6 border-t sm:gap-10 border-navy-900/10 pt-6">
            {[
              [active.length, "events listed"],
              [cities, "cities"],
              [countries, "countries"],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-4xl font-medium">{n}</dd>
                <dd className="mt-1 text-xs font-medium tracking-[0.14em] text-navy-500 uppercase">{label}</dd>
              </div>
            ))}
            <div className="hidden sm:block">
              <dd className="font-display text-4xl font-medium">{years.length > 1 ? `${years[0]}-${String(years.at(-1)).slice(2)}` : years[0]}</dd>
              <dd className="mt-1 text-xs font-medium tracking-[0.14em] text-navy-500 uppercase">years covered</dd>
            </div>
          </dl>
        </div>

        {next && (
          <a
            href={`#e-${next.id}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-navy-900 text-white shadow-2xl shadow-navy-900/25 sm:aspect-[5/4] lg:aspect-[4/5]"
          >
            <CityPhoto
              event={next}
              priority
              sizes="(min-width: 1024px) 480px, 100vw"
              className="absolute inset-0 transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-navy-950 via-navy-950/30 to-transparent" />
            <span className="glass-badge glass-badge-gold absolute top-5 left-5 rounded-full px-4 py-1.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase">
              Next event
            </span>
            <span className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8">
              <span className="block text-sm font-semibold tracking-[0.18em] text-gold-300 uppercase">
                {formatDateRange(next)}
              </span>
              <span className="mt-2 block font-display text-5xl leading-none font-medium sm:text-6xl">
                {next.city ?? next.country}
              </span>
              <span className="mt-3 flex items-center justify-between gap-4 text-base text-white/90">
                <span>
                  {flag(next.country_code)} {next.title}
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-1" />
              </span>
            </span>
          </a>
        )}
      </div>
    </section>
  );
}

function Nations({ nations }: { nations: Nation[] }) {
  if (nations.length === 0) return null;
  return (
    <section id="nations" className="bg-navy-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-gold-300 uppercase">Nations</p>
          <h2 className="mt-2 font-display text-4xl leading-tight font-medium sm:text-5xl">
            Countries in preparation
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-navy-100/80">
            In the countries below, a prayer breakfast is being established or relaunched, or the details
            of the annual event have not yet been confirmed. Additional information is welcome.
          </p>
        </div>
        <ul className="grid content-start gap-3 sm:grid-cols-2">
          {nations.map((n) => (
            <li key={n.id} className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
              <p className="flex items-center gap-2.5 font-display text-2xl font-medium">
                {flag(n.country_code) && <span className="text-xl">{flag(n.country_code)}</span>}
                {n.country}
              </p>
              <p className="mt-2 text-[0.65rem] font-semibold tracking-[0.18em] text-gold-300 uppercase">
                {n.status === "in_progress" ? "In preparation" : "Information requested"}
              </p>
              {n.note && <p className="mt-2 text-sm leading-relaxed text-navy-100/80">{n.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default async function Home() {
  const { events, nations, today } = await getDirectory();
  const upcoming = upcomingEvents(events, today);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero events={events} next={upcoming[0]} />

        {upcoming.length > 1 && (
          <section id="coming-up" className="bg-navy-900 py-16 sm:py-20">
            <UpcomingStrip events={upcoming.slice(0, 12)} />
          </section>
        )}

        <section id="calendar" className="mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-gold-600 uppercase">Calendar</p>
          <h2 className="mt-2 font-display text-4xl font-medium sm:text-5xl">Events by year</h2>
          <p className="mt-4 mb-8 max-w-2xl leading-relaxed text-navy-700">
            Events are listed in chronological order. Each entry shows the host city, the dates, a link
            to the organisers’ website and a contact.
          </p>
          <Timeline events={events} today={today} />
        </section>

        <Nations nations={nations} />
      </main>
      <SiteFooter events={events} />
    </>
  );
}
