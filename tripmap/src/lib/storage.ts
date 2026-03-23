import { Trip } from './types';

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
  const trips = getTrips();
  const index = trips.findIndex((t) => t.id === trip.id);
  if (index >= 0) {
    trips[index] = trip;
  } else {
    trips.push(trip);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function deleteTrip(id: string): void {
  const trips = getTrips().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}
