/**
 * The static half of the site's copy, in whichever language is being rendered.
 *
 * `defaults.ts`, `places.ts` and `packages.ts` stay English on purpose: they are
 * the source the seed scripts write into Sanity and the labels the studio itself
 * shows an editor. Everything a *traveller* reads is resolved through here
 * instead, keyed by the same ids — a category id, a province name, a package
 * slug — so a German reader gets German landscape names and journey notes
 * without a second copy of the atlas existing anywhere.
 *
 * Anything the catalogue has no entry for falls back to the English value rather
 * than rendering a missing-key marker, which matters for the atlas: place names
 * and most district names are proper nouns and are meant to pass through
 * untouched.
 */
import { getTranslations } from 'next-intl/server';
import type { Highlight, Stage } from './defaults';
import { journeyPackages } from './packages';
import type { Place, Precision } from './places';

export type StaticCopy = {
  locale: string;
  /** Province name → the friendlier region label used in headings and on cards. */
  region: (province: string) => string;
  /** The province's own name, translated. */
  province: (province: string) => string;
  /** One line under a place name on a card. */
  note: (place: Pick<Place, 'categoryId' | 'city' | 'district'>) => string;
  categoryName: (categoryId: string) => string;
  precision: (precision: Precision) => string;
  destination: {
    introHeading: string;
    introCopy: (name: string) => string;
    goodToKnowHeading: string;
    goodToKnowCopy: string;
  };
  tour: {
    introHeading: string;
    introCopy: string;
    includedHeading: string;
    includedCopy: string;
  };
  highlights: Highlight[];
  stages: Stage[];
  seoTitle: (name: string) => string;
  seoDescription: (name: string, area: string) => string;
  /** Title, route and note for a ready-made journey, by slug. */
  packageCopy: (slug: string) => { title: string; route: string; note: string } | null;
  /** “12 days” / “12 Tage” — the stated length of a journey. */
  days: (count: number) => string;
  contact: { location: string; responseTime: string };
  stage: {
    oneDay: string;
    day: (number: number) => string;
    roadAndDriving: (km: string, duration: string) => string;
    fullDayAt: (name: string) => string;
  };
};

function truncateSeo(value: string, max: number) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,:;—-]+$/, '');
  return `${cut}.`;
}

/** Slugs the packages catalogue knows, so a lookup can tell "absent" from "empty". */
const packageSlugs = new Set(journeyPackages.map((journey) => journey.slug));

/**
 * Built once per locale per request. next-intl caches the catalogue itself, so
 * the cost here is only the closure.
 */
export async function staticCopy(locale: string): Promise<StaticCopy> {
  const [places, defaults, packages] = await Promise.all([
    getTranslations({ locale, namespace: 'places' }),
    getTranslations({ locale, namespace: 'defaults' }),
    getTranslations({ locale, namespace: 'packages' })
  ]);
  const [journey, durations] = await Promise.all([
    getTranslations({ locale, namespace: 'journey' }),
    getTranslations({ locale, namespace: 'durations' })
  ]);

  /**
   * A translated label if the catalogue holds one, the original string if not.
   * District and town names are proper nouns and must survive untranslated.
   *
   * `has` is checked rather than comparing against the fallback string, so an
   * intentional pass-through does not trip the missing-message reporter.
   */
  type Namespaced = ((key: string) => string) & { has: (key: string) => boolean };

  const orOriginal = (translate: Namespaced, key: string, original: string) => {
    if (!key) return original;
    return translate.has(key) ? translate(key) : original;
  };

  const highlights = defaults.raw('highlights') as Highlight[];
  const stages = defaults.raw('stages') as Stage[];

  const seoTitle = (name: string) =>
    [
      defaults('seoTitle', { name }),
      defaults('seoTitleShort', { name }),
      defaults('seoTitleShortest', { name })
    ].find((title) => title.length <= 60) ?? truncateSeo(name, 60);

  return {
    locale,
    region: (province) => orOriginal(places, `regions.${province}`, province),
    province: (province) => orOriginal(places, `provinces.${province}`, province),
    note: (place) => {
      const note = orOriginal(places, `categoryNotes.${place.categoryId}`, '');
      if (note) return note;
      return places('noteFallback', { area: place.city || place.district });
    },
    categoryName: (categoryId) => orOriginal(places, `categories.${categoryId}`, ''),
    precision: (precision) => places(`precision.${precision}`),
    destination: {
      introHeading: defaults('destinationIntroHeading'),
      introCopy: (name) => defaults('destinationIntroCopy', { name }),
      goodToKnowHeading: defaults('destinationGoodToKnowHeading'),
      goodToKnowCopy: defaults('destinationGoodToKnowCopy')
    },
    tour: {
      introHeading: defaults('tourIntroHeading'),
      introCopy: defaults('tourIntroCopy'),
      includedHeading: defaults('tourIncludedHeading'),
      includedCopy: defaults('tourIncludedCopy')
    },
    highlights,
    stages,
    seoTitle,
    seoDescription: (name, area) =>
      truncateSeo(defaults('seoDescription', { name, area }), 160),
    packageCopy: (slug) => {
      if (!packageSlugs.has(slug)) return null;
      return {
        title: packages(`${slug}.title`),
        route: packages(`${slug}.route`),
        note: packages(`${slug}.note`)
      };
    },
    days: (count) => durations('day', { count }),
    contact: {
      location: defaults('contactLocation'),
      responseTime: defaults('contactResponseTime')
    },
    stage: {
      oneDay: journey('oneDay'),
      day: (number) => journey('dayNumber', { number }),
      roadAndDriving: (km, duration) => journey('roadAndDriving', { km, duration }),
      fullDayAt: (name) => journey('fullDayAt', { name })
    }
  };
}
