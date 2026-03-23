'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './TripMapView.css';
import type { Trip, Destination, DayData, Activity, Phase, Restaurant } from '@/lib/types';

// ---------------------------------------------------------------------------
// Google Places cache & types
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

async function fetchPlaceData(query: string): Promise<PlaceData | null> {
  if (query in placesCache) return placesCache[query];
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
// Helpers
// ---------------------------------------------------------------------------

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
const FLIGHT_DISTANCE_KM = 300;

/** Haversine distance in km */
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

/** Detect ocean crossing indices (distance > FLIGHT_DISTANCE_KM between consecutive points) */
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

function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TripMapViewProps {
  trip: Trip;
}

type MarkerRef = { id: number; marker: maplibregl.Marker; el: HTMLDivElement; stop: Destination };
type DayMarkerRef = { marker: maplibregl.Marker; el: HTMLDivElement; query: string; act: Activity };

export default function TripMapView({ trip: initialTrip }: TripMapViewProps) {
  const [tripData, setTripData] = useState<Trip>(initialTrip);
  const trip = tripData;

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<MarkerRef[]>([]);
  const dayMarkersRef = useRef<DayMarkerRef[]>([]);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const overviewRouteCoordsRef = useRef<[number, number][] | null>(null);
  const overviewFerryFeaturesRef = useRef<GeoJSON.Feature[]>([]);
  const routeSourceAddedRef = useRef(false);

  const [activeDay, setActiveDay] = useState<'all' | number>('all');
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [activeActivityIdx, setActiveActivityIdx] = useState<number | null>(null);
  const [placeDetail, setPlaceDetail] = useState<{ activity: Activity; place: PlaceData } | null>(null);
  const [activityPhotos, setActivityPhotos] = useState<Record<string, string>>({});
  const [activityRatings, setActivityRatings] = useState<Record<string, PlaceData>>({});
  const [restaurantPhotos, setRestaurantPhotos] = useState<Record<string, string>>({});
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, PlaceData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ name: string; address: string; lat: number; lng: number; query: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<{ name: string; lat: number; lng: number; query: string; address: string } | null>(null);
  const [addTime, setAddTime] = useState('12:00');
  const [addDesc, setAddDesc] = useState('');
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---- Persist trip changes to localStorage ----
  const persistTrip = useCallback((updated: Trip) => {
    setTripData(updated);
    try {
      const key = 'tripmap_voyages';
      const trips = JSON.parse(localStorage.getItem(key) || '[]');
      const idx = trips.findIndex((t: Trip) => t.id === updated.id);
      if (idx >= 0) trips[idx] = updated;
      else trips.push(updated);
      localStorage.setItem(key, JSON.stringify(trips));
    } catch { /* ignore */ }
  }, []);

  // ---- Marker creation ----
  const createMarkerElement = useCallback((num: number, color: string): HTMLDivElement => {
    const dot = document.createElement('div');
    dot.className = 'tm-marker-dot';
    dot.style.background = color;
    dot.textContent = String(num);
    return dot;
  }, []);

  // ---- Clear day markers ----
  const clearDayMarkers = useCallback(() => {
    dayMarkersRef.current.forEach((m) => m.marker.remove());
    dayMarkersRef.current = [];
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
  }, []);

  // ---- Overview markers ----
  const addOverviewMarkers = useCallback(
    (map: maplibregl.Map) => {
      // Clear existing
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current = [];

      trip.destinations.forEach((stop) => {
        const phase = trip.phases.find((p) => p.id === stop.phase);
        const color = phase?.color || '#4A67FF';
        const el = createMarkerElement(stop.id, color);

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          selectOverviewStop(stop.id);
        });

        markersRef.current.push({ id: stop.id, marker, el, stop });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trip, createMarkerElement]
  );

  // ---- Select overview stop ----
  const selectOverviewStop = useCallback(
    (id: number) => {
      const map = mapRef.current;
      if (!map) return;
      const stop = trip.destinations.find((s) => s.id === id);
      if (!stop) return;

      setActiveCardId(id);

      map.flyTo({ center: [stop.lng, stop.lat], zoom: 10, duration: 800 });

      const markerObj = markersRef.current.find((m) => m.id === id);
      if (markerObj) {
        if (activePopupRef.current) activePopupRef.current.remove();
        activePopupRef.current = new maplibregl.Popup({ offset: 20, maxWidth: '260px' })
          .setLngLat([stop.lng, stop.lat])
          .setHTML(
            `<div class="tm-info-window">
              <h3>${stop.name}</h3>
              <div class="tm-iw-days">${stop.days}</div>
              <p>${stop.description}</p>
            </div>`
          )
          .addTo(map);
      }

      // Scroll card into view
      const cardEl = document.querySelector(`.tm-step-card[data-id="${id}"]`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
    [trip]
  );

  // ---- Fit all markers ----
  const fitAllMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || trip.destinations.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    trip.destinations.forEach((s) => bounds.extend([s.lng, s.lat]));
    map.fitBounds(bounds, { padding: 30, animate: false });
  }, [trip]);

  // ---- Draw overview route ----
  const drawOverviewRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !routeSourceAddedRef.current) return;

    const waypoints: [number, number][] = trip.destinations.map((s) => [s.lng, s.lat]);
    if (waypoints.length < 2) return;

    // Show straight lines immediately
    (map.getSource('route') as maplibregl.GeoJSONSource)?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: waypoints },
    });

    const oceanCrossings = detectOceanCrossings(waypoints);
    const result = await fetchRouteSegmented(waypoints, oceanCrossings);
    overviewRouteCoordsRef.current = result.coords;

    overviewFerryFeaturesRef.current = result.ferrySegments.map((seg) => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: seg },
    }));

    if (map.getSource('ferry')) {
      (map.getSource('ferry') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: overviewFerryFeaturesRef.current,
      });
    }

    (map.getSource('route') as maplibregl.GeoJSONSource).setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: result.coords },
    });
  }, [trip]);

  // ---- Draw day route ----
  const drawDayRoute = useCallback(async (day: DayData) => {
    const map = mapRef.current;
    if (!map || !routeSourceAddedRef.current) return;

    const waypoints: [number, number][] = day.activities
      .filter((a) => a.lat !== 0 || a.lng !== 0)
      .map((a) => [a.lng, a.lat]);
    if (waypoints.length === 0) return;

    (map.getSource('route') as maplibregl.GeoJSONSource).setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: waypoints },
    });

    if (waypoints.length >= 2) {
      const routeCoords = await fetchRoute(waypoints);
      (map.getSource('route') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: routeCoords },
      });
    }
  }, []);

  // ---- Add day markers ----
  const addDayMarkers = useCallback(
    (day: DayData) => {
      const map = mapRef.current;
      if (!map) return;

      const validActivities = day.activities.filter((a) => a.lat !== 0 || a.lng !== 0);

      validActivities.forEach((act, idx) => {
        const el = createMarkerElement(idx + 1, '#4A67FF');

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([act.lng, act.lat])
          .addTo(map);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (activePopupRef.current) activePopupRef.current.remove();
          activePopupRef.current = new maplibregl.Popup({ offset: 20, maxWidth: '260px' })
            .setLngLat([act.lng, act.lat])
            .setHTML(
              `<div class="tm-info-window">
                <h3>${act.name}</h3>
                <div class="tm-iw-days">${act.time}</div>
                <p>${act.desc}</p>
              </div>`
            )
            .addTo(map);
        });

        dayMarkersRef.current.push({ marker, el, query: act.query, act });
      });

      // Fit bounds
      if (validActivities.length === 1) {
        map.flyTo({ center: [validActivities[0].lng, validActivities[0].lat], zoom: 13 });
      } else if (validActivities.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        validActivities.forEach((a) => bounds.extend([a.lng, a.lat]));
        map.fitBounds(bounds, { padding: 40 });
      }
    },
    [createMarkerElement]
  );

  // ---- Show overview ----
  const showOverview = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    clearDayMarkers();

    // Re-add overview markers
    markersRef.current.forEach((m) => m.marker.addTo(map));

    // Restore route
    if (routeSourceAddedRef.current) {
      const coords =
        overviewRouteCoordsRef.current || trip.destinations.map((s) => [s.lng, s.lat] as [number, number]);
      (map.getSource('route') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      });
      (map.getSource('ferry') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: overviewFerryFeaturesRef.current,
      });
    }

    fitAllMarkers();
    setActiveCardId(null);
    setActiveActivityIdx(null);
    setPlaceDetail(null);
  }, [trip, clearDayMarkers, fitAllMarkers]);

  // ---- Load place data for day activities ----
  const loadDayPlaceData = useCallback((day: DayData) => {
    day.activities.forEach((act) => {
      if (act.query && !(act.query in placesCache)) {
        fetchPlaceData(act.query).then((place) => {
          if (place) {
            if (place.photoUrls.length > 0) {
              setActivityPhotos((prev) => ({ ...prev, [act.query]: place.photoUrls[0] }));
            }
            setActivityRatings((prev) => ({ ...prev, [act.query]: place }));
          }
        });
      } else if (placesCache[act.query]) {
        const cached = placesCache[act.query]!;
        if (cached.photoUrls.length > 0) {
          setActivityPhotos((prev) => ({ ...prev, [act.query]: cached.photoUrls[0] }));
        }
        setActivityRatings((prev) => ({ ...prev, [act.query]: cached }));
      }
    });
    // Load restaurant place data
    if (day.restaurants) {
      day.restaurants.forEach((rest) => {
        if (rest.query && !(rest.query in placesCache)) {
          fetchPlaceData(rest.query).then((place) => {
            if (place) {
              if (place.photoUrls.length > 0) {
                setRestaurantPhotos((prev) => ({ ...prev, [rest.query]: place.photoUrls[0] }));
              }
              setRestaurantRatings((prev) => ({ ...prev, [rest.query]: place }));
            }
          });
        } else if (placesCache[rest.query]) {
          const cached = placesCache[rest.query]!;
          if (cached.photoUrls.length > 0) {
            setRestaurantPhotos((prev) => ({ ...prev, [rest.query]: cached.photoUrls[0] }));
          }
          setRestaurantRatings((prev) => ({ ...prev, [rest.query]: cached }));
        }
      });
    }
  }, []);

  // ---- Show day view ----
  const showDayView = useCallback(
    (dayNum: number) => {
      const map = mapRef.current;
      if (!map) return;

      const day = trip.days.find((d) => d.dayNumber === dayNum);
      if (!day) return;

      // Hide overview markers
      markersRef.current.forEach((m) => m.marker.remove());
      clearDayMarkers();

      // Clear ferry
      if (routeSourceAddedRef.current && map.getSource('ferry')) {
        (map.getSource('ferry') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: [],
        });
      }

      addDayMarkers(day);
      drawDayRoute(day);
      setActiveActivityIdx(null);
      setPlaceDetail(null);
      loadDayPlaceData(day);
    },
    [trip, clearDayMarkers, addDayMarkers, drawDayRoute, loadDayPlaceData]
  );

  // ---- Delete activity ----
  const handleDeleteActivity = useCallback(
    (dayNum: number, actIdx: number) => {
      if (deleteConfirmIdx !== actIdx) {
        setDeleteConfirmIdx(actIdx);
        setTimeout(() => setDeleteConfirmIdx(null), 2500);
        return;
      }
      // Confirmed delete
      const updated = { ...trip };
      const dayIdx = updated.days.findIndex((d) => d.dayNumber === dayNum);
      if (dayIdx < 0) return;
      updated.days = [...updated.days];
      updated.days[dayIdx] = { ...updated.days[dayIdx] };
      updated.days[dayIdx].activities = updated.days[dayIdx].activities.filter((_, i) => i !== actIdx);
      persistTrip(updated);
      setPlaceDetail(null);
      setDeleteConfirmIdx(null);
      // Re-render day
      setTimeout(() => {
        clearDayMarkers();
        addDayMarkers(updated.days[dayIdx]);
        drawDayRoute(updated.days[dayIdx]);
      }, 50);
    },
    [trip, deleteConfirmIdx, persistTrip, clearDayMarkers, addDayMarkers, drawDayRoute]
  );

  // ---- Search places for adding ----
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setShowSearchResults(false); return; }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.name) {
            setSearchResults([{
              name: data.name || query,
              address: data.formattedAddress || '',
              lat: 0, lng: 0, // Will get from Google Maps URI or separate geocoding
              query: query,
            }]);
          }
        }
      } catch { /* ignore */ }
      setShowSearchResults(true);
    }, 300);
  }, []);

  // ---- Search with geocoding via OSRM/Nominatim ----
  const searchWithGeocode = useCallback(async (query: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Tenerife')}&format=json&limit=5`);
      if (res.ok) {
        const results = await res.json();
        if (results.length > 0) {
          setSearchResults(results.map((r: { display_name: string; lat: string; lon: string }) => ({
            name: r.display_name.split(',')[0],
            address: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
            query: r.display_name.split(',')[0],
          })));
          setShowSearchResults(true);
          return;
        }
      }
    } catch { /* ignore */ }
    setShowSearchResults(false);
  }, []);

  // Override search to use Nominatim for geocoding
  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setShowSearchResults(false); return; }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchWithGeocode(query), 300);
  }, [searchWithGeocode]);

  // ---- Select search result → show add form ----
  const selectSearchResult = useCallback((result: { name: string; address: string; lat: number; lng: number; query: string }) => {
    setShowSearchResults(false);
    setSearchQuery(result.name);
    setPendingAdd(result);
    // Default time
    if (activeDay !== 'all') {
      const day = trip.days.find((d) => d.dayNumber === activeDay);
      if (day && day.activities.length > 0) {
        const last = day.activities[day.activities.length - 1];
        const [h, m] = last.time.split(':').map(Number);
        setAddTime(String(Math.min(h + 1, 23)).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
      } else {
        setAddTime('10:00');
      }
    }
    setAddDesc(result.address);
    // Fly to location
    if (result.lat && result.lng) {
      mapRef.current?.flyTo({ center: [result.lng, result.lat], zoom: 14 });
    }
  }, [activeDay, trip]);

  // ---- Confirm add activity ----
  const confirmAddActivity = useCallback(() => {
    if (!pendingAdd || activeDay === 'all') return;
    const [h] = addTime.split(':').map(Number);
    const period = h < 12 ? 'Matin' : h < 17 ? 'Apres-midi' : 'Soir';
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      time: addTime,
      period,
      name: pendingAdd.name,
      query: pendingAdd.query || pendingAdd.name,
      lat: pendingAdd.lat,
      lng: pendingAdd.lng,
      desc: addDesc || pendingAdd.address || '',
    };
    const updated = { ...trip };
    const dayIdx = updated.days.findIndex((d) => d.dayNumber === activeDay);
    if (dayIdx < 0) return;
    updated.days = [...updated.days];
    updated.days[dayIdx] = { ...updated.days[dayIdx] };
    updated.days[dayIdx].activities = [...updated.days[dayIdx].activities, newActivity]
      .sort((a, b) => a.time.localeCompare(b.time));
    persistTrip(updated);
    setPendingAdd(null);
    setSearchQuery('');
    setAddDesc('');
    // Re-render day
    setTimeout(() => {
      clearDayMarkers();
      addDayMarkers(updated.days[dayIdx]);
      drawDayRoute(updated.days[dayIdx]);
      loadDayPlaceData(updated.days[dayIdx]);
    }, 50);
  }, [pendingAdd, activeDay, addTime, addDesc, trip, persistTrip, clearDayMarkers, addDayMarkers, drawDayRoute, loadDayPlaceData]);

  // ---- Handle day switch ----
  const handleDaySwitch = useCallback(
    (day: 'all' | number) => {
      setActiveDay(day);
      setPendingAdd(null);
      setSearchQuery('');
      setDeleteConfirmIdx(null);
      if (day === 'all') {
        showOverview();
      } else {
        showDayView(day);
      }
    },
    [showOverview, showDayView]
  );

  // ---- Activity click ----
  const handleActivityClick = useCallback(
    (act: Activity, idx: number) => {
      const map = mapRef.current;
      if (!map) return;

      map.flyTo({ center: [act.lng, act.lat], zoom: 15 });
      setActiveActivityIdx(idx);

      // Load and show place detail
      if (act.query) {
        fetchPlaceData(act.query).then((place) => {
          if (place) {
            setPlaceDetail({ activity: act, place });
            if (place.photoUrls.length > 0) {
              setActivityPhotos((prev) => ({ ...prev, [act.query]: place.photoUrls[0] }));
            }
            setActivityRatings((prev) => ({ ...prev, [act.query]: place }));
          }
        });
      }
    },
    []
  );

  // ---- Restaurant click ----
  const handleRestaurantClick = useCallback(
    (rest: Restaurant) => {
      const map = mapRef.current;
      if (map && (rest.lat !== 0 || rest.lng !== 0)) {
        map.flyTo({ center: [rest.lng, rest.lat], zoom: 16 });
      }
      if (rest.query) {
        fetchPlaceData(rest.query).then((place) => {
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
            setPlaceDetail({ activity: pseudoActivity, place });
          }
        });
      }
    },
    []
  );

  // ---- Init map ----
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Compute initial center from destinations
    const initialCenter: [number, number] = trip.destinations.length > 0
      ? [
          trip.destinations.reduce((s, d) => s + d.lng, 0) / trip.destinations.length,
          trip.destinations.reduce((s, d) => s + d.lat, 0) / trip.destinations.length,
        ]
      : [0, 20];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: trip.destinations.length > 0 ? 5 : 2,
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

      routeSourceAddedRef.current = true;

      addOverviewMarkers(map);
      fitAllMarkers();
      drawOverviewRoute();
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current = [];
      dayMarkersRef.current.forEach((m) => m.marker.remove());
      dayMarkersRef.current = [];
      if (activePopupRef.current) activePopupRef.current.remove();
      try { map.remove(); } catch { /* ignore AbortError on strict mode double-render */ }
      mapRef.current = null;
      routeSourceAddedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Keyboard navigation ----
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDaySwitch('all');
      }
      if (e.key === 'ArrowRight' && activeDay !== 'all') {
        e.preventDefault();
        const maxDay = Math.max(...trip.days.map((d) => d.dayNumber));
        const next = Math.min((activeDay as number) + 1, maxDay);
        handleDaySwitch(next);
      }
      if (e.key === 'ArrowLeft' && activeDay !== 'all') {
        e.preventDefault();
        const prev = Math.max((activeDay as number) - 1, 1);
        handleDaySwitch(prev);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [activeDay, handleDaySwitch, trip]);

  // ---- Derived data ----
  const currentDayData = activeDay !== 'all' ? trip.days.find((d) => d.dayNumber === activeDay) : null;

  // Group activities by period
  const groupedActivities = currentDayData
    ? currentDayData.activities.reduce<Record<string, Activity[]>>((acc, act) => {
        if (!acc[act.period]) acc[act.period] = [];
        acc[act.period].push(act);
        return acc;
      }, {})
    : {};

  return (
    <div className="tm-root">
      {/* Day tabs */}
      <div className="tm-day-tabs">
        <button
          className={`tm-tab ${activeDay === 'all' ? 'active' : ''}`}
          onClick={() => handleDaySwitch('all')}
        >
          Tout le parcours
        </button>
        {trip.days.map((d) => (
          <button
            key={d.dayNumber}
            className={`tm-tab ${activeDay === d.dayNumber ? 'active' : ''}`}
            onClick={() => handleDaySwitch(d.dayNumber)}
          >
            Jour {d.dayNumber}
          </button>
        ))}
      </div>

      {/* Main container */}
      <div className="tm-main">
        {/* Map */}
        <div className="tm-map-container">
          <div ref={mapContainer} className="tm-map" />
          <button
            className="tm-btn-fit"
            title="Recentrer"
            onClick={() => {
              if (activeDay === 'all') {
                fitAllMarkers();
              } else {
                const day = trip.days.find((d) => d.dayNumber === activeDay);
                if (day) {
                  const valid = day.activities.filter((a) => a.lat !== 0 || a.lng !== 0);
                  if (valid.length === 1) {
                    mapRef.current?.flyTo({ center: [valid[0].lng, valid[0].lat], zoom: 13 });
                  } else if (valid.length > 1) {
                    const bounds = new maplibregl.LngLatBounds();
                    valid.forEach((a) => bounds.extend([a.lng, a.lat]));
                    mapRef.current?.fitBounds(bounds, { padding: 40 });
                  }
                }
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        </div>

        {/* Panel */}
        <div className="tm-panel">
          {/* Panel header */}
          <div className="tm-panel-header">
            <div className="tm-panel-day-label">
              <span>
                {activeDay === 'all'
                  ? trip.name.toUpperCase()
                  : `JOUR ${activeDay}${
                      currentDayData ? ' — ' + formatDateDisplay(currentDayData.date) : ''
                    }`}
              </span>
            </div>
            <h1>
              {activeDay === 'all'
                ? `${trip.days.length} jours`
                : currentDayData?.title || `Jour ${activeDay}`}
            </h1>
            <p className="tm-panel-description">
              {activeDay === 'all'
                ? trip.destinations.map((d) => d.name).join(' → ')
                : currentDayData?.description || ''}
            </p>
          </div>

          {/* Overview content */}
          {activeDay === 'all' && (
            <div className="tm-panel-list">
              {(() => {
                let lastPhase: number | null = null;
                return trip.destinations.map((stop, idx) => {
                  const phase = trip.phases.find((p) => p.id === stop.phase);
                  const color = phase?.color || '#4A67FF';
                  const isLast = idx === trip.destinations.length - 1;
                  const showSeparator = stop.phase !== lastPhase;
                  if (showSeparator) lastPhase = stop.phase;

                  return (
                    <div key={stop.id}>
                      {showSeparator && phase && (
                        <div
                          className="tm-phase-separator"
                          style={{ '--phase-color': color } as React.CSSProperties}
                        >
                          <span className="tm-phase-label">
                            {phase.icon} {phase.name}
                          </span>
                          <span className="tm-phase-days">{phase.days}</span>
                        </div>
                      )}
                      <div
                        className={`tm-step-card ${activeCardId === stop.id ? 'active' : ''}`}
                        data-id={stop.id}
                        onClick={() => selectOverviewStop(stop.id)}
                      >
                        <div className="tm-step-timeline">
                          <span className="tm-step-number" style={{ background: color }}>
                            {stop.id}
                          </span>
                          {!isLast && <div className="tm-step-line" />}
                        </div>
                        <div className="tm-step-card-content">
                          <div className="tm-step-card-title">{stop.name}</div>
                          <div className="tm-step-card-days">{stop.days}</div>
                          <p className="tm-step-card-desc">{stop.description}</p>
                          {stop.highlights.length > 0 && (
                            <div className="tm-step-card-highlights">
                              {stop.highlights.slice(0, 3).map((h, i) => (
                                <span key={i} className="tm-highlight-tag">
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* Search bar (day view only) */}
          {activeDay !== 'all' && (
            <div className="tm-search-container">
              <div className="tm-search-bar">
                <svg className="tm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="tm-search-input"
                  type="text"
                  placeholder="Ajouter un lieu..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setSearchQuery(''); setShowSearchResults(false); setPendingAdd(null); } }}
                />
                {searchQuery && (
                  <button className="tm-search-clear" onClick={() => { setSearchQuery(''); setShowSearchResults(false); setPendingAdd(null); }}>✕</button>
                )}
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="tm-search-results">
                  {searchResults.map((r, i) => (
                    <div key={i} className="tm-search-result" onClick={() => selectSearchResult(r)}>
                      <div className="tm-result-name">{r.name}</div>
                      <div className="tm-result-address">{r.address}</div>
                    </div>
                  ))}
                </div>
              )}
              {pendingAdd && (
                <div className="tm-add-form">
                  <div className="tm-add-form-name">{pendingAdd.name}</div>
                  <div className="tm-add-form-row">
                    <input type="time" className="tm-add-time" value={addTime} onChange={(e) => setAddTime(e.target.value)} />
                    <input type="text" className="tm-add-desc" placeholder="Description (optionnel)" value={addDesc} onChange={(e) => setAddDesc(e.target.value)} />
                  </div>
                  <div className="tm-add-form-actions">
                    <button className="tm-add-cancel" onClick={() => { setPendingAdd(null); setSearchQuery(''); }}>Annuler</button>
                    <button className="tm-add-confirm" onClick={confirmAddActivity}>Ajouter</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Day content */}
          {activeDay !== 'all' && currentDayData && (
            <div className="tm-day-timeline">
              {Object.entries(groupedActivities).map(([period, activities]) => (
                <div key={period} className="tm-period-section">
                  <div className="tm-period-header">{period}</div>
                  {activities.map((act, idx) => {
                    const globalIdx = currentDayData.activities.indexOf(act);
                    const isLastInPeriod = idx === activities.length - 1;
                    return (
                      <div
                        key={globalIdx}
                        className={`tm-activity-card ${activeActivityIdx === globalIdx ? 'active' : ''}`}
                        onClick={() => handleActivityClick(act, globalIdx)}
                      >
                        <div className="tm-activity-timeline">
                          <div className="tm-activity-time">{act.time}</div>
                          <div className="tm-activity-dot" />
                          {!isLastInPeriod && <div className="tm-activity-line" />}
                        </div>
                        <div className="tm-activity-info">
                          <div className="tm-activity-name">{act.name}</div>
                          {activityRatings[act.query] && activityRatings[act.query].rating && (
                            <div className="tm-activity-rating">
                              <span className="tm-rating-stars">{activityRatings[act.query].rating} ★</span>
                              {activityRatings[act.query].userRatingCount && (
                                <span className="tm-rating-count">({activityRatings[act.query].userRatingCount!.toLocaleString()})</span>
                              )}
                              {activityRatings[act.query].types?.[0] && (
                                <span className="tm-rating-type"> · {formatPlaceType(activityRatings[act.query].types![0])}</span>
                              )}
                            </div>
                          )}
                          <div className="tm-activity-desc">{act.desc}</div>
                        </div>
                        {activityPhotos[act.query] && (
                          <div
                            className="tm-activity-image"
                            style={{ backgroundImage: `url(${activityPhotos[act.query]})` }}
                          />
                        )}
                        <button
                          className={`tm-activity-delete ${deleteConfirmIdx === globalIdx ? 'confirm' : ''}`}
                          title="Supprimer"
                          onClick={(e) => { e.stopPropagation(); handleDeleteActivity(activeDay as number, globalIdx); }}
                        >
                          {deleteConfirmIdx === globalIdx ? 'Supprimer ?' : '×'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
              {currentDayData.activities.length === 0 && (
                <div className="tm-empty-day">
                  <p>Aucune activite pour ce jour</p>
                </div>
              )}
            </div>
          )}

          {/* Restaurants recommandes */}
          {activeDay !== 'all' && currentDayData?.restaurants && currentDayData.restaurants.length > 0 && (
            <div className="tm-restaurants-section">
              <div className="tm-restaurants-header">
                <span className="tm-restaurants-icon">🍽️</span>
                Restaurants recommandes
              </div>
              <div className="tm-restaurants-grid">
                {currentDayData.restaurants.map((rest, idx) => (
                  <div
                    key={idx}
                    className="tm-restaurant-card"
                    onClick={() => handleRestaurantClick(rest)}
                  >
                    <div
                      className="tm-restaurant-photo"
                      style={
                        restaurantPhotos[rest.query]
                          ? { backgroundImage: `url(${restaurantPhotos[rest.query]})` }
                          : undefined
                      }
                    >
                      {!restaurantPhotos[rest.query] && (
                        <span className="tm-restaurant-photo-placeholder">🍜</span>
                      )}
                    </div>
                    <div className="tm-restaurant-info">
                      <div className="tm-restaurant-name">{rest.name}</div>
                      {restaurantRatings[rest.query]?.rating && (
                        <div className="tm-restaurant-rating">
                          <span className="tm-rating-stars">
                            {Array.from({ length: 5 }, (_, i) =>
                              i < Math.round(restaurantRatings[rest.query].rating!) ? '★' : '☆'
                            ).join('')}
                          </span>
                          <span className="tm-restaurant-rating-num">
                            {restaurantRatings[rest.query].rating}
                          </span>
                          {restaurantRatings[rest.query].userRatingCount && (
                            <span className="tm-rating-count">
                              ({restaurantRatings[rest.query].userRatingCount!.toLocaleString()})
                            </span>
                          )}
                        </div>
                      )}
                      <div className="tm-restaurant-meta">
                        <span className="tm-restaurant-cuisine">{rest.cuisine}</span>
                        <span className="tm-restaurant-price">{rest.priceRange}</span>
                      </div>
                      <div className="tm-restaurant-desc">{rest.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Place detail overlay */}
        {placeDetail && (
          <div className="tm-place-detail">
            <button className="tm-place-close" onClick={() => setPlaceDetail(null)}>✕</button>
            {/* Photo carousel */}
            <div className="tm-photos-container">
              {placeDetail.place.photoUrls.length > 0 ? (
                <div className="tm-photos-scroll">
                  {placeDetail.place.photoUrls.map((url, i) => (
                    <img key={i} className="tm-place-photo" src={url} alt={placeDetail.activity.name} loading="lazy" />
                  ))}
                </div>
              ) : (
                <div className="tm-photo-placeholder">📍</div>
              )}
            </div>
            {/* Info */}
            <div className="tm-place-info">
              <h2 className="tm-place-name">{placeDetail.activity.name}</h2>
              {placeDetail.place.rating && (
                <div className="tm-place-rating">
                  <span className="tm-detail-stars">
                    {Array.from({ length: 5 }, (_, i) =>
                      i < Math.round(placeDetail.place.rating!) ? '★' : '☆'
                    ).join('')}
                  </span>
                  <span className="tm-detail-rating-num">{placeDetail.place.rating}</span>
                  {placeDetail.place.userRatingCount && (
                    <span className="tm-detail-rating-count">({placeDetail.place.userRatingCount.toLocaleString()} avis)</span>
                  )}
                  {placeDetail.place.types?.[0] && (
                    <span className="tm-detail-type"> · {formatPlaceType(placeDetail.place.types[0])}</span>
                  )}
                </div>
              )}
              <p className="tm-place-desc">{placeDetail.activity.desc}</p>
              <div className="tm-place-links">
                {placeDetail.place.googleMapsUri && (
                  <a className="tm-place-link" href={placeDetail.place.googleMapsUri} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Voir sur Google Maps
                  </a>
                )}
                {placeDetail.place.websiteUri && (
                  <a className="tm-place-link" href={placeDetail.place.websiteUri} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                    Site web
                  </a>
                )}
                {placeDetail.place.phone && (
                  <a className="tm-place-link" href={`tel:${placeDetail.place.phone}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    {placeDetail.place.phone}
                  </a>
                )}
              </div>
              {placeDetail.place.formattedAddress && (
                <div className="tm-place-address">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {placeDetail.place.formattedAddress}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
