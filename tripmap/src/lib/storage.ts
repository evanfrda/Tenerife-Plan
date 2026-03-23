import { Trip } from './types';
import { supabase } from './supabase';

const STORAGE_KEY = 'tripmap_voyages';

export function getTrips(): Trip[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Trip[];
  } catch {
    return [];
  }
}

export function getTrip(id: string): Trip | null {
  const trips = getTrips();
  return trips.find((t) => t.id === id) ?? null;
}

export function saveTrip(trip: Trip): void {
  // Save to localStorage (immediate, offline-capable)
  const trips = getTrips();
  const index = trips.findIndex((t) => t.id === trip.id);
  if (index >= 0) {
    trips[index] = trip;
  } else {
    trips.push(trip);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));

  // Also save to Supabase (shared, async)
  saveTripToSupabase(trip);
}

export function deleteTrip(id: string): void {
  const trips = getTrips().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

// ---- Supabase sync ----

async function saveTripToSupabase(trip: Trip): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('trips')
      .upsert({ id: trip.id, data: trip, updated_at: new Date().toISOString() });
  } catch {
    // Silently fail — localStorage is the primary store
  }
}

export async function loadTripFromSupabase(id: string): Promise<Trip | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('data')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data.data as Trip;
  } catch {
    return null;
  }
}
