import Image from "next/image";
import type { PBEvent } from "@/lib/types";
import { Logo } from "./brand";

/**
 * The photo of the city where the event takes place. Wikimedia already serves
 * a resized rendition, so those are loaded directly; images in Supabase
 * Storage go through the Next.js image optimizer.
 */
export function CityPhoto({
  event,
  sizes,
  width = 960,
  priority = false,
  className = "",
}: {
  event: Pick<PBEvent, "image_url" | "city" | "country">;
  sizes: string;
  /** Rendition to ask Wikimedia for (standard sizes: 500, 960, 1280). */
  width?: 500 | 960 | 1280;
  priority?: boolean;
  className?: string;
}) {
  if (!event.image_url) {
    return (
      <div
        className={`flex items-center justify-center bg-linear-to-br from-navy-800 to-navy-950 ${className}`}
      >
        <Logo variant="emblem" tone="light" height={96} decorative className="h-2/5 max-h-24 w-auto opacity-25" />
      </div>
    );
  }

  let direct = false;
  let src = event.image_url;
  try {
    direct = new URL(src).hostname.endsWith("wikimedia.org");
  } catch {
    direct = true;
  }
  if (direct) {
    // ".../1280px-Name.jpg" → smaller standard rendition (never upscale)
    src = src.replace(/\/(\d+)px-(?=[^/]+$)/, (m, px) => (Number(px) > width ? `/${width}px-` : m));
  }

  return (
    <div className={`${className.includes("absolute") ? "" : "relative"} overflow-hidden bg-navy-100 ${className}`}>
      <Image
        src={src}
        alt={event.city ? `${event.city}, ${event.country}` : event.country}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={direct}
        className="object-cover"
      />
    </div>
  );
}
