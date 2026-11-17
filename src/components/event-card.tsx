import {
  contactHref, dayLabel, eventPhase, flag, formatDateRange, shortMonth, type Phase,
} from "@/lib/event-utils";
import type { PBEvent } from "@/lib/types";
import { CityPhoto } from "./city-photo";
import { ArrowUpRight, Close, Globe, Mail, Phone, Pin } from "./icons";

function StatusBadge({ event, phase, isNext }: { event: PBEvent; phase: Phase; isNext: boolean }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.14em] uppercase";
  if (event.status === "cancelled")
    return <span className={`${base} bg-red-50 text-red-800 ring-1 ring-red-200`}>Cancelled</span>;
  if (phase === "now")
    return (
      <span className={`${base} bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200`}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> In progress
      </span>
    );
  if (isNext) return <span className={`${base} bg-gold-500 text-white`}>Next event</span>;
  if (phase === "past") return <span className={`${base} bg-navy-50 text-navy-500`}>Past event</span>;
  if (event.status === "tbc" || !event.start_date)
    return <span className={`${base} bg-gold-100 text-gold-700 ring-1 ring-gold-300/60`}>To be confirmed</span>;
  return null;
}

/** "Contact" button: one set of contact details per prayer breakfast. */
function ContactButton({ event }: { event: PBEvent }) {
  const href = contactHref(event);
  if (!href) return null;

  const cls =
    "inline-flex items-center gap-2 rounded-full border border-navy-900/20 px-4 py-2 text-xs font-semibold tracking-wide text-navy-900 transition hover:border-navy-900 hover:bg-navy-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500";

  const details = [event.contact_email, event.contact_phone, event.contact_url].filter(Boolean).length;
  // A single e-mail address: open the mail app straight away.
  if (details === 1 && !event.contact_name) {
    return (
      <a href={href} className={cls} {...(event.contact_url ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        <Mail className="h-4 w-4" /> Contact
      </a>
    );
  }

  const id = `contact-${event.id}`;
  return (
    <>
      <button type="button" popoverTarget={id} className={cls}>
        <Mail className="h-4 w-4" /> Contact
      </button>
      <div id={id} popover="auto" className="contact-popover">
        <div className="rounded-2xl bg-white p-6 text-navy-900 shadow-2xl ring-1 ring-navy-900/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-600 uppercase">Contact</p>
              <p className="mt-1 font-display text-2xl leading-tight">{event.title}</p>
              <p className="text-sm text-navy-500">
                {event.city ? `${event.city}, ` : ""}
                {event.country}
              </p>
            </div>
            <button
              type="button"
              popoverTarget={id}
              popoverTargetAction="hide"
              aria-label="Close"
              className="rounded-full p-1.5 text-navy-500 hover:bg-navy-50 hover:text-navy-900"
            >
              <Close className="h-5 w-5" />
            </button>
          </div>
          <ul className="mt-5 space-y-3 text-sm">
            {event.contact_name && <li className="font-semibold">{event.contact_name}</li>}
            {event.contact_email && (
              <li>
                <a href={`mailto:${event.contact_email}`} className="inline-flex items-center gap-2.5 underline-offset-4 hover:underline">
                  <Mail className="h-4 w-4 text-gold-600" /> {event.contact_email}
                </a>
              </li>
            )}
            {event.contact_phone && (
              <li>
                <a href={`tel:${event.contact_phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-2.5 underline-offset-4 hover:underline">
                  <Phone className="h-4 w-4 text-gold-600" /> {event.contact_phone}
                </a>
              </li>
            )}
            {event.contact_url && (
              <li>
                <a href={event.contact_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 underline-offset-4 hover:underline">
                  <Globe className="h-4 w-4 text-gold-600" /> Contact page
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export function EventCard({
  event,
  today,
  isNext = false,
  priority = false,
}: {
  event: PBEvent;
  today: string;
  isNext?: boolean;
  priority?: boolean;
}) {
  const phase = eventPhase(event, today);
  const cancelled = event.status === "cancelled";
  const muted = cancelled || phase === "past";
  const hasContact = Boolean(contactHref(event));

  return (
    <article
      id={`e-${event.id}`}
      className={`group grid overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgb(19_40_76/0.06),0_8px_24px_-12px_rgb(19_40_76/0.18)] ring-1 transition sm:grid-cols-[minmax(0,15rem)_1fr] lg:grid-cols-[minmax(0,19rem)_1fr] ${
        isNext ? "ring-2 ring-gold-500" : "ring-navy-900/8 hover:ring-navy-900/20"
      }`}
    >
      {/* City photo */}
      <div className="relative">
        <CityPhoto
          event={event}
          sizes="(min-width: 1024px) 304px, (min-width: 640px) 240px, 100vw"
          priority={priority}
          className={`aspect-[16/10] h-full w-full sm:aspect-auto sm:min-h-52 ${muted ? "saturate-[0.35]" : ""}`}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-navy-950/80 via-navy-950/10 to-transparent" />
        <p className="absolute right-4 bottom-3 left-4 flex items-end gap-2 text-white">
          <span className="text-xl leading-none">{flag(event.country_code)}</span>
          <span className="font-display text-2xl leading-none font-medium">{event.city ?? event.country}</span>
        </p>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex w-16 shrink-0 flex-col items-center rounded-xl py-2 text-center ${
              muted ? "bg-navy-50 text-navy-500" : "bg-navy-900 text-white"
            }`}
          >
            <span className={`font-display leading-none font-semibold ${dayLabel(event).length > 3 ? "text-xl" : "text-3xl"}`}>
              {dayLabel(event)}
            </span>
            <span className={`mt-1 text-[0.65rem] font-semibold tracking-[0.18em] uppercase ${muted ? "" : "text-gold-300"}`}>
              {shortMonth(event)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge event={event} phase={phase} isNext={isNext} />
              {event.short_name && (
                <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-gold-600 uppercase">{event.short_name}</span>
              )}
            </div>
            <h3 className={`mt-1.5 font-display text-[1.65rem] leading-[1.1] font-medium text-balance ${cancelled ? "text-navy-500 line-through decoration-1" : ""}`}>
              {event.title}
            </h3>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-navy-700">
              <Pin className="h-4 w-4 shrink-0 text-gold-600" />
              <span>
                {event.venue ? `${event.venue} · ` : ""}
                {event.city ? `${event.city}, ` : ""}
                {event.country}
              </span>
            </p>
          </div>
        </div>

        <div className="text-sm leading-relaxed text-navy-700">
          <p className="font-semibold text-navy-900">
            {formatDateRange(event)}
            {event.date_note && <span className="font-normal text-navy-500"> · {event.date_note}</span>}
          </p>
          {event.description && <p className="mt-1.5 max-w-prose">{event.description}</p>}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-1">
          {event.website_url && (
            <a
              href={event.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-2 text-xs font-semibold tracking-wide text-white transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              More info <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
          <ContactButton event={event} />
          {!event.website_url && !hasContact && (
            <span className="text-xs text-navy-500 italic">Website and contact details to follow</span>
          )}
        </div>
      </div>
    </article>
  );
}
