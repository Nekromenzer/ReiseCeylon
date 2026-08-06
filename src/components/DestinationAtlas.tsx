'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

export type AtlasEntry = {
  slug: string;
  name: string;
  note: string;
  image: string;
  imageAlt: string;
  categoryId: string;
  category: string;
  province: string;
  district: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
};

type AtlasCategory = { id: string; name: string; count: number };

const PAGE = 24;

/** One searchable string per place, so a query can match a town or a district too. */
function haystack(entry: AtlasEntry) {
  return [entry.name, entry.category, entry.city, entry.district, entry.province, entry.region]
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
  provinces: string[];
}) {
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
          <p className="eyebrow">Browse the island</p>
          <h2>Find your landscape.</h2>
        </div>
        <div className="atlas-search">
          <span aria-hidden="true">⌕</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a place, town or district"
            aria-label="Search destinations"
          />
          <kbd aria-hidden="true">/</kbd>
        </div>
      </header>

      <div className="atlas-controls">
        <div className="atlas-chips" role="group" aria-label="Filter by landscape">
          <button
            type="button"
            className={category === 'all' ? 'is-active' : ''}
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            All <i>{destinations.length}</i>
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
          <span>Province</span>
          <select value={province} onChange={(event) => setProvince(event.target.value)}>
            <option value="all">All provinces</option>
            {provinces.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="atlas-status" aria-live="polite">
        <p>
          {results.length === 0
            ? 'No places match those filters'
            : `${results.length} ${results.length === 1 ? 'place' : 'places'}`}
          {filtered ? <span> · filtered</span> : null}
        </p>
        {filtered ? (
          <button type="button" onClick={reset} className="atlas-reset">
            Clear filters
          </button>
        ) : null}
      </div>

      {results.length === 0 ? (
        <div className="atlas-empty">
          <p>Nothing here yet.</p>
          <p>
            Try a wider landscape, another province, or{' '}
            <Link href="/contact" className="text-link">
              ask us to build the route <span>↗</span>
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
                  {entry.featured ? <b>Featured</b> : null}
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
            Show more <span aria-hidden="true">↓</span>
          </button>
          <p>
            {shown.length} of {results.length}
          </p>
        </div>
      ) : null}
    </section>
  );
}
