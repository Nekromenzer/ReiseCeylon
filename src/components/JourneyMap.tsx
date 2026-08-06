'use client';

/**
 * The route, on a real map.
 *
 * Leaflet over OpenStreetMap tiles — pannable, zoomable and keyless, so there is
 * no billing account behind any of it. Loaded through a client-only dynamic
 * import from JourneyPlanner, because Leaflet reaches for `window` the moment it
 * is imported and would break server rendering.
 *
 * Two things are drawn on top of the tiles:
 *
 *   - the route, as a polyline through the stops in order, doubled up so a pale
 *     casing sits under a gold line and stays legible over any tile colour,
 *   - a numbered pin per stop, built with `divIcon` rather than Leaflet's default
 *     marker image, which lets the pins carry the brand's type and gold and
 *     avoids the well-known broken-icon-path problem under a bundler.
 *
 * The view follows the route: whenever the stop list changes the map refits its
 * bounds, so adding a place at the far end of the island brings it into frame
 * without the traveller having to hunt for it.
 */

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Waypoint } from '@/lib/journey';
import 'leaflet/dist/leaflet.css';

/** The whole island, for when there is no route to frame yet. */
const SRI_LANKA_BOUNDS: L.LatLngBoundsExpression = [
  [5.85, 79.5],
  [9.9, 81.95]
];

const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Teal for a stop the traveller found, forest for an airport transfer, gold for the atlas. */
function pinIcon(index: number, active: boolean, stop: Waypoint) {
  const classes = [
    'rc-map-pin',
    active ? 'is-active' : '',
    stop.transfer ? 'is-transfer' : stop.custom ? 'is-custom' : ''
  ].filter(Boolean);
  return L.divIcon({
    className: 'rc-map-pin-wrap',
    html: `<span class="${classes.join(' ')}"><i>${index + 1}</i></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16]
  });
}

/**
 * Keeps the viewport on the route. A single stop gets a fixed zoom — bounds of
 * one point have no extent to fit — and an empty route falls back to the island.
 */
function FitToRoute({ stops, fitSignal }: { stops: Waypoint[]; fitSignal?: string }) {
  const map = useMap();

  /* The signature, not the array: a re-render with the same stops must not move
     a map the traveller has just panned somewhere by hand. `fitSignal` is the
     deliberate exception — expanding the map is a request for more of the route,
     so it reframes. */
  const signature = `${stops.map((stop) => stop.slug).join('|')}::${fitSignal ?? ''}`;

  useEffect(() => {
    if (stops.length === 0) {
      map.fitBounds(SRI_LANKA_BOUNDS, { padding: [24, 24] });
      return;
    }

    if (stops.length === 1) {
      map.setView([stops[0].latitude, stops[0].longitude], 11, { animate: true });
      return;
    }

    map.fitBounds(
      stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]),
      { padding: [48, 48], maxZoom: 12, animate: true }
    );
    /* signature stands in for stops — see above. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);

  return null;
}

/**
 * Leaflet measures its container once and then trusts that measurement forever.
 * Anything that changes the container's size behind its back — a tab revealing
 * it, the pane expanding to fill the screen — leaves it rendering tiles for the
 * old box, with grey where the new space is.
 *
 * A ResizeObserver covers every one of those cases without any of them having to
 * announce itself, and the work is coalesced into an animation frame so a CSS
 * transition resizing the container does not queue one call per frame.
 */
function KeepSized() {
  const map = useMap();

  useEffect(() => {
    let frame = 0;
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    };

    const observer = new ResizeObserver(resize);
    observer.observe(map.getContainer());
    resize();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [map]);

  return null;
}

export default function JourneyMap({
  stops,
  activeSlug,
  fitSignal,
  onSelect
}: {
  stops: Waypoint[];
  activeSlug?: string | null;
  /** Changing this reframes the route — see FitToRoute. */
  fitSignal?: string;
  onSelect?: (slug: string) => void;
}) {
  const line = useMemo(
    () => stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]),
    [stops]
  );

  return (
    <MapContainer
      className="rc-journey-map"
      bounds={SRI_LANKA_BOUNDS}
      scrollWheelZoom={false}
      /* The page scrolls past this map; a wheel over it should scroll the page,
         not zoom. Ctrl/⌘ + wheel still zooms, which is what Leaflet prints. */
      zoomControl
      attributionControl
    >
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={18} />

      {line.length > 1 ? (
        <>
          <Polyline positions={line} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.75 }} />
          <Polyline
            positions={line}
            pathOptions={{ color: '#c49a3a', weight: 3.5, opacity: 1, dashArray: '1 9', lineCap: 'round' }}
          />
        </>
      ) : null}

      {stops.map((stop, index) => (
        <Marker
          key={`${stop.slug}-${index}`}
          position={[stop.latitude, stop.longitude]}
          icon={pinIcon(index, stop.slug === activeSlug, stop)}
          eventHandlers={onSelect ? { click: () => onSelect(stop.slug) } : undefined}
        >
          <Popup>
            <strong>{stop.name}</strong>
            <br />
            Stop {index + 1} of {stops.length}
            {stop.transfer ? (
              <>
                <br />
                <em>Airport transfer</em>
              </>
            ) : stop.custom ? (
              <>
                <br />
                <em>Your own stop</em>
              </>
            ) : null}
          </Popup>
        </Marker>
      ))}

      <FitToRoute stops={stops} fitSignal={fitSignal} />
      <KeepSized />
    </MapContainer>
  );
}
