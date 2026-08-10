'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export function ThemeToggle() {
  const t = useTranslations('nav');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('reise-theme');
    const enabled = stored === 'dark';
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    window.localStorage.setItem('reise-theme', next ? 'dark' : 'light');
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={dark ? t('themeLight') : t('themeDark')}
    >
      <span className={dark ? 'theme-dot theme-dot-dark' : 'theme-dot'} />
    </button>
  );
}
