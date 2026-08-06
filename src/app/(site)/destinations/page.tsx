import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { DestinationAtlas } from '@/components/DestinationAtlas';
import { Reveal } from '@/components/Reveal';
import { art } from '@/lib/content';
import { placeCategories } from '@/lib/places';
import { getDestinations, getFeaturedDestinations } from '@/sanity/site';

export const metadata: Metadata = {
  title: 'Destinations — ReiseCeylon',
  description:
    'Every beach, ruin, waterfall, park and hill station we route through, mapped by province and category across Sri Lanka.'
};

export default async function DestinationsPage() {
  const [destinations, featured] = await Promise.all([getDestinations(), getFeaturedDestinations()]);
  const provinces = [...new Set(destinations.map((place) => place.province))].filter(Boolean).sort();
  const categories = placeCategories
    .map((category) => ({
      ...category,
      count: destinations.filter((place) => place.categoryId === category.id).length
    }))
    .filter((category) => category.count > 0);

  return (
    <main>
      <section className="page-hero atlas-hero">
        <Image src={featured[0]?.image ?? art.fortress} alt="" fill priority sizes="100vw" />
        <div className="page-hero-content">
          <span>The atlas · {destinations.length} places</span>
          <h1>Destinations</h1>
          <p>
            Every place we route through, from the reef edge to the cloud line. Filter by landscape or
            province, then open one to see where it sits, what it is near, and how we like to arrive.
          </p>
        </div>
      </section>

      <section className="atlas-summary">
        <div>
          <strong>{destinations.length}</strong>
          <span>Mapped places</span>
        </div>
        <div>
          <strong>{categories.length}</strong>
          <span>Landscapes</span>
        </div>
        <div>
          <strong>{provinces.length}</strong>
          <span>Provinces</span>
        </div>
        <div>
          <strong>1:1</strong>
          <span>One planner, first note to last night</span>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="atlas-featured">
          <Reveal>
            <p className="eyebrow">Start here</p>
            <h2>The five we keep returning to.</h2>
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
    </main>
  );
}
