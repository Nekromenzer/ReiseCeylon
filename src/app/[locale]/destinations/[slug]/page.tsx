import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DestinationHighlights } from '@/components/DestinationHighlights';
import { ClientMessages } from '@/components/ClientMessages';
import { JsonLd } from '@/components/JsonLd';
import { Reveal } from '@/components/Reveal';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { destinationFaqs } from '@/lib/faq';
import {
  aliasGroupFor,
  directionsUrlFor,
  distanceKm,
  formatCoordinate,
  legacySlugAliases,
  mapEmbedUrl
} from '@/lib/places';
import { attractionSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { alternatesFor, pathFor, urlFor } from '@/lib/seo';
import { getDestination, getDestinations, getTours, type Destination } from '@/sanity/site';

/* Destinations added in the studio after a build are rendered on first request. */
export const dynamicParams = true;

/**
 * The languages whose destination pages are built ahead of time.
 *
 * This route is the whole atlas crossed with every language — 174 places × 4 =
 * 696 pages, which is 90% of everything the site caches. Prerendering all four
 * meant paying to build and store every French and Dutch page on every single
 * deploy, whether or not anyone ever asked for one.
 *
 * English and German are built because they are the markets the site is written
 * for. French and Dutch are left to `dynamicParams` below: the first request for
 * one renders it, and it is cached from then on. That first render is normally a
 * crawler rather than a traveller, and nothing about the page changes — same
 * html, same hreflang, same sitemap entry, same url. Only the moment it is built
 * moves.
 *
 * Adding a language back is a one-word change here.
 */
const PRERENDERED_LOCALES = ['en', 'de'] as const;

/**
 * The cross product of the languages above and every place. The slug is the same
 * in all four — a url that changed with the language would break the moment a
 * traveller shared it.
 */
export async function generateStaticParams() {
  const destinations = await getDestinations(routing.defaultLocale);
  return PRERENDERED_LOCALES.flatMap((locale) =>
    destinations.map(({ slug }) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const [t, destination] = await Promise.all([
    getTranslations({ locale, namespace: 'meta' }),
    getDestination(slug, locale)
  ]);
  if (!destination) return { title: t('destinationFallbackTitle') };

  const path = `/destinations/${destination.slug}`;
  return {
    title: { absolute: destination.seoTitle },
    description: destination.seoDescription,
    alternates: alternatesFor(path, locale),
    openGraph: {
      title: destination.seoTitle,
      description: destination.seoDescription,
      url: pathFor(path, locale),
      type: 'website',
      images: [{ url: destination.image, alt: destination.imageAlt }]
    },
    twitter: {
      card: 'summary_large_image',
      title: destination.seoTitle,
      description: destination.seoDescription,
      images: [destination.image]
    }
  };
}

/** Everything factual we hold about the place, in the order a planner reads it. */
function facts(destination: Destination, t: (key: string) => string) {
  const hasPoint = destination.latitude !== null && destination.longitude !== null;
  return [
    { label: t('factLandscape'), value: destination.category },
    { label: t('factProvince'), value: destination.provinceLabel },
    { label: t('factDistrict'), value: destination.district },
    { label: t('factNearestTown'), value: destination.city },
    {
      label: t('factCoordinates'),
      value: hasPoint
        ? `${formatCoordinate(destination.latitude!, 'lat')}, ${formatCoordinate(destination.longitude!, 'lon')}`
        : null
    },
    {
      label: t('factDecimal'),
      value: hasPoint ? `${destination.latitude!.toFixed(4)}, ${destination.longitude!.toFixed(4)}` : null
    }
  ].filter((fact) => Boolean(fact.value));
}

export default async function DestinationPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, faqCopy, destinations, tours] = await Promise.all([
    getTranslations('destination'),
    getTranslations('faq'),
    getDestinations(locale),
    getTours(locale)
  ]);
  const destination = destinations.find((item) => item.slug === slug);

  if (!destination) {
    /* Old links from before the atlas — /destinations/sigiriya and friends. */
    const alias = legacySlugAliases[slug];
    if (alias && destinations.some((item) => item.slug === alias)) {
      permanentRedirect(pathFor(`/destinations/${alias}`, locale));
    }
    notFound();
  }

  const hasPoint = destination.latitude !== null && destination.longitude !== null;
  const record = facts(destination, t);
  /* A pre-atlas slug and the atlas record it points at are one place, not two. */
  const self = new Set(aliasGroupFor(destination.slug));

  const nearby = hasPoint
    ? destinations
        .filter((item) => !self.has(item.slug) && item.latitude !== null && item.longitude !== null)
        .map((item) => ({
          place: item,
          km: distanceKm(
            { latitude: destination.latitude!, longitude: destination.longitude! },
            { latitude: item.latitude!, longitude: item.longitude! }
          )
        }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 4)
    : [];

  const sameCategory = destination.categoryId
    ? destinations
        .filter((item) => item.categoryId === destination.categoryId && !self.has(item.slug))
        .slice(0, 8)
    : [];

  /* The questions a traveller types, answered from the record above — see
     `@/lib/faq`. Rendered below and declared as an FAQPage in the same breath:
     Google will not show an answer it cannot find in the page, and neither
     should anything else. */
  const faqs = destinationFaqs(
    destination,
    nearby.map(({ place, km }) => ({ name: place.name, km })),
    faqCopy
  );
  const path = `/destinations/${destination.slug}`;

  return (
    <main>
      <JsonLd
        data={[
          attractionSchema(destination, locale, {
            regionName: destination.provinceLabel
              ? t('provinceSuffix', { province: destination.provinceLabel })
              : undefined
          }),
          breadcrumbSchema(
            [
              { name: t('breadcrumbRoot'), path: '/destinations' },
              { name: destination.name, path }
            ],
            locale
          ),
          faqSchema(faqs, urlFor(path, locale))
        ]}
      />
      <section className="page-hero">
        <Image src={destination.image} alt={destination.imageAlt} fill priority sizes="100vw" />
        <div className="page-hero-content">
          <nav className="detail-crumbs" aria-label={t('breadcrumbAria')}>
            <Link href="/destinations">{t('breadcrumbRoot')}</Link>
            {destination.category ? (
              <>
                <span aria-hidden="true">/</span>
                <Link href="/destinations#atlas">{destination.category}</Link>
              </>
            ) : null}
          </nav>
          <span>
            {[destination.region, destination.provinceLabel || 'Sri Lanka'].filter(Boolean).join(' · ')}
          </span>
          <h1>{destination.name}</h1>
          <p>{t('heroCopy', { note: destination.note })}</p>
        </div>
      </section>

      {record.length > 0 ? (
        <section className="detail-facts">
          <dl>
            {record.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          {hasPoint ? (
            <div className="detail-fact-links">
              <a href={destination.googleMapsUrl ?? '#'} target="_blank" rel="noreferrer" className="text-link">
                {t('googleMaps')} <span>↗</span>
              </a>
              <a
                href={directionsUrlFor(destination.latitude!, destination.longitude!)}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                {t('directions')} <span>↗</span>
              </a>
              <a href={destination.openStreetMapUrl ?? '#'} target="_blank" rel="noreferrer" className="text-link">
                {t('openStreetMap')} <span>↗</span>
              </a>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="detail-intro">
        <div>{t('whyGo')}</div>
        <Reveal>
          <blockquote>{destination.introHeading}</blockquote>
          <p>{destination.introCopy}</p>
        </Reveal>
      </section>

      <ClientMessages locale={locale} namespaces={['highlights']}>
        <DestinationHighlights
          highlights={destination.highlights}
          image={destination.image}
          imageAlt={destination.imageAlt}
          heading={t('highlightsHeading', { name: destination.name })}
        />
      </ClientMessages>

      {hasPoint ? (
        <section className="detail-map">
          <Reveal className="detail-map-copy">
            <p className="eyebrow">{t('whereItSits')}</p>
            <h2>
              {destination.city || destination.district}, {destination.provinceLabel}.
            </h2>
            <p>{destination.precisionNote}</p>
            <p className="detail-map-coords">
              {formatCoordinate(destination.latitude!, 'lat')} · {formatCoordinate(destination.longitude!, 'lon')}
            </p>
          </Reveal>
          <div className="detail-map-frame">
            <iframe
              title={t('mapTitle', { name: destination.name })}
              src={mapEmbedUrl(destination.latitude!, destination.longitude!)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      ) : null}

      {nearby.length > 0 ? (
        <section className="detail-nearby">
          <Reveal>
            <p className="eyebrow">{t('withinReach')}</p>
            <h2>{t('whatIsClose')}</h2>
          </Reveal>
          <div className="detail-nearby-grid">
            {nearby.map(({ place, km }, index) => (
              <Reveal key={place.slug} delay={index * 0.05}>
                <Link href={`/destinations/${place.slug}`} className="nearby-card">
                  <Image src={place.image} alt={place.imageAlt} fill sizes="(max-width: 900px) 90vw, 24vw" />
                  <span className="nearby-wash" />
                  <span className="nearby-copy">
                    <em>
                      {km < 1 ? t('underKm') : t('kmAway', { km: km.toFixed(km < 10 ? 1 : 0) })}
                    </em>
                    <strong>{place.name}</strong>
                    <span>{place.category}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {sameCategory.length > 0 ? (
        <section className="detail-related">
          <p className="eyebrow">
            {t('moreOf', { category: destination.category.toLocaleLowerCase(locale) })}
          </p>
          <div className="detail-related-links">
            {sameCategory.map((place) => (
              <Link key={place.slug} href={`/destinations/${place.slug}`}>
                {place.name} <i aria-hidden="true">↗</i>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {destination.goodToKnowHeading || destination.goodToKnowCopy ? (
        <section className="detail-intro">
          <div>{t('goodToKnow')}</div>
          <Reveal>
            <blockquote>{destination.goodToKnowHeading}</blockquote>
            <p>{destination.goodToKnowCopy}</p>
            {tours.length > 0 ? (
              <Link href={`/tours/${tours[0].slug}`} className="text-link">
                {t('seeJourney')} <span>↗</span>
              </Link>
            ) : null}
          </Reveal>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section className="detail-faq">
          <Reveal className="detail-faq-head">
            <p className="eyebrow">{faqCopy('eyebrow')}</p>
            <h2>{faqCopy('heading', { name: destination.name })}</h2>
          </Reveal>
          {/* Answers are rendered open rather than behind a disclosure. They are
              four sentences each, and text a reader has to click for is text an
              extractor has to guess at. */}
          <dl className="detail-faq-list">
            {faqs.map((entry) => (
              <div key={entry.question}>
                <dt>{entry.question}</dt>
                <dd>{entry.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </main>
  );
}
