'use client';

/**
 * Design your own — the place picker on one side, the itinerary you drag into
 * shape on the other.
 *
 * Reordering is native HTML5 drag and drop rather than a library: the list is
 * short, vertical and single-column, which is the one case the browser's own
 * implementation handles well. Every drag action also has a keyboard equivalent
 * (the ↑ ↓ buttons on each stop) because drag and drop alone is unusable with a
 * keyboard or a screen reader, and this is the only way to build a custom route.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PlaceSearchResult } from '@/app/api/places/search/route';
import {
  customWaypoint,
  formatDuration,
  formatKm,
  type Leg,
  type PlannerPlace,
  type Waypoint
} from '@/lib/journey';

type Filter = { id: string; name: string };
type Province = { value: string; label: string };

/** Long enough that typing a town name is one lookup, not eight. */
const SEARCH_DEBOUNCE_MS = 450;

export function JourneyBuilder({
  catalogue,
  categories,
  provinces,
  stops,
  legs,
  onAdd,
  onAddCustom,
  onRemove,
  onReorder,
  onOptimise,
  onClear
}: {
  catalogue: PlannerPlace[];
  categories: Filter[];
  provinces: Province[];
  stops: Waypoint[];
  legs: Leg[];
  onAdd: (slug: string) => void;
  onAddCustom: (stop: Waypoint) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onOptimise: () => void;
  onClear: () => void;
}) {
  const t = useTranslations('builder');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [province, setProvince] = useState('all');
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  /* Anywhere else in Sri Lanka — looked up in OpenStreetMap, not the atlas. */
  const [anywhere, setAnywhere] = useState('');
  const [found, setFound] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchSeq = useRef(0);

  const chosen = useMemo(() => new Set(stops.map((stop) => stop.slug)), [stops]);

  /* One searchable string per place, so a query can match a town or district too. */
  const index = useMemo(
    () =>
      catalogue.map((place) => ({
        place,
        text: [place.name, place.category, place.city, place.district, place.province]
          .join(' ')
          .toLowerCase()
      })),
    [catalogue]
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return index
      .filter(({ place, text }) => {
        if (category !== 'all' && place.categoryId !== category) return false;
        if (province !== 'all' && place.province !== province) return false;
        return needle.length === 0 || text.includes(needle);
      })
      .map(({ place }) => place)
      .slice(0, 60);
  }, [index, query, category, province]);

  /*
   * Debounced, and guarded by a sequence number so a slow reply for an earlier
   * query cannot overwrite the results of a later one.
   */
  useEffect(() => {
    const term = anywhere.trim();
    if (term.length < 3) {
      setFound([]);
      setSearching(false);
      setSearchError('');
      return;
    }

    const seq = ++searchSeq.current;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/search?q=${encodeURIComponent(term)}`);
        const body = await response.json();
        if (seq !== searchSeq.current) return;
        setFound(body.results ?? []);
        setSearchError(body.error ?? '');
      } catch {
        if (seq !== searchSeq.current) return;
        setFound([]);
        setSearchError(t('searchUnavailable'));
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [anywhere, t]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= stops.length || from === to) return;
    onReorder(from, to);
  };

  const addFound = (result: PlaceSearchResult) => {
    onAddCustom(customWaypoint(result.name, result.latitude, result.longitude));
    setAnywhere('');
    setFound([]);
  };

  return (
    <>
      <section
        className="rc-plan-pane rc-plan-picker"
        id="rc-panel-custom"
        role="tabpanel"
        aria-labelledby="rc-tab-custom"
      >
        {/* Search and filters stay put; only the list of places moves. */}
        <div className="rc-plan-pane-head">
          <header>
            <h2 id="rc-picker-heading">{t('pickerHeading')}</h2>
            <p>{t('pickerIntro')}</p>
          </header>

        <div className="rc-plan-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
          />
        </div>

        <div className="rc-plan-filters">
          {/* Selects, not chips: thirteen landscape chips wrap to eleven rows in
              a pane this narrow and push the places themselves off the screen. */}
          <label className="rc-plan-select">
            <span>{t('landscape')}</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">{t('allLandscapes')}</option>
              {categories.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="rc-plan-select">
            <span>{t('province')}</span>
            <select value={province} onChange={(event) => setProvince(event.target.value)}>
              <option value="all">{t('allProvinces')}</option>
              {provinces.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        </div>

        <div className="rc-plan-pane-scroll">
        <ul className="rc-plan-results">
          {results.length === 0 ? (
            <li className="rc-plan-results-empty">{t('noMatch')}</li>
          ) : (
            results.map((place) => {
              const added = chosen.has(place.slug);
              return (
                <li key={place.slug}>
                  <button
                    type="button"
                    className={added ? 'is-added' : ''}
                    onClick={() => (added ? undefined : onAdd(place.slug))}
                    disabled={added}
                    aria-label={
                      added ? t('alreadyAdded', { name: place.name }) : t('addPlace', { name: place.name })
                    }
                  >
                    <span>
                      <strong>{place.name}</strong>
                      <small>
                        {place.category} · {place.city || place.district}
                      </small>
                    </span>
                    <i aria-hidden="true">{added ? '✓' : '+'}</i>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="rc-plan-anywhere">
          <h3>{t('anywhereHeading')}</h3>
          <p>{t('anywhereCopy')}</p>

          <div className="rc-plan-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={anywhere}
              onChange={(event) => setAnywhere(event.target.value)}
              placeholder={t('anywherePlaceholder')}
              aria-label={t('anywhereAria')}
            />
            {searching ? <em aria-hidden="true">…</em> : null}
          </div>

          <div aria-live="polite">
            {searchError ? <p className="rc-plan-anywhere-note">{searchError}</p> : null}

            {!searchError && anywhere.trim().length >= 3 && !searching && found.length === 0 ? (
              <p className="rc-plan-anywhere-note">{t('nothingFound')}</p>
            ) : null}

            {found.length > 0 ? (
              <ul className="rc-plan-results rc-plan-results-found">
                {found.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => addFound(result)}
                      aria-label={t('addPlace', { name: result.name })}
                    >
                      <span>
                        <strong>{result.name}</strong>
                        <small>{[result.kind, result.context].filter(Boolean).join(' · ')}</small>
                      </span>
                      <i aria-hidden="true">+</i>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <p className="rc-plan-anywhere-credit">
            {t('creditPre')}{' '}
            <a href="https://openstreetmap.org/copyright" target="_blank" rel="noreferrer noopener">
              OpenStreetMap
            </a>
            .
          </p>
        </div>
        </div>
      </section>

      <section className="rc-plan-pane rc-plan-itinerary" aria-labelledby="rc-itinerary-heading">
        <div className="rc-plan-pane-head">
        <header>
          <div>
            <h2 id="rc-itinerary-heading">{t('routeHeading')}</h2>
            <p>
              {stops.length === 0
                ? t('nothingAdded')
                : t('stopsInOrder', { count: stops.length })}
            </p>
          </div>
          {stops.length > 0 ? (
            <div className="rc-plan-itinerary-tools">
              <button type="button" onClick={onOptimise} disabled={stops.length < 4}>
                {t('shortestOrder')}
              </button>
              <button type="button" onClick={onClear} className="rc-plan-clear">
                {t('clear')}
              </button>
            </div>
          ) : null}
        </header>
        </div>

        <div className="rc-plan-pane-scroll">
        {stops.length === 0 ? (
          <p className="rc-plan-itinerary-empty">{t('pickFirst')}</p>
        ) : (
          <ol className="rc-plan-stops">
            {stops.map((stop, index) => {
              const leg = legs[index - 1];
              return (
                <li key={`${stop.slug}-${index}`}>
                  {leg ? (
                    <p className="rc-plan-leg-inline" aria-label={t('driveTo', { name: stop.name })}>
                      <i aria-hidden="true">↓</i>
                      <span>
                        {t('legInline', {
                          km: formatKm(leg.roadKm),
                          duration: formatDuration(leg.minutes)
                        })}
                      </span>
                    </p>
                  ) : null}

                  <div
                    className={`rc-plan-stop${dragging === index ? ' is-dragging' : ''}${
                      over === index && dragging !== index ? ' is-over' : ''
                    }`}
                    draggable
                    onDragStart={(event) => {
                      setDragging(index);
                      event.dataTransfer.effectAllowed = 'move';
                      /* Firefox will not start a drag without data on the transfer. */
                      event.dataTransfer.setData('text/plain', String(index));
                    }}
                    onDragEnter={() => setOver(index)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const from = Number(event.dataTransfer.getData('text/plain'));
                      if (Number.isInteger(from)) move(from, index);
                      setDragging(null);
                      setOver(null);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setOver(null);
                    }}
                  >
                    <span className="rc-plan-stop-grip" aria-hidden="true">
                      ⠿
                    </span>
                    <span className="rc-plan-stop-index" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="rc-plan-stop-name">
                      {stop.name}
                      {stop.custom ? <em title={t('ownStopTitle')}>{t('ownStop')}</em> : null}
                    </span>
                    <span className="rc-plan-stop-controls">
                      <button
                        type="button"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        aria-label={t('moveEarlier', { name: stop.name })}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, index + 1)}
                        disabled={index === stops.length - 1}
                        aria-label={t('moveLater', { name: stop.name })}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        aria-label={t('remove', { name: stop.name })}
                        className="rc-plan-stop-remove"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        </div>
      </section>
    </>
  );
}
