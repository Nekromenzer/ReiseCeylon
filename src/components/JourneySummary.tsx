'use client';

/**
 * The numbers under the map — what a route costs in distance, hours and days,
 * leg by leg, plus everything it passes on the way.
 *
 * Shared by both halves of the planner: a ready-made package and a route the
 * traveller dragged together are measured by exactly the same model, so the
 * figures are comparable between the two.
 */

import Link from 'next/link';
import {
  formatDuration,
  formatKm,
  terrainNote,
  type PlannerPlace,
  type RouteTotals,
  type Waypoint
} from '@/lib/journey';

export function JourneySummary({
  stops,
  route,
  nearby,
  declaredDays,
  onAdd
}: {
  stops: Waypoint[];
  route: RouteTotals;
  nearby: Array<{ place: PlannerPlace; km: number }>;
  /**
   * The length a ready-made journey states for itself. It wins over the model's
   * suggestion, which is only a guess at how many days a route needs — a day
   * trip we actually run is a day trip, whatever the driving budget says.
   */
  declaredDays?: string;
  onAdd?: (slug: string) => void;
}) {
  if (stops.length === 0) {
    return (
      <div className="rc-plan-summary rc-plan-summary-empty">
        <p>No stops yet.</p>
        <p>Add a place and the distance, drive time and route appear here.</p>
      </div>
    );
  }

  const driving = route.minutes / 60;

  return (
    <div className="rc-plan-summary">
      <dl className="rc-plan-stats">
        <div>
          <dt>Stops</dt>
          <dd>{stops.length}</dd>
        </div>
        <div>
          <dt>Road distance</dt>
          <dd>{formatKm(route.roadKm)}</dd>
        </div>
        <div>
          <dt>Time on the road</dt>
          <dd>{formatDuration(route.minutes)}</dd>
        </div>
        <div>
          <dt>{declaredDays ? 'Length' : 'Suggested length'}</dt>
          <dd>
            {declaredDays ?? `${route.suggestedDays} ${route.suggestedDays === 1 ? 'day' : 'days'}`}
          </dd>
        </div>
      </dl>

      <p className="rc-plan-estimate">
        Estimated from the road network, not a live traffic feed — {formatKm(route.roadKm)} at Sri
        Lankan touring speeds, about {formatDuration(route.minutes)} behind the wheel in total.
        {route.longestLeg && driving > 0 ? (
          <>
            {' '}
            The longest single drive is {route.longestLeg.from.name} to {route.longestLeg.to.name},{' '}
            {formatDuration(route.longestLeg.minutes)}.
          </>
        ) : null}
      </p>

      {route.legs.length > 0 ? (
        <div className="rc-plan-legs">
          <h3>Leg by leg</h3>
          <ol>
            {route.legs.map((leg, index) => (
              <li key={`${leg.from.slug}-${leg.to.slug}-${index}`}>
                <span className="rc-plan-leg-route">
                  <strong>{leg.from.name}</strong>
                  <i aria-hidden="true">→</i>
                  <strong>{leg.to.name}</strong>
                </span>
                <span className="rc-plan-leg-figures">
                  <b>{formatKm(leg.roadKm)}</b>
                  <b>{formatDuration(leg.minutes)}</b>
                </span>
                <span className="rc-plan-leg-terrain">{terrainNote(leg.highlandFraction)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="rc-plan-covered">
        <h3>What this journey covers</h3>
        <ol>
          {stops.map((stop, index) => (
            <li key={`${stop.slug}-${index}`}>
              <i aria-hidden="true">{index + 1}</i>
              {/* Neither an airport transfer nor a stop the traveller found
                  themselves has a destination page to link to. */}
              {stop.transfer ? (
                <span>
                  {stop.name} <em className="rc-plan-own rc-plan-transfer-tag">transfer</em>
                </span>
              ) : stop.custom ? (
                <span>
                  {stop.name} <em className="rc-plan-own">your own stop</em>
                </span>
              ) : (
                <Link href={`/destinations/${stop.slug}`}>{stop.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </div>

      {nearby.length > 0 ? (
        <div className="rc-plan-nearby">
          <h3>Also on this road</h3>
          <p>Places the route already passes close to.</p>
          <ul>
            {nearby.map(({ place, km }) => (
              <li key={place.slug}>
                <span>
                  <strong>{place.name}</strong>
                  <small>
                    {place.category} · {formatKm(km)} off the route
                  </small>
                </span>
                {onAdd ? (
                  <button type="button" onClick={() => onAdd(place.slug)} aria-label={`Add ${place.name} to your journey`}>
                    Add
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
