'use client';

/**
 * Finalise — the traveller's details, sent to ReiseCeylon with the whole
 * itinerary attached.
 *
 * The route is not re-derived on the server from a slug, because a custom
 * journey has no slug to look up. The stops, legs and totals the traveller was
 * looking at are posted with the form, and `/api/journey-enquiry` formats
 * exactly those into the email — so what lands in the inbox is what was on the
 * screen.
 *
 * The same itinerary is kept here after the send, so the traveller can take a
 * printable copy away whether or not their emailed one arrives.
 */

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatDuration, formatKm, type RouteTotals, type Waypoint } from '@/lib/journey';
import {
  DEFAULT_DIAL_CODE,
  LEADING_DIAL_CODES,
  OTHER_DIAL_CODE,
  OTHER_DIAL_CODES
} from '@/lib/dial-codes';
import { itineraryFileName, printableCopy, renderItineraryPrintable, type Itinerary } from '@/lib/itinerary';

export type EnquiryPayload = Itinerary;

type Status = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Whether the traveller's own copy actually went. Until a sending domain is
 * verified with Resend it will not, and promising an email that never arrives is
 * worse than not mentioning one.
 */
type Sent = { copySent: boolean };

export function JourneyEnquiryForm({
  title,
  kind,
  stops,
  route,
  declaredDays,
  airportTransfers,
  onClose
}: {
  title: string;
  kind: 'package' | 'custom';
  stops: Waypoint[];
  route: RouteTotals;
  declaredDays?: string;
  airportTransfers: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('enquiry');
  const sheet = useTranslations('itinerary');
  const dial = useTranslations('dialCodes');
  const locale = useLocale();

  /* Both optional — a traveller who has not thought about either can still send. */
  const vehicleOptions = t.raw('vehicleOptions') as string[];
  const budgetOptions = t.raw('budgetOptions') as string[];

  /* Country names pass through untranslated if the catalogue has no entry. */
  const country = (name: string) => {
    const translated = dial(name);
    return translated === `dialCodes.${name}` ? name : translated;
  };

  const length = declaredDays ?? t('aboutDays', { count: route.suggestedDays });

  const [status, setStatus] = useState<Status>('idle');
  const [sent, setSent] = useState<Sent>({ copySent: false });
  const [error, setError] = useState('');

  /* `other` swaps the country list for a free prefix — see dial-codes.ts. */
  const [dialCode, setDialCode] = useState<string>(DEFAULT_DIAL_CODE);

  /**
   * What was actually sent, kept for the printable copy. Re-reading the form
   * would not do: it is unmounted by the time the download button exists.
   */
  const [submitted, setSubmitted] = useState<Itinerary | null>(null);

  /* The print document is rendered into an iframe rather than a popup, which no
     blocker intercepts and which leaves the planner untouched behind it. */
  const printFrame = useRef<HTMLIFrameElement | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus('sending');
    setError('');

    /* Country code and number are collected apart and travel as one string. */
    const prefix = dialCode === OTHER_DIAL_CODE ? String(form.get('dialCode') ?? '').trim() : dialCode;
    const number = String(form.get('phone') ?? '').trim();

    const payload: Itinerary = {
      /* The language the traveller planned in — the email and PDF answer in it. */
      locale,
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: `${prefix} ${number}`.trim(),
      dates: String(form.get('dates') ?? ''),
      travellers: String(form.get('travellers') ?? ''),
      vehicle: String(form.get('vehicle') ?? ''),
      budget: String(form.get('budget') ?? ''),
      message: String(form.get('message') ?? ''),
      journey: {
        kind,
        title,
        stops: stops.map((stop) => ({ name: stop.name, slug: stop.slug })),
        roadKm: Math.round(route.roadKm),
        minutes: Math.round(route.minutes),
        suggestedDays: route.suggestedDays,
        declaredDays,
        airportTransfers,
        legs: route.legs.map((leg) => ({
          from: leg.from.name,
          to: leg.to.name,
          km: Math.round(leg.roadKm),
          minutes: Math.round(leg.minutes)
        }))
      }
    };

    try {
      const response = await fetch('/api/journey-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || t('sendFailed'));

      setSubmitted(payload);
      setSent({ copySent: body.copySent === true });
      setStatus('sent');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : t('sendFailed'));
    }
  }

  /**
   * The itinerary as paper. The browser's own print dialogue is what writes the
   * PDF — every one of them can, none of them needs a library shipped to the
   * traveller to do it, and the result stays selectable text.
   */
  function downloadPdf() {
    if (!submitted) return;

    const frame = printFrame.current;
    const view = frame?.contentWindow;
    if (!frame || !view) return;

    /* The document title becomes the suggested filename in the print dialogue. */
    view.document.open();
    view.document.write(
      renderItineraryPrintable(submitted, printableCopy((key) => sheet(key), locale))
    );
    view.document.close();
    view.document.title = itineraryFileName(submitted.journey);

    /* Safari needs the frame focused before it will accept print(). */
    view.focus();
    view.print();
  }

  if (status === 'sent') {
    return (
      <div className="rc-plan-enquiry rc-plan-enquiry-sent" role="status">
        <span>{t('sentEyebrow')}</span>
        <h2>{t('sentHeading')}</h2>
        <p>
          {t('sentCopy', { title, stops: stops.length, km: formatKm(route.roadKm) })}
          {sent.copySent ? ` ${t('copyOnItsWay')}` : ''} {t('sentCopySuffix')}
        </p>

        <div className="rc-plan-enquiry-done">
          <button type="button" className="rc-plan-enquiry-download" onClick={downloadPdf}>
            {t('downloadPdf')}
          </button>
          <button type="button" onClick={onClose}>
            {t('backToPlanning')}
          </button>
        </div>

        {/* Off-screen rather than hidden: a display:none frame will not print. */}
        <iframe ref={printFrame} title={t('printableTitle')} aria-hidden className="rc-print-frame" />
      </div>
    );
  }

  return (
    <div className="rc-plan-enquiry">
      <header>
        <div>
          <span>{t('eyebrow')}</span>
          <h2>{t('heading')}</h2>
        </div>
        <button type="button" onClick={onClose} className="rc-plan-enquiry-close" aria-label={t('close')}>
          ×
        </button>
      </header>

      <div className="rc-plan-enquiry-recap">
        <strong>{title}</strong>
        <p>
          {t('recap', {
            stops: stops.length,
            km: formatKm(route.roadKm),
            duration: formatDuration(route.minutes),
            length
          })}
        </p>
        <p className="rc-plan-enquiry-stops">{stops.map((stop) => stop.name).join(' → ')}</p>
      </div>

      <form onSubmit={submit}>
        <label>
          {t('name')}
          <input name="name" required placeholder={t('namePlaceholder')} />
        </label>
        <label>
          {t('email')}
          <input name="email" type="email" required placeholder={t('emailPlaceholder')} />
        </label>

        {/* Country code and number, so what reaches us can actually be dialled. */}
        <label>
          {t('mobile')}
          <div className="rc-plan-enquiry-phone">
            <select
              name="dialCountry"
              value={dialCode}
              onChange={(event) => setDialCode(event.target.value)}
              aria-label={t('dialCodeAria')}
            >
              {LEADING_DIAL_CODES.map((entry) => (
                <option key={entry.country} value={entry.code}>
                  {entry.code} · {country(entry.country)}
                </option>
              ))}
              <optgroup label={t('moreCountries')}>
                {OTHER_DIAL_CODES.map((entry) => (
                  <option key={entry.country} value={entry.code}>
                    {entry.code} · {country(entry.country)}
                  </option>
                ))}
              </optgroup>
              <option value={OTHER_DIAL_CODE}>{t('elsewhere')}</option>
            </select>
            {dialCode === OTHER_DIAL_CODE ? (
              <input
                name="dialCode"
                required
                inputMode="tel"
                pattern="\+?\d{1,4}"
                placeholder="+00"
                aria-label={t('dialCodeAria')}
                className="rc-plan-enquiry-dial"
              />
            ) : null}
            <input
              name="phone"
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={t('phonePlaceholder')}
            />
          </div>
        </label>

        <label>
          {t('dates')}
          <input name="dates" placeholder={t('datesPlaceholder')} />
        </label>
        <label>
          {t('travellers')}
          <select name="travellers" defaultValue={t('travellers2')}>
            <option>{t('travellersSolo')}</option>
            <option>{t('travellers2')}</option>
            <option>{t('travellers35')}</option>
            <option>{t('travellers6')}</option>
          </select>
        </label>
        <div className="rc-plan-enquiry-pair">
          <label>
            {t('vehicle')} <i>{t('optional')}</i>
            <select name="vehicle" defaultValue={vehicleOptions[0]}>
              {vehicleOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            {t('budget')} <i>{t('optional')}</i>
            <select name="budget" defaultValue={budgetOptions[0]}>
              {budgetOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {t('message')}
          <textarea name="message" placeholder={t('messagePlaceholder')} />
        </label>

        {status === 'error' ? (
          <p className="rc-plan-enquiry-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? t('sending') : t('submit')}
        </button>
        <p className="rc-plan-enquiry-fineprint">{t('fineprint')}</p>
      </form>
    </div>
  );
}
