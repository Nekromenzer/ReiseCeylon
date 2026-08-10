'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export type AtlasEntry = {
  slug: string;
  name: string;
  note: string;
  image: string;
  imageAlt: string;
  categoryId: string;
  category: string;
  province: string;
  /** The province name as the reader sees it; `province` stays the raw key. */
  provinceLabel: string;
  district: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
};

type AtlasCategory = { id: string; name: string; count: number };
type AtlasProvince = { value: string; label: string };

const PAGE = 24;

/**
 * One searchable string per place. Both the translated labels and the raw
 * province key go in, so a German reader can type "Strände" and an English one
 * can still type "Southern" and both find the same card.
 */
function haystack(entry: AtlasEntry) {
  return [
    entry.name,
    entry.category,
    entry.city,
    entry.district,
    entry.province,
    entry.provinceLabel,
    entry.region
  ]
    .join(' ')
    .toLowerCase();
}

export function DestinationAtlas({
  destinations,
  categories,
  provinces
}: {
  destinations: AtlasEntry[];
  categories: AtlasCategory[];
  provinces: AtlasProvince[];
}) {
  const t = useTranslations('atlas');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [province, setProvince] = useState('all');
  const [visible, setVisible] = useState(PAGE);
  const searchRef = useRef<HTMLInputElement>(null);

  const index = useMemo(
    () => destinations.map((entry) => ({ entry, text: haystack(entry) })),
    [destinations]
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return index
      .filter(({ entry, text }) => {
        if (category !== 'all' && entry.categoryId !== category) return false;
        if (province !== 'all' && entry.province !== province) return false;
        return needle.length === 0 || text.includes(needle);
      })
      .map(({ entry }) => entry);
  }, [index, query, category, province]);

  /* A new filter always starts the list again from the top. */
  useEffect(() => {
    setVisible(PAGE);
  }, [query, category, province]);

  /* “/” jumps to the search field, the way a map or a docs site would. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = query.trim().length > 0 || category !== 'all' || province !== 'all';
  const shown = results.slice(0, visible);

  const reset = () => {
    setQuery('');
    setCategory('all');
    setProvince('all');
  };

  return (
    <section className="atlas" id="atlas">
      <header className="atlas-head">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2>{t('heading')}</h2>
        </div>
        <div className="atlas-search">
          <span aria-hidden="true">⌕</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
          />
          <kbd aria-hidden="true">/</kbd>
        </div>
      </header>

      <div className="atlas-controls">
        <div className="atlas-chips" role="group" aria-label={t('filterLandscapeAria')}>
          <button
            type="button"
            className={category === 'all' ? 'is-active' : ''}
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            {t('all')} <i>{destinations.length}</i>
          </button>
          {categories.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={category === entry.id ? 'is-active' : ''}
              aria-pressed={category === entry.id}
              onClick={() => setCategory(entry.id)}
            >
              {entry.name} <i>{entry.count}</i>
            </button>
          ))}
        </div>

        <label className="atlas-select">
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

      <div className="atlas-status" aria-live="polite">
        <p>
          {results.length === 0 ? t('noMatch') : t('placeCount', { count: results.length })}
          {filtered ? <span> · {t('filtered')}</span> : null}
        </p>
        {filtered ? (
          <button type="button" onClick={reset} className="atlas-reset">
            {t('clearFilters')}
          </button>
        ) : null}
      </div>

      {results.length === 0 ? (
        <div className="atlas-empty">
          <p>{t('emptyTitle')}</p>
          <p>
            {t('emptyCopyPre')}{' '}
            <Link href="/contact" className="text-link">
              {t('emptyCopyLink')} <span>↗</span>
            </Link>
          </p>
        </div>
      ) : (
        <ul className="atlas-grid">
          {shown.map((entry, position) => (
            <li key={entry.slug}>
              <Link href={`/destinations/${entry.slug}`} className="atlas-card">
                <span className="atlas-card-media">
                  <Image
                    src={entry.image}
                    alt={entry.imageAlt}
                    fill
                    loading={position < 8 ? 'eager' : 'lazy'}
                    sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 23vw"
                  />
                  <em>{entry.category}</em>
                  {entry.featured ? <b>{t('featured')}</b> : null}
                </span>
                <span className="atlas-card-copy">
                  <strong>{entry.name}</strong>
                  <span>{entry.note}</span>
                  <span className="atlas-card-meta">
                    {[entry.city, entry.district].filter(Boolean).join(' · ')}
                    <i aria-hidden="true">↗</i>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {visible < results.length ? (
        <div className="atlas-more">
          <button type="button" onClick={() => setVisible((count) => count + PAGE)}>
            {t('showMore')} <span aria-hidden="true">↓</span>
          </button>
          <p>{t('shownOf', { shown: shown.length, total: results.length })}</p>
        </div>
      ) : null}
    </section>
  );
}
