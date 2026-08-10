/**
 * One itinerary, three renderings: the enquiry that reaches ReiseCeylon, the
 * traveller's emailed copy, and the sheet they print or save as a PDF.
 *
 * All three are built here rather than in the API route, because the printable
 * document is produced in the browser — the traveller downloads it the moment
 * the send succeeds, without a round trip — while the emails are produced on the
 * server. Sharing the module is what keeps the PDF and the email describing the
 * same journey in the same words; they drifted the moment they were written
 * twice.
 *
 * Everything here is a pure string function with no Sanity, Resend or DOM
 * dependency, so it runs unchanged on either side.
 */
import { CUSTOM_PREFIX, formatDuration } from './journey';

/**
 * The labels for these three documents, supplied by the caller.
 *
 * This module runs on both sides of the client boundary — the API route renders
 * the emails, the browser renders the printable sheet — so it cannot reach for
 * next-intl itself. Both callers pass a translator bound to the `itinerary`
 * namespace and the traveller's language instead, which is what makes the email
 * that lands in an inbox match the page the route was planned on.
 */
export type Translate = (key: string, values?: Record<string, string | number>) => string;

export type ItineraryCopy = { t: Translate; locale: string };

/** Convenience for the browser, where the translator has next-intl's signature. */
export function printableCopy(t: Translate, locale: string): ItineraryCopy {
  return { t, locale };
}

export type ItineraryLeg = { from: string; to: string; km: number; minutes: number };

export type ItineraryStop = { name: string; slug: string };

export type ItineraryJourney = {
  kind: 'package' | 'custom';
  title: string;
  stops: ItineraryStop[];
  roadKm: number;
  minutes: number;
  suggestedDays: number;
  /** A ready-made journey's own stated length; absent on a custom route. */
  declaredDays?: string;
  /** Whether the route is quoted airport to airport. */
  airportTransfers: boolean;
  legs: ItineraryLeg[];
};

export type Itinerary = {
  /** The language the traveller planned in. Drives the emails and the PDF. */
  locale: string;
  name: string;
  email: string;
  /** Dialling code and number, already joined — empty if the field was skipped. */
  phone: string;
  dates: string;
  travellers: string;
  vehicle: string;
  budget: string;
  message: string;
  journey: ItineraryJourney;
};

/**
 * Everything in these documents is traveller-supplied, so every value is escaped
 * before it reaches the HTML — a name with an angle bracket in it must not be
 * able to write markup into our own inbox, or into the sheet we hand back.
 */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * A stop the traveller found themselves carries its coordinates in its slug and
 * nothing in our atlas — so the documents print the point, and a map link,
 * rather than leaving the designer to guess which of four villages of that name
 * it is.
 */
export function customPoint(slug: string) {
  if (!slug.startsWith(CUSTOM_PREFIX)) return null;
  const [latitude, longitude] = slug.slice(CUSTOM_PREFIX.length).split(',').map(Number);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

/** The length as it should be stated: what the package declares beats our estimate. */
function statedLength(journey: ItineraryJourney, t: Translate) {
  if (journey.declaredDays) return journey.declaredDays;
  return t('days', { count: journey.suggestedDays });
}

function transfersLine(journey: ItineraryJourney, t: Translate) {
  return journey.airportTransfers ? t('transfersOn') : t('transfersOff');
}

type Audience = { forTraveller?: boolean };

export function renderItineraryEmailHtml(
  enquiry: Itinerary,
  copy: ItineraryCopy,
  audience: Audience = {}
) {
  const { journey } = enquiry;
  const { t, locale } = copy;
  const e = escapeHtml;
  const mine = audience.forTraveller === true;

  const stops = journey.stops
    .map((stop, index) => {
      const point = customPoint(stop.slug);
      const note = point
        ? ` <a href="https://www.google.com/maps/search/?api=1&amp;query=${point.latitude},${point.longitude}"
             style="color:#8a8172;font-size:12px">${e(t('theirOwnStop'))} — ${point.latitude}, ${point.longitude}</a>`
        : '';
      return `<li><strong>${index + 1}.</strong> ${e(stop.name)}${note}</li>`;
    })
    .join('');

  const legs = journey.legs
    .map(
      (leg) =>
        `<tr><td>${e(leg.from)} → ${e(leg.to)}</td><td align="right">${leg.km} km</td><td align="right">${formatDuration(leg.minutes)}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="${e(locale)}"><body style="margin:0;padding:24px;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#1d2a24">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e3ded2;padding:32px">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8a8172">
      ${e(mine ? t('yourJourney') : journey.kind === 'custom' ? t('customJourney') : t('readyMadeJourney'))}
    </p>
    <h1 style="margin:0 0 ${mine ? '14' : '20'}px;font-size:26px;font-weight:400">${e(journey.title)}</h1>
    ${
      mine
        ? `<p style="margin:0 0 22px;font-size:15px;line-height:1.7">${e(t('thanks', { name: enquiry.name.split(' ')[0] }))}</p>`
        : ''
    }

    <table width="100%" style="border-collapse:collapse;margin:0 0 24px;font-size:14px">
      <tr><td style="padding:6px 0;color:#8a8172">${e(t('stops'))}</td><td align="right">${journey.stops.length}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${e(t('roadDistance'))}</td><td align="right">${journey.roadKm} km</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${e(t('timeOnRoad'))}</td><td align="right">${formatDuration(journey.minutes)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${e(journey.declaredDays ? t('length') : t('suggestedLength'))}</td><td align="right">${e(statedLength(journey, t))}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${e(t('transfers'))}</td><td align="right">${e(transfersLine(journey, t))}</td></tr>
    </table>

    <h2 style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a8172;margin:0 0 8px">${e(t('theRoute'))}</h2>
    <ol style="margin:0 0 24px;padding:0 0 0 4px;list-style:none;font-size:15px;line-height:1.9">${stops}</ol>

    ${
      legs.length > 0
        ? `<h2 style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a8172;margin:0 0 8px">${e(t('legByLeg'))}</h2>
    <table width="100%" style="border-collapse:collapse;margin:0 0 24px;font-size:13px">${legs}</table>`
        : ''
    }

    <h2 style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a8172;margin:0 0 8px">${e(mine ? t('whatYouToldUs') : t('theTraveller'))}</h2>
    <table width="100%" style="border-collapse:collapse;font-size:14px">
      ${
        mine
          ? ''
          : `<tr><td style="padding:6px 0;color:#8a8172;width:130px">${e(t('name'))}</td><td>${e(enquiry.name)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${e(t('email'))}</td><td><a href="mailto:${e(enquiry.email)}">${e(enquiry.email)}</a></td></tr>`
      }
      <tr><td style="padding:6px 0;color:#8a8172;width:130px">${e(t('mobile'))}</td><td>${
        enquiry.phone
          ? `<a href="tel:${e(enquiry.phone.replace(/[^\d+]/g, ''))}">${e(enquiry.phone)}</a>`
          : '—'
      }</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${e(t('dates'))}</td><td>${e(enquiry.dates) || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${e(t('travellers'))}</td><td>${e(enquiry.travellers) || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${e(t('vehicle'))}</td><td>${e(enquiry.vehicle) || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${e(t('budget'))}</td><td>${e(enquiry.budget) || '—'}</td></tr>
    </table>

    ${
      enquiry.message
        ? `<h2 style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a8172;margin:24px 0 8px">${e(mine ? t('yourNote') : t('theirNote'))}</h2>
    <p style="margin:0;font-size:15px;line-height:1.7;white-space:pre-wrap">${e(enquiry.message)}</p>`
        : ''
    }

    <p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e3ded2;font-size:12px;color:#8a8172">
      ${
        e(mine ? t('footerTraveller') : t('footerInternal'))
      }
    </p>
  </div>
</body></html>`;
}

/** The same content as text, for clients that will not render the HTML part. */
export function renderItineraryEmailText(
  enquiry: Itinerary,
  copy: ItineraryCopy,
  audience: Audience = {}
) {
  const { journey } = enquiry;
  const { t, locale } = copy;
  const mine = audience.forTraveller === true;
  const upper = (value: string) => value.toLocaleUpperCase(locale);

  return [
    `${upper(mine ? t('yourJourney') : journey.kind === 'custom' ? t('customJourney') : t('readyMadeJourney'))}: ${journey.title}`,
    ...(mine ? ['', t('thanksText', { name: enquiry.name.split(' ')[0] })] : []),
    '',
    `${t('stops')}: ${journey.stops.length}`,
    `${t('roadDistance')}: ${journey.roadKm} km`,
    `${t('timeOnRoad')}: ${formatDuration(journey.minutes)}`,
    journey.declaredDays
      ? `${t('length')}: ${journey.declaredDays}`
      : `${t('suggestedLength')}: ${statedLength(journey, t)}`,
    `${t('transfers')}: ${transfersLine(journey, t)}`,
    '',
    upper(t('theRoute')),
    ...journey.stops.map((stop, index) => {
      const point = customPoint(stop.slug);
      return `  ${index + 1}. ${stop.name}${point ? ` (${t('theirOwnStop')} — ${point.latitude}, ${point.longitude})` : ''}`;
    }),
    '',
    ...(journey.legs.length > 0
      ? [
          upper(t('legByLeg')),
          ...journey.legs.map(
            (leg) => `  ${leg.from} -> ${leg.to}: ${leg.km} km, ${formatDuration(leg.minutes)}`
          ),
          ''
        ]
      : []),
    upper(mine ? t('whatYouToldUs') : t('theTraveller')),
    ...(mine ? [] : [`  ${t('name')}: ${enquiry.name}`, `  ${t('email')}: ${enquiry.email}`]),
    `  ${t('mobile')}: ${enquiry.phone || '—'}`,
    `  ${t('dates')}: ${enquiry.dates || '—'}`,
    `  ${t('travellers')}: ${enquiry.travellers || '—'}`,
    `  ${t('vehicle')}: ${enquiry.vehicle || '—'}`,
    `  ${t('budget')}: ${enquiry.budget || '—'}`,
    ...(enquiry.message ? ['', upper(mine ? t('yourNote') : t('theirNote')), enquiry.message] : [])
  ].join('\n');
}

/**
 * The sheet the traveller takes away — a complete, self-contained HTML document
 * written for paper rather than for an inbox, which the browser's own print
 * dialogue saves as a PDF.
 *
 * There is no PDF library behind this on purpose. Every browser already carries
 * a competent PDF writer, and a printable document costs nothing to send, works
 * offline once saved, and keeps the itinerary as selectable text rather than an
 * image of it.
 */
export function renderItineraryPrintable(
  enquiry: Itinerary,
  copy: ItineraryCopy,
  printedOn = new Date()
) {
  const { journey } = enquiry;
  const { t, locale } = copy;
  const e = escapeHtml;

  const date = printedOn.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const stops = journey.stops
    .map((stop, index) => {
      const point = customPoint(stop.slug);
      const note = point
        ? `<small>${e(t('yourOwnStop'))} — ${point.latitude}, ${point.longitude}</small>`
        : '';
      return `<li><span class="n">${String(index + 1).padStart(2, '0')}</span><div><strong>${e(stop.name)}</strong>${note}</div></li>`;
    })
    .join('');

  const legs = journey.legs
    .map(
      (leg) =>
        `<tr><td>${e(leg.from)} <span class="arrow">→</span> ${e(leg.to)}</td><td class="r">${leg.km} km</td><td class="r">${formatDuration(leg.minutes)}</td></tr>`
    )
    .join('');

  /* Only the fields the traveller actually filled in are worth a row on paper. */
  const details = [
    [t('preparedFor'), enquiry.name],
    [t('mobile'), enquiry.phone],
    [t('email'), enquiry.email],
    [t('when'), enquiry.dates],
    [t('travellers'), enquiry.travellers],
    [t('vehicle'), enquiry.vehicle],
    [t('budget'), enquiry.budget]
  ]
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `<tr><th>${e(label)}</th><td>${e(value)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="${e(locale)}">
<head>
<meta charset="utf-8">
<title>${e(journey.title)} — ReiseCeylon</title>
<style>
  @page { size: A4; margin: 16mm 15mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 28px 26px;
    background: #f6f4ef; color: #1d2a24;
    font-family: Georgia, 'Times New Roman', serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e3ded2; padding: 40px 42px; }
  .eyebrow { margin: 0 0 6px; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: #8a8172; }
  h1 { margin: 0 0 6px; font-size: 30px; font-weight: 400; line-height: 1.2; }
  .lede { margin: 0 0 26px; font-size: 13px; color: #8a8172; }
  h2 {
    margin: 0 0 10px; font-size: 11px; font-weight: 700;
    letter-spacing: .16em; text-transform: uppercase; color: #8a8172;
  }
  section { margin-bottom: 26px; }
  .facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: #e3ded2; border: 1px solid #e3ded2; }
  .facts div { padding: 12px 14px; background: #fbfaf7; }
  .facts dt { margin: 0 0 3px; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: #8a8172; }
  .facts dd { margin: 0; font-size: 15px; }
  ol { margin: 0; padding: 0; list-style: none; }
  ol li { display: flex; gap: 14px; padding: 9px 0; border-bottom: 1px solid #efece4; page-break-inside: avoid; }
  ol li:last-child { border-bottom: 0; }
  .n { flex: 0 0 26px; color: #b9a468; font-size: 12px; letter-spacing: .06em; padding-top: 3px; }
  ol strong { display: block; font-size: 15.5px; font-weight: 400; }
  ol small { display: block; margin-top: 2px; font-size: 11px; color: #8a8172; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  table td, table th { padding: 8px 0; border-bottom: 1px solid #efece4; text-align: left; vertical-align: top; }
  table tr:last-child td, table tr:last-child th { border-bottom: 0; }
  th { width: 128px; font-weight: 400; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #8a8172; }
  .r { text-align: right; white-space: nowrap; color: #55605a; }
  .arrow { color: #b9a468; }
  .note { margin: 0; font-size: 14px; line-height: 1.75; white-space: pre-wrap; }
  footer {
    margin-top: 30px; padding-top: 14px; border-top: 1px solid #e3ded2;
    font-size: 10.5px; line-height: 1.7; color: #8a8172;
  }
  /* On screen this document exists only to be printed — the button says so. */
  .actions { max-width: 720px; margin: 0 auto 18px; text-align: right; }
  .actions button {
    padding: 11px 22px; border: 0; border-radius: 999px;
    background: #1d2a24; color: #f6f4ef; font-family: inherit; font-size: 13px; cursor: pointer;
  }
  @media print { .actions { display: none; } body { padding: 0; background: #fff; } .sheet { border: 0; padding: 0; max-width: none; } }
</style>
</head>
<body>
  <div class="actions"><button type="button" onclick="window.print()">${e(t('saveAsPdf'))}</button></div>
  <div class="sheet">
    <p class="eyebrow">${e(journey.kind === 'custom' ? t('designedJourney') : t('readyMadeJourney'))}</p>
    <h1>${e(journey.title)}</h1>
    <p class="lede">${e(
      enquiry.name ? t('preparedByFor', { name: enquiry.name }) : t('preparedBy')
    )} · ${e(date)}</p>

    <section>
      <dl class="facts">
        <div><dt>${e(t('stops'))}</dt><dd>${journey.stops.length}</dd></div>
        <div><dt>${e(t('roadDistance'))}</dt><dd>${journey.roadKm} km</dd></div>
        <div><dt>${e(t('timeOnRoad'))}</dt><dd>${formatDuration(journey.minutes)}</dd></div>
        <div><dt>${e(journey.declaredDays ? t('length') : t('suggestedLength'))}</dt><dd>${e(statedLength(journey, t))}</dd></div>
        <div><dt>${e(t('transfers'))}</dt><dd>${e(transfersLine(journey, t))}</dd></div>
        <div><dt>${e(t('travellers'))}</dt><dd>${e(enquiry.travellers) || '—'}</dd></div>
      </dl>
    </section>

    <section>
      <h2>${e(t('theRoute'))}</h2>
      <ol>${stops}</ol>
    </section>

    ${
      legs.length > 0
        ? `<section>
      <h2>${e(t('legByLeg'))}</h2>
      <table>${legs}</table>
    </section>`
        : ''
    }

    ${
      details.length > 0
        ? `<section>
      <h2>${e(t('yourDetails'))}</h2>
      <table>${details}</table>
    </section>`
        : ''
    }

    ${
      enquiry.message
        ? `<section>
      <h2>${e(t('yourNote'))}</h2>
      <p class="note">${e(enquiry.message)}</p>
    </section>`
        : ''
    }

    <footer>
      ${e(t('printFooter'))}<br>
      ReiseCeylon · journeys@reiseceylon.com · reiseceylon.com
    </footer>
  </div>
</body>
</html>`;
}

/** What the saved file is called, before the browser appends its own extension. */
export function itineraryFileName(journey: ItineraryJourney) {
  const slug = journey.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `reiseceylon-${slug || 'journey'}`;
}
