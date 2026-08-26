import { ApifyClient } from 'apify-client';

export function getApifyClient() {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error('APIFY_TOKEN is not configured in environment variables.');
  }
  return new ApifyClient({ token });
}

export const GOOGLE_PLACES_ACTOR_ID = 'compass/crawler-google-places';

export interface StartScrapeParams {
  sector: string;
  city: string;
  country?: string | null;
  maxResults?: number;
}

export async function startGooglePlacesScrape({
  sector,
  city,
  country,
  maxResults = 50,
}: StartScrapeParams) {
  const client = getApifyClient();
  const locationString = country ? `${city}, ${country}` : city;
  const searchString = `${sector} ${locationString}`;

  const input = {
    searchStringsArray: [searchString],
    locationQuery: locationString,
    maxCrawledPlacesPerSearch: Math.min(Math.max(Number(maxResults) || 20, 5), 100),
    language: 'fr',
    skipClosedPlaces: true,
  };

  const run = await client.actor(GOOGLE_PLACES_ACTOR_ID).start(input);
  return {
    runId: run.id,
    datasetId: run.defaultDatasetId,
    status: run.status,
  };
}

export async function getScrapeRunStatus(runId: string) {
  const client = getApifyClient();
  const run = await client.run(runId).get();
  if (!run) {
    throw new Error(`Apify run ${runId} not found`);
  }
  return run;
}

export async function getScrapeDatasetItems(datasetId: string, limit = 100) {
  const client = getApifyClient();
  const dataset = await client.dataset(datasetId).listItems({
    limit,
  });
  return dataset.items || [];
}

export interface NormalizedApifyLead {
  place_id: string | null;
  name: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  latitude: number | null;
  longitude: number | null;
  raw: Record<string, unknown>;
}

export function normalizeApifyPlace(place: Record<string, any>): NormalizedApifyLead {
  const placeId =
    place.placeId ||
    place.id ||
    place.cid ||
    (place.title && place.address ? `${place.title}_${place.address}`.replace(/\s+/g, '_') : null);

  const phone =
    place.phone ||
    place.phoneNumber ||
    place.phoneUnformatted ||
    (Array.isArray(place.phones) && place.phones.length > 0 ? place.phones[0] : null);

  const rating =
    typeof place.totalScore === 'number'
      ? place.totalScore
      : typeof place.rating === 'number'
      ? place.rating
      : null;

  const reviewsCount =
    typeof place.reviewsCount === 'number'
      ? place.reviewsCount
      : typeof place.userRatingsTotal === 'number'
      ? place.userRatingsTotal
      : null;

  const lat = place.location?.lat || place.latitude || null;
  const lng = place.location?.lng || place.longitude || null;

  return {
    place_id: placeId ? String(placeId) : null,
    name: place.title || place.name || 'Entreprise sans nom',
    category: place.categoryName || place.category || place.primaryCategory || 'Commerce / Service',
    address: place.address || place.street || place.formattedAddress || null,
    phone: phone ? String(phone).trim() : null,
    website: place.website || place.url || null,
    rating: rating ? Number(rating) : null,
    reviews_count: reviewsCount ? parseInt(String(reviewsCount), 10) : null,
    latitude: lat ? Number(lat) : null,
    longitude: lng ? Number(lng) : null,
    raw: place,
  };
}
