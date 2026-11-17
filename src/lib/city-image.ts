// Finds a photo for a city (or landmark) on Wikipedia / Wikimedia Commons,
// together with the author and licence so it can be credited on the card.
// No API key needed. Kept dependency-free so scripts can import it too.
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CityImage {
  url: string; // ~1280px wide rendition
  credit: string; // "Author · CC BY-SA 4.0 · Wikimedia Commons"
  sourceUrl: string; // file page on Wikimedia
  pageTitle: string; // Wikipedia article the photo comes from
}

const API = "https://en.wikipedia.org/w/api.php";
const HEADERS = { "User-Agent": "PrayerBreakfastsDirectory/1.0", Accept: "application/json" };

interface WikiPage {
  title: string;
  missing?: boolean;
  pageimage?: string;
  thumbnail?: { source: string; width: number; height: number };
}

/** GET with a couple of retries: the API answers 429 when called in quick bursts. */
async function getJson(params: Record<string, string>): Promise<any | null> {
  const qs = new URLSearchParams({ action: "query", format: "json", formatversion: "2", ...params });
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${API}?${qs}`, { headers: HEADERS });
    if (res.ok) return res.json();
    if (res.status !== 429 && res.status < 500) return null;
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  return null;
}

async function query(params: Record<string, string>): Promise<WikiPage | null> {
  const json = await getJson(params);
  const page: WikiPage | undefined = json?.query?.pages?.[0];
  return page && !page.missing ? page : null;
}

const IMAGE_PROPS = { prop: "pageimages", piprop: "thumbnail|name", pithumbsize: "1280" };

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function findCityImage(term: string): Promise<CityImage | null> {
  const q = term.trim();
  if (!q) return null;

  // 1. Exact article title (follows redirects); 2. otherwise best search hit.
  let page = await query({ ...IMAGE_PROPS, titles: q, redirects: "1" });
  if (!page?.thumbnail) {
    page = await query({ ...IMAGE_PROPS, generator: "search", gsrsearch: q, gsrlimit: "1" });
  }
  if (!page?.thumbnail || !page.pageimage) return null;

  const fileTitle = `File:${page.pageimage}`;
  let credit = "Wikimedia Commons";
  let sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle.replaceAll(" ", "_"))}`;

  try {
    const json = await getJson({ prop: "imageinfo", iiprop: "extmetadata|url", titles: fileTitle });
    const info = json?.query?.pages?.[0]?.imageinfo?.[0];
    if (info) {
      const meta = info.extmetadata ?? {};
      let artist = stripHtml(meta.Artist?.value ?? "").replace(/^(photo|author)\s*:\s*/i, "");
      // Derivative works list several files and authors; the source link has the full credit.
      if (artist.length > 80 || /^File:|derivative work/i.test(artist)) artist = "";
      const licence = stripHtml(meta.LicenseShortName?.value ?? "");
      credit = [artist, licence, "Wikimedia Commons"].filter(Boolean).join(" · ");
      if (info.descriptionurl) sourceUrl = info.descriptionurl;
    }
  } catch {
    // Credit lookup is best-effort; the photo itself is still usable.
  }

  return { url: page.thumbnail.source.split("?")[0], credit, sourceUrl, pageTitle: page.title };
}

/** Downloads the photo so it can be copied into our own storage. */
export async function downloadImage(url: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const res = await fetch(url, { headers: { "User-Agent": HEADERS["User-Agent"] } });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) return null;
  return { bytes: await res.arrayBuffer(), contentType };
}
