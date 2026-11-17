// Cuts the supplied logo (public/brand/logo-full.jpg) into the pieces the site
// uses, with a transparent background, plus a light version for dark
// backgrounds. Nothing is redrawn: every pixel comes from the supplied file.
// Run: npm run logo
import sharp from "sharp";

const SRC = new URL("../public/brand/logo-full.jpg", import.meta.url);
const out = (name) => new URL(`../public/brand/${name}`, import.meta.url).pathname;
const app = (name) => new URL(`../src/app/${name}`, import.meta.url).pathname;

// Where each part sits in the 1254×1254 source (measured from the ink).
const PAD = 10;
const box = (x0, y0, x1, y1) => ({ left: x0 - PAD, top: y0 - PAD, width: x1 - x0 + 2 * PAD, height: y1 - y0 + 2 * PAD });
const EMBLEM = box(401, 240, 852, 686);
const WORDMARK = box(271, 759, 985, 910); // PRAYER / BREAKFASTS
const STACKED = box(271, 240, 985, 988); // emblem + wordmark + tagline

const GOLD_LIGHT = [211, 191, 153]; // readable on navy

/**
 * White background → transparent. `light` turns the navy ink white (and the
 * gold tagline a lighter gold) for use on dark backgrounds.
 */
async function cut(region, { light = false } = {}) {
  const { data, info } = await sharp(SRC.pathname).extract(region).raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += 3, o += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let a = 1 - Math.min(r, g, b) / 255;
    if (a < 0.05) continue; // paper (and JPEG noise) stays fully transparent
    const gold = r - b > 8;
    if (light) {
      const [R, G, B] = gold ? GOLD_LIGHT : [255, 255, 255];
      px[o] = R; px[o + 1] = G; px[o + 2] = B;
      px[o + 3] = Math.round(255 * Math.min(1, a / (gold ? 0.62 : 0.92)));
    } else {
      // Colour that, laid over white at this opacity, gives back the original pixel.
      const un = (v) => Math.max(0, Math.min(255, Math.round((v - (1 - a) * 255) / a)));
      px[o] = un(r); px[o + 1] = un(g); px[o + 2] = un(b);
      px[o + 3] = Math.round(255 * a);
    }
  }
  return sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } });
}

const png = (img) => img.png({ compressionLevel: 9 });
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

for (const light of [false, true]) {
  const suffix = light ? "-light" : "";

  // Emblem on its own (square)
  const emblem = await (await cut(EMBLEM, { light }))
    .resize(480, 480, { fit: "contain", background: CLEAR }).png().toBuffer();
  await png(sharp(emblem)).toFile(out(`emblem${suffix}.png`));

  // Emblem + wordmark + tagline, as supplied
  await png(await cut(STACKED, { light })).toFile(out(`logo-stacked${suffix}.png`));

  // Emblem with the wordmark beside it, for the header bars
  const H = 240;
  const wordmark = await (await cut(WORDMARK, { light })).resize({ height: 184 }).png().toBuffer();
  const wm = await sharp(wordmark).metadata();
  const mark = await sharp(emblem).resize(H, H).png().toBuffer();
  await png(
    sharp({ create: { width: H + 44 + wm.width, height: H, channels: 4, background: CLEAR } }).composite([
      { input: mark, left: 0, top: 0 },
      { input: wordmark, left: H + 44, top: Math.round((H - wm.height) / 2) },
    ]),
  ).toFile(out(`logo-horizontal${suffix}.png`));
}

// Browser tab icon and home-screen icon: the emblem on white
for (const [file, size] of [["icon.png", 256], ["apple-icon.png", 180]]) {
  const inner = Math.round(size * 0.84);
  const mark = await sharp(out("emblem.png")).resize(inner, inner).png().toBuffer();
  await png(
    sharp({ create: { width: size, height: size, channels: 4, background: WHITE } })
      .composite([{ input: mark, gravity: "centre" }]),
  ).toFile(app(file));
}

// Link preview (shared on WhatsApp, e-mail, social): the full logo on white
const stacked = await sharp(out("logo-stacked.png")).resize({ height: 480 }).png().toBuffer();
await png(
  sharp({ create: { width: 1200, height: 630, channels: 4, background: WHITE } })
    .composite([{ input: stacked, gravity: "centre" }]),
).toFile(app("opengraph-image.png"));

console.log("Logo assets written to public/brand and src/app");
