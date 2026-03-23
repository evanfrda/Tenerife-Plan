'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MobileTripApp.css';
import type { Trip, Destination, DayData, Activity, Restaurant, Phase } from '@/lib/types';
import { saveTrip } from '@/lib/storage';

// ---------------------------------------------------------------------------
// Hero images — high-res Unsplash keyed by location
// ---------------------------------------------------------------------------
// Hero images per day number — each image matches a key spot of that day
const DAY_HERO_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=1200&h=900&fit=crop&q=80', // Sunset ocean / plage
  2: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200&h=900&fit=crop&q=80', // Volcan / montagne
  3: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1200&h=900&fit=crop&q=80', // Ocean / falaises
  4: 'https://images.unsplash.com/photo-1602088113235-229c19758e9f?w=1200&h=900&fit=crop&q=80', // Village montagne
  5: 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=1200&h=900&fit=crop&q=80', // Plage sauvage
  6: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=900&fit=crop&q=80', // Foret tropicale / nature
  7: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=900&fit=crop&q=80', // Plage doree
};

// ---------------------------------------------------------------------------
// Accommodation data — budget options for each phase
// ---------------------------------------------------------------------------
interface StayPeriod {
  id: number;
  phase: string;
  phaseColor: string;
  location: string;
  dates: string;
  nights: number;
  dayNums: number[];
  budget: string;
  options: {
    name: string;
    type: string;
    typeIcon: string;
    price: string;
    priceEur: string;
    area: string;
    desc: string;
    tips: string;
    query: string;
  }[];
}

const STAY_PERIODS: StayPeriod[] = [
  {
    id: 1, phase: 'Sud \u2014 Costa Adeje', phaseColor: '#FF6B6B', location: 'Costa Adeje / Playa San Juan', dates: '4-6 juin',
    nights: 3, dayNums: [1, 2, 3], budget: '~50-70 \u20AC/nuit',
    options: [
      { name: 'Airbnb Playa San Juan', type: 'Airbnb', typeIcon: '\uD83C\uDFE1', price: '~55 \u20AC/nuit', priceEur: '~55\u20AC', area: 'Playa San Juan', desc: 'Plus local et moins cher que le coeur touristique d\'Adeje. A 10 min de Puerto Col\u00f3n et 25 min de Los Gigantes.', tips: 'Meilleur compromis qualit\u00e9-prix du sud. Chercher sur Airbnb "Costa Adeje".', query: 'Playa San Juan Costa Adeje Tenerife' },
      { name: 'Airbnb La Caleta de Adeje', type: 'Airbnb', typeIcon: '\uD83C\uDFE1', price: '~70 \u20AC/nuit', priceEur: '~70\u20AC', area: 'La Caleta de Adeje', desc: 'Village de p\u00eacheurs romantique. Sunsets face \u00e0 La Gomera. Plus cher mais ambiance unique.', tips: 'Id\u00e9al pour les couchers de soleil.', query: 'La Caleta de Adeje Tenerife' },
    ],
  },
  {
    id: 2, phase: 'Travers\u00e9e & Nord \u2014 La Laguna', phaseColor: '#45B7D1', location: 'La Laguna', dates: '7-9 juin',
    nights: 3, dayNums: [4, 5, 6], budget: '~35-55 \u20AC/nuit',
    options: [
      { name: 'Airbnb La Laguna Centro', type: 'Airbnb', typeIcon: '\uD83C\uDFE1', price: '~45 \u20AC/nuit', priceEur: '~45\u20AC', area: 'Centre historique', desc: 'Ville UNESCO, ambiance universitaire vivante le soir. Zone la moins ch\u00e8re de l\'\u00eele. A 20 min de Las Teresitas, 40 min d\'Anaga.', tips: 'Chercher sur Airbnb "La Laguna centro hist\u00f3rico".', query: 'San Cristóbal de La Laguna centro Tenerife' },
    ],
  },
  {
    id: 3, phase: 'Dernier jour & D\u00e9part', phaseColor: '#FFB347', location: 'El M\u00e9dano (pr\u00e8s a\u00e9roport)', dates: '10 juin',
    nights: 1, dayNums: [7], budget: '~40-55 \u20AC/nuit',
    options: [
      { name: 'Airbnb El M\u00e9dano', type: 'Airbnb', typeIcon: '\uD83C\uDFE1', price: '~45 \u20AC/nuit', priceEur: '~45\u20AC', area: 'El M\u00e9dano', desc: 'A 10-15 min de l\'a\u00e9roport TFS. Ambiance surf. Logement simple pour la derni\u00e8re nuit.', tips: 'Vol \u00e0 6h le 11 juin \u2014 r\u00e9veil 3h30.', query: 'El Médano Tenerife' },
      { name: 'Airbnb Golf del Sur', type: 'Airbnb', typeIcon: '\uD83C\uDFE1', price: '~50 \u20AC/nuit', priceEur: '~50\u20AC', area: 'Golf del Sur', desc: 'Alternative calme, \u00e9galement \u00e0 10-15 min de TFS. Zone r\u00e9sidentielle.', tips: 'Plus calme qu\'El M\u00e9dano pour bien dormir avant le vol.', query: 'Golf del Sur Tenerife' },
    ],
  },
];

function getHeroImageFallback(dayNumber: number): string {
  return DAY_HERO_IMAGES[dayNumber] || DAY_HERO_IMAGES[1]; // fallback
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Google Places cache & types (reused from TripMapView)
// ---------------------------------------------------------------------------
interface PlaceData {
  name?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  photoUrls: string[];
  googleMapsUri?: string;
  websiteUri?: string;
  formattedAddress?: string;
  phone?: string;
}

const placesCache: Record<string, PlaceData | null> = {};
let localPlacesData: Record<string, PlaceData | null> | null = null;

async function loadLocalPlacesData(): Promise<Record<string, PlaceData | null>> {
  if (localPlacesData) return localPlacesData;
  try {
    const res = await fetch('/places-data.json');
    if (res.ok) {
      localPlacesData = await res.json();
      return localPlacesData!;
    }
  } catch { /* ignore */ }
  localPlacesData = {};
  return localPlacesData;
}

async function fetchPlaceData(query: string): Promise<PlaceData | null> {
  if (query in placesCache) return placesCache[query];

  // Try local data first (offline mode)
  const local = await loadLocalPlacesData();
  if (query in local) {
    placesCache[query] = local[query];
    return local[query];
  }

  // Fallback to API
  try {
    const res = await fetch(`/api/places?query=${encodeURIComponent(query)}`);
    if (!res.ok) { placesCache[query] = null; return null; }
    const data: PlaceData = await res.json();
    placesCache[query] = data;
    return data;
  } catch {
    placesCache[query] = null;
    return null;
  }
}

function formatPlaceType(type: string): string {
  const types: Record<string, string> = {
    tourist_attraction: 'Attraction',
    temple: 'Temple',
    shrine: 'Sanctuaire',
    park: 'Parc',
    museum: 'Musee',
    restaurant: 'Restaurant',
    transit_station: 'Gare',
    train_station: 'Gare',
    subway_station: 'Metro',
    airport: 'Aeroport',
    lodging: 'Hebergement',
    store: 'Magasin',
    food: 'Nourriture',
    cafe: 'Cafe',
    bar: 'Bar',
    point_of_interest: 'Point d\'interet',
    natural_feature: 'Nature',
  };
  return types[type] || type.replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Map / routing helpers (reused from TripMapView)
// ---------------------------------------------------------------------------
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
const FLIGHT_DISTANCE_KM = 300;

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function detectOceanCrossings(waypoints: [number, number][]): Set<number> {
  const crossings = new Set<number>();
  for (let i = 0; i < waypoints.length - 1; i++) {
    if (haversineKm(waypoints[i], waypoints[i + 1]) > FLIGHT_DISTANCE_KM) {
      crossings.add(i);
    }
  }
  return crossings;
}

async function fetchRoute(waypoints: [number, number][]): Promise<[number, number][]> {
  if (waypoints.length < 2) return waypoints;
  const coordsStr = waypoints.map((p) => `${p[0]},${p[1]}`).join(';');
  const url = `${OSRM_BASE}/${coordsStr}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        return data.routes[0].geometry.coordinates as [number, number][];
      }
    }
  } catch {
    /* fallback */
  }
  return waypoints;
}

interface SegmentedRoute {
  coords: [number, number][];
  ferrySegments: [number, number][][];
}

async function fetchRouteSegmented(
  waypoints: [number, number][],
  oceanCrossings: Set<number>
): Promise<SegmentedRoute> {
  const roadGroups: [number, number][][] = [];
  const ferrySegments: [number, number][][] = [];
  let currentGroup: [number, number][] = [waypoints[0]];

  for (let i = 1; i < waypoints.length; i++) {
    if (oceanCrossings.has(i - 1)) {
      if (currentGroup.length > 0) roadGroups.push(currentGroup);
      ferrySegments.push([waypoints[i - 1], waypoints[i]]);
      currentGroup = [waypoints[i]];
    } else {
      currentGroup.push(waypoints[i]);
    }
  }
  if (currentGroup.length > 0) roadGroups.push(currentGroup);

  let allCoords: [number, number][] = [];
  for (let g = 0; g < roadGroups.length; g++) {
    const group = roadGroups[g];
    const groupCoords = group.length >= 2 ? await fetchRoute(group) : group;

    if (g > 0) {
      const ferry = ferrySegments[g - 1];
      allCoords.push(ferry[0], ferry[1]);
    }

    if (allCoords.length > 0) {
      const skip =
        groupCoords[0][0] === allCoords[allCoords.length - 1][0] &&
        groupCoords[0][1] === allCoords[allCoords.length - 1][1]
          ? 1
          : 0;
      allCoords = allCoords.concat(groupCoords.slice(skip));
    } else {
      allCoords = groupCoords.slice();
    }
  }

  return { coords: allCoords, ferrySegments };
}

// ---------------------------------------------------------------------------
// Star rendering helper
// ---------------------------------------------------------------------------
function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75 ? 1 : 0;
  const empty = 5 - full - half;
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(empty);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type Tab = 'accueil' | 'carte' | 'restos' | 'spots';
type SubTab = 'activites' | 'restos';
type RestoCategory = 'google' | 'tabelog';

// ---------------------------------------------------------------------------
// AE Activities — TikTok collection spots for Alex & Evan
// ---------------------------------------------------------------------------
interface AESpot {
  name: string;
  query: string;
  city: string;
  category: string;
  categoryIcon: string;
  desc: string;
  address?: string;
  price?: string;
  tips?: string;
}

const AE_CITIES = ['Costa Adeje', 'La Laguna', 'Nord', 'Anaga'] as const;

const AE_SPOTS: AESpot[] = [
  // ===== COSTA ADEJE =====
  {
    name: 'Playa Diego Hern\u00e1ndez',
    query: 'Playa Diego Hernández Tenerife',
    city: 'Costa Adeje',
    category: 'Plages',
    categoryIcon: '\uD83C\uDFD6\uFE0F',
    desc: 'Sable blanc, eau turquoise, vue sur La Gomera. Accessible uniquement a pied (20 min depuis La Caleta).',
    tips: 'Apportez eau et pique-nique.',
  },
  {
    name: 'Playa del Duque',
    query: 'Playa del Duque Adeje Tenerife',
    city: 'Costa Adeje',
    category: 'Plages',
    categoryIcon: '\uD83C\uDFD6\uFE0F',
    desc: 'La plus belle plage du sud. Sable dore, eau calme a 22\u00b0C.',
    price: 'Transats ~19 \u20ac la paire',
  },
  {
    name: 'La Caleta de Adeje',
    query: 'La Caleta de Adeje Tenerife',
    city: 'Costa Adeje',
    category: 'Sunset',
    categoryIcon: '\uD83C\uDF05',
    desc: 'Village de pecheurs face plein ouest. Top 5 sunset de l\'ile. Le soleil plonge derriere La Gomera.',
  },
  {
    name: 'Whale Wise Eco Tours',
    query: 'Whale Wise Eco Tours Los Gigantes Tenerife',
    city: 'Costa Adeje',
    category: 'Activite',
    categoryIcon: '\uD83D\uDC0B',
    desc: 'Whale watching eco. Bateau hybride electrique, max 10 passagers, biologiste marine. 2h30. Note 5.0/5.',
    price: '65-80 \u20ac/personne',
    tips: 'Reserver 1-2 semaines a l\'avance.',
  },
  {
    name: 'Quad Sunset Tour',
    query: 'Tenerife First Quads sunset tour',
    city: 'Costa Adeje',
    category: 'Activite',
    categoryIcon: '\uD83C\uDFCD\uFE0F',
    desc: 'Quad sunset 3h au-dessus de la mer de nuages a ~2 400 m. Toast cava face au coucher de soleil.',
    price: '150-170 \u20ac (quad double)',
    tips: 'Reserver 2 semaines a l\'avance. Pantalon long + chaussures fermees + polaire.',
  },
  // ===== LA LAGUNA =====
  {
    name: 'La Laguna \u2014 Ville UNESCO',
    query: 'San Crist\u00f3bal de La Laguna UNESCO Tenerife',
    city: 'La Laguna',
    category: 'Culture',
    categoryIcon: '\uD83C\uDFDB\uFE0F',
    desc: 'Ville UNESCO, ambiance universitaire. Cathedrale, Plaza del Adelantado, rues colorees.',
  },
  {
    name: 'Guachinche',
    query: 'Guachinche La Orotava Tenerife',
    city: 'La Laguna',
    category: 'Food',
    categoryIcon: '\uD83C\uDF77',
    desc: 'Tavernes familiales dans des garages ou caves a vin. Vin maison, cuisine grand-mere canarienne. Cash uniquement.',
    price: '8-15 \u20ac/personne tout compris',
    tips: 'Verifier les ouvertures sur guachinchentenerife.com.',
  },
  {
    name: 'La Orotava',
    query: 'La Orotava old town Tenerife',
    city: 'La Laguna',
    category: 'Culture',
    categoryIcon: '\uD83C\uDFDB\uFE0F',
    desc: 'Ville coloniale. Casa de los Balcones (1632), Jardines Victoria.',
    price: 'Casa de los Balcones : 5\u20ac',
  },
  {
    name: 'Mariposario del Drago',
    query: 'Mariposario del Drago Icod Tenerife',
    city: 'La Laguna',
    category: 'Nature',
    categoryIcon: '\uD83E\uDD8B',
    desc: '800+ papillons exotiques en liberte. Naissance en direct dans le laboratoire. Drago Milenario visible a cote.',
    price: '8,50 \u20ac/adulte',
  },
  // ===== NORD =====
  {
    name: 'Playa El Bollullo',
    query: 'Playa El Bollullo Tenerife',
    city: 'Nord',
    category: 'Plages',
    categoryIcon: '\uD83C\uDFD6\uFE0F',
    desc: 'Sable noir volcanique, falaises, chiringuito avec vue. Sentier raide ~15 min. Ambiance sauvage.',
    tips: 'Courants forts, baignade prudente.',
  },
  {
    name: 'Rambla de Castro',
    query: 'Rambla de Castro hiking Tenerife',
    city: 'Nord',
    category: 'Rando',
    categoryIcon: '\uD83E\uDD7E',
    desc: 'Zone protegee. Falaises, palmiers, dragonniers, cascade se jetant dans la mer. 1h30-2h.',
  },
  {
    name: 'Mirador des 500 Escalones',
    query: 'Mirador 500 escalones Tacoronte Tenerife',
    city: 'Nord',
    category: 'Mirador',
    categoryIcon: '\uD83D\uDC40',
    desc: 'Cache dans un lotissement. Plateformes a 150 m au-dessus de l\'Atlantique. Vue Teide + cote nord.',
    tips: 'GPS indispensable : 28.4772, -16.4178. Chaussures adherentes.',
  },
  {
    name: 'Piscines de Bajamar',
    query: 'Piscinas naturales Bajamar Tenerife',
    city: 'Nord',
    category: 'Plages',
    categoryIcon: '\uD83C\uDF0A',
    desc: 'Bassins creuses dans la roche volcanique. Moins touristiques que Garachico. Acces gratuit.',
  },
  {
    name: 'Garachico \u2014 El Caleto\u0301n',
    query: 'El Calet\u00f3n Garachico Tenerife',
    city: 'Nord',
    category: 'Plages',
    categoryIcon: '\uD83C\uDF0A',
    desc: 'Piscines naturelles + centre historique. Gratuit.',
  },
  // ===== ANAGA =====
  {
    name: 'Cruz del Carmen \u2014 Laurisilva',
    query: 'Cruz del Carmen Sendero de los Sentidos Tenerife',
    city: 'Anaga',
    category: 'Rando',
    categoryIcon: '\uD83C\uDF3F',
    desc: 'Boucle 45 min dans la foret laurifere millenaire. Passerelles, ambiance conte de fees.',
  },
  {
    name: 'Roque de Taborno',
    query: 'Roque de Taborno hiking Tenerife',
    city: 'Anaga',
    category: 'Rando',
    categoryIcon: '\uD83E\uDD7E',
    desc: 'Boucle 4 km, 230 m D+, 1h30-2h. Rocher imposant, vue ocean et montagnes.',
  },
  {
    name: 'Playa de Benijo',
    query: 'Playa de Benijo Tenerife',
    city: 'Anaga',
    category: 'Plages',
    categoryIcon: '\uD83C\uDFD6\uFE0F',
    desc: 'Sable noir, totalement sauvage, Roques de Anaga. 121 marches. Top 5 sunsets.',
    tips: 'Verifier les marees. Courants forts.',
  },
  {
    name: 'Mirador de Aguaide',
    query: 'Mirador de Aguaide Tenerife',
    city: 'Anaga',
    category: 'Mirador',
    categoryIcon: '\uD83D\uDC40',
    desc: 'Vue spectaculaire sur les falaises d\'Anaga et les Roques de Anaga.',
  },
  {
    name: 'Taganana',
    query: 'Casa Africa Taganana Tenerife',
    city: 'Anaga',
    category: 'Food',
    categoryIcon: '\uD83D\uDC1F',
    desc: 'Village de pecheurs. Poisson du jour chez Casa Africa. Menu ~12 \u20ac.',
  },
];

export default function MobileTripApp({ trip: initialTrip }: { trip: Trip }) {
  // State
  const [trip, setTrip] = useState(initialTrip);
  const [activeTab, setActiveTab] = useState<Tab>('accueil');
  const [activeDay, setActiveDay] = useState(1);
  const [subTab, setSubTab] = useState<SubTab>('activites');
  const [placeDetail, setPlaceDetail] = useState<{ activity: Activity; place: PlaceData } | null>(null);
  const [activityPlaces, setActivityPlaces] = useState<Record<string, PlaceData>>({});
  const [restaurantPlaces, setRestaurantPlaces] = useState<Record<string, PlaceData>>({});
  const [restoCategory, setRestoCategory] = useState<RestoCategory>('tabelog');
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [aeCity, setAeCity] = useState<string>('all');
  const [aePlaces, setAePlaces] = useState<Record<string, PlaceData>>({});

  // Editing state
  const [editModal, setEditModal] = useState<{
    mode: 'add' | 'edit';
    type: 'activity' | 'restaurant';
    item?: Activity | Restaurant;
  } | null>(null);

  // ---- CRUD helpers ----
  const persistTrip = useCallback((updated: Trip) => {
    setTrip(updated);
    saveTrip(updated);
  }, []);

  const deleteActivity = useCallback((dayNumber: number, activityId: string) => {
    const updated = { ...trip };
    updated.days = updated.days.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      return { ...d, activities: d.activities.filter(a => a.id !== activityId) };
    });
    persistTrip(updated);
  }, [trip, persistTrip]);

  const deleteRestaurant = useCallback((dayNumber: number, restaurantId: string) => {
    const updated = { ...trip };
    updated.days = updated.days.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      return { ...d, restaurants: (d.restaurants || []).filter(r => r.id !== restaurantId) };
    });
    persistTrip(updated);
  }, [trip, persistTrip]);

  const saveActivityOrRestaurant = useCallback((dayNumber: number, type: 'activity' | 'restaurant', item: Activity | Restaurant, existingId?: string) => {
    const updated = { ...trip };
    updated.days = updated.days.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      if (type === 'activity') {
        const act = item as Activity;
        if (existingId) {
          return { ...d, activities: d.activities.map(a => a.id === existingId ? act : a) };
        }
        return { ...d, activities: [...d.activities, act] };
      } else {
        const rst = item as Restaurant;
        if (existingId) {
          return { ...d, restaurants: (d.restaurants || []).map(r => r.id === existingId ? rst : r) };
        }
        return { ...d, restaurants: [...(d.restaurants || []), rst] };
      }
    });
    persistTrip(updated);
  }, [trip, persistTrip]);

  // Map refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const routeReadyRef = useRef(false);

  // Day selector ref for auto-scroll
  const daySelectorRef = useRef<HTMLDivElement>(null);
  const dayPillRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const photosScrollRef = useRef<HTMLDivElement>(null);

  const currentDay = trip.days.find(d => d.dayNumber === activeDay);
  const maxDay = Math.max(...trip.days.map(d => d.dayNumber));
  const minDay = Math.min(...trip.days.map(d => d.dayNumber));

  // ---- Scroll active pill into view ----
  const scrollPillIntoView = useCallback((dayNum: number) => {
    const pill = dayPillRefs.current[dayNum];
    const container = daySelectorRef.current;
    if (pill && container) {
      const pillLeft = pill.offsetLeft;
      const pillWidth = pill.offsetWidth;
      const containerWidth = container.offsetWidth;
      container.scrollTo({
        left: pillLeft - containerWidth / 2 + pillWidth / 2,
        behavior: 'smooth',
      });
    }
  }, []);

  // ---- Load place data for a day ----
  const loadDayPlaceData = useCallback((day: DayData) => {
    day.activities.forEach((act) => {
      if (!act.query) return;
      if (placesCache[act.query] !== undefined) {
        const cached = placesCache[act.query];
        if (cached) setActivityPlaces(prev => ({ ...prev, [act.query]: cached }));
        return;
      }
      fetchPlaceData(act.query).then(place => {
        if (place) setActivityPlaces(prev => ({ ...prev, [act.query]: place }));
      });
    });
    if (day.restaurants) {
      day.restaurants.forEach((rest) => {
        if (!rest.query) return;
        if (placesCache[rest.query] !== undefined) {
          const cached = placesCache[rest.query];
          if (cached) setRestaurantPlaces(prev => ({ ...prev, [rest.query]: cached }));
          return;
        }
        fetchPlaceData(rest.query).then(place => {
          if (place) setRestaurantPlaces(prev => ({ ...prev, [rest.query]: place }));
        });
      });
    }
    // Tabelog restaurants
    if (day.tabelogRestaurants) {
      day.tabelogRestaurants.forEach((rest) => {
        if (!rest.query) return;
        if (placesCache[rest.query] !== undefined) {
          const cached = placesCache[rest.query];
          if (cached) setRestaurantPlaces(prev => ({ ...prev, [rest.query]: cached }));
          return;
        }
        fetchPlaceData(rest.query).then(place => {
          if (place) setRestaurantPlaces(prev => ({ ...prev, [rest.query]: place }));
        });
      });
    }
  }, []);

  // ---- Clear markers ----
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, []);

  // ---- Add markers for a day ----
  const addDayMarkers = useCallback((day: DayData) => {
    const map = mapRef.current;
    if (!map) return;

    clearMarkers();

    // Activity markers (numbered, blue)
    const validActivities = day.activities.filter(a => a.lat !== 0 || a.lng !== 0);
    validActivities.forEach((act, idx) => {
      const el = document.createElement('div');
      el.className = 'ma-marker-activity';
      el.textContent = String(idx + 1);

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([act.lng, act.lat])
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        // Open place detail on marker click
        if (act.query) {
          fetchPlaceData(act.query).then(place => {
            if (place) {
              setCurrentPhotoIdx(0);
              setPlaceDetail({ activity: act, place });
              setActivityPlaces(prev => ({ ...prev, [act.query]: place }));
            }
          });
        }
      });

      markersRef.current.push(marker);
    });

    // Restaurant markers (orange)
    if (day.restaurants) {
      day.restaurants.forEach((rest) => {
        if (rest.lat === 0 && rest.lng === 0) return;
        const el = document.createElement('div');
        el.className = 'ma-marker-restaurant';
        el.textContent = '\uD83C\uDF7D';

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([rest.lng, rest.lat])
          .addTo(map);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          // Open place detail on restaurant marker click
          if (rest.query) {
            fetchPlaceData(rest.query).then(place => {
              if (place) {
                const pseudoActivity: Activity = {
                  id: '', time: '', period: '', name: rest.name,
                  query: rest.query, lat: rest.lat, lng: rest.lng, desc: rest.desc,
                };
                setCurrentPhotoIdx(0);
                setPlaceDetail({ activity: pseudoActivity, place });
              }
            });
          }
        });

        markersRef.current.push(marker);
      });
    }

    // Fit bounds
    const allPts: [number, number][] = [
      ...validActivities.map(a => [a.lng, a.lat] as [number, number]),
      ...(day.restaurants || []).filter(r => r.lat !== 0 || r.lng !== 0).map(r => [r.lng, r.lat] as [number, number]),
    ];
    if (allPts.length === 1) {
      map.flyTo({ center: allPts[0], zoom: 14, duration: 600 });
    } else if (allPts.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      allPts.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, { padding: 60, duration: 600 });
    }
  }, [clearMarkers]);

  // ---- Draw route for a day ----
  const drawDayRoute = useCallback(async (day: DayData) => {
    const map = mapRef.current;
    if (!map || !routeReadyRef.current) return;

    const waypoints: [number, number][] = day.activities
      .filter(a => a.lat !== 0 || a.lng !== 0)
      .map(a => [a.lng, a.lat]);

    // Clear ferry
    if (map.getSource('ferry')) {
      (map.getSource('ferry') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [],
      });
    }

    if (waypoints.length < 2) {
      (map.getSource('route') as maplibregl.GeoJSONSource)?.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] },
      });
      return;
    }

    // Show straight lines immediately
    (map.getSource('route') as maplibregl.GeoJSONSource)?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: waypoints },
    });

    // Then fetch actual route
    const routeCoords = await fetchRoute(waypoints);
    (map.getSource('route') as maplibregl.GeoJSONSource)?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: routeCoords },
    });
  }, []);

  // ---- Fit bounds to current day ----
  const fitCurrentDay = useCallback(() => {
    const map = mapRef.current;
    const day = trip.days.find(d => d.dayNumber === activeDay);
    if (!map || !day) return;

    const allPts: [number, number][] = [
      ...day.activities.filter(a => a.lat !== 0 || a.lng !== 0).map(a => [a.lng, a.lat] as [number, number]),
      ...(day.restaurants || []).filter(r => r.lat !== 0 || r.lng !== 0).map(r => [r.lng, r.lat] as [number, number]),
    ];

    if (allPts.length === 1) {
      map.flyTo({ center: allPts[0], zoom: 13 });
    } else if (allPts.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      allPts.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [trip, activeDay]);

  // ---- Handle day change ----
  const handleDayChange = useCallback((dayNum: number) => {
    if (dayNum < minDay || dayNum > maxDay) return;
    setActiveDay(dayNum);
    setSubTab('activites');
    scrollPillIntoView(dayNum);

    const day = trip.days.find(d => d.dayNumber === dayNum);
    if (day) {
      loadDayPlaceData(day);
      // Only update map if carte tab is active
      if (activeTab === 'carte') {
        addDayMarkers(day);
        drawDayRoute(day);
      }
    }
  }, [trip, minDay, maxDay, activeTab, scrollPillIntoView, loadDayPlaceData, addDayMarkers, drawDayRoute]);

  // ---- Activity click ----
  const handleActivityClick = useCallback((act: Activity) => {
    const map = mapRef.current;
    if (map && (act.lat !== 0 || act.lng !== 0)) {
      map.flyTo({ center: [act.lng, act.lat], zoom: 15, duration: 600 });
    }
    if (act.query) {
      fetchPlaceData(act.query).then(place => {
        if (place) {
          setCurrentPhotoIdx(0);
          setPlaceDetail({ activity: act, place });
          setActivityPlaces(prev => ({ ...prev, [act.query]: place }));
        }
      });
    }
  }, []);

  // ---- Restaurant click ----
  const handleRestaurantClick = useCallback((rest: Restaurant) => {
    const map = mapRef.current;
    if (map && (rest.lat !== 0 || rest.lng !== 0)) {
      map.flyTo({ center: [rest.lng, rest.lat], zoom: 16, duration: 600 });
    }
    if (rest.query) {
      fetchPlaceData(rest.query).then(place => {
        if (place) {
          const pseudoActivity: Activity = {
            id: '', time: '',
            period: '',
            name: rest.name,
            query: rest.query,
            lat: rest.lat,
            lng: rest.lng,
            desc: rest.desc,
          };
          setCurrentPhotoIdx(0);
          setPlaceDetail({ activity: pseudoActivity, place });
        }
      });
    }
  }, []);

  // ---- Destination click (Voyage tab → go to first day) ----
  const handleDestinationClick = useCallback((dest: Destination) => {
    if (dest.dayNums && dest.dayNums.length > 0) {
      const firstDay = dest.dayNums[0];
      setActiveDay(firstDay);
      setActiveTab('accueil');
      setSubTab('activites');
      scrollPillIntoView(firstDay);

      const day = trip.days.find(d => d.dayNumber === firstDay);
      if (day) {
        loadDayPlaceData(day);
        addDayMarkers(day);
        drawDayRoute(day);
      }
    }
  }, [trip, scrollPillIntoView, loadDayPlaceData, addDayMarkers, drawDayRoute]);

  // ---- Init map (once) ----
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initialCenter: [number, number] = trip.destinations.length > 0
      ? [
          trip.destinations.reduce((s, d) => s + d.lng, 0) / trip.destinations.length,
          trip.destinations.reduce((s, d) => s + d.lat, 0) / trip.destinations.length,
        ]
      : [139.6917, 35.6895];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: 6,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

    map.on('load', () => {
      // Route source + layers
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      map.addLayer({
        id: 'route-bg',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#4A67FF', 'line-width': 7, 'line-opacity': 0.1 },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#4A67FF', 'line-width': 3, 'line-opacity': 0.7 },
      });

      // Ferry/flight dashed lines
      map.addSource('ferry', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'ferry-line',
        type: 'line',
        source: 'ferry',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#4A67FF', 'line-width': 2, 'line-opacity': 0.4, 'line-dasharray': [4, 4] },
      });

      routeReadyRef.current = true;

      // Load initial day data
      const day = trip.days.find(d => d.dayNumber === 1) || trip.days[0];
      if (day) {
        loadDayPlaceData(day);
        addDayMarkers(day);
        drawDayRoute(day);
      }
    });

    mapRef.current = map;

    return () => {
      clearMarkers();
      try { map.remove(); } catch { /* ignore */ }
      mapRef.current = null;
      routeReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Load initial day data on mount ----
  useEffect(() => {
    const day = trip.days.find(d => d.dayNumber === activeDay);
    if (day) loadDayPlaceData(day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Load AE places when tab is opened ----
  const aeLoadedRef = useRef(false);
  useEffect(() => {
    if (activeTab !== 'spots' || aeLoadedRef.current) return;
    aeLoadedRef.current = true;
    AE_SPOTS.forEach((spot) => {
      if (placesCache[spot.query] !== undefined) {
        const cached = placesCache[spot.query];
        if (cached) setAePlaces(prev => ({ ...prev, [spot.query]: cached }));
        return;
      }
      fetchPlaceData(spot.query).then(place => {
        if (place) setAePlaces(prev => ({ ...prev, [spot.query]: place }));
      });
    });
  }, [activeTab]);

  // ---- Filter AE spots by city ----
  const filteredAESpots = aeCity === 'all'
    ? AE_SPOTS
    : AE_SPOTS.filter(s => s.city === aeCity);

  const aeGroupedByCity = filteredAESpots.reduce<Record<string, AESpot[]>>((acc, spot) => {
    if (!acc[spot.city]) acc[spot.city] = [];
    acc[spot.city].push(spot);
    return acc;
  }, {});

  // ---- Group activities by period ----
  const groupedActivities = currentDay
    ? currentDay.activities.reduce<Record<string, Activity[]>>((acc, act) => {
        const p = act.period || 'Autre';
        if (!acc[p]) acc[p] = [];
        acc[p].push(act);
        return acc;
      }, {})
    : {};

  const periodOrder = ['Matin', 'Apr\u00e8s-midi', 'Apres-midi', 'Soir', 'Autre'];
  const sortedPeriods = Object.keys(groupedActivities).sort(
    (a, b) => (periodOrder.indexOf(a) === -1 ? 99 : periodOrder.indexOf(a)) -
              (periodOrder.indexOf(b) === -1 ? 99 : periodOrder.indexOf(b))
  );

  // ---- Get destination for a day ----
  const getDestinationForDay = (dayNum: number): Destination | undefined => {
    return trip.destinations.find(d => d.dayNums.includes(dayNum));
  };

  // ---- Compute trip duration ----
  const tripDuration = trip.days.length;

  // ---- Countdown to trip ----
  const now = new Date();
  const tripStart = new Date(trip.startDate);
  const diffMs = tripStart.getTime() - now.getTime();
  const daysUntilTrip = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isTripStarted = daysUntilTrip <= 0;

  // ---- Get first 3 activity photos for hero thumbnails ----
  const heroThumbData: { url: string; act: Activity }[] = [];
  if (currentDay) {
    for (const act of currentDay.activities) {
      if (heroThumbData.length >= 3) break;
      const p = activityPlaces[act.query];
      if (p && p.photoUrls.length > 0) {
        heroThumbData.push({ url: p.photoUrls[0], act });
      }
    }
  }

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <div className="ma-app">
      {/* ---- MAP (always in DOM) ---- */}
      <div className="ma-map-wrapper">
        <div ref={mapContainer} className="ma-map" />
        {activeTab === 'carte' && (
          <>
            {/* Day selector on map */}
            <div className="ma-map-day-selector">
              {trip.days.map(d => (
                <button
                  key={d.dayNumber}
                  className={`ma-day-pill-map ${d.dayNumber === activeDay ? 'active' : ''}`}
                  onClick={() => {
                    setActiveDay(d.dayNumber);
                    const day = trip.days.find(dd => dd.dayNumber === d.dayNumber);
                    if (day) {
                      loadDayPlaceData(day);
                      addDayMarkers(day);
                      drawDayRoute(day);
                    }
                    scrollPillIntoView(d.dayNumber);
                  }}
                >
                  J{d.dayNumber}
                </button>
              ))}
            </div>
            <button className="ma-map-fit" onClick={fitCurrentDay} title="Recentrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ---- CONTENT LAYER (on top of map, hidden for carte tab) ---- */}
      <div className={`ma-content-layer ${activeTab === 'carte' ? 'ma-hidden' : ''}`}>
        {/* =============================== ACCUEIL TAB =============================== */}
        {activeTab === 'accueil' && currentDay && (
          <div className="ma-tab-content" key={`accueil-${activeDay}`}>
            {/* Hero */}
            <div className="ma-hero">
              <div
                className="ma-hero-image"
                style={{ backgroundImage: `url(${(() => {
                  // Use first Google Places photo from today's activities as hero
                  const firstPhoto = currentDay.activities
                    .map(a => activityPlaces[a.query]?.photoUrls?.[0])
                    .find(Boolean);
                  return firstPhoto || getHeroImageFallback(currentDay.dayNumber);
                })()})` }}
              />
              <div className="ma-hero-content">
                <div className="ma-hero-day-counter">Jour {activeDay}</div>
                <h1 className="ma-hero-title">{currentDay.title}</h1>
                <div className="ma-hero-subtitle">
                  <span>{'\uD83D\uDCCD'}</span>
                  {getDestinationForDay(activeDay)?.subtitle && (
                    <span>{getDestinationForDay(activeDay)!.subtitle} &middot; </span>
                  )}
                  <span>{formatDateLong(currentDay.date)}</span>
                </div>
              </div>

              {/* Thumbnail photos */}
              {heroThumbData.length > 0 && (
                <div className="ma-hero-thumbs">
                  {heroThumbData.map((thumb, i) => (
                    <img
                      key={i}
                      src={thumb.url}
                      alt=""
                      className="ma-hero-thumb"
                      loading="lazy"
                      onClick={(e) => { e.stopPropagation(); handleActivityClick(thumb.act); }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sheet */}
            <div className="ma-sheet">
              <div className="ma-sheet-handle" />

              {/* Day selector */}
              <div className="ma-day-selector" ref={daySelectorRef}>
                {trip.days.map(d => (
                  <button
                    key={d.dayNumber}
                    ref={el => { dayPillRefs.current[d.dayNumber] = el; }}
                    className={`ma-day-pill ${d.dayNumber === activeDay ? 'active' : ''}`}
                    onClick={() => handleDayChange(d.dayNumber)}
                  >
                    <span className="ma-day-pill-label">J{d.dayNumber}</span>
                    <span className="ma-day-pill-date">{formatDateShort(d.date)}</span>
                  </button>
                ))}
              </div>

              {/* Sub-tabs: Activites / Restos */}
              <div className="ma-sub-tabs">
                <button
                  className={`ma-sub-tab ${subTab === 'activites' ? 'active' : ''}`}
                  onClick={() => setSubTab('activites')}
                >
                  Activites
                </button>
                <button
                  className={`ma-sub-tab ${subTab === 'restos' ? 'active' : ''}`}
                  onClick={() => setSubTab('restos')}
                >
                  Restaurants
                </button>
              </div>

              {/* ---- Activities sub-tab ---- */}
              {subTab === 'activites' && (
                <div className="ma-activities-list">
                  {sortedPeriods.map(period => (
                    <div key={period}>
                      <div className="ma-period-header">
                        {period === 'Matin' && '\u2600\uFE0F'}{' '}
                        {(period === 'Apres-midi' || period === 'Apr\u00e8s-midi') && '\uD83C\uDF24\uFE0F'}{' '}
                        {period === 'Soir' && '\uD83C\uDF19'}{' '}
                        {period === 'Apr\u00e8s-midi' ? 'APRES-MIDI' : period.toUpperCase()}
                      </div>
                      {groupedActivities[period].map((act, i) => {
                        const place = activityPlaces[act.query];
                        const photo = place?.photoUrls?.[0];
                        const mainType = place?.types?.[0];
                        return (
                          <div
                            key={act.id || `${period}-${i}`}
                            className="ma-activity-card"
                            onClick={() => handleActivityClick(act)}
                          >
                            {photo ? (
                              <img src={photo} alt="" className="ma-activity-photo" loading="lazy" />
                            ) : (
                              <div className="ma-activity-photo-placeholder">{'\uD83D\uDDFE'}</div>
                            )}
                            <div className="ma-activity-info">
                              <h3 className="ma-activity-name">{act.name}</h3>
                              {place?.rating && (
                                <div className="ma-activity-rating">
                                  <span className="ma-stars">{renderStars(place.rating)}</span>
                                  <span>{place.rating.toFixed(1)}</span>
                                  {place.userRatingCount && (
                                    <span className="ma-rating-count">
                                      ({place.userRatingCount.toLocaleString('fr-FR')})
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="ma-activity-meta">
                                {act.time && <span>{act.time}</span>}
                                {mainType && (
                                  <span className="ma-type-badge">{formatPlaceType(mainType)}</span>
                                )}
                              </div>
                              {act.desc && <p className="ma-activity-desc">{act.desc}</p>}
                            </div>
                            <div className="ma-card-actions" onClick={e => e.stopPropagation()}>
                              <button className="ma-card-action-btn ma-edit-btn" title="Modifier" onClick={() => setEditModal({ mode: 'edit', type: 'activity', item: act })}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button className="ma-card-action-btn ma-delete-btn" title="Supprimer" onClick={() => { if (confirm(`Supprimer "${act.name}" ?`)) deleteActivity(activeDay, act.id); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {currentDay.activities.length === 0 && (
                    <div className="ma-empty-state">
                      <span className="ma-empty-state-icon">{'\uD83D\uDDFE'}</span>
                      Pas d&apos;activites pour ce jour
                    </div>
                  )}
                  <button className="ma-add-btn" onClick={() => setEditModal({ mode: 'add', type: 'activity' })}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14"/></svg>
                    Ajouter une activite
                  </button>
                </div>
              )}

              {/* ---- Restaurants sub-tab (inside Accueil) ---- */}
              {subTab === 'restos' && (
                <div className="ma-activities-list">
                  {currentDay.restaurants && currentDay.restaurants.length > 0 ? (
                    <>
                      <div className="ma-resto-section-header">
                        {'\uD83C\uDF7D\uFE0F'} Restaurants du jour
                      </div>
                      {currentDay.restaurants.map((rest, i) => {
                        const place = restaurantPlaces[rest.query];
                        const photo = place?.photoUrls?.[0];
                        return (
                          <div
                            key={rest.id || i}
                            className="ma-resto-card-small"
                            onClick={() => handleRestaurantClick(rest)}
                          >
                            {photo ? (
                              <img src={photo} alt="" className="ma-resto-card-photo" loading="lazy" />
                            ) : (
                              <div className="ma-resto-card-photo-placeholder">{'\uD83C\uDF7C'}</div>
                            )}
                            <div className="ma-resto-card-info">
                              <h3 className="ma-resto-card-name">{rest.name}</h3>
                              {rest.label && <span className="ma-resto-label-small">{rest.label}</span>}
                              {place?.rating && (
                                <div className="ma-resto-card-rating">
                                  <span className="ma-stars">{renderStars(place.rating)}</span>
                                  <span>{place.rating.toFixed(1)}</span>
                                  {place.userRatingCount && (
                                    <span className="ma-rating-count">
                                      ({place.userRatingCount.toLocaleString('fr-FR')} avis)
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="ma-resto-card-tags">
                                {rest.cuisine && (
                                  <span className="ma-cuisine-badge">{rest.cuisine}</span>
                                )}
                                {rest.priceRange && (
                                  <span className="ma-price-badge">{rest.priceRange}</span>
                                )}
                              </div>
                              {rest.desc && <p className="ma-resto-card-desc">{rest.desc}</p>}
                            </div>
                            <div className="ma-card-actions" onClick={e => e.stopPropagation()}>
                              <button className="ma-card-action-btn ma-edit-btn" title="Modifier" onClick={() => setEditModal({ mode: 'edit', type: 'restaurant', item: rest })}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button className="ma-card-action-btn ma-delete-btn" title="Supprimer" onClick={() => { if (confirm(`Supprimer "${rest.name}" ?`)) deleteRestaurant(activeDay, rest.id); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="ma-empty-state">
                      <span className="ma-empty-state-icon">{'\uD83C\uDF7D\uFE0F'}</span>
                      Pas de restaurants pour ce jour
                    </div>
                  )}
                  <button className="ma-add-btn" onClick={() => setEditModal({ mode: 'add', type: 'restaurant' })}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14"/></svg>
                    Ajouter un restaurant
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============================== RESTOS TAB =============================== */}
        {activeTab === 'restos' && (
          <div className="ma-tab-content ma-restos-tab" key="restos">
            <div className="ma-restos-tab-header">{'\uD83C\uDF7D\uFE0F'} Restaurants</div>

            {/* Day selector */}
            <div className="ma-day-selector" ref={activeTab === 'restos' ? daySelectorRef : undefined}>
              {trip.days.map(d => (
                <button
                  key={d.dayNumber}
                  ref={el => { if (activeTab === 'restos') dayPillRefs.current[d.dayNumber] = el; }}
                  className={`ma-day-pill ${d.dayNumber === activeDay ? 'active' : ''}`}
                  onClick={() => handleDayChange(d.dayNumber)}
                >
                  <span className="ma-day-pill-label">J{d.dayNumber}</span>
                  <span className="ma-day-pill-date">{formatDateShort(d.date)}</span>
                </button>
              ))}
            </div>

            {/* Category tabs */}
            <div className="ma-resto-categories">
              <button
                className={`ma-resto-cat-btn ${restoCategory === 'tabelog' ? 'active' : ''}`}
                onClick={() => setRestoCategory('tabelog')}
              >
                {'\uD83C\uDDEF\uD83C\uDDF5'} Tabelog Authentique
              </button>
              <button
                className={`ma-resto-cat-btn ${restoCategory === 'google' ? 'active' : ''}`}
                onClick={() => setRestoCategory('google')}
              >
                {'\uD83C\uDF0D'} Google Maps
              </button>
            </div>

            <div className="ma-restos-list">
              {(() => {
                const restos = restoCategory === 'tabelog'
                  ? currentDay?.tabelogRestaurants || []
                  : currentDay?.restaurants || [];
                if (restos.length === 0) {
                  return (
                    <div className="ma-restos-empty">
                      <span className="ma-restos-empty-icon">{'\uD83C\uDF7D\uFE0F'}</span>
                      Pas de restaurants pour ce jour
                    </div>
                  );
                }
                return restos.map((rest, i) => {
                  const place = restaurantPlaces[rest.query];
                  const photo = place?.photoUrls?.[0];
                  return (
                    <div
                      key={`${restoCategory}-${i}`}
                      className="ma-resto-large-card"
                      onClick={() => handleRestaurantClick(rest)}
                    >
                      <div className="ma-resto-large-photo-wrap">
                        {photo ? (
                          <img src={photo} alt="" className="ma-resto-large-photo" loading="lazy" />
                        ) : (
                          <div className="ma-resto-large-photo-placeholder">{'\uD83C\uDF7C'}</div>
                        )}
                        <h3 className="ma-resto-large-name">{rest.name}</h3>
                        {rest.label && <span className="ma-resto-label">{rest.label}</span>}
                      </div>
                      <div className="ma-resto-large-info">
                        <div className="ma-resto-large-rating">
                          {restoCategory === 'tabelog' && rest.tabelogRating && (
                            <>
                              <span className="ma-tabelog-badge">Tabelog</span>
                              <span className="ma-tabelog-score">{rest.tabelogRating.toFixed(2)}</span>
                            </>
                          )}
                          {restoCategory === 'google' && place?.rating && (
                            <>
                              <span className="ma-stars">{renderStars(place.rating)}</span>
                              <span>{place.rating.toFixed(1)}</span>
                            </>
                          )}
                          {place?.userRatingCount && (
                            <span className="ma-rating-count">
                              ({place.userRatingCount.toLocaleString('fr-FR')} avis)
                            </span>
                          )}
                        </div>
                        <div className="ma-resto-large-tags">
                          {rest.cuisine && (
                            <span className="ma-cuisine-badge">{rest.cuisine}</span>
                          )}
                          {rest.priceRange && (
                            <span className="ma-price-badge">{rest.priceRange}</span>
                          )}
                        </div>
                        {rest.desc && <p className="ma-resto-large-desc">{rest.desc}</p>}
                        {place?.googleMapsUri && (
                          <a
                            href={place.googleMapsUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ma-resto-maps-btn"
                            onClick={e => e.stopPropagation()}
                          >
                            {'\uD83D\uDCCD'} Voir sur Maps &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* =============================== SPOTS TAB =============================== */}
        {activeTab === 'spots' && (
          <div className="ma-tab-content ma-ae-tab" key="ae">
            <div className="ma-ae-header">
              <h1 className="ma-ae-title">{'\uD83C\uDF1F'} Spots &agrave; voir</h1>
              <p className="ma-ae-subtitle">Plages, randos, miradors &amp; bonnes adresses</p>
            </div>

            {/* City filter */}
            <div className="ma-ae-city-filter">
              <button
                className={`ma-ae-city-btn ${aeCity === 'all' ? 'active' : ''}`}
                onClick={() => setAeCity('all')}
              >
                Tout
              </button>
              {AE_CITIES.map(city => (
                <button
                  key={city}
                  className={`ma-ae-city-btn ${aeCity === city ? 'active' : ''}`}
                  onClick={() => setAeCity(city)}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Spots grouped by city */}
            {Object.entries(aeGroupedByCity).map(([city, spots]) => (
              <div key={city} className="ma-ae-city-section">
                <div className="ma-ae-city-header">
                  <span className="ma-ae-city-dot" style={{
                    background: city === 'Osaka' ? '#FFB347' : city === 'Tokyo' ? '#96CEB4' : city === 'Yokohama' ? '#45B7D1' : '#FF6B6B'
                  }} />
                  {city}
                  <span className="ma-ae-city-count">{spots.length}</span>
                </div>

                {spots.map((spot, i) => {
                  const place = aePlaces[spot.query] || activityPlaces[spot.query];
                  const photo = place?.photoUrls?.[0];
                  return (
                    <div
                      key={`${city}-${i}`}
                      className="ma-ae-card"
                      onClick={() => {
                        if (spot.query) {
                          const cached = aePlaces[spot.query] || activityPlaces[spot.query];
                          if (cached) {
                            setCurrentPhotoIdx(0);
                            setPlaceDetail({
                              activity: { id: '', time: '', period: '', name: spot.name, query: spot.query, lat: 0, lng: 0, desc: spot.desc },
                              place: cached,
                            });
                          } else {
                            fetchPlaceData(spot.query).then(p => {
                              if (p) {
                                setAePlaces(prev => ({ ...prev, [spot.query]: p }));
                                setCurrentPhotoIdx(0);
                                setPlaceDetail({
                                  activity: { id: '', time: '', period: '', name: spot.name, query: spot.query, lat: 0, lng: 0, desc: spot.desc },
                                  place: p,
                                });
                              }
                            });
                          }
                        }
                      }}
                    >
                      {photo ? (
                        <img src={photo} alt="" className="ma-ae-card-photo" loading="lazy" />
                      ) : (
                        <div className="ma-ae-card-photo-placeholder">{spot.categoryIcon}</div>
                      )}
                      <div className="ma-ae-card-info">
                        <div className="ma-ae-card-top">
                          <h3 className="ma-ae-card-name">{spot.name}</h3>
                          <span className="ma-ae-card-category" style={{
                            background: spot.category === 'Food' ? '#fff3e0' : spot.category === 'Shopping' ? '#e8eaf6' : spot.category === 'JDM' ? '#fce4ec' : spot.category === 'Photo Spots' ? '#e0f7fa' : '#f3e5f5',
                            color: spot.category === 'Food' ? '#e65100' : spot.category === 'Shopping' ? '#283593' : spot.category === 'JDM' ? '#c62828' : spot.category === 'Photo Spots' ? '#00695c' : '#6a1b9a',
                          }}>{spot.categoryIcon} {spot.category}</span>
                        </div>
                        {place?.rating && (
                          <div className="ma-ae-card-rating">
                            <span className="ma-stars">{renderStars(place.rating)}</span>
                            <span>{place.rating.toFixed(1)}</span>
                            {place.userRatingCount && (
                              <span className="ma-rating-count">
                                ({place.userRatingCount.toLocaleString('fr-FR')} avis)
                              </span>
                            )}
                          </div>
                        )}
                        {spot.price && (
                          <span className="ma-ae-card-price">{spot.price}</span>
                        )}
                        <p className="ma-ae-card-desc">{spot.desc}</p>
                        {spot.tips && (
                          <p className="ma-ae-card-tips">{'\uD83D\uDCA1'} {spot.tips}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Bottom padding */}
            <div style={{ height: 24 }} />
          </div>
        )}
      </div>

      {/* =============================== PLACE DETAIL OVERLAY =============================== */}
      {placeDetail && (
        <div className="ma-place-overlay">
          <button className="ma-place-close" onClick={() => setPlaceDetail(null)}>
            {'\u2715'}
          </button>

          {/* Photo carousel */}
          <div
            className="ma-place-photos"
            ref={photosScrollRef}
            onScroll={() => {
              const el = photosScrollRef.current;
              if (el) {
                const idx = Math.round(el.scrollLeft / el.offsetWidth);
                setCurrentPhotoIdx(idx);
              }
            }}
          >
            {placeDetail.place.photoUrls.length > 0 ? (
              placeDetail.place.photoUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="ma-place-photo" loading="lazy" />
              ))
            ) : (
              <div className="ma-place-photo-placeholder">{'\uD83D\uDCF7'}</div>
            )}
          </div>

          {/* Photo dots */}
          {placeDetail.place.photoUrls.length > 1 && (
            <div className="ma-place-photo-dots">
              {placeDetail.place.photoUrls.map((_, i) => (
                <span key={i} className={`ma-place-photo-dot ${i === currentPhotoIdx ? 'active' : ''}`} />
              ))}
            </div>
          )}

          {/* Info */}
          <div className="ma-place-info">
            <h2 className="ma-place-name">
              {placeDetail.place.name || placeDetail.activity.name}
            </h2>

            {placeDetail.place.rating && (
              <div className="ma-place-rating-row">
                <span className="ma-place-rating-stars">
                  {renderStars(placeDetail.place.rating)}
                </span>
                <span className="ma-place-rating-num">
                  {placeDetail.place.rating.toFixed(1)}
                </span>
                {placeDetail.place.userRatingCount && (
                  <span className="ma-place-rating-count">
                    ({placeDetail.place.userRatingCount.toLocaleString('fr-FR')} avis)
                  </span>
                )}
                {placeDetail.place.types?.[0] && (
                  <span className="ma-place-type-badge">
                    {formatPlaceType(placeDetail.place.types[0])}
                  </span>
                )}
              </div>
            )}

            {placeDetail.activity.desc && (
              <p className="ma-place-desc">{placeDetail.activity.desc}</p>
            )}

            {/* Links */}
            <div className="ma-place-links">
              {placeDetail.place.googleMapsUri && (
                <a
                  href={placeDetail.place.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ma-place-link"
                >
                  <span className="ma-place-link-icon">{'\uD83D\uDDFA\uFE0F'}</span>
                  <span className="ma-place-link-text">Ouvrir dans Google Maps</span>
                  <span className="ma-place-link-arrow">{'\u203A'}</span>
                </a>
              )}
              {placeDetail.place.websiteUri && (
                <a
                  href={placeDetail.place.websiteUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ma-place-link"
                >
                  <span className="ma-place-link-icon">{'\uD83C\uDF10'}</span>
                  <span className="ma-place-link-text">Site web</span>
                  <span className="ma-place-link-arrow">{'\u203A'}</span>
                </a>
              )}
              {placeDetail.place.phone && (
                <a
                  href={`tel:${placeDetail.place.phone}`}
                  className="ma-place-link"
                >
                  <span className="ma-place-link-icon">{'\uD83D\uDCDE'}</span>
                  <span className="ma-place-link-text">{placeDetail.place.phone}</span>
                  <span className="ma-place-link-arrow">{'\u203A'}</span>
                </a>
              )}
            </div>

            {/* Address */}
            {placeDetail.place.formattedAddress && (
              <div className="ma-place-address">
                <span className="ma-place-address-icon">{'\uD83D\uDCCD'}</span>
                <span>{placeDetail.place.formattedAddress}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================== BOTTOM NAVIGATION =============================== */}
      <nav className="ma-bottom-nav">
        <button
          className={`ma-nav-item ${activeTab === 'accueil' ? 'active' : ''}`}
          onClick={() => setActiveTab('accueil')}
        >
          <span className="ma-nav-icon">{'\uD83C\uDFE0'}</span>
          <span className="ma-nav-label">Accueil</span>
        </button>
        <button
          className={`ma-nav-item ${activeTab === 'carte' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('carte');
            setTimeout(() => {
              mapRef.current?.resize();
              const day = trip.days.find(d => d.dayNumber === activeDay);
              if (day) {
                addDayMarkers(day);
                drawDayRoute(day);
              }
            }, 50);
          }}
        >
          <span className="ma-nav-icon">{'\uD83D\uDDFA\uFE0F'}</span>
          <span className="ma-nav-label">Carte</span>
        </button>
        <button
          className={`ma-nav-item ${activeTab === 'restos' ? 'active' : ''}`}
          onClick={() => setActiveTab('restos')}
        >
          <span className="ma-nav-icon">{'\uD83C\uDF7D\uFE0F'}</span>
          <span className="ma-nav-label">Restos</span>
        </button>
        <button
          className={`ma-nav-item ${activeTab === 'spots' ? 'active' : ''}`}
          onClick={() => setActiveTab('spots')}
        >
          <span className="ma-nav-icon">{'\uD83C\uDF1F'}</span>
          <span className="ma-nav-label">Spots</span>
        </button>
      </nav>

      {/* =============================== EDIT MODAL =============================== */}
      {editModal && (
        <EditModal
          mode={editModal.mode}
          type={editModal.type}
          item={editModal.item}
          onClose={() => setEditModal(null)}
          onSave={(item) => {
            const existingId = editModal.mode === 'edit' ? (editModal.item as Activity | Restaurant)?.id : undefined;
            saveActivityOrRestaurant(activeDay, editModal.type, item, existingId);
            setEditModal(null);
          }}
        />
      )}
    </div>
  );
}

// ---- Edit Modal Component ----
function EditModal({ mode, type, item, onClose, onSave }: {
  mode: 'add' | 'edit';
  type: 'activity' | 'restaurant';
  item?: Activity | Restaurant;
  onClose: () => void;
  onSave: (item: Activity | Restaurant) => void;
}) {
  const isActivity = type === 'activity';
  const existing = item as (Activity & Restaurant) | undefined;

  const [name, setName] = useState(existing?.name || '');
  const [time, setTime] = useState((existing as Activity)?.time || '');
  const [period, setPeriod] = useState((existing as Activity)?.period || 'Matin');
  const [desc, setDesc] = useState(existing?.desc || '');
  const [cuisine, setCuisine] = useState((existing as Restaurant)?.cuisine || '');
  const [priceRange, setPriceRange] = useState((existing as Restaurant)?.priceRange || '');

  const handleSubmit = () => {
    if (!name.trim()) return;
    const query = name.trim() + ' Tenerife';
    if (isActivity) {
      const act: Activity = {
        id: existing?.id || crypto.randomUUID(),
        time: time || '',
        period: period || 'Matin',
        name: name.trim(),
        query,
        lat: (existing as Activity)?.lat || 0,
        lng: (existing as Activity)?.lng || 0,
        desc: desc.trim(),
      };
      onSave(act);
    } else {
      const rst: Restaurant = {
        id: existing?.id || crypto.randomUUID(),
        name: name.trim(),
        query,
        lat: (existing as Restaurant)?.lat || 0,
        lng: (existing as Restaurant)?.lng || 0,
        cuisine: cuisine.trim(),
        priceRange: priceRange.trim(),
        desc: desc.trim(),
      };
      onSave(rst);
    }
  };

  return (
    <div className="ma-modal-overlay" onClick={onClose}>
      <div className="ma-modal" onClick={e => e.stopPropagation()}>
        <div className="ma-modal-header">
          <h2>{mode === 'add' ? 'Ajouter' : 'Modifier'} {isActivity ? 'une activite' : 'un restaurant'}</h2>
          <button className="ma-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="ma-modal-body">
          <label className="ma-field">
            <span>Nom</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={isActivity ? 'Ex: Playa de Benijo' : 'Ex: Casa Africa'} autoFocus />
          </label>
          {isActivity && (
            <>
              <label className="ma-field">
                <span>Heure</span>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </label>
              <label className="ma-field">
                <span>Periode</span>
                <select value={period} onChange={e => setPeriod(e.target.value)}>
                  <option value="Matin">Matin</option>
                  <option value="Apres-midi">Apres-midi</option>
                  <option value="Soir">Soir</option>
                </select>
              </label>
            </>
          )}
          {!isActivity && (
            <>
              <label className="ma-field">
                <span>Cuisine</span>
                <input type="text" value={cuisine} onChange={e => setCuisine(e.target.value)} placeholder="Ex: Poisson frais" />
              </label>
              <label className="ma-field">
                <span>Gamme de prix</span>
                <input type="text" value={priceRange} onChange={e => setPriceRange(e.target.value)} placeholder="Ex: \u20AC\u20AC" />
              </label>
            </>
          )}
          <label className="ma-field">
            <span>Description</span>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description..." rows={3} />
          </label>
        </div>
        <div className="ma-modal-footer">
          <button className="ma-modal-btn ma-modal-cancel" onClick={onClose}>Annuler</button>
          <button className="ma-modal-btn ma-modal-save" onClick={handleSubmit} disabled={!name.trim()}>
            {mode === 'add' ? 'Ajouter' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
