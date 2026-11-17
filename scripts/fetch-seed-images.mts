// Fills in image_url / image_credit / image_source_url in src/data/seed.json
// by looking each city up on Wikipedia. Run: npm run seed:images
import { readFileSync, writeFileSync } from "node:fs";
import { findCityImage, type CityImage } from "../src/lib/city-image.ts";

const file = new URL("../src/data/seed.json", import.meta.url);
const seed = JSON.parse(readFileSync(file, "utf8"));
const force = process.argv.includes("--force");
const cache = new Map<string, CityImage | null>();

for (const e of seed.events) {
  const term: string | undefined = e.image_query ?? e.city;
  if (!term || (e.image_url && !force)) continue;
  if (!cache.has(term)) {
    cache.set(term, await findCityImage(term));
    await new Promise((r) => setTimeout(r, 600)); // be polite to the API
  }
  const img = cache.get(term);
  console.log(`${img ? "✓" : "✗"} ${term}${img ? ` → ${img.pageTitle}` : ""}`);
  if (img) {
    e.image_url = img.url;
    e.image_credit = img.credit;
    e.image_source_url = img.sourceUrl;
  }
}

writeFileSync(file, JSON.stringify(seed, null, 2) + "\n");
