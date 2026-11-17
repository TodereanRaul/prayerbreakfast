# prayerbreakfasts.com

A calendar of national and regional prayer breakfasts: every gathering in the order it takes
place each year, with a photo of the city, a "More info" link and its own contact.
An administrator keeps the list up to date from `/admin`.

Next.js 16 (App Router, Cache Components) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage).

## Run it

```bash
npm install
npm run dev
```

Without Supabase keys the site runs in **demo mode**: it shows the list in
`src/data/seed.json` (from "Prayer Breakfasts mainly in Europe, version 5.0") and the admin
is switched off.

## Connect Supabase

1. Create a Supabase project.
2. In the SQL editor, run the files in `supabase/migrations` in order, then `supabase/seed.sql`
   (the starting list of events, with city photos).
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
4. Create the administrator: Authentication → Users → Add user (e-mail + password), then

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'admin@example.org';
   ```

5. Authentication → Sign In / Providers: turn off "Allow new users to sign up".
   (Signing up would not grant any rights anyway: only users in `admins` can write.)

Sign in at `/admin/login`.

## How it works

| | |
|---|---|
| `src/app/page.tsx` | The public page: hero, "coming up" strip, year-by-year calendar, nations |
| `src/lib/data.ts` | Reads events (cached; refreshed the moment an admin saves) |
| `src/app/admin` | Admin: sign in, add / edit / delete events, copy an event to next year, nations |
| `src/app/admin/actions.ts` | All writes (Server Actions), each one checks the admin session |
| `src/lib/city-image.ts` | Finds a photo of the city on Wikipedia, with author and licence |
| `supabase/migrations` | Tables, row-level security, storage bucket |

**City photos.** When an event is saved, a photo of its city is looked up on Wikipedia
(no API key), copied into the `event-images` storage bucket and credited in the footer
("Photo credits"). In the edit form an admin can search for a landmark instead
("Westminster Hall"), search again, or upload their own photo.

**Dates.** An event has exact dates, or just a year and month plus a note ("Week 21",
"Date to be confirmed"). Events are sorted by date inside each year; past ones are marked
"Took place" and the next one is highlighted.

**Security.** Everyone can read published events. Writes are allowed by row-level security
only for users listed in `public.admins`; the same rule protects the storage bucket.

## Scripts

- `npm run seed:images` looks up a photo for seed events that have none (`-- --force` redoes all)
- `npm run seed:sql` regenerates `supabase/seed.sql` from `src/data/seed.json`
