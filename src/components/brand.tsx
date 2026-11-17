import Image from "next/image";
import emblemLight from "../../public/brand/emblem-light.png";
import emblem from "../../public/brand/emblem.png";
import horizontalLight from "../../public/brand/logo-horizontal-light.png";
import horizontal from "../../public/brand/logo-horizontal.png";
import stackedLight from "../../public/brand/logo-stacked-light.png";
import stacked from "../../public/brand/logo-stacked.png";

// Every file here is cut from the logo as supplied (public/brand/logo-full.jpg)
// by scripts/build-logo-assets.mjs. Nothing is redrawn.
const FILES = {
  /** Emblem with "PRAYER BREAKFASTS" beside it, for header bars */
  horizontal: { dark: horizontal, light: horizontalLight },
  /** The full logo: emblem, name and "Leaders | Faith | Fellowship" */
  stacked: { dark: stacked, light: stackedLight },
  /** The emblem on its own */
  emblem: { dark: emblem, light: emblemLight },
};

export function Logo({
  variant,
  tone = "dark",
  height,
  priority = false,
  decorative = false,
  className = "",
}: {
  variant: keyof typeof FILES;
  /** "dark" ink for light backgrounds, "light" ink for navy backgrounds */
  tone?: "dark" | "light";
  /** Rendered height in pixels; the width follows the logo's proportions */
  height: number;
  priority?: boolean;
  /** True when the logo is only ornament (watermark, placeholder) */
  decorative?: boolean;
  className?: string;
}) {
  const file = FILES[variant][tone];
  const width = Math.round((height * file.width) / file.height);
  return (
    <Image
      src={file}
      alt={decorative ? "" : "Prayer Breakfasts"}
      width={width}
      height={height}
      sizes={`${width}px`}
      priority={priority}
      className={`shrink-0 ${className}`}
    />
  );
}

export function Tagline({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-[0.68rem] font-medium tracking-[0.32em] uppercase ${className}`}>
      <span>Leaders</span>
      <span aria-hidden className="h-3 w-px bg-current opacity-50" />
      <span>Faith</span>
      <span aria-hidden className="h-3 w-px bg-current opacity-50" />
      <span>Fellowship</span>
    </p>
  );
}
