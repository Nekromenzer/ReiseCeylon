/**
 * Finding a place the atlas does not have.
 *
 * The 174 atlas places are the ones we write about. A traveller planning their
 * own route will want stops we have never published — the town they are staying
 * in, an airport, a relative's village — so this looks those up in
 * OpenStreetMap through Nominatim, the same project the map tiles come from.
 * Keyless, like the rest of the mapping here.
 *
 * It is proxied rather than called from the browser for three reasons, all of
 * them Nominatim's usage policy: the request needs a genuine User-Agent
 * identifying the application, results should be cached rather than re-fetched,
 * and the call volume has to stay modest. Going through the server gives us all
 * three, and keeps the traveller's IP out of it.
 *
 * Results are restricted to Sri Lanka. This plans Sri Lankan journeys, and an
 * unbounded search would return a Kandy in half a dozen other countries.
 */
import { NextResponse } from 'next/server';
import { CONTACT_EMAIL } from '@/lib/defaults';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

/**
 * Nominatim asks for an application name and a contact address so they can get
 * in touch before blocking anyone. Keep it accurate.
 */
const USER_AGENT = `ReiseCeylon-JourneyPlanner/1.0 (+https://reiseceylon.com; ${CONTACT_EMAIL})`;

/** Long enough that repeat searches for the same town cost Nominatim nothing. */
const CACHE_SECONDS = 60 * 60 * 24;

type NominatimRow = {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  type?: string;
  addresstype?: string;
  class?: string;
};

export type PlaceSearchResult = {
  id: string;
  name: string;
  /** The rest of the address, so two places of the same name can be told apart. */
  context: string;
  latitude: number;
  longitude: number;
  kind: string;
};

/** Sri Lanka's bounding box, as Nominatim wants it: left,top,right,bottom. */
const VIEWBOX = '79.4,10.0,82.1,5.8';

/** “Kandy, Kandy District, Central Province, Sri Lanka” → “Kandy District, Central Province”. */
function contextOf(row: NominatimRow) {
  const parts = row.display_name.split(',').map((part) => part.trim());
  const withoutName = parts[0] === (row.name ?? '') ? parts.slice(1) : parts;
  return withoutName
    .filter((part) => part !== 'Sri Lanka' && !/^\d{4,}$/.test(part))
    .slice(0, 2)
    .join(', ');
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';

  /* Two characters is not a search, it is a keystroke. */
  if (query.length < 3) return NextResponse.json({ results: [] });
  if (query.length > 120) return NextResponse.json({ results: [] });

  const url = new URL(NOMINATIM);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('countrycodes', 'lk');
  url.searchParams.set('viewbox', VIEWBOX);
  url.searchParams.set('bounded', '1');
  url.searchParams.set('limit', '6');
  url.searchParams.set('addressdetails', '0');

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      console.error('[places/search] nominatim replied', response.status);
      return NextResponse.json({ results: [], error: 'Search is unavailable right now.' }, { status: 502 });
    }

    const rows = (await response.json()) as NominatimRow[];

    const results: PlaceSearchResult[] = rows
      .map((row) => ({
        id: String(row.place_id),
        name: row.name || row.display_name.split(',')[0].trim(),
        context: contextOf(row),
        latitude: Number(row.lat),
        longitude: Number(row.lon),
        kind: (row.addresstype || row.type || row.class || 'place').replace(/_/g, ' ')
      }))
      .filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));

    return NextResponse.json({ results });
  } catch (cause) {
    /* A timeout or a network failure must not take the planner down with it —
       the atlas search beside this one still works. */
    console.error('[places/search] lookup failed', cause);
    return NextResponse.json({ results: [], error: 'Search is unavailable right now.' }, { status: 502 });
  }
}
