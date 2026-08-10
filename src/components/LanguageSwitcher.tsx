'use client';

/**
 * The language switcher.
 *
 * Switching keeps the reader where they are: `usePathname` from our own
 * navigation module returns the path *without* the locale segment, so replacing
 * the locale lands on the same page in the new language rather than sending
 * everyone back to the homepage. next-intl writes its cookie on the way, so the
 * choice survives the next visit.
 *
 * A details/summary disclosure rather than a custom popup — it opens on click,
 * closes on Escape, is reachable by keyboard and needs no state to be correct
 * before hydration.
 */

import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { localeLabels, localeNames, locales, type Locale } from '@/i18n/routing';

export function LanguageSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('nav');
  const active = useLocale() as Locale;
  /* Already stripped of the locale segment, and with any [slug] resolved — so
     switching lands on the same page rather than the homepage. */
  const pathname = usePathname();
  const holder = useRef<HTMLDetailsElement>(null);

  /* Click-away and Escape both close it. */
  useEffect(() => {
    const close = (event: Event) => {
      const node = holder.current;
      if (!node?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') node.open = false;
        return;
      }
      if (node.contains(event.target as Node)) return;
      node.open = false;
    };

    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  return (
    <details className="lang-switch" ref={holder}>
      <summary aria-label={t('changeLanguage')} title={t('changeLanguage')}>
        <span aria-hidden="true">{localeLabels[active]}</span>
        <i aria-hidden="true">▾</i>
      </summary>
      <ul className="lang-menu">
        {locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === active ? 'true' : undefined}
              className={locale === active ? 'is-active' : ''}
              onClick={() => {
                if (holder.current) holder.current.open = false;
                onNavigate?.();
              }}
            >
              <b>{localeLabels[locale]}</b>
              <span>{localeNames[locale]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
