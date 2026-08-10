'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

/** Destination options, keyed by the message they are labelled with. */
const OPTIONS = [
  { key: 'hill', slug: 'ella' },
  { key: 'ancient', slug: 'sigiriya-rock-fortress' },
  { key: 'south', slug: 'mirissa-beach' },
  { key: 'wild', slug: 'yala-national-park' }
] as const;

export function SearchJourney() {
  const t = useTranslations('search');
  const [where, setWhere] = useState<string>(OPTIONS[0].key);
  const router = useRouter();

  return (
    <form
      className="search-card"
      onSubmit={(event) => {
        event.preventDefault();
        const chosen = OPTIONS.find((option) => option.key === where) ?? OPTIONS[0];
        router.push(`/destinations/${chosen.slug}`);
      }}
    >
      <label>
        <span>{t('whereTo')}</span>
        <select value={where} onChange={(event) => setWhere(event.target.value)}>
          {OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {t(option.key)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('when')}</span>
        <input type="text" placeholder={t('seasonPlaceholder')} />
      </label>
      <label>
        <span>{t('travellers')}</span>
        <select defaultValue="two">
          <option value="two">{t('two')}</option>
          <option value="solo">{t('solo')}</option>
          <option value="few">{t('few')}</option>
          <option value="many">{t('many')}</option>
        </select>
      </label>
      <button type="submit">
        {t('explore')} <span>↗</span>
      </button>
    </form>
  );
}
