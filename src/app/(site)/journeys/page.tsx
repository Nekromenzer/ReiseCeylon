import type { Metadata } from 'next';
import Link from 'next/link';
import { JourneyPlanner, type PlannerPackage } from '@/components/JourneyPlanner';
import { durationBands, type PlannerPlace } from '@/lib/journey';
import { placeCategories, places, provinces } from '@/lib/places';
import { getTours } from '@/sanity/site';

export const metadata: Metadata = {
  title: 'Plan your journey — ReiseCeylon',
  description:
    'Choose a ready-made Sri Lankan journey or design your own. See the route on the map, with distances, drive times and every place it covers.'
};

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

const categories = placeCategories.map(({ id, name }) => ({ id, name }));

export default async function JourneysPage() {
  const tours = await getTours();

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
      <header className="rc-plan-bar">
        <div>
          <p className="eyebrow">Plan your journey</p>
          <h1>
            Take one of ours, <em>or draw your own.</em>
          </h1>
        </div>
        {/* The copy is the first thing to go on a phone; the link is not. */}
        <div className="rc-plan-bar-aside">
          <p>
            Measured across the real road network — how far, how long behind the wheel, and
            everything it passes. When it looks right, send it to us.
          </p>
          <Link href="/contact" className="text-link">
            Or talk it through <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <JourneyPlanner
        packages={packages}
        bands={durationBands}
        catalogue={catalogue}
        categories={categories}
        provinces={provinces}
      />
    </main>
  );
}
