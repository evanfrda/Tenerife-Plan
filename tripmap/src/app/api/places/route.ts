import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_PLACES_KEY || '';

interface PlaceResult {
  name?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  photos?: { name: string }[];
  googleMapsUri?: string;
  websiteUri?: string;
  formattedAddress?: string;
  internationalPhoneNumber?: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query');
  if (!query || !API_KEY) {
    return NextResponse.json({ error: 'Missing query or API key' }, { status: 400 });
  }

  try {
    // Step 1: Text Search to find the place
    const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.types,places.photos,places.googleMapsUri,places.websiteUri,places.formattedAddress,places.internationalPhoneNumber',
      },
      body: JSON.stringify({ textQuery: query + ' Tenerife', maxResultCount: 1 }),
    });

    if (!searchRes.ok) {
      return NextResponse.json({ error: 'Places API error' }, { status: 500 });
    }

    const searchData = await searchRes.json();
    const place: PlaceResult = searchData.places?.[0];
    if (!place) {
      return NextResponse.json({ error: 'No results' }, { status: 404 });
    }

    // Step 2: Build photo URLs (up to 8)
    const photoUrls: string[] = [];
    if (place.photos) {
      const photosToFetch = place.photos.slice(0, 8);
      for (const photo of photosToFetch) {
        photoUrls.push(
          `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=600&maxHeightPx=400&key=${API_KEY}`
        );
      }
    }

    return NextResponse.json({
      name: place.name,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      types: place.types,
      photoUrls,
      googleMapsUri: place.googleMapsUri,
      websiteUri: place.websiteUri,
      formattedAddress: place.formattedAddress,
      phone: place.internationalPhoneNumber,
    });
  } catch (err) {
    console.error('Places API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
