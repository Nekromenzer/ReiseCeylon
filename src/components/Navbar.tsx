'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const links = [
  ['Destinations', '/destinations'],
  ['Experiences', '/#experiences'],
  ['Journeys', '/#journeys'],
  ['About', '/about'],
  ['Journal', '/blog'],
  ['Contact', '/contact']
];

export function Navbar() {
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
        <nav className="nav-inner" aria-label="Main navigation">
          <Link href="/" className="brand" aria-label="ReiseCeylon home">
            <span className="brand-mark">
              <Image src="/brand/logo-primary.png" alt="" width={64} height={64} priority />
            </span>
            <span className="brand-type">Reise<span>Ceylon</span></span>
          </Link>
          <div className="nav-links">
            {links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
          </div>
          <div className="nav-actions">
            <ThemeToggle />
            <Link href="/contact" className="nav-cta">Start planning <span>↗</span></Link>
            <button
              type="button"
              className={`menu-button ${open ? 'menu-open' : ''}`}
              aria-label="Toggle menu"
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
            <Link key={label} href={href} style={{ transitionDelay: `${100 + index * 55}ms` }} onClick={() => setOpen(false)}>
              {label}<span>↗</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
