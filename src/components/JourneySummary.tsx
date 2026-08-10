'use client';

/**
 * The numbers under the map — what a route costs in distance, hours and days,
 * leg by leg, plus everything it passes on the way.
 *
 * Shared by both halves of the planner: a ready-made package and a route the
 * traveller dragged together are measured by exactly the same model, so the
 * figures are comparable between the two.
 */

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
  const t = useTranslations('summary');
  const terrain = useTranslations('journey');

  if (stops.length === 0) {
    return (
      <div className="rc-plan-summary rc-plan-summary-empty">
        <p>{t('emptyTitle')}</p>
        <p>{t('emptyCopy')}</p>
      </div>
    );
  }

  const driving = route.minutes / 60;

  return (
    <div className="rc-plan-summary">
      <dl className="rc-plan-stats">
        <div>
          <dt>{t('stops')}</dt>
          <dd>{stops.length}</dd>
        </div>
        <div>
          <dt>{t('roadDistance')}</dt>
          <dd>{formatKm(route.roadKm)}</dd>
        </div>
        <div>
          <dt>{t('timeOnRoad')}</dt>
          <dd>{formatDuration(route.minutes)}</dd>
        </div>
        <div>
          <dt>{declaredDays ? t('length') : t('suggestedLength')}</dt>
          <dd>{declaredDays ?? t('days', { count: route.suggestedDays })}</dd>
        </div>
      </dl>

      <p className="rc-plan-estimate">
        {t('estimate', {
          km: formatKm(route.roadKm),
          duration: formatDuration(route.minutes)
        })}
        {route.longestLeg && driving > 0 ? (
          <>
            {' '}
            {t('longestLeg', {
              from: route.longestLeg.from.name,
              to: route.longestLeg.to.name,
              duration: formatDuration(route.longestLeg.minutes)
            })}
          </>
        ) : null}
      </p>

      {route.legs.length > 0 ? (
        <div className="rc-plan-legs">
          <h3>{t('legByLeg')}</h3>
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
                <span className="rc-plan-leg-terrain">{terrain(terrainNote(leg.highlandFraction))}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="rc-plan-covered">
        <h3>{t('covers')}</h3>
        <ol>
          {stops.map((stop, index) => (
            <li key={`${stop.slug}-${index}`}>
              <i aria-hidden="true">{index + 1}</i>
              {/* Neither an airport transfer nor a stop the traveller found
                  themselves has a destination page to link to. */}
              {stop.transfer ? (
                <span>
                  {stop.name} <em className="rc-plan-own rc-plan-transfer-tag">{t('transferTag')}</em>
                </span>
              ) : stop.custom ? (
                <span>
                  {stop.name} <em className="rc-plan-own">{t('ownStop')}</em>
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
          <h3>{t('alsoOnRoad')}</h3>
          <p>{t('alsoOnRoadCopy')}</p>
          <ul>
            {nearby.map(({ place, km }) => (
              <li key={place.slug}>
                <span>
                  <strong>{place.name}</strong>
                  <small>
                    {place.category} · {t('offRoute', { km: formatKm(km) })}
                  </small>
                </span>
                {onAdd ? (
                  <button
                    type="button"
                    onClick={() => onAdd(place.slug)}
                    aria-label={t('addAria', { name: place.name })}
                  >
                    {t('add')}
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
