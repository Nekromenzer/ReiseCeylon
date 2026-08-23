/**
 * The finished journey, delivered by email.
 *
 * Posted by JourneyEnquiryForm with the itinerary the traveller was looking at
 * — stops, legs and totals included — so the email is a record of the plan as
 * it appeared on screen rather than something re-derived here from a slug a
 * custom journey would not have.
 *
 * The documents themselves are rendered by `@/lib/itinerary`, which the form
 * also uses for the printable copy the traveller downloads. Only the sending
 * lives here.
 *
 * Two addresses matter:
 *   All ReiseCeylon copies go to the canonical contact inbox in defaults.ts.
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
import { getTranslations } from 'next-intl/server';
import { defaultLocale, isLocale } from '@/i18n/routing';
import { CONTACT_EMAIL } from '@/lib/defaults';
import {
  renderItineraryEmailHtml,
  renderItineraryEmailText,
  type Itinerary,
  type ItineraryCopy,
  type ItineraryLeg
} from '@/lib/itinerary';

/** `RESEND_API` is what this project's .env uses; the conventional name works too. */
const apiKey = process.env.RESEND_API_KEY ?? process.env.RESEND_API;
const configuredFrom = process.env.JOURNEY_ENQUIRY_FROM;
const from = configuredFrom && !/@resend\.dev>?$/i.test(configuredFrom.trim())
  ? configuredFrom
  : 'ReiseCeylon <enquiries@tours.reiseceylon.com>';

/**
 * Node, not edge — the Resend SDK is a Node client, and an edge deployment would
 * fail every send with an opaque runtime error rather than the API's own message.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * A dialling code and enough digits to be a real number. Deliberately loose —
 * national formats vary far more than any regex worth maintaining here, and a
 * traveller whose valid number is refused simply leaves.
 */
const isPhone = (value: string) => /^\+\d[\d\s().-]{5,24}$/.test(value);

/** Validates the shape rather than trusting it — this is a public endpoint. */
function parse(body: unknown): Itinerary | null {
  if (typeof body !== 'object' || body === null) return null;
  const raw = body as Record<string, unknown>;
  const journey = raw.journey as Record<string, unknown> | undefined;

  const name = String(raw.name ?? '').trim();
  const email = String(raw.email ?? '').trim();
  const phone = String(raw.phone ?? '').trim();
  if (name.length === 0 || name.length > 120) return null;
  if (!isEmail(email) || email.length > 200) return null;
  if (!isPhone(phone)) return null;
  if (!journey || !Array.isArray(journey.stops) || journey.stops.length === 0) return null;

  const stops = journey.stops
    .slice(0, 60)
    .map((stop) => {
      const entry = stop as Record<string, unknown>;
      return { name: String(entry.name ?? '').slice(0, 120), slug: String(entry.slug ?? '').slice(0, 120) };
    })
    .filter((stop) => stop.name.length > 0);

  if (stops.length === 0) return null;

  const legs: ItineraryLeg[] = (Array.isArray(journey.legs) ? journey.legs : []).slice(0, 60).map((leg) => {
    const entry = leg as Record<string, unknown>;
    return {
      from: String(entry.from ?? '').slice(0, 120),
      to: String(entry.to ?? '').slice(0, 120),
      km: Number(entry.km) || 0,
      minutes: Number(entry.minutes) || 0
    };
  });

  /* Unknown or absent languages fall back rather than being rejected — the
     itinerary matters more than the language tag that came with it. */
  const requested = String(raw.locale ?? '');

  return {
    locale: isLocale(requested) ? requested : defaultLocale,
    name,
    email,
    phone: phone.slice(0, 32),
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
 * Resend's own failures, translated into something the server log can be read
 * for. The two that actually happen in this project:
 *
 *   restricted   the shared onboarding@resend.dev sender only ever delivers to
 *                the address that owns the Resend account. Every other recipient
 *                — including the traveller — is refused until a domain is
 *                verified at resend.com/domains and JOURNEY_ENQUIRY_FROM points
 *                at it.
 *   unverified   JOURNEY_ENQUIRY_FROM names a domain Resend does not hold.
 */
function describeSendFailure(error: unknown) {
  const message = String((error as { message?: unknown })?.message ?? error ?? '');
  if (/only send testing emails|your own email address/i.test(message)) {
    return `${message} — verify a domain at resend.com/domains and set JOURNEY_ENQUIRY_FROM to an address on it.`;
  }
  if (/domain is not verified|not verified/i.test(message)) {
    return `${message} — JOURNEY_ENQUIRY_FROM is "${from}", which Resend will not send as.`;
  }
  return message || 'Resend returned no reason.';
}

/**
 * One send, which never throws. Each recipient's fate is decided on its own:
 * previously an admin failure returned early and the traveller's copy was never
 * attempted, so a single misconfiguration silently cost both emails.
 */
async function send(
  resend: Resend,
  label: 'admin' | 'traveller',
  payload: Parameters<Resend['emails']['send']>[0]
) {
  try {
    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.error(`[journey-enquiry] ${label} email refused`, {
        to: payload.to,
        from: payload.from,
        reason: describeSendFailure(error)
      });
      return false;
    }
    console.info(`[journey-enquiry] ${label} email sent`, { to: payload.to, id: data?.id });
    return true;
  } catch (cause) {
    console.error(`[journey-enquiry] ${label} email failed`, {
      to: payload.to,
      from: payload.from,
      reason: describeSendFailure(cause)
    });
    return false;
  }
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
      {
        error:
          'Please check your name, email address, mobile number and that the journey has at least one stop.'
      },
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

  const to = CONTACT_EMAIL;

  const resend = new Resend(apiKey);

  /*
   * Two languages, deliberately. The traveller is answered in the language they
   * planned in; the copy that lands in the ReiseCeylon inbox stays English, so
   * whoever reads enquiries reads them all in one language.
   */
  const [travellerT, internalT] = await Promise.all([
    getTranslations({ locale: enquiry.locale, namespace: 'itinerary' }),
    getTranslations({ locale: defaultLocale, namespace: 'itinerary' })
  ]);

  const travellerCopy: ItineraryCopy = {
    t: (key, values) => travellerT(key, values),
    locale: enquiry.locale
  };
  const internalCopy: ItineraryCopy = {
    t: (key, values) => internalT(key, values),
    locale: defaultLocale
  };

  /*
   * Both sends are attempted, always, and neither can cancel the other. The
   * enquiry reaching ReiseCeylon is what decides the response — a traveller's
   * copy that bounces must not tell them their journey was lost — but a refused
   * enquiry no longer swallows their copy either.
   */
  const [adminSent, copySent] = await Promise.all([
    send(resend, 'admin', {
      from,
      to,
      replyTo: enquiry.email,
      subject: `${internalT('emailSubjectInternal', { title: enquiry.journey.title })} (${enquiry.name}) [${enquiry.locale.toUpperCase()}]`,
      html: renderItineraryEmailHtml(enquiry, internalCopy),
      text: renderItineraryEmailText(enquiry, internalCopy)
    }),
    send(resend, 'traveller', {
      from,
      to: enquiry.email,
      replyTo: to,
      subject: travellerT('emailSubjectTraveller', { title: enquiry.journey.title }),
      html: renderItineraryEmailHtml(enquiry, travellerCopy, { forTraveller: true }),
      text: renderItineraryEmailText(enquiry, travellerCopy, { forTraveller: true })
    })
  ]);

  if (!adminSent) {
    /*
     * The itinerary did not reach us. The traveller is told plainly rather than
     * shown a success screen for an enquiry nobody will ever read — the reason
     * is in the server log, addressed to whoever holds the Resend account.
     */
    return NextResponse.json({ error: 'That did not send. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, copySent });
}
