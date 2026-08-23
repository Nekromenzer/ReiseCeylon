import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { defaultLocale, isLocale } from '@/i18n/routing';
import { CONTACT_EMAIL } from '@/lib/defaults';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const apiKey = process.env.RESEND_API_KEY ?? process.env.RESEND_API;
const configuredFrom = process.env.JOURNEY_ENQUIRY_FROM;
const from = configuredFrom && !/@resend\.dev>?$/i.test(configuredFrom.trim())
  ? configuredFrom
  : 'ReiseCeylon <enquiries@tours.reiseceylon.com>';
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

type ContactEnquiry = {
  locale: string;
  name: string;
  email: string;
  dates: string;
  interest: string;
  message: string;
};

function parse(body: unknown): ContactEnquiry | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Record<string, unknown>;
  if (String(raw.website ?? '').trim()) return null;

  const name = String(raw.name ?? '').trim();
  const email = String(raw.email ?? '').trim().toLowerCase();
  if (!name || name.length > 120 || !isEmail(email) || email.length > 200) return null;

  const requestedLocale = String(raw.locale ?? '');
  return {
    locale: isLocale(requestedLocale) ? requestedLocale : defaultLocale,
    name,
    email,
    dates: String(raw.dates ?? '').trim().slice(0, 200),
    interest: String(raw.interest ?? '').trim().slice(0, 200),
    message: String(raw.message ?? '').trim().slice(0, 4000)
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 400 });
  }

  const enquiry = parse(body);
  if (!enquiry) {
    const isBot = body && typeof body === 'object' && String((body as Record<string, unknown>).website ?? '').trim();
    if (isBot) {
      console.warn('[contact-enquiry] rejected because the honeypot field was filled');
      return NextResponse.json(
        { error: 'Do not send a value for the website field.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Please enter a valid name and email address.' }, { status: 400 });
  }

  if (!apiKey) {
    console.error('[contact-enquiry] Resend API key is missing');
    return NextResponse.json(
      { error: 'Email is temporarily unavailable. Please email us directly.' },
      { status: 503 }
    );
  }

  const to = CONTACT_EMAIL;

  const rows = [
    ['Name', enquiry.name],
    ['Email', enquiry.email],
    ['Dates', enquiry.dates || 'Not provided'],
    ['Interest', enquiry.interest || 'Not provided'],
    ['Language', enquiry.locale.toUpperCase()],
    ['Message', enquiry.message || 'Not provided']
  ];
  const html = rows.map(([label, value]) => (
    `<p><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value).replaceAll('\n', '<br>')}</p>`
  )).join('');
  const text = rows.map(([label, value]) => `${label}:\n${value}`).join('\n\n');

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo: enquiry.email,
      subject: `New ReiseCeylon contact enquiry — ${enquiry.name}`,
      html,
      text
    });

    if (error) {
      console.error('[contact-enquiry] email refused', { from, to, reason: error.message });
      return NextResponse.json({ error: 'That did not send. Please try again.' }, { status: 502 });
    }

    console.info('[contact-enquiry] email sent', { to, id: data?.id });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    console.error('[contact-enquiry] email failed', {
      from,
      to,
      reason: cause instanceof Error ? cause.message : String(cause)
    });
    return NextResponse.json({ error: 'That did not send. Please try again.' }, { status: 502 });
  }
}
