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
 */

import { useState } from 'react';
import { formatDuration, formatKm, type RouteTotals, type Waypoint } from '@/lib/journey';

/** Both optional — a traveller who has not thought about either can still send. */
export const VEHICLE_OPTIONS = [
  'No preference',
  'Car — up to 3 travellers',
  'Van — up to 6 travellers',
  'Minibus — 7 or more',
  '4x4 — for the parks and rough tracks',
  'Self-drive'
];

export const BUDGET_OPTIONS = [
  'Not sure yet',
  'Under $100 per person per day',
  '$100–200 per person per day',
  '$200–350 per person per day',
  '$350+ per person per day',
  'Tell me what this route costs'
];

export type EnquiryPayload = {
  name: string;
  email: string;
  dates: string;
  travellers: string;
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
    /** A ready-made journey's own stated length, which beats the estimate. */
    declaredDays?: string;
    /** Whether the route is quoted airport to airport. */
    airportTransfers: boolean;
    legs: Array<{ from: string; to: string; km: number; minutes: number }>;
  };
};

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
  const length = declaredDays ?? `about ${route.suggestedDays} ${route.suggestedDays === 1 ? 'day' : 'days'}`;

  const [status, setStatus] = useState<Status>('idle');
  const [sent, setSent] = useState<Sent>({ copySent: false });
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus('sending');
    setError('');

    const payload: EnquiryPayload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
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
      if (!response.ok) throw new Error(body.error || 'That did not send. Please try again.');

      setSent({ copySent: body.copySent === true });
      setStatus('sent');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'That did not send. Please try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rc-plan-enquiry rc-plan-enquiry-sent" role="status">
        <span>On its way</span>
        <h2>We have your journey.</h2>
        <p>
          {title} — {stops.length} {stops.length === 1 ? 'stop' : 'stops'}, {formatKm(route.roadKm)} of
          road.{sent.copySent ? ' A copy is on its way to your inbox.' : ''} A ReiseCeylon travel
          designer will write back within one working day.
        </p>
        <button type="button" onClick={onClose}>
          Back to planning
        </button>
      </div>
    );
  }

  return (
    <div className="rc-plan-enquiry">
      <header>
        <div>
          <span>Finalise</span>
          <h2>Send us this journey.</h2>
        </div>
        <button type="button" onClick={onClose} className="rc-plan-enquiry-close" aria-label="Close">
          ×
        </button>
      </header>

      <div className="rc-plan-enquiry-recap">
        <strong>{title}</strong>
        <p>
          {stops.length} {stops.length === 1 ? 'stop' : 'stops'} · {formatKm(route.roadKm)} ·{' '}
          {formatDuration(route.minutes)} driving · {length}
        </p>
        <p className="rc-plan-enquiry-stops">{stops.map((stop) => stop.name).join(' → ')}</p>
      </div>

      <form onSubmit={submit}>
        <label>
          Your name
          <input name="name" required placeholder="How should we address you?" />
        </label>
        <label>
          Email address
          <input name="email" type="email" required placeholder="you@example.com" />
        </label>
        <label>
          When are you thinking?
          <input name="dates" placeholder="Month or approximate dates" />
        </label>
        <label>
          Travellers
          <select name="travellers" defaultValue="2 travellers">
            <option>Solo traveller</option>
            <option>2 travellers</option>
            <option>3–5 travellers</option>
            <option>6+ travellers</option>
          </select>
        </label>
        <div className="rc-plan-enquiry-pair">
          <label>
            Vehicle <i>optional</i>
            <select name="vehicle" defaultValue={VEHICLE_OPTIONS[0]}>
              {VEHICLE_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Budget <i>optional</i>
            <select name="budget" defaultValue={BUDGET_OPTIONS[0]}>
              {BUDGET_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Anything to add?
          <textarea
            name="message"
            placeholder="Your pace, what you would change about this route, anything you would rather not miss..."
          />
        </label>

        {status === 'error' ? (
          <p className="rc-plan-enquiry-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send this journey ↗'}
        </button>
        <p className="rc-plan-enquiry-fineprint">
          We will email you a copy of this itinerary at the address above.
        </p>
      </form>
    </div>
  );
}
