# ReiseCeylon

A premium Sri Lanka destination discovery and private journey platform built with Next.js, TypeScript, Tailwind CSS, and Framer Motion.

## Development

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. Use `npm run lint` for TypeScript validation and `npm run build` for a production build.

## Routes

- `/` — destination-led homepage
- `/destinations` — the atlas: every mapped place, filterable by landscape and province
- `/destinations/[slug]` — destination story, location record, map and what is nearby
- `/journeys` — plan your journey: pick a ready-made package or build your own route
- `/tours/[slug]` — private journey details
- `/about` — brand story
- `/blog` — travel journal (Sanity)
- `/blog/[slug]` — journal entry (Sanity)
- `/contact` — journey enquiry
- `/studio` — Sanity Studio, where journal entries are written

Brand source files live in `design.md`; optimized web assets are stored under `public/brand/` and `public/images/`.

## The atlas

`public/json/sri-lanka-tourist-places-map.json` is the factual record for every
destination — 174 places across 13 landscapes and 9 provinces, with coordinates,
district, nearest town and point precision. `sri-lanka-tourist-places.geojson`
is the same data as a FeatureCollection, for mapping tools.

[src/lib/places.ts](src/lib/places.ts) reads it and is the single source for
categories, provinces, distances and map links.

Photography lives at `public/images/destination/<slug>.jpg`, one file per place.
Four are real photographs; the rest are generated sample plates:

```bash
npm run images:destinations          # rebuild the sample plates (deterministic)
```

Replacing a placeholder is a one-file drop — put the real photograph at the same
path, or upload it in the studio, which takes precedence.

## Plan your journey

`/journeys` is the planner. Two ways in, one engine behind both:

- **Ready-made journeys** — the packages, filtered by length (day trips through
  to two weeks). Picking one draws its route and measures it.
- **Design your own** — search the 174 atlas places, add them, and drag them
  into the order you want. Every figure updates as you drag. Anything the atlas
  does not have — a hotel, an airport, the town you start from — is found with
  **Somewhere else?**, which looks it up in OpenStreetMap through
  `/api/places/search` and adds it as your own stop, pinned in teal.

**Airport pickup and drop-off** is on by default, and bookends the route with
Bandaranaike International (CMB) — so a journey is measured the way it is
actually driven, airport to airport. The bookends are added by the planner
rather than stored in a journey's stops, so switching the option off leaves
exactly the sights the traveller chose. Ready-made journeys therefore list no
origin of their own.

Journeys are not priced on the site. Every one is quoted per enquiry, so the
`price` field is kept in the studio for internal reference only and is not
rendered anywhere.

On a desktop the page is an app shell rather than a scrolling document: it fills
the viewport, the map stays pinned in view, and each pane scrolls on its own.
Below 1100px it reverts to normal flow with the map pinned to the top of its own
section.

**Expand** on the map fills the window with it — the route on one side, the
figures and the send button on the other (stacked, on a phone). Escape closes it.
It is a class change rather than a remount, so the traveller's zoom and pan
survive, and a ResizeObserver in `JourneyMap` re-measures Leaflet whenever the
container changes size — without it the map keeps drawing tiles for the old box
and leaves grey where the new space is.

Either way the route is drawn on a Leaflet map over OpenStreetMap tiles
(keyless — no billing account), and measured by the model in
[src/lib/journey.ts](src/lib/journey.ts): road distance, drive time per leg,
what the journey covers and what else it passes within 18 km.

There is no routing service behind those numbers. Distance is the great-circle
line scaled by a terrain-aware detour factor, and time comes from an average
speed that drops from 42 km/h across the lowlands to 24 km/h through the central
highlands. That is what lets a drag recalculate the whole page in one frame with
no network call. It is calibrated against published road distances — most legs
land within 10%, and the file documents the table it was checked against.

Packages are defined in [src/lib/packages.ts](src/lib/packages.ts) and merged
with the studio the same way destinations are: a `tour` document wins, and any
package the studio has never heard of is offered alongside it. A journey's
**Stops on the map** field is the list that draws its route.

### Emailing a finished journey

`POST /api/journey-enquiry` formats the itinerary the traveller was looking at —
stops, legs and totals, plus their optional vehicle preference and budget range —
and sends it with [Resend](https://resend.com). A stop they found themselves is
flagged in the email with its coordinates and a map link, since there is no
destination page to look it up on.

Two emails go out: the enquiry to ReiseCeylon, then a copy of the itinerary to
the traveller. The copy is sent second and its failure is swallowed — their plan
reaching us is what matters, and a bounced copy must not report the whole send as
failed. The response says which of the two went (`{ ok, copySent }`), and the
confirmation only promises a copy when one was actually delivered. The sender
uses the verified `tours.reiseceylon.com` domain so copies can reach travellers.

| Variable | |
| --- | --- |
| `RESEND_API_KEY` | The API key. `RESEND_API` is accepted too. |
| Inquiry recipient | Every ReiseCeylon copy is sent to `reiseceylon@gmail.com`. |
| `JOURNEY_ENQUIRY_FROM` | The sender. Use `ReiseCeylon <enquiries@tours.reiseceylon.com>`, on the verified Resend domain. |

With no key set the endpoint returns 503 and the form says email is not
configured rather than failing silently. The restricted `onboarding@resend.dev`
test sender is automatically replaced with the verified ReiseCeylon sender.

## Content (Sanity)

The studio is embedded at `/studio` and also hosted at
[reiseceylon.sanity.studio](https://reiseceylon.sanity.studio/). It manages:

| Studio section | Drives |
| --- | --- |
| Destinations | Homepage chapter rail, `/destinations` and `/destinations/[slug]` |
| Journeys & tour plans | Homepage journeys, `/journeys`, `/tours/[slug]` and its day-by-day timeline |
| Journal entries | `/blog` and `/blog/[slug]` |
| Contact details | Footer and `/contact` (a singleton — one document) |

Everything else on the homepage (hero plates, the ticker, experiences, the atlas
of attractions, testimonials) is still static in [src/lib/content.ts](src/lib/content.ts).

Each getter in [src/sanity/site.ts](src/sanity/site.ts) falls back to that static
content when its document type is empty in Sanity, so the site never renders blank.

Redeploy the hosted studio after any schema change:

```bash
npx sanity login
npm run sanity -- deploy --yes
```

The webhook revalidation secret is not a Sanity login token and must not be
used as `SANITY_AUTH_TOKEN`.

Local setup:

```bash
cp .env.local.example .env.local   # then fill in the project id
npm run dev                        # studio at http://localhost:3000/studio
```

One-time setup in [sanity.io/manage](https://sanity.io/manage) → API:

- **CORS origins** — `http://localhost:3000` and the production domain, both with credentials allowed. The embedded studio cannot log in without this.
- **Webhook** — `POST https://reiseceylon.com/api/revalidate`, filter
  `_type in ["post", "destination", "tour", "siteSettings"]`, secret set to
  `SANITY_REVALIDATE_SECRET`. Publishing then refreshes the affected pages within seconds.

Publishing an entry: **Journal entries → Create**, fill in title, slug (generated from the title), excerpt, cover image, category and body, then **Publish**. Categories and authors are separate documents, created once and referenced from each entry.

### Automated journal drafts and publishing

The blog automation deliberately has two stages. Every Monday at 09:00 Sri
Lanka time, `.github/workflows/generate-blog-draft.yml` takes the next unused
entry from `scripts/blog-topics.json`, asks the configured AI model for an
English draft, validates it, and creates a document under **Blog posts** in
Sanity. It cannot publish that draft.

An editor must then:

1. Check every factual claim and internal link.
2. Upload a cover photograph ReiseCeylon owns or is licensed to use.
3. Check the image alternative text and revise the English copy.
4. Add translations when they have been reviewed.
5. In **Publishing workflow**, choose a future **Publish at** value and change
   **Review status** to **Approved for scheduled publishing**.

`.github/workflows/publish-approved-blog.yml` checks hourly. It refuses drafts
that are not explicitly approved or are missing their due date, English copy,
category, body, cover asset, or cover-image alternative text. After publication,
the existing signed Sanity webhook refreshes the journal, article route, sitemap
and RSS-backed reads.

Generated drafts are also checked for a concise descriptive title, a useful
search description, substantial non-placeholder copy, at least two H2 sections,
canonical internal links and descriptive anchor text. Each planned topic carries
a primary search phrase and user intent, while the generator records specific
fact-check items in the Studio review notes. These checks prevent weak automated
posts; they do not guarantee a search ranking, which still depends on editorial
quality, authority, competition, links and the overall page experience.

Configure these under **GitHub → Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `SANITY_API_TOKEN` | Sanity token with Editor permissions |
| Secret | `OPENAI_API_KEY` | API key used only by draft generation |
| Variable | `NEXT_PUBLIC_SANITY_PROJECT_ID` | Same project id as the deployed site |
| Variable | `NEXT_PUBLIC_SANITY_DATASET` | Normally `production` |
| Variable | `NEXT_PUBLIC_SANITY_API_VERSION` | Normally `2024-10-01` |
| Variable | `BLOG_AI_MODEL` | Optional; defaults to `gpt-5-mini` |

The schedules start only after these workflow files reach the repository's
default branch. Before enabling them, deploy the updated Studio schema and run
both workflows manually: generate a draft, inspect it in Studio, then use the
publisher's default dry-run option. A manual publisher run changes content only
when **Dry run** is turned off.

Useful local checks and manual commands:

```bash
npm run blog:validate-topics
npm test
npm run blog:generate-draft -- --topic=sigiriya-first-visit-guide --dry-run
npm run blog:publish-approved -- --dry-run
```

The generation dry run still calls the AI service and reads Sanity, but does not
write documents. Add new reviewed topics to the end of
`scripts/blog-topics.json`; stable topic keys prevent workflow retries from
creating duplicates.

Schemas live in `src/sanity/schemas/`. Journal queries are in `src/sanity/queries.ts`,
everything else in `src/sanity/site.ts`.

A destination document has three sections. **Story** — note, intro, highlights,
good to know — belongs to the editor. **SEO** — search title and description —
feeds the page metadata. **Location** — landscape, province,
district, town, coordinates, precision — belongs to the atlas and is overwritten
on every sync. Setting a destination to **Hidden** removes it from the site
without deleting anything.

### Seed and sync scripts

These are run by hand, not as part of a build. The `:auth` command uses the
current Sanity CLI login; the original command remains available for CI or an
explicit `SANITY_API_TOKEN`.

```bash
SANITY_API_TOKEN=sk... npm run sync:destinations   # the 174 atlas places
SANITY_API_TOKEN=sk... npm run sync:destinations -- --with-content # refresh SEO and story copy
npm run sync:destinations:auth -- --with-content  # same refresh with the CLI login
npm run generate:destination-editorial            # generate missing reviewable copy (uses Sanity AI credits)
SANITY_API_TOKEN=sk... npm run seed:site           # journeys, contact details
SANITY_API_TOKEN=sk... npm run seed:journal        # one sample journal entry
npm run audit:destinations                         # validate generated destination content
```

`sync:destinations` is the one that is safe to re-run: it creates what is
missing, refreshes the location half of what exists, and normally never touches copy an
editor has written. `--with-content` deliberately refreshes each place's SEO and
story fields from `scripts/destination-editorial.json`; it still does not touch
images. The generator writes only missing entries to that reviewable file and
does not publish them. `--dry-run` prints the plan; `--with-images` also uploads
each sample plate to Sanity (174 uploads, and only for documents with no image
yet). The two seed scripts do overwrite studio edits — run them once, at
migration time.

Until the sync has run, `/destinations` still lists every atlas place: Sanity
documents come first, and anything the studio has never heard of is filled in
from `public/json`.
