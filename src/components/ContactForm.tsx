'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function ContactForm() {
  const t = useTranslations('contactForm');
  const locale = useLocale();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setStatus('sending');
    setError('');

    try {
      const response = await fetch('/api/contact-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? ''),
          dates: String(form.get('dates') ?? ''),
          interest: String(form.get('interest') ?? ''),
          message: String(form.get('message') ?? ''),
          website: String(form.get('website') ?? '')
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || t('sendFailed'));

      formElement.reset();
      setStatus('sent');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('sendFailed'));
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="contact-form">
        <div className="contact-success">
          <span>{t('successEyebrow')}</span>
          <h2>{t('successHeading')}</h2>
          <p>{t('successCopy')}</p>
          <button type="button" onClick={() => setStatus('idle')}>{t('sendAnother')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-form">
      <form onSubmit={submit}>
        <input className="contact-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden />
        <label>{t('name')}<input name="name" required placeholder={t('namePlaceholder')} /></label>
        <label>{t('email')}<input name="email" type="email" required placeholder={t('emailPlaceholder')} /></label>
        <label>
          {t('phone')}
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('phonePlaceholder')}
          />
        </label>
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
        {status === 'error' ? <p className="contact-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? t('sending') : t('submit')}
        </button>
      </form>
    </div>
  );
}
