'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Trip } from '@/lib/types';
import { getTrip, saveTrip } from '@/lib/storage';
import { getTenerifeTrip } from '@/lib/tenerifeTripSeed';

const MobileTripApp = dynamic(() => import('@/components/MobileTripApp'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f0',
      fontFamily: 'Poppins, sans-serif',
    }}>
      <div style={{
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🇮🇨</div>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid #e0e0e0',
          borderTopColor: '#4CAF50',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto',
        }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

export default function HomePage() {
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    // Load or create the Tenerife trip
    const tenerifeSeed = getTenerifeTrip();
    let t = getTrip(tenerifeSeed.id);

    if (!t) {
      saveTrip(tenerifeSeed);
      t = tenerifeSeed;
    } else {
      // Always sync destinations, restaurants and phases from seed
      const updated = { ...t };
      updated.destinations = tenerifeSeed.destinations;
      updated.phases = tenerifeSeed.phases;
      updated.days = updated.days.map((day) => {
        const seedDay = tenerifeSeed.days.find((sd) => sd.dayNumber === day.dayNumber);
        return {
          ...day,
          restaurants: seedDay?.restaurants || day.restaurants,
          tabelogRestaurants: seedDay?.tabelogRestaurants || day.tabelogRestaurants,
        };
      });
      saveTrip(updated);
      t = updated;
    }

    setTrip(t);
  }, []);

  if (!trip) return null;

  return <MobileTripApp trip={trip} />;
}
