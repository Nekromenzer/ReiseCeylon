'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function ContactForm() {
  const t = useTranslations('contactForm');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="contact-form">
        <div className="contact-success">
          <span>{t('successEyebrow')}</span>
          <h2>{t('successHeading')}</h2>
          <p>{t('successCopy')}</p>
          <button type="button" onClick={() => setSent(false)}>{t('sendAnother')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-form">
      <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
        <label>{t('name')}<input name="name" required placeholder={t('namePlaceholder')} /></label>
        <label>{t('email')}<input name="email" type="email" required placeholder={t('emailPlaceholder')} /></label>
        <label>{t('dates')}<input name="dates" placeholder={t('datesPlaceholder')} /></label>
        <label>{t('interest')}
          <select name="interest" defaultValue="">
            <option value="" disabled>{t('interestPlaceholder')}</option>
            <option>{t('interestNature')}</option>
            <option>{t('interestCulture')}</option>
            <option>{t('interestCoast')}</option>
            <option>{t('interestEverything')}</option>
          </select>
        </label>
        <label>{t('message')}<textarea name="message" placeholder={t('messagePlaceholder')} /></label>
        <button type="submit">{t('submit')}</button>
      </form>
    </div>
  );
}
