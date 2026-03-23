/**
 * Downloads all Google Places data (photos, ratings, etc.) locally
 * so the app works without the API.
 *
 * Run: node scripts/download-places.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_PLACES_KEY;
if (!API_KEY) {
  console.error('Missing GOOGLE_PLACES_KEY env variable');
  process.exit(1);
}

// Import trip data by reading the seed file
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'places');
const DATA_FILE = path.join(__dirname, '..', 'public', 'places-data.json');

// Collect all queries from the seed
function getAllQueries() {
  // Read the compiled seed - we'll just hardcode extracting from the TS file
  const seedPath = path.join(__dirname, '..', 'src', 'lib', 'japanTripSeed.ts');
  const content = fs.readFileSync(seedPath, 'utf-8');

  const queries = new Set();

  // Extract all query: '...' values
  const queryRegex = /query:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = queryRegex.exec(content)) !== null) {
    queries.add(match[1]);
  }

  return [...queries];
}

async function searchPlace(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.types,places.photos,places.googleMapsUri,places.websiteUri,places.formattedAddress,places.internationalPhoneNumber',
    },
    body: JSON.stringify({ textQuery: query + ' Japan', maxResultCount: 1 }),
  });

  if (!res.ok) {
    console.error(`  API error for "${query}": ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data.places?.[0] || null;
}

async function downloadPhoto(photoName, filename) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&maxHeightPx=600&key=${API_KEY}`;

  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return false;

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filename, buffer);
    return true;
  } catch (e) {
    console.error(`  Photo download failed: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Extracting queries from seed data...');
  const queries = getAllQueries();
  console.log(`   Found ${queries.length} unique queries\n`);

  // Create photos directory
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }

  const placesData = {};
  let processed = 0;

  for (const query of queries) {
    processed++;
    const progress = `[${processed}/${queries.length}]`;

    // Create a safe filename from query
    const safeKey = query.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    console.log(`${progress} Fetching: ${query}`);

    const place = await searchPlace(query);
    if (!place) {
      console.log(`   ⚠️  No results`);
      placesData[query] = null;
      continue;
    }

    // Download photos (up to 4)
    const photoUrls = [];
    if (place.photos) {
      const photosToGet = place.photos.slice(0, 4);
      for (let i = 0; i < photosToGet.length; i++) {
        const photoFilename = `${safeKey}_${i}.jpg`;
        const photoPath = path.join(PHOTOS_DIR, photoFilename);

        if (fs.existsSync(photoPath)) {
          console.log(`   📷 Photo ${i + 1} already exists`);
          photoUrls.push(`/places/${photoFilename}`);
        } else {
          const ok = await downloadPhoto(photosToGet[i].name, photoPath);
          if (ok) {
            console.log(`   📷 Photo ${i + 1} downloaded`);
            photoUrls.push(`/places/${photoFilename}`);
          }
        }
      }
    }

    placesData[query] = {
      name: place.displayName?.text || query,
      rating: place.rating || null,
      userRatingCount: place.userRatingCount || null,
      types: place.types || [],
      photoUrls,
      googleMapsUri: place.googleMapsUri || null,
      websiteUri: place.websiteUri || null,
      formattedAddress: place.formattedAddress || null,
      phone: place.internationalPhoneNumber || null,
    };

    console.log(`   ✅ ${place.displayName?.text} — ${place.rating || 'no rating'} ⭐ — ${photoUrls.length} photos`);

    // Rate limiting: wait 100ms between requests
    await new Promise(r => setTimeout(r, 100));
  }

  // Save all data as JSON
  fs.writeFileSync(DATA_FILE, JSON.stringify(placesData, null, 2));

  const photoCount = Object.values(placesData).filter(Boolean).reduce((sum, p) => sum + (p?.photoUrls?.length || 0), 0);
  console.log(`\n✅ Done!`);
  console.log(`   📄 ${Object.keys(placesData).length} places saved to public/places-data.json`);
  console.log(`   📷 ${photoCount} photos saved to public/places/`);
  console.log(`\n   The app will now use local data — no API needed!`);
}

main().catch(console.error);
