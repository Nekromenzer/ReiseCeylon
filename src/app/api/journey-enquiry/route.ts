/**
 * The finished journey, delivered by email.
 *
 * Posted by JourneyEnquiryForm with the itinerary the traveller was looking at
 * — stops, legs and totals included — so the email is a record of the plan as
 * it appeared on screen rather than something re-derived here from a slug a
 * custom journey would not have.
 *
 * Two addresses matter:
 *   JOURNEY_ENQUIRY_TO    where enquiries land. Falls back to the contact email
 *                         in the studio, which is where the rest of the site
 *                         already points.
 *   JOURNEY_ENQUIRY_FROM  the sender. Resend will only accept a domain you have
 *                         verified with them; until one is verified their
 *                         onboarding@resend.dev sender works and delivers to the
 *                         address that owns the Resend account.
 *
 * The traveller's own address is set as reply-to, so answering the email
 * answers them.
 */
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getContactDetails } from '@/sanity/site';

/** `RESEND_API` is what this project's .env uses; the conventional name works too. */
const apiKey = process.env.RESEND_API_KEY ?? process.env.RESEND_API;
const from = process.env.JOURNEY_ENQUIRY_FROM ?? 'ReiseCeylon <onboarding@resend.dev>';

type Leg = { from: string; to: string; km: number; minutes: number };

type Enquiry = {
  name: string;
  email: string;
  dates: string;
  travellers: string;
  /** Both optional on the form; empty means the traveller skipped them. */
  vehicle: string;
  budget: string;
  message: string;
  journey: {
    kind: 'package' | 'custom';
    title: string;
    stops: Array<{ name: string; slug: string }>;
    roadKm: number;
    minutes: number;
    suggestedDays: number;
    /** A ready-made journey's own stated length; absent on a custom route. */
    declaredDays: string;
    /** Whether the route is quoted airport to airport. */
    airportTransfers: boolean;
    legs: Leg[];
  };
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Everything in the email is traveller-supplied, so every value is escaped
 * before it reaches the HTML — a name with an angle bracket in it must not be
 * able to write markup into our own inbox.
 */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(minutes: number) {
  const total = Math.round(minutes);
  if (total <= 0) return '—';
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** Validates the shape rather than trusting it — this is a public endpoint. */
function parse(body: unknown): Enquiry | null {
  if (typeof body !== 'object' || body === null) return null;
  const raw = body as Record<string, unknown>;
  const journey = raw.journey as Record<string, unknown> | undefined;

  const name = String(raw.name ?? '').trim();
  const email = String(raw.email ?? '').trim();
  if (name.length === 0 || name.length > 120) return null;
  if (!isEmail(email) || email.length > 200) return null;
  if (!journey || !Array.isArray(journey.stops) || journey.stops.length === 0) return null;

  const stops = journey.stops
    .slice(0, 60)
    .map((stop) => {
      const entry = stop as Record<string, unknown>;
      return { name: String(entry.name ?? '').slice(0, 120), slug: String(entry.slug ?? '').slice(0, 120) };
    })
    .filter((stop) => stop.name.length > 0);

  if (stops.length === 0) return null;

  const legs = (Array.isArray(journey.legs) ? journey.legs : []).slice(0, 60).map((leg) => {
    const entry = leg as Record<string, unknown>;
    return {
      from: String(entry.from ?? '').slice(0, 120),
      to: String(entry.to ?? '').slice(0, 120),
      km: Number(entry.km) || 0,
      minutes: Number(entry.minutes) || 0
    };
  });

  return {
    name,
    email,
    dates: String(raw.dates ?? '').slice(0, 200),
    travellers: String(raw.travellers ?? '').slice(0, 60),
    vehicle: String(raw.vehicle ?? '').slice(0, 80),
    budget: String(raw.budget ?? '').slice(0, 80),
    message: String(raw.message ?? '').slice(0, 4000),
    journey: {
      kind: journey.kind === 'custom' ? 'custom' : 'package',
      title: String(journey.title ?? 'A journey').slice(0, 200),
      stops,
      roadKm: Number(journey.roadKm) || 0,
      minutes: Number(journey.minutes) || 0,
      suggestedDays: Number(journey.suggestedDays) || 0,
      declaredDays: String(journey.declaredDays ?? '').slice(0, 60),
      airportTransfers: journey.airportTransfers === true,
      legs
    }
  };
}

/**
 * A stop the traveller found themselves carries its coordinates in its slug and
 * nothing in our atlas — so the email prints the point, and a map link, rather
 * than leaving the designer to guess which of four villages of that name it is.
 */
const CUSTOM_PREFIX = 'custom:';

function customPoint(slug: string) {
  if (!slug.startsWith(CUSTOM_PREFIX)) return null;
  const [latitude, longitude] = slug.slice(CUSTOM_PREFIX.length).split(',').map(Number);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

type Audience = { forTraveller?: boolean };

function renderHtml(enquiry: Enquiry, audience: Audience = {}) {
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
      <tr><td style="padding:6px 0;color:#8a8172">${journey.declaredDays ? 'Length' : 'Suggested length'}</td><td align="right">${journey.declaredDays ? e(journey.declaredDays) : `${journey.suggestedDays} ${journey.suggestedDays === 1 ? 'day' : 'days'}`}</td></tr>
      <tr><td style="padding:6px 0;color:#8a8172">Transfers</td><td align="right">${journey.airportTransfers ? 'Airport pickup and drop-off (CMB)' : 'None — own start and end'}</td></tr>
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
      <tr><td style="padding:6px 0;color:#8a8172;width:130px">Dates</td><td>${e(enquiry.dates) || '—'}</td></tr>
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
function renderText(enquiry: Enquiry, audience: Audience = {}) {
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
    journey.declaredDays
      ? `Length: ${journey.declaredDays}`
      : `Suggested length: ${journey.suggestedDays} day(s)`,
    `Transfers: ${journey.airportTransfers ? 'Airport pickup and drop-off (CMB)' : 'None — own start and end'}`,
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
    `  Dates: ${enquiry.dates || '—'}`,
    `  Travellers: ${enquiry.travellers || '—'}`,
    `  Vehicle: ${enquiry.vehicle || '—'}`,
    `  Budget: ${enquiry.budget || '—'}`,
    ...(enquiry.message ? ['', mine ? 'YOUR NOTE' : 'THEIR NOTE', enquiry.message] : [])
  ].join('\n');
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const enquiry = parse(body);
  if (!enquiry) {
    return NextResponse.json(
      { error: 'Please check your name, email address and that the journey has at least one stop.' },
      { status: 400 }
    );
  }

  if (!apiKey) {
    console.error('[journey-enquiry] RESEND_API_KEY is not set — enquiry not sent', {
      from: enquiry.email,
      stops: enquiry.journey.stops.length
    });
    return NextResponse.json(
      { error: 'Email is not configured on this site yet. Please write to us directly.' },
      { status: 503 }
    );
  }

  const contact = await getContactDetails();
  const to = process.env.JOURNEY_ENQUIRY_TO ?? contact.email;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: enquiry.email,
      subject: `${enquiry.journey.kind === 'custom' ? 'Custom journey' : 'Journey'} — ${enquiry.journey.title} (${enquiry.name})`,
      html: renderHtml(enquiry),
      text: renderText(enquiry)
    });

    if (error) {
      console.error('[journey-enquiry] resend rejected the message', error);
      return NextResponse.json({ error: 'That did not send. Please try again.' }, { status: 502 });
    }

    /*
     * The traveller's own copy. Deliberately after the enquiry and deliberately
     * not awaited into the result: their itinerary reaching us is the thing that
     * matters, and a bounced copy must not tell them the whole send failed.
     *
     * Until a domain is verified with Resend this one will fail every time — a
     * test-mode key may only deliver to the account owner — which is exactly why
     * it is isolated.
     */
    const copy = await resend.emails
      .send({
        from,
        to: enquiry.email,
        replyTo: to,
        subject: `Your Sri Lanka journey — ${enquiry.journey.title}`,
        html: renderHtml(enquiry, { forTraveller: true }),
        text: renderText(enquiry, { forTraveller: true })
      })
      .catch((cause) => ({ error: cause }));

    if (copy.error) {
      console.error('[journey-enquiry] traveller copy not delivered', copy.error);
      return NextResponse.json({ ok: true, copySent: false });
    }

    return NextResponse.json({ ok: true, copySent: true });
  } catch (cause) {
    console.error('[journey-enquiry] send failed', cause);
    return NextResponse.json({ error: 'That did not send. Please try again.' }, { status: 502 });
  }
}
