import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JourneyPlanner, type PlannerPackage } from '@/components/JourneyPlanner';
import { JsonLd } from '@/components/JsonLd';
import { Link } from '@/i18n/navigation';
import { durationBands, type PlannerPlace } from '@/lib/journey';
import { staticCopy } from '@/lib/localised';
import { placeCategories, places, provinces } from '@/lib/places';
import { breadcrumbSchema, itemListSchema } from '@/lib/schema';
import { alternatesFor, urlFor } from '@/lib/seo';
import { getTours } from '@/sanity/site';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('journeysTitle'),
    description: t('journeysDescription'),
    alternates: alternatesFor('/journeys', locale),
    openGraph: {
      title: t('journeysTitle'),
      description: t('journeysDescription'),
      url: urlFor('/journeys', locale),
      type: 'website'
    }
  };
}

/**
 * The atlas, slimmed to what the planner routes over. The full records carry
 * editorial copy and image paths the planner never reads, and this list crosses
 * to the browser as props.
 */
const catalogue: PlannerPlace[] = places.map((place) => ({
  slug: place.slug,
  name: place.name,
  latitude: place.latitude,
  longitude: place.longitude,
  categoryId: place.categoryId,
  category: place.category,
  province: place.province,
  district: place.district,
  city: place.city
}));

export default async function JourneysPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, journeyCopy, meta, copy, tours] = await Promise.all([
    getTranslations('journeys'),
    getTranslations('journey'),
    getTranslations('meta'),
    staticCopy(locale),
    getTours(locale)
  ]);

  /* Landscape names and the duration filter are rendered here, on the server,
     and cross to the planner already translated. */
  const categories = placeCategories.map(({ id, name }) => ({
    id,
    name: copy.categoryName(id) || name
  }));

  const localisedCatalogue: PlannerPlace[] = catalogue.map((place) => ({
    ...place,
    category: copy.categoryName(place.categoryId) || place.category
  }));

  const provinceOptions = provinces
    .map((province) => ({ value: province, label: copy.province(province) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  const bandLabels: Record<string, string> = {
    all: journeyCopy('bandAll'),
    day: journeyCopy('bandDay'),
    short: journeyCopy('bandShort'),
    week: journeyCopy('bandWeek'),
    long: journeyCopy('bandLong')
  };
  const bands = durationBands.map((band) => ({ id: band.id, label: bandLabels[band.id] ?? band.label }));

  const packages: PlannerPackage[] = tours.map((tour) => ({
    slug: tour.slug,
    title: tour.title,
    days: tour.days,
    durationDays: tour.durationDays,
    route: tour.route,
    price: tour.price,
    image: tour.image,
    imageAlt: tour.imageAlt,
    note: tour.note,
    stops: tour.stops
  }));

  return (
    /*
     * An app shell, not a scrolling page. The header is one row, the planner
     * fills whatever height is left, and each pane inside it scrolls on its own
     * — so the map never leaves the screen while you are working on a route.
     */
    <main className="rc-plan-page">
      <JsonLd
        data={[
          itemListSchema({
            name: meta('journeysTitle'),
            description: meta('journeysDescription'),
            url: urlFor('/journeys', locale),
            items: tours.map((tour) => ({
              name: tour.title,
              url: urlFor(`/tours/${tour.slug}`, locale)
            }))
          }),
          breadcrumbSchema([{ name: meta('journeysTitle'), path: '/journeys' }], locale)
        ]}
      />
      <header className="rc-plan-bar">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1>
            {t('headingPre')} <em>{t('headingEm')}</em>
          </h1>
        </div>
        {/* The copy is the first thing to go on a phone; the link is not. */}
        <div className="rc-plan-bar-aside">
          <p>{t('aside')}</p>
          <Link href="/contact" className="text-link">
            {t('talkLink')} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <JourneyPlanner
        packages={packages}
        bands={bands}
        catalogue={localisedCatalogue}
        categories={categories}
        provinces={provinceOptions}
      />
    </main>
  );
}
