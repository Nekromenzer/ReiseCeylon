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
- `/destinations/[slug]` — destination stories
- `/tours/[slug]` — private journey details
- `/about` — brand story
- `/blog` — travel journal (Sanity)
- `/blog/[slug]` — journal entry (Sanity)
- `/contact` — journey enquiry
- `/studio` — Sanity Studio, where journal entries are written

Brand source files live in `design.md`; optimized web assets are stored under `public/brand/` and `public/images/`.

## Content (Sanity)

The studio is embedded at `/studio` and also hosted at
[reiseceylon.sanity.studio](https://reiseceylon.sanity.studio/). It manages:

| Studio section | Drives |
| --- | --- |
| Destinations | Homepage chapter rail and `/destinations/[slug]` |
| Journeys & tour plans | Homepage journeys, `/tours/[slug]` and its day-by-day timeline |
| Journal entries | `/blog` and `/blog/[slug]` |
| Contact details | Footer and `/contact` (a singleton — one document) |

Everything else on the homepage (hero plates, the ticker, experiences, the atlas
of attractions, testimonials) is still static in [src/lib/content.ts](src/lib/content.ts).

Each getter in [src/sanity/site.ts](src/sanity/site.ts) falls back to that static
content when its document type is empty in Sanity, so the site never renders blank.

Redeploy the hosted studio after any schema change:

```bash
set -a && . ./.env && set +a && SANITY_AUTH_TOKEN="$SANITY_REVALIDATE_SECRET" npx sanity deploy -y
```

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

Schemas live in `src/sanity/schemas/`. Journal queries are in `src/sanity/queries.ts`,
everything else in `src/sanity/site.ts`.

### Seed scripts

Both need a token with write access and are run once, not as part of a build.
Re-running overwrites studio edits with the original copy.

```bash
SANITY_API_TOKEN=sk... npm run seed:site      # destinations, journeys, contact details
SANITY_API_TOKEN=sk... npm run seed:journal   # one sample journal entry
```
