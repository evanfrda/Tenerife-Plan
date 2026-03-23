'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Trip } from '@/lib/types';
import { getTrip, saveTrip, loadTripFromSupabase } from '@/lib/storage';
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83C\uDDEE\uD83C\uDDE8'}</div>
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
    const tenerifeSeed = getTenerifeTrip();

    // 1. Load immediately from localStorage or seed (instant)
    let t = getTrip(tenerifeSeed.id);
    if (!t) {
      t = tenerifeSeed;
      saveTrip(t);
    }
    setTrip(t);

    // 2. Then try Supabase in background (shared data)
    loadTripFromSupabase(tenerifeSeed.id).then((supabaseTrip) => {
      if (supabaseTrip) {
        // Supabase has newer data — update
        saveTrip(supabaseTrip);
        setTrip(supabaseTrip);
      }
    }).catch(() => {
      // Supabase unavailable — localStorage is fine
    });
  }, []);

  if (!trip) return null;

  return <MobileTripApp trip={trip} />;
}
