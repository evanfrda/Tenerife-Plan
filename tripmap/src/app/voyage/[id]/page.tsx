'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Trip } from '@/lib/types';
import { getTrip, saveTrip } from '@/lib/storage';
import { getTenerifeTrip } from '@/lib/tenerifeTripSeed';

const TripMapView = dynamic(() => import('@/components/TripMapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  ),
});

export default function TripViewPage() {
  const params = useParams();
  const id = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let t = getTrip(id);
    // Migrate: add restaurant data if missing
    if (t && t.days.length > 0 && !t.days[0].restaurants) {
      const tenerifeSeed = getTenerifeTrip();
      if (t.id === tenerifeSeed.id) {
        const updated = { ...t };
        updated.days = updated.days.map((day) => {
          const seedDay = tenerifeSeed.days.find((sd) => sd.dayNumber === day.dayNumber);
          if (seedDay?.restaurants) {
            return { ...day, restaurants: seedDay.restaurants };
          }
          return day;
        });
        saveTrip(updated);
        t = updated;
      }
    }
    setTrip(t);
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Voyage introuvable</h1>
          <p className="text-gray-500 mb-6">
            Ce voyage n&apos;existe pas ou a ete supprime.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all hover:shadow-lg"
            style={{ backgroundColor: '#4A67FF' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 shrink-0 z-20">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Retour
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-lg">{trip.flag}</span>
              <h1 className="font-semibold text-gray-900 text-sm">{trip.name}</h1>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {trip.days.length} jours
          </div>
        </div>
      </header>

      {/* Map view fills the rest */}
      <div className="flex-1 overflow-hidden">
        <TripMapView trip={trip} />
      </div>
    </div>
  );
}
