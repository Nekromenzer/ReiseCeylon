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

## Journal (Sanity)

Content lives in a Sanity project; the studio is embedded in this app at `/studio`.

```bash
cp .env.local.example .env.local   # then fill in the project id
npm run dev                        # studio at http://localhost:3000/studio
```

One-time setup in [sanity.io/manage](https://sanity.io/manage) → API:

- **CORS origins** — add `http://localhost:3000` and the production domain, both with credentials allowed. The studio cannot log in without this.
- **Webhook** — `POST https://reiseceylon.com/api/revalidate`, filter `_type == "post"`, secret set to `SANITY_REVALIDATE_SECRET`. Publishing an entry then refreshes `/blog` within seconds.

Publishing an entry: **Journal entries → Create**, fill in title, slug (generated from the title), excerpt, cover image, category and body, then **Publish**. Categories and authors are separate documents, created once and referenced from each entry.

Schemas live in `src/sanity/schemas/`, queries and their types in `src/sanity/queries.ts`. Until the first entry is published, `/blog` shows curated placeholder cards.
