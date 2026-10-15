import type { Metadata } from 'next';
import { AdSlot } from '@/components/AdSlot';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DestinationAtlas } from '@/components/DestinationAtlas';
import { ClientMessages } from '@/components/ClientMessages';
import { JsonLd } from '@/components/JsonLd';
import { Reveal } from '@/components/Reveal';
import { Link } from '@/i18n/navigation';
import { art } from '@/lib/content';
import { staticCopy } from '@/lib/localised';
import { placeCategories } from '@/lib/places';
import { breadcrumbSchema, itemListSchema } from '@/lib/schema';
import { alternatesFor, urlFor } from '@/lib/seo';
import { getDestinations, getFeaturedDestinations } from '@/sanity/site';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('destinationsTitle'),
    description: t('destinationsDescription'),
    alternates: alternatesFor('/destinations', locale),
    openGraph: {
      title: t('destinationsTitle'),
      description: t('destinationsDescription'),
      url: urlFor('/destinations', locale),
      type: 'website'
    }
  };
}

export default async function DestinationsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, meta, atlasCopy, copy, destinations, featured] = await Promise.all([
    getTranslations('destinations'),
    getTranslations('meta'),
    getTranslations('atlas'),
    staticCopy(locale),
    getDestinations(locale),
    getFeaturedDestinations(locale)
  ]);

  /* Provinces are sorted by their translated label, which is the order the
     reader actually sees in the select. */
  const provinces = [...new Set(destinations.map((place) => place.province))]
    .filter(Boolean)
    .map((province) => ({ value: province, label: copy.province(province) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  const categories = placeCategories
    .map((category) => ({
      id: category.id,
      name: copy.categoryName(category.id) || category.name,
      count: destinations.filter((place) => place.categoryId === category.id).length
    }))
    .filter((category) => category.count > 0);

  return (
    <main>
      <JsonLd
        data={[
          itemListSchema({
            name: meta('destinationsTitle'),
            description: meta('destinationsDescription'),
            url: urlFor('/destinations', locale),
            items: destinations.map((place) => ({
              name: place.name,
              url: urlFor(`/destinations/${place.slug}`, locale)
            }))
          }),
          breadcrumbSchema([{ name: meta('destinationsTitle'), path: '/destinations' }], locale)
        ]}
      />
      <section className="page-hero atlas-hero">
        <Image src={featured[0]?.image ?? art.fortress} alt="" fill priority sizes="100vw" />
        <div className="page-hero-content">
          <span>{t('heroEyebrow', { count: destinations.length })}</span>
          <h1>{t('heroTitle')}</h1>
          <p>{t('heroIntro')}</p>
        </div>
      </section>

      <section className="atlas-summary">
        <div>
          <strong>{destinations.length}</strong>
          <span>{t('summaryPlaces')}</span>
        </div>
        <div>
          <strong>{categories.length}</strong>
          <span>{t('summaryLandscapes')}</span>
        </div>
        <div>
          <strong>{provinces.length}</strong>
          <span>{t('summaryProvinces')}</span>
        </div>
        <div>
          <strong>1:1</strong>
          <span>{t('summaryPlanner')}</span>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="atlas-featured">
          <Reveal>
            <p className="eyebrow">{t('featuredEyebrow')}</p>
            <h2>{t('featuredHeading')}</h2>
          </Reveal>
          <div className="atlas-featured-rail">
            {featured.map((place, index) => (
              <Reveal key={place.slug} delay={index * 0.06}>
                <Link href={`/destinations/${place.slug}`} className="atlas-feature">
                  <Image src={place.image} alt={place.imageAlt} fill sizes="(max-width: 900px) 90vw, 30vw" />
                  <span className="atlas-feature-wash" />
                  <span className="atlas-feature-copy">
                    <em>{place.region}</em>
                    <strong>{place.name}</strong>
                    <span>{place.note}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <AdSlot locale={locale} />
      <ClientMessages locale={locale} namespaces={['atlas']}>
        <DestinationAtlas
          destinations={destinations.map((place) => ({
          slug: place.slug,
          name: place.name,
          note: place.note,
          image: place.image,
          imageAlt: place.imageAlt,
          categoryId: place.categoryId,
          category: place.category,
          province: place.province,
          provinceLabel: place.provinceLabel,
          district: place.district,
          city: place.city,
          region: place.region,
          latitude: place.latitude,
          longitude: place.longitude,
          featured: place.featured
          }))}
          categories={categories}
          provinces={provinces}
        />
      </ClientMessages>

      {/*
        Every place, server-rendered, as plain links.

        The atlas above is a client component that shows 24 cards and loads the
        rest on a button. That is right for a reader and wrong for everything
        that does not click: a crawler without JavaScript saw 24 of 174 links,
        and the page never read as the hub for the other 150. This list closes
        that gap in the initial html, at the cost of one flat `<ul>`.
      */}
      <AdSlot format="rectangle" locale={locale} />
      <section className="atlas-index">
        <Reveal>
          <p className="eyebrow">{atlasCopy('indexEyebrow')}</p>
          <h2>{atlasCopy('indexHeading')}</h2>
          <p className="atlas-index-intro">
            {atlasCopy('indexIntro', { count: destinations.length })}
          </p>
        </Reveal>
        <ul className="atlas-index-list" aria-label={atlasCopy('indexAria')}>
          {destinations.map((place) => (
            <li key={place.slug}>
              <Link href={`/destinations/${place.slug}`}>
                <strong>{place.name}</strong>
                {place.district ? <span>{place.district}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
