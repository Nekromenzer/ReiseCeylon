'use client';

/**
 * Plan your journey — the whole planner.
 *
 * Two ways in, one engine behind both:
 *
 *   - pick a ready-made journey and see its route drawn out, or
 *   - build one from the atlas, dragging the stops into the order you want.
 *
 * Either way the stop list is the only state that matters. Everything else —
 * the route on the map, the distances, the drive times, the suggested length,
 * what else the road passes — is derived from it on every render by the model in
 * `@/lib/journey`. There is no routing service and no fetch in the loop, so a
 * drag updates every figure on the page in the same frame it lands.
 *
 * Choosing a package and then editing it is the expected path, not an edge case:
 * "Customise this" copies the package's stops into the builder, at which point it
 * is an ordinary custom route.
 */

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  buildRoute,
  matchesDurationBand,
  withAirportTransfers,
  optimiseOrder,
  placesAlongRoute,
  waypointsFor,
  formatDuration,
  formatKm,
  type PlannerPlace,
  type Waypoint
} from '@/lib/journey';
import { JourneyBuilder } from './JourneyBuilder';
import { JourneyEnquiryForm } from './JourneyEnquiryForm';
import { JourneySummary } from './JourneySummary';

/* Leaflet reads `window` on import, so the map may only ever load in the browser. */
const JourneyMap = dynamic(() => import('./JourneyMap'), {
  ssr: false,
  loading: () => <MapLoading />
});

/** Its own component so the loading state can reach the catalogue too. */
function MapLoading() {
  const t = useTranslations('planner');
  return <div className="rc-journey-map rc-journey-map-loading">{t('mapLoading')}</div>;
}

export type PlannerPackage = {
  slug: string;
  title: string;
  days: string;
  durationDays: number;
  route: string;
  price: string;
  image: string;
  imageAlt: string;
  note: string;
  stops: string[];
};

type Band = { id: string; label: string };
type Filter = { id: string; name: string };
type Province = { value: string; label: string };

type Mode = 'packages' | 'custom';

export function JourneyPlanner({
  packages,
  bands,
  catalogue,
  categories,
  provinces
}: {
  packages: PlannerPackage[];
  bands: Band[];
  catalogue: PlannerPlace[];
  categories: Filter[];
  provinces: Province[];
}) {
  const t = useTranslations('planner');
  const [mode, setMode] = useState<Mode>('packages');
  const [band, setBand] = useState('all');
  const [selected, setSelected] = useState(packages[0]?.slug ?? '');
  /*
   * Waypoints rather than slugs, because a custom stop found in OpenStreetMap
   * has no atlas record to look a slug up in — it only exists as the point the
   * traveller added.
   */
  const [custom, setCustom] = useState<Waypoint[]>([]);
  const [finalising, setFinalising] = useState(false);

  /*
   * On by default. Every ready-made journey is quoted as an airport-to-airport
   * trip, and almost every traveller building their own is flying in too — so
   * the honest default is to show the transfer time rather than hide it.
   */
  const [airportTransfers, setAirportTransfers] = useState(true);

  /* The map pane, blown up to fill the screen for a proper look at the route. */
  const [expanded, setExpanded] = useState(false);

  /* Escape closes it, and the page behind must not scroll while it is open. */
  useEffect(() => {
    if (!expanded) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  const byBand = useMemo(
    () => packages.filter((journey) => matchesDurationBand(journey.durationDays, band)),
    [packages, band]
  );

  const activePackage = useMemo(
    () => packages.find((journey) => journey.slug === selected) ?? byBand[0] ?? packages[0] ?? null,
    [packages, selected, byBand]
  );

  /* One ordered list of stops drives everything, whichever mode produced it. */
  const packageStops = useMemo(
    () => waypointsFor(activePackage?.stops ?? [], catalogue),
    [activePackage, catalogue]
  );

  /* What the traveller chose... */
  const chosen: Waypoint[] = mode === 'packages' ? packageStops : custom;

  /* ...and what will actually be driven, airport transfers included. */
  const stops = useMemo(
    () => withAirportTransfers(chosen, airportTransfers),
    [chosen, airportTransfers]
  );

  const route = useMemo(() => buildRoute(stops), [stops]);
  const nearby = useMemo(() => placesAlongRoute(stops, catalogue, 18, 8), [stops, catalogue]);

  const title =
    mode === 'packages' ? (activePackage?.title ?? t('aJourney')) : t('yourOwnJourney');

  /** Adds an atlas place. The same place cannot be added to a route twice. */
  const add = useCallback(
    (slug: string) => {
      const [stop] = waypointsFor([slug], catalogue);
      if (!stop) return;
      setCustom((current) => (current.some((entry) => entry.slug === stop.slug) ? current : [...current, stop]));
    },
    [catalogue]
  );

  /** Adds a point found in OpenStreetMap rather than the atlas. */
  const addCustom = useCallback((stop: Waypoint) => {
    setCustom((current) => (current.some((entry) => entry.slug === stop.slug) ? current : [...current, stop]));
  }, []);

  const remove = useCallback((index: number) => {
    setCustom((current) => current.filter((_, position) => position !== index));
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setCustom((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const optimise = useCallback(() => {
    setCustom((current) => optimiseOrder(current));
  }, []);

  /** Load a package into the builder — from here on it is an ordinary custom route. */
  const customise = useCallback(() => {
    setCustom(packageStops);
    setMode('custom');
  }, [packageStops]);

  return (
    <div className="rc-plan">
      <div className="rc-plan-modes" role="tablist" aria-label={t('modesAria')}>
        <button
          type="button"
          role="tab"
          id="rc-tab-packages"
          aria-selected={mode === 'packages'}
          aria-controls="rc-panel-packages"
          className={mode === 'packages' ? 'is-active' : ''}
          onClick={() => setMode('packages')}
        >
          <strong>{t('tabPackages')}</strong>
          <span>{t('tabPackagesSub')}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="rc-tab-custom"
          aria-selected={mode === 'custom'}
          aria-controls="rc-panel-custom"
          className={mode === 'custom' ? 'is-active' : ''}
          onClick={() => setMode('custom')}
        >
          <strong>{t('tabCustom')}</strong>
          <span>{t('tabCustomSub')}</span>
        </button>
      </div>

      <div className={`rc-plan-workspace${mode === 'custom' ? ' is-custom' : ''}`}>
        {mode === 'packages' ? (
          <section
            className="rc-plan-pane"
            id="rc-panel-packages"
            role="tabpanel"
            aria-labelledby="rc-tab-packages"
          >
            <div className="rc-plan-pane-head">
              <div className="rc-plan-bands" role="group" aria-label={t('filterLengthAria')}>
                {bands.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={band === entry.id ? 'is-active' : ''}
                    aria-pressed={band === entry.id}
                    onClick={() => setBand(entry.id)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rc-plan-pane-scroll">
              {byBand.length === 0 ? (
                <p className="rc-plan-itinerary-empty">
                  {t('noneOfLengthPre')}{' '}
                  <button type="button" className="rc-plan-inline-link" onClick={() => setMode('custom')}>
                    {t('noneOfLengthLink')}
                  </button>
                  .
                </p>
              ) : (
                <ul className="rc-plan-packages">
                  {byBand.map((journey) => {
                    const isActive = activePackage?.slug === journey.slug;
                    return (
                      <li key={journey.slug}>
                        <button
                          type="button"
                          className={`rc-plan-package${isActive ? ' is-active' : ''}`}
                          aria-pressed={isActive}
                          onClick={() => setSelected(journey.slug)}
                        >
                          <span className="rc-plan-package-media">
                            <Image
                              src={journey.image}
                              alt={journey.imageAlt}
                              fill
                              sizes="(max-width: 900px) 40vw, 180px"
                            />
                            <em>{journey.days}</em>
                          </span>
                          <span className="rc-plan-package-copy">
                            <strong>{journey.title}</strong>
                            <small>{journey.route}</small>
                            <span>{journey.note}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {activePackage ? (
              <div className="rc-plan-pane-foot">
                <Link href={`/tours/${activePackage.slug}`} className="rc-plan-secondary">
                  {t('fullItinerary')} <span aria-hidden="true">↗</span>
                </Link>
                <button type="button" onClick={customise} className="rc-plan-secondary">
                  {t('customiseThis')} <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <JourneyBuilder
            catalogue={catalogue}
            categories={categories}
            provinces={provinces}
            stops={chosen}
            legs={buildRoute(chosen).legs}
            onAdd={add}
            onAddCustom={addCustom}
            onRemove={remove}
            onReorder={reorder}
            onOptimise={optimise}
            onClear={() => setCustom([])}
          />
        )}

        {/* The map pane never scrolls as a whole: the map is pinned to the top,
            only the figures beneath it move, and the send button stays put. */}
        <aside className={`rc-plan-pane rc-plan-pane-map${expanded ? ' is-expanded' : ''}`}>
          <div className="rc-plan-map-holder">
            {/* One Leaflet instance throughout: expanding is a class change, not a
                remount, so the zoom and pan the traveller set are kept. */}
            <JourneyMap stops={stops} fitSignal={expanded ? 'expanded' : 'inline'} />

            <button
              type="button"
              className="rc-plan-expand"
              aria-expanded={expanded}
              aria-label={expanded ? t('mapClose') : t('mapExpand')}
              onClick={() => setExpanded((open) => !open)}
            >
              <span aria-hidden="true">{expanded ? '✕' : '⤢'}</span>
              <em>{expanded ? t('close') : t('expand')}</em>
            </button>
            {stops.length > 0 ? (
              <p className="rc-plan-map-caption">
                {t('mapCaption', {
                  stops: stops.length,
                  km: formatKm(route.roadKm),
                  duration: formatDuration(route.minutes)
                })}
              </p>
            ) : null}
          </div>

          <label className="rc-plan-transfer">
            <input
              type="checkbox"
              checked={airportTransfers}
              onChange={(event) => setAirportTransfers(event.target.checked)}
            />
            <span>
              <strong>{t('transferTitle')}</strong>
              <small>{airportTransfers ? t('transferOn') : t('transferOff')}</small>
            </span>
          </label>

          <div className="rc-plan-pane-scroll">
            <JourneySummary
              stops={stops}
              route={route}
              nearby={nearby}
              declaredDays={mode === 'packages' ? activePackage?.days : undefined}
              onAdd={mode === 'custom' ? add : undefined}
            />
          </div>

          {stops.length > 0 ? (
            <div className="rc-plan-pane-foot">
              <button type="button" className="rc-plan-finalise" onClick={() => setFinalising(true)}>
                {t('finalise')} <span aria-hidden="true">↗</span>
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      {finalising ? (
        <div
          className="rc-plan-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t('sendDialogAria')}
          onClick={(event) => {
            if (event.target === event.currentTarget) setFinalising(false);
          }}
        >
          <JourneyEnquiryForm
            title={title}
            kind={mode === 'packages' ? 'package' : 'custom'}
            stops={stops}
            route={route}
            declaredDays={mode === 'packages' ? activePackage?.days : undefined}
            airportTransfers={airportTransfers}
            onClose={() => setFinalising(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

