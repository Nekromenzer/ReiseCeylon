'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

/** Label key paired with its route — the label is resolved per language below. */
const links = [
  ['destinations', '/destinations'],
  ['experiences', '/#experiences'],
  ['planJourney', '/journeys'],
  ['about', '/about'],
  ['journal', '/blog'],
  ['contact', '/contact']
] as const;

export function Navbar() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 36);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <>
      <header className={`nav-shell ${scrolled ? 'nav-scrolled' : ''}`}>
        <nav className="nav-inner" aria-label={t('ariaMain')}>
          <Link href="/" className="brand" aria-label={t('ariaHome')}>
            <span className="brand-mark">
              <Image src="/brand/logo-primary.png" alt="" width={64} height={64} priority />
            </span>
            <span className="brand-type">Reise<span>Ceylon</span></span>
          </Link>
          <div className="nav-links">
            {links.map(([label, href]) => (
              <Link key={label} href={href}>
                {t(label)}
              </Link>
            ))}
          </div>
          <div className="nav-actions">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/contact" className="nav-cta">
              {t('cta')} <span>↗</span>
            </Link>
            <button
              type="button"
              className={`menu-button ${open ? 'menu-open' : ''}`}
              aria-label={t('toggleMenu')}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <i /><i />
            </button>
          </div>
        </nav>
      </header>
      <div className={`menu-overlay ${open ? 'overlay-open' : ''}`} aria-hidden={!open}>
        <div className="menu-list">
          {links.map(([label, href], index) => (
            <Link
              key={label}
              href={href}
              style={{ transitionDelay: `${100 + index * 55}ms` }}
              onClick={() => setOpen(false)}
            >
              {t(label)}<span>↗</span>
            </Link>
          ))}
        </div>
        {/* The switcher again inside the overlay — the header row is too tight
            for it on a phone, and this is the only menu there. */}
        <div className="menu-lang">
          <span>{t('language')}</span>
          <LanguageSwitcher onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
