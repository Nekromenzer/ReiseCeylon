import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { DestinationHighlights } from '@/components/DestinationHighlights';
import { Reveal } from '@/components/Reveal';
import {
  aliasGroupFor,
  directionsUrlFor,
  distanceKm,
  formatCoordinate,
  legacySlugAliases,
  mapEmbedUrl,
  precisionNotes
} from '@/lib/places';
import { getDestination, getDestinations, getTours, type Destination } from '@/sanity/site';

/* Destinations added in the studio after a build are rendered on first request. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const destinations = await getDestinations();
  return destinations.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) return { title: 'Destination — ReiseCeylon' };

  const where = [destination.category, destination.district, destination.province]
    .filter(Boolean)
    .join(', ');

  return {
    title: `${destination.name} — ReiseCeylon`,
    description: `${destination.note}. ${where ? `${where}, ` : ''}Sri Lanka.`,
    openGraph: { images: [{ url: destination.image }] }
  };
}

/** Everything factual we hold about the place, in the order a planner reads it. */
function facts(destination: Destination) {
  const hasPoint = destination.latitude !== null && destination.longitude !== null;
  return [
    { label: 'Landscape', value: destination.category },
    { label: 'Province', value: destination.province ? `${destination.province} Province` : null },
    { label: 'District', value: destination.district },
    { label: 'Nearest town', value: destination.city },
    {
      label: 'Coordinates',
      value: hasPoint
        ? `${formatCoordinate(destination.latitude!, 'lat')}, ${formatCoordinate(destination.longitude!, 'lon')}`
        : null
    },
    {
      label: 'Decimal',
      value: hasPoint ? `${destination.latitude!.toFixed(4)}, ${destination.longitude!.toFixed(4)}` : null
    }
  ].filter((fact) => Boolean(fact.value));
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [destinations, tours] = await Promise.all([getDestinations(), getTours()]);
  const destination = destinations.find((item) => item.slug === slug);

  if (!destination) {
    /* Old links from before the atlas — /destinations/sigiriya and friends. */
    const alias = legacySlugAliases[slug];
    if (alias && destinations.some((item) => item.slug === alias)) {
      permanentRedirect(`/destinations/${alias}`);
    }
    notFound();
  }

  const hasPoint = destination.latitude !== null && destination.longitude !== null;
  const record = facts(destination);
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

  return (
    <main>
      <section className="page-hero">
        <Image src={destination.image} alt={destination.imageAlt} fill priority sizes="100vw" />
        <div className="page-hero-content">
          <nav className="detail-crumbs" aria-label="Breadcrumb">
            <Link href="/destinations">Destinations</Link>
            {destination.category ? (
              <>
                <span aria-hidden="true">/</span>
                <Link href="/destinations#atlas">{destination.category}</Link>
              </>
            ) : null}
          </nav>
          <span>
            {[destination.region, destination.province ? `${destination.province} Province` : 'Sri Lanka']
              .filter(Boolean)
              .join(' · ')}
          </span>
          <h1>{destination.name}</h1>
          <p>
            {destination.note}. A place best understood slowly, through early light, local stories and
            the paths between landmarks.
          </p>
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
              <a
                href={destination.googleMapsUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Google Maps <span>↗</span>
              </a>
              <a
                href={directionsUrlFor(destination.latitude!, destination.longitude!)}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Directions <span>↗</span>
              </a>
              <a
                href={destination.openStreetMapUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                OpenStreetMap <span>↗</span>
              </a>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="detail-intro">
        <div>Why go</div>
        <Reveal>
          <blockquote>{destination.introHeading}</blockquote>
          <p>{destination.introCopy}</p>
        </Reveal>
      </section>

      <DestinationHighlights
        highlights={destination.highlights}
        image={destination.image}
        imageAlt={destination.imageAlt}
        heading={`What we would not miss in ${destination.name}.`}
      />

      {hasPoint ? (
        <section className="detail-map">
          <Reveal className="detail-map-copy">
            <p className="eyebrow">Where it sits</p>
            <h2>
              {destination.city || destination.district}, {destination.province}.
            </h2>
            <p>{precisionNotes[destination.precision]}</p>
            <p className="detail-map-coords">
              {formatCoordinate(destination.latitude!, 'lat')} · {formatCoordinate(destination.longitude!, 'lon')}
            </p>
          </Reveal>
          <div className="detail-map-frame">
            <iframe
              title={`Map of ${destination.name}`}
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
            <p className="eyebrow">Within reach</p>
            <h2>What is close by.</h2>
          </Reveal>
          <div className="detail-nearby-grid">
            {nearby.map(({ place, km }, index) => (
              <Reveal key={place.slug} delay={index * 0.05}>
                <Link href={`/destinations/${place.slug}`} className="nearby-card">
                  <Image src={place.image} alt={place.imageAlt} fill sizes="(max-width: 900px) 90vw, 24vw" />
                  <span className="nearby-wash" />
                  <span className="nearby-copy">
                    <em>{km < 1 ? '<1 km' : `${km.toFixed(km < 10 ? 1 : 0)} km away`}</em>
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
          <p className="eyebrow">More {destination.category.toLowerCase()}</p>
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
          <div>Good to know</div>
          <Reveal>
            <blockquote>{destination.goodToKnowHeading}</blockquote>
            <p>{destination.goodToKnowCopy}</p>
            {tours.length > 0 ? (
              <Link href={`/tours/${tours[0].slug}`} className="text-link">
                See a journey through here <span>↗</span>
              </Link>
            ) : null}
          </Reveal>
        </section>
      ) : null}
    </main>
  );
}
