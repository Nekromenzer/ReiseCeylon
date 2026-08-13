import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/JsonLd';
import { Reveal } from '@/components/Reveal';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getPlace } from '@/lib/places';
import { breadcrumbSchema, tripSchema } from '@/lib/schema';
import { alternatesFor, urlFor } from '@/lib/seo';
import { getDestinations, getTours } from '@/sanity/site';

/* Journeys added in the studio after a build are rendered on first request. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const tours = await getTours(routing.defaultLocale);
  return routing.locales.flatMap((locale) => tours.map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tours = await getTours(locale);
  const tour = tours.find((item) => item.slug === slug);
  if (!tour) return {};

  const path = `/tours/${tour.slug}`;
  return {
    title: tour.title,
    description: tour.note,
    alternates: alternatesFor(path, locale),
    openGraph: {
      title: tour.title,
      description: tour.note,
      url: urlFor(path, locale),
      type: 'website',
      images: [{ url: tour.image, alt: tour.imageAlt }]
    },
    twitter: {
      card: 'summary_large_image',
      title: tour.title,
      description: tour.note,
      images: [tour.image]
    }
  };
}

export default async function TourPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, meta, tours, destinations] = await Promise.all([
    getTranslations('tour'),
    getTranslations('meta'),
    getTours(locale),
    getDestinations(locale)
  ]);
  const tour = tours.find((item) => item.slug === slug);
  if (!tour) notFound();

  /* The route in travel order, named in the reader's language. This is the part
     of the trip schema worth having — “a 12-day itinerary through Sigiriya,
     Kandy, Ella and Yala” is answerable from the list alone. A stop the atlas
     has since dropped keeps its English name rather than vanishing. */
  const bySlug = new Map(destinations.map((place) => [place.slug, place]));
  const stops = tour.stops
    .map((stopSlug) => {
      const known = bySlug.get(stopSlug);
      if (known) return { slug: stopSlug, name: known.name, isAtlasPlace: true };
      const atlas = getPlace(stopSlug);
      return atlas ? { slug: stopSlug, name: atlas.name, isAtlasPlace: false } : null;
    })
    .filter((stop): stop is { slug: string; name: string; isAtlasPlace: boolean } => stop !== null);

  const path = `/tours/${tour.slug}`;

  return (
    <main>
      <JsonLd
        data={[
          tripSchema(tour, locale, stops),
          breadcrumbSchema(
            [
              { name: meta('journeysTitle'), path: '/journeys' },
              { name: tour.title, path }
            ],
            locale
          )
        ]}
      />
      <section className="page-hero">
        <Image src={tour.image} alt={tour.imageAlt} fill priority sizes="100vw" />
        <div className="page-hero-content">
          <span>{t('heroMeta', { days: tour.days })}</span>
          <h1>{tour.title}</h1>
          <p>{t('heroCopy', { route: tour.route })}</p>
        </div>
      </section>
      <section className="detail-intro">
        <div>{t('theJourney')}</div>
        <Reveal>
          <blockquote>{tour.introHeading}</blockquote>
          <p>{tour.introCopy}</p>
        </Reveal>
      </section>
      {tour.itinerary.length > 0 ? (
        <section className="content-section">
          <h2 className="content-heading">{t('howStoryUnfolds')}</h2>
          <div className="timeline">
            {tour.itinerary.map((stage) => (
              <Reveal className="timeline-item" key={`${stage.period}-${stage.title}`}>
                <span>{stage.period}</span>
                <div>
                  <h3>{stage.title}</h3>
                  <p>{stage.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
      {tour.includedHeading || tour.includedCopy ? (
        <section className="detail-intro">
          <div>{t('included')}</div>
          <Reveal>
            <blockquote>{tour.includedHeading}</blockquote>
            <p>{tour.includedCopy}</p>
            <Link href="/contact" className="dark-cta">
              {t('tailor')} <span>↗</span>
            </Link>
          </Reveal>
        </section>
      ) : null}
    </main>
  );
}
