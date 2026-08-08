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
function statedLength(journey: ItineraryJourney) {
  if (journey.declaredDays) return journey.declaredDays;
  return `${journey.suggestedDays} ${journey.suggestedDays === 1 ? 'day' : 'days'}`;
}

function transfersLine(journey: ItineraryJourney) {
  return journey.airportTransfers ? 'Airport pickup and drop-off (CMB)' : 'None — own start and end';
}

type Audience = { forTraveller?: boolean };

export function renderItineraryEmailHtml(enquiry: Itinerary, audience: Audience = {}) {
  const { journey } = enquiry;
  const e = escapeHtml;
  const mine = audience.forTraveller === true;

  const stops = journey.stops
    .map((stop, index) => {
      const point = customPoint(stop.slug);
      const note = point
        ? ` <a href="https://www.google.com/maps/search/?api=1&amp;query=${point.latitude},${point.longitude}"
             style="color:#8a8172;font-size:12px">their own stop — ${point.latitude}, ${point.longitude}</a>`
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
<html><body style="margin:0;padding:24px;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#1d2a24">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e3ded2;padding:32px">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8a8172">
      ${mine ? 'Your journey' : journey.kind === 'custom' ? 'Custom journey' : 'Ready-made journey'}
    </p>
    <h1 style="margin:0 0 ${mine ? '14' : '20'}px;font-size:26px;font-weight:400">${e(journey.title)}</h1>
    ${
      mine
        ? `<p style="margin:0 0 22px;font-size:15px;line-height:1.7">Thank you, ${e(enquiry.name.split(' ')[0])} — here is the journey you put together, exactly as you left it. One of our travel designers is reading it now and will write back within one working day.</p>`
        : ''
    }

    <table width="100%" style="border-collapse:collapse;margin:0 0 24px;font-size:14px">
      <tr><td style="padding:6px 0;color:#8a8172">Stops</td><td align="right">${journey.stops.length}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">Road distance</td><td align="right">${journey.roadKm} km</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">Time on the road</td><td align="right">${formatDuration(journey.minutes)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">${journey.declaredDays ? 'Length' : 'Suggested length'}</td><td align="right">${e(statedLength(journey))}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">Transfers</td><td align="right">${transfersLine(journey)}</td></tr>
    </table>

    <h2 style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a8172;margin:0 0 8px">The route</h2>
    <ol style="margin:0 0 24px;padding:0 0 0 4px;list-style:none;font-size:15px;line-height:1.9">${stops}</ol>

    ${
      legs.length > 0
        ? `<h2 style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a8172;margin:0 0 8px">Leg by leg</h2>
    <table width="100%" style="border-collapse:collapse;margin:0 0 24px;font-size:13px">${legs}</table>`
        : ''
    }

    <h2 style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a8172;margin:0 0 8px">${mine ? 'What you told us' : 'The traveller'}</h2>
    <table width="100%" style="border-collapse:collapse;font-size:14px">
      ${
        mine
          ? ''
          : `<tr><td style="padding:6px 0;color:#8a8172;width:130px">Name</td><td>${e(enquiry.name)}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">Email</td><td><a href="mailto:${e(enquiry.email)}">${e(enquiry.email)}</a></td></tr>`
      }
      <tr><td style="padding:6px 0;color:#8a8172;width:130px">Mobile</td><td>${
        enquiry.phone
          ? `<a href="tel:${e(enquiry.phone.replace(/[^\d+]/g, ''))}">${e(enquiry.phone)}</a>`
          : '—'
      }</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">Dates</td><td>${e(enquiry.dates) || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">Travellers</td><td>${e(enquiry.travellers) || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">Vehicle</td><td>${e(enquiry.vehicle) || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">Budget</td><td>${e(enquiry.budget) || '—'}</td></tr>
    </table>

    ${
      enquiry.message
        ? `<h2 style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a8172;margin:24px 0 8px">${mine ? 'Your note' : 'Their note'}</h2>
    <p style="margin:0;font-size:15px;line-height:1.7;white-space:pre-wrap">${e(enquiry.message)}</p>`
        : ''
    }

    <p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e3ded2;font-size:12px;color:#8a8172">
      ${
        mine
          ? 'Distances and drive times are estimates for a private vehicle at Sri Lankan touring speeds. Your travel designer will confirm the real timings. Simply reply to this email to change anything.'
          : "Sent from the journey planner at /journeys. Distances and drive times are the planner's estimates, not a routing service."
      }
    </p>
  </div>
</body></html>`;
}

/** The same content as text, for clients that will not render the HTML part. */
export function renderItineraryEmailText(enquiry: Itinerary, audience: Audience = {}) {
  const { journey } = enquiry;
  const mine = audience.forTraveller === true;
  return [
    `${mine ? 'YOUR JOURNEY' : journey.kind === 'custom' ? 'CUSTOM JOURNEY' : 'READY-MADE JOURNEY'}: ${journey.title}`,
    ...(mine
      ? ['', `Thank you, ${enquiry.name.split(' ')[0]} — here is the journey you put together. A travel designer will write back within one working day.`]
      : []),
    '',
    `Stops: ${journey.stops.length}`,
    `Road distance: ${journey.roadKm} km`,
    `Time on the road: ${formatDuration(journey.minutes)}`,
    journey.declaredDays ? `Length: ${journey.declaredDays}` : `Suggested length: ${statedLength(journey)}`,
    `Transfers: ${transfersLine(journey)}`,
    '',
    'THE ROUTE',
    ...journey.stops.map((stop, index) => {
      const point = customPoint(stop.slug);
      return `  ${index + 1}. ${stop.name}${point ? ` (their own stop — ${point.latitude}, ${point.longitude})` : ''}`;
    }),
    '',
    ...(journey.legs.length > 0
      ? [
          'LEG BY LEG',
          ...journey.legs.map(
            (leg) => `  ${leg.from} -> ${leg.to}: ${leg.km} km, ${formatDuration(leg.minutes)}`
          ),
          ''
        ]
      : []),
    mine ? 'WHAT YOU TOLD US' : 'THE TRAVELLER',
    ...(mine ? [] : [`  Name: ${enquiry.name}`, `  Email: ${enquiry.email}`]),
    `  Mobile: ${enquiry.phone || '—'}`,
    `  Dates: ${enquiry.dates || '—'}`,
    `  Travellers: ${enquiry.travellers || '—'}`,
    `  Vehicle: ${enquiry.vehicle || '—'}`,
    `  Budget: ${enquiry.budget || '—'}`,
    ...(enquiry.message ? ['', mine ? 'YOUR NOTE' : 'THEIR NOTE', enquiry.message] : [])
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
export function renderItineraryPrintable(enquiry: Itinerary, printedOn = new Date()) {
  const { journey } = enquiry;
  const e = escapeHtml;

  const date = printedOn.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const stops = journey.stops
    .map((stop, index) => {
      const point = customPoint(stop.slug);
      const note = point
        ? `<small>Your own stop — ${point.latitude}, ${point.longitude}</small>`
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
    ['Prepared for', enquiry.name],
    ['Mobile', enquiry.phone],
    ['Email', enquiry.email],
    ['When', enquiry.dates],
    ['Travellers', enquiry.travellers],
    ['Vehicle', enquiry.vehicle],
    ['Budget', enquiry.budget]
  ]
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `<tr><th>${e(label)}</th><td>${e(value)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="en">
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
  <div class="actions"><button type="button" onclick="window.print()">Save as PDF</button></div>
  <div class="sheet">
    <p class="eyebrow">${journey.kind === 'custom' ? 'A journey you designed' : 'Ready-made journey'}</p>
    <h1>${e(journey.title)}</h1>
    <p class="lede">Prepared by ReiseCeylon${enquiry.name ? ` for ${e(enquiry.name)}` : ''} · ${e(date)}</p>

    <section>
      <dl class="facts">
        <div><dt>Stops</dt><dd>${journey.stops.length}</dd></div>
        <div><dt>Road distance</dt><dd>${journey.roadKm} km</dd></div>
        <div><dt>Time on the road</dt><dd>${formatDuration(journey.minutes)}</dd></div>
        <div><dt>${journey.declaredDays ? 'Length' : 'Suggested length'}</dt><dd>${e(statedLength(journey))}</dd></div>
        <div><dt>Transfers</dt><dd>${transfersLine(journey)}</dd></div>
        <div><dt>Travellers</dt><dd>${e(enquiry.travellers) || '—'}</dd></div>
      </dl>
    </section>

    <section>
      <h2>The route</h2>
      <ol>${stops}</ol>
    </section>

    ${
      legs.length > 0
        ? `<section>
      <h2>Leg by leg</h2>
      <table>${legs}</table>
    </section>`
        : ''
    }

    ${
      details.length > 0
        ? `<section>
      <h2>Your details</h2>
      <table>${details}</table>
    </section>`
        : ''
    }

    ${
      enquiry.message
        ? `<section>
      <h2>Your note</h2>
      <p class="note">${e(enquiry.message)}</p>
    </section>`
        : ''
    }

    <footer>
      Distances and drive times are estimates for a private vehicle at Sri Lankan touring speeds, not a
      routing service — your travel designer will confirm the real timings.<br>
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
